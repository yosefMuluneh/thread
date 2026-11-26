"use server";

import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";
import { getAuthenticatedUser } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";


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

    // If the creation webhook ran before the creator's local profile existed,
    // Clerk's org:admin membership lets us restore the owner relationship.
    if (!community.createdBy && membership.role === "org:admin") {
      await Community.updateOne(
        { _id: community._id, createdBy: { $exists: false } },
        { $set: { createdBy: authenticatedUser._id } }
      );
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

export async function sendInvitationToUser(
  communityId: string,
  username: string
) {
  const { user, community } = await getCommunityAdminContext(communityId);
  const normalizedUsername = username.trim().replace(/^@/, "").toLowerCase();
  if (!normalizedUsername) throw new Error("Enter a username to invite.");

  const invitee = await User.findOne({ username: normalizedUsername });
  if (!invitee) throw new Error("No user with that username was found.");
  if (invitee._id.equals(user._id)) throw new Error("You cannot invite yourself.");

  const isMember = community.members.some(
    (member: any) => member.toString() === invitee._id.toString()
  );
  if (isMember) throw new Error("That user is already a community member.");

  const alreadyInvited = (community.invitations ?? []).some(
    (invitation: any) => invitation.user?.toString() === invitee._id.toString()
  );
  if (alreadyInvited) throw new Error("An invitation is already pending for this user.");

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

  revalidatePath(`/communities/${community.id}`);
  revalidatePath("/communities");
  return { success: true, invitedUsername: invitee.username };
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
    return {
      id: community.id,
      name: community.name,
      username: community.username,
      image: community.image,
      bio: community.bio,
      invitedBy: invitation?.invitedBy ?? null,
      createdAt: invitation?.createdAt ?? null,
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

  const isMember = community.members.some(
    (member: any) => member.toString() === user._id.toString()
  );
  if (isMember) throw new Error("You are already a member.");

  const hasInvitation = (community.invitations ?? []).some(
    (item: any) => item.user?.toString() === user._id.toString()
  );
  if (hasInvitation) throw new Error("You already have an invitation. Accept it from My Communities.");

  const hasRequest = (community.joinRequests ?? []).some(
    (item: any) => item.user?.toString() === user._id.toString()
  );
  if (hasRequest) return { requested: true };

  await Community.updateOne(
    { _id: community._id },
    { $push: { joinRequests: { user: user._id, requestedAt: new Date() } } }
  );

  revalidatePath(`/communities/${community.id}`);
  return { requested: true };
}

export async function fetchCommunityAdminData(communityId: string) {
  await getCommunityAdminContext(communityId);
  const community = await Community.findOne({ id: communityId })
    .populate("joinRequests.user", "name username image id")
    .populate("invitations.user", "name username image id")
    .populate("invitations.invitedBy", "name username image id")
    .lean();

  return {
    requests: JSON.parse(JSON.stringify(community?.joinRequests ?? [])),
    invitations: JSON.parse(JSON.stringify(community?.invitations ?? [])),
  };
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
  const isMember = community.members.some(
    (member: any) => member.toString() === user._id.toString()
  );

  if (isMember || isCreator) {
    if (isCreator) {
      throw new Error("The community owner cannot leave their own community.");
    }

    const clerk = await clerkClient();
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

  const result = await requestCommunityMembership(communityId);
  return { joined: false, requested: result.requested };
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
