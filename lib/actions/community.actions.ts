"use server";

import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";
import { getAuthenticatedUser } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";
import { createNotification } from "@/lib/actions/notification.actions";


export async function fetchCommunityDetails(id: string) {
  try {
    await connectToDB();

    const communityDetails = await Community.findOne({ id }).populate([
      "createdBy",
      {
        path: "members",
        model: User,
        select: "name username image _id id",
      },
      {
        path: "joinRequests.user",
        model: User,
        select: "name username image _id id",
      },
    ]);

    return communityDetails;
  } catch (error) {
    // Handle any errors
    console.error("Error fetching community details:", error);
    throw error;
  }
}

export async function fetchMyCommunities() {
  const authenticatedUser = await getAuthenticatedUser();
  const clerk = await clerkClient();

  // Clerk is the source of truth for organization membership. Reconcile the
  // current user's memberships before reading the local community cards so
  // newly created/joined organizations appear even if a webhook is delayed.
  const { data: memberships } =
    await clerk.users.getOrganizationMembershipList({
      userId: authenticatedUser.id,
      limit: 500,
    });

  for (const membership of memberships) {
    const organization = membership.organization;
    const community = await Community.findOneAndUpdate(
      { id: organization.id },
      {
        $set: {
          name: organization.name,
          username: organization.slug || organization.id,
          image: organization.imageUrl || "",
        },
        $setOnInsert: { bio: "" },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!community) continue;

    // Recover the real creator from Clerk if the organization webhook arrived
    // before that creator's local profile was available.
    if (!community.createdBy && organization.createdBy) {
      const creator = await User.findOne({ id: organization.createdBy }).select("_id");
      if (creator) {
        await Community.updateOne(
          { _id: community._id, createdBy: { $exists: false } },
          { $set: { createdBy: creator._id } }
        );
      }
    }

    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        { $addToSet: { members: authenticatedUser._id } }
      ),
      User.updateOne(
        { _id: authenticatedUser._id },
        { $addToSet: { communities: community._id } }
      ),
    ]);
  }

  const communities = await Community.find({
    $or: [
      { _id: { $in: authenticatedUser.communities ?? [] } },
      { members: authenticatedUser._id },
      { createdBy: authenticatedUser._id },
    ],
  })
    .sort({ _id: "desc" })
    .populate({ path: "members", model: User, select: "name username image id" })
    .lean();

  return JSON.parse(JSON.stringify(communities));
}

export async function fetchCommunityPosts(id: string) {
  try {
    await connectToDB();

    const communityPosts = await Community.findOne({id}).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "author",
          model: User,
          select: "name image id", // Select the "name" and "_id" fields from the "User" model
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "image _id", // Select the "name" and "_id" fields from the "User" model
          },
        },
        {
          path  : "community",
          model : Community,
        }
      ],
    });

    return communityPosts;
  } catch (error) {
    // Handle any errors
    console.error("Error fetching community posts:", error);
    throw error;
  }
}

export async function fetchCommunities({
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    await connectToDB();

    // Calculate the number of communities to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter communities.
    const query: FilterQuery<typeof Community> = {};

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched communities based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    // Create a query to fetch the communities based on the search and sort criteria.
    const communitiesQuery = Community.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate("members");

    // Count the total number of communities that match the search criteria (without pagination).
    const totalCommunitiesCount = await Community.countDocuments(query);

    const communities = await communitiesQuery.exec();

    // Check if there are more communities beyond the current page.
    const isNext = totalCommunitiesCount > skipAmount + communities.length;

    return { communities, isNext };
  } catch (error) {
    console.error("Error fetching communities:", error);
    throw error;
  }
}

async function getCommunityAdminContext(communityId: string) {
  const user = await getAuthenticatedUser();
  const community = await Community.findOne({ id: communityId });
  if (!community) throw new Error("Community not found.");

  const clerk = await clerkClient();
  const { data: memberships } = await clerk.users.getOrganizationMembershipList({
    userId: user.id,
    limit: 500,
  });
  const membership = memberships.find(
    (item) => item.organization.id === community.id
  );
  const isCreator =
    community.createdBy?.toString() === user._id.toString();
  const isClerkAdmin = membership?.role === "org:admin";

  if (!isCreator && !isClerkAdmin) {
    throw new Error("Only the community owner or an admin can manage invitations and requests.");
  }

  return { user, community, clerk };
}

export async function searchCommunityInviteCandidates(
  communityId: string,
  searchString: string
) {
  const { user, community } = await getCommunityAdminContext(communityId);
  await connectToDB();

  const term = searchString.trim().split("").map((character) =>
    ".*+?^$()|[]{}\\".includes(character) ? "\\" + character : character
  ).join("");
  if (term.length < 2) return [];

  const excludedIds = [
    user._id,
    ...(community.members ?? []),
    ...(community.invitations ?? []).map((invitation: any) => invitation.user),
  ].filter(Boolean);

  const candidates = await User.find({
    _id: { $nin: excludedIds },
    $or: [
      { username: { $regex: term, $options: "i" } },
      { name: { $regex: term, $options: "i" } },
    ],
  })
    .select("id name username image")
    .sort({ name: 1 })
    .limit(12)
    .lean();

  return candidates.map((candidate: any) => ({
    id: String(candidate.id),
    name: String(candidate.name ?? ""),
    username: String(candidate.username ?? ""),
    image: String(candidate.image ?? ""),
  }));
}

export async function sendInvitationsToUsers(
  communityId: string,
  inviteeUserIds: string[]
) {
  const { user, community, clerk } = await getCommunityAdminContext(communityId);
  const uniqueIds = [...new Set(inviteeUserIds.filter((id) => typeof id === "string" && id.trim()))];
  if (uniqueIds.length === 0) throw new Error("Select at least one person to invite.");

  const invitees = await User.find({ id: { $in: uniqueIds } });
  if (invitees.length !== uniqueIds.length) {
    throw new Error("One or more selected users could not be found. Refresh the list and try again.");
  }

  const alreadyInvitedIds = new Set(
    (community.invitations ?? []).map((invitation: any) => invitation.user?.toString())
  );
  const communityMemberIds = new Set(
    (community.members ?? []).map((member: any) => member.toString())
  );

  const eligibleInvitees = [];
  for (const invitee of invitees) {
    if (invitee._id.equals(user._id)) continue;
    if (alreadyInvitedIds.has(invitee._id.toString())) continue;
    if (communityMemberIds.has(invitee._id.toString())) continue;

    const { data: memberships } = await clerk.users.getOrganizationMembershipList({
      userId: invitee.id,
      limit: 500,
    });
    if (!memberships.some((membership) => membership.organization.id === community.id)) {
      eligibleInvitees.push(invitee);
    }
  }

  if (eligibleInvitees.length === 0) {
    throw new Error("None of the selected users can be invited. They may already be members or have pending invitations.");
  }

  await Promise.all(
    eligibleInvitees.map(async (invitee) => {
      await Promise.all([
        Community.updateOne(
          { _id: community._id },
          {
            $push: {
              invitations: {
                user: invitee._id,
                invitedBy: user._id,
                createdAt: new Date(),
              },
            },
            $pull: { joinRequests: { user: invitee._id } },
          }
        ),
        User.updateOne(
          { _id: invitee._id },
          { $addToSet: { invitedTo: community._id } }
        ),
      ]);
      await createNotification({
        recipientId: invitee._id,
        actorId: user._id,
        type: "community_invitation",
        entityType: "community",
        entityId: community.id,
        message: `invited you to join ${community.name}.`,
      });
    })
  );

  revalidatePath("/communities");
  revalidatePath(`/communities/${community.id}`);
  return {
    success: true,
    invitedCount: eligibleInvitees.length,
    invitedUsernames: eligibleInvitees.map((invitee) => invitee.username),
  };
}

export async function fetchMyCommunityInvitations() {
  const user = await getAuthenticatedUser();
  const invitations = await Community.find({ "invitations.user": user._id })
    .populate("createdBy", "name username image id")
    .populate("invitations.invitedBy", "name username image id")
    .lean();

  return invitations.map((community: any) => {
    const invitation = (community.invitations ?? []).find(
      (item: any) => item.user?.toString() === user._id.toString()
    );
    const inviter = invitation?.invitedBy;
    return {
      id: String(community.id),
      name: String(community.name ?? ""),
      username: String(community.username ?? ""),
      image: String(community.image ?? ""),
      bio: String(community.bio ?? ""),
      invitedBy: inviter
        ? {
            id: String(inviter.id ?? ""),
            name: String(inviter.name ?? ""),
            username: String(inviter.username ?? ""),
            image: String(inviter.image ?? ""),
          }
        : null,
      createdAt: invitation?.createdAt ? new Date(invitation.createdAt).toISOString() : null,
    };
  });
}

export async function respondToCommunityInvitation(
  communityId: string,
  response: "accept" | "decline"
) {
  const user = await getAuthenticatedUser();
  const community = await Community.findOne({
    id: communityId,
    "invitations.user": user._id,
  });
  if (!community) throw new Error("This invitation is no longer pending.");

  if (response === "accept") {
    const clerk = await clerkClient();
    const { data: memberships } = await clerk.users.getOrganizationMembershipList({
      userId: user.id,
      limit: 500,
    });
    const alreadyMember = memberships.some(
      (item) => item.organization.id === community.id
    );

    if (!alreadyMember) {
      await clerk.organizations.createOrganizationMembership({
        organizationId: community.id,
        userId: user.id,
        role: "org:member",
      });
    }

    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        {
          $addToSet: { members: user._id },
          $pull: {
            invitations: { user: user._id },
            joinRequests: { user: user._id },
          },
        }
      ),
      User.updateOne(
        { _id: user._id },
        {
          $addToSet: { communities: community._id },
          $pull: { invitedTo: community._id },
        }
      ),
    ]);
  } else {
    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        { $pull: { invitations: { user: user._id } } }
      ),
      User.updateOne(
        { _id: user._id },
        { $pull: { invitedTo: community._id } }
      ),
    ]);
  }

  revalidatePath("/communities");
  revalidatePath(`/communities/${community.id}`);
  return { success: true };
}

export async function requestCommunityMembership(communityId: string) {
  const user = await getAuthenticatedUser();
  const community = await Community.findOne({ id: communityId });
  if (!community) throw new Error("Community not found.");
  if (!community.requiresApproval) {
    throw new Error("This community allows direct joining. Use Join instead.");
  }

  const clerk = await clerkClient();
  const { data: memberships } = await clerk.users.getOrganizationMembershipList({
    userId: user.id,
    limit: 500,
  });
  const isClerkMember = memberships.some(
    (membership) => membership.organization.id === community.id
  );

  if (isClerkMember) {
    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        { $addToSet: { members: user._id } }
      ),
      User.updateOne(
        { _id: user._id },
        { $addToSet: { communities: community._id } }
      ),
    ]);
    return { requested: false, joined: true };
  }

  await Promise.all([
    Community.updateOne(
      { _id: community._id },
      { $pull: { members: user._id } }
    ),
    User.updateOne(
      { _id: user._id },
      { $pull: { communities: community._id } }
    ),
  ]);

  const hasInvitation = (community.invitations ?? []).some(
    (item: any) => item.user?.toString() === user._id.toString()
  );
  if (hasInvitation) {
    throw new Error("You already have an invitation. Accept it from My Communities.");
  }

  const hasRequest = (community.joinRequests ?? []).some(
    (item: any) => item.user?.toString() === user._id.toString()
  );
  if (hasRequest) return { requested: true, joined: false };

  await Community.updateOne(
    { _id: community._id },
    { $push: { joinRequests: { user: user._id, requestedAt: new Date() } } }
  );

  revalidatePath(`/communities/${community.id}`);
  return { requested: true, joined: false };
}

export async function fetchCommunityAdminData(communityId: string) {
  const { community } = await getCommunityAdminContext(communityId);
  const populated = (await Community.findById(community._id)
    .populate("joinRequests.user", "name username image id")
    .populate("invitations.user", "name username image id")
    .populate("invitations.invitedBy", "name username image id")
    .lean()) as {
      joinRequests?: unknown[];
      invitations?: unknown[];
      requiresApproval?: boolean;
    } | null;

  return {
    requests: JSON.parse(JSON.stringify(populated?.joinRequests ?? [])),
    invitations: JSON.parse(JSON.stringify(populated?.invitations ?? [])),
    requiresApproval: Boolean(populated?.requiresApproval),
  };
}

export async function updateCommunityJoinPolicy(
  communityId: string,
  requiresApproval: boolean
) {
  const { community } = await getCommunityAdminContext(communityId);
  await Community.updateOne(
    { _id: community._id },
    { $set: { requiresApproval: Boolean(requiresApproval) } }
  );
  revalidatePath(`/communities/${community.id}`);
  revalidatePath("/communities");
  return { requiresApproval: Boolean(requiresApproval) };
}

export async function reviewCommunityJoinRequest(
  communityId: string,
  userId: string,
  decision: "approve" | "reject"
) {
  const { community, clerk } = await getCommunityAdminContext(communityId);
  const requestedUser = await User.findOne({ id: userId });
  if (!requestedUser) throw new Error("Requesting user was not found.");

  const hasRequest = (community.joinRequests ?? []).some(
    (item: any) => item.user?.toString() === requestedUser._id.toString()
  );
  if (!hasRequest) throw new Error("This join request is no longer pending.");

  if (decision === "approve") {
    const { data: memberships } = await clerk.users.getOrganizationMembershipList({
      userId: requestedUser.id,
      limit: 500,
    });
    const alreadyMember = memberships.some(
      (item) => item.organization.id === community.id
    );
    if (!alreadyMember) {
      await clerk.organizations.createOrganizationMembership({
        organizationId: community.id,
        userId: requestedUser.id,
        role: "org:member",
      });
    }

    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        {
          $addToSet: { members: requestedUser._id },
          $pull: { joinRequests: { user: requestedUser._id } },
        }
      ),
      User.updateOne(
        { _id: requestedUser._id },
        { $addToSet: { communities: community._id } }
      ),
    ]);
  } else {
    await Community.updateOne(
      { _id: community._id },
      { $pull: { joinRequests: { user: requestedUser._id } } }
    );
  }

  await createNotification({
    recipientId: requestedUser._id,
    actorId: (await getAuthenticatedUser())._id,
    type: decision === "approve" ? "community_join_approved" : "community_join_rejected",
    entityType: "community",
    entityId: community.id,
    message: decision === "approve"
      ? `approved your request to join ${community.name}.`
      : `rejected your request to join ${community.name}.`,
  });

  revalidatePath(`/communities/${community.id}`);
  revalidatePath("/communities");
  return { success: true };
}

export async function removeCommunityMember(
  communityId: string,
  memberUserId: string
) {
  const owner = await getAuthenticatedUser();
  const community = await Community.findOne({ id: communityId });
  if (!community) throw new Error("Community not found.");

  const isCreator = community.createdBy?.toString() === owner._id.toString();
  if (!isCreator) {
    throw new Error("Only the community owner can remove members.");
  }

  const member = await User.findOne({ id: memberUserId });
  if (!member) throw new Error("Community member was not found.");
  if (member._id.equals(owner._id)) {
    throw new Error("The community owner cannot remove themselves.");
  }

  const isListedMember = (community.members ?? []).some(
    (id: any) => id.toString() === member._id.toString()
  );
  if (!isListedMember) throw new Error("This user is not a community member.");

  const clerk = await clerkClient();
  const { data: memberships } = await clerk.users.getOrganizationMembershipList({
    userId: member.id,
    limit: 500,
  });
  const isClerkMember = memberships.some(
    (membership) => membership.organization.id === community.id
  );

  if (isClerkMember) {
    await clerk.organizations.deleteOrganizationMembership({
      organizationId: community.id,
      userId: member.id,
    });
  }

  await Promise.all([
    Community.updateOne(
      { _id: community._id },
      { $pull: { members: member._id } }
    ),
    User.updateOne(
      { _id: member._id },
      { $pull: { communities: community._id } }
    ),
  ]);

  revalidatePath(`/communities/${community.id}`);
  revalidatePath("/communities");
  return { success: true };
}

export async function toggleCommunityMembership(
  communityId: string
): Promise<{ joined: boolean; requested: boolean }> {
  const user = await getAuthenticatedUser();
  const community = await Community.findOne({ id: communityId });
  if (!community) throw new Error("Community not found.");

  const isCreator =
    community.createdBy?.toString() === user._id.toString();
  if (isCreator) {
    throw new Error("The community owner cannot leave their own community.");
  }

  const clerk = await clerkClient();
  const { data: memberships } = await clerk.users.getOrganizationMembershipList({
    userId: user.id,
    limit: 500,
  });
  const isClerkMember = memberships.some(
    (membership) => membership.organization.id === community.id
  );

  if (isClerkMember) {
    await clerk.organizations.deleteOrganizationMembership({
      organizationId: community.id,
      userId: user.id,
    });

    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        { $pull: { members: user._id } }
      ),
      User.updateOne(
        { _id: user._id },
        { $pull: { communities: community._id } }
      ),
    ]);

    revalidatePath(`/communities/${community.id}`);
    revalidatePath("/communities");
    return { joined: false, requested: false };
  }

  if (community.requiresApproval) {
    const result = await requestCommunityMembership(communityId);
    return { joined: result.joined, requested: result.requested };
  }

  await clerk.organizations.createOrganizationMembership({
    organizationId: community.id,
    userId: user.id,
    role: "org:member",
  });

  await Promise.all([
    Community.updateOne(
      { _id: community._id },
      { $addToSet: { members: user._id } }
    ),
    User.updateOne(
      { _id: user._id },
      { $addToSet: { communities: community._id } }
    ),
  ]);

  revalidatePath(`/communities/${community.id}`);
  revalidatePath("/communities");
  return { joined: true, requested: false };
}

export async function cancelCommunityInvitation(
  communityId: string,
  inviteeUserId: string
) {
  const { community } = await getCommunityAdminContext(communityId);
  const invitee = await User.findOne({ id: inviteeUserId });
  if (!invitee) throw new Error("Invited user was not found.");

  await Promise.all([
    Community.updateOne(
      { _id: community._id },
      { $pull: { invitations: { user: invitee._id } } }
    ),
    User.updateOne(
      { _id: invitee._id },
      { $pull: { invitedTo: community._id } }
    ),
  ]);

  revalidatePath(`/communities/${community.id}`);
  revalidatePath("/communities");
  return { success: true };
}

export async function cancelCommunityJoinRequest(communityId: string) {
  const user = await getAuthenticatedUser();
  const community = await Community.findOne({ id: communityId });
  if (!community) throw new Error("Community not found.");

  await Community.updateOne(
    { _id: community._id },
    { $pull: { joinRequests: { user: user._id } } }
  );
  revalidatePath(`/communities/${community.id}`);
  return { requested: false };
}
