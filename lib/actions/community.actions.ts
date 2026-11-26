"use server";

import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";
import { getAuthenticatedUser } from "@/lib/auth";


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

export async function toggleCommunityMembership(communityId: string): Promise<{ joined: boolean }> {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!communityId || !communityId.trim()) {
      throw new Error("A valid community is required.");
    }

    const community = await Community.findOne({ id: communityId.trim() });
    if (!community) throw new Error("Community not found.");

    const isCreator =
      community.createdBy?.toString() === authenticatedUser._id.toString();
    const isMember = community.members.some(
      (member: any) => member.toString() === authenticatedUser._id.toString()
    );

    if (isMember || isCreator) {
      if (isCreator) {
        throw new Error("The community creator cannot leave their own community.");
      }

      await Promise.all([
        Community.updateOne(
          { _id: community._id },
          { $pull: { members: authenticatedUser._id } }
        ),
        User.updateOne(
          { _id: authenticatedUser._id },
          { $pull: { communities: community._id } }
        ),
      ]);

      revalidatePath(`/communities/${community.id}`);
      revalidatePath("/communities");
      return { joined: false };
    }

    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        {
          $addToSet: { members: authenticatedUser._id },
          $pull: { invitations: authenticatedUser._id },
        }
      ),
      User.updateOne(
        { _id: authenticatedUser._id },
        {
          $addToSet: { communities: community._id },
          $pull: { invitedTo: community._id },
        }
      ),
    ]);

    revalidatePath(`/communities/${community.id}`);
    revalidatePath("/communities");
    return { joined: true };
  } catch (error) {
    console.error("Error updating community membership:", error);
    throw error;
  }
}

export async function acceptCommunityInvitation(communityId: string) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    const community = await Community.findOne({
      id: communityId,
      invitations: authenticatedUser._id,
    });

    if (!community) {
      throw new Error("No pending invitation was found for this community.");
    }

    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        {
          $addToSet: { members: authenticatedUser._id },
          $pull: { invitations: authenticatedUser._id },
        }
      ),
      User.updateOne(
        { _id: authenticatedUser._id },
        {
          $addToSet: { communities: community._id },
          $pull: { invitedTo: community._id },
        }
      ),
    ]);

    revalidatePath(`/communities/${community.id}`);
    revalidatePath("/communities");
    return { joined: true };
  } catch (error) {
    console.error("Error accepting community invitation:", error);
    throw error;
  }
}

export async function sendInvitationToUser(
  communityId: string,
  userId: string
) {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    // Find the community by its unique id
    const community = await Community.findOne({ id: communityId });

    if (!community) {
      throw new Error("Community not found");
    }

    if (authenticatedUser.id === userId) {
      throw new Error("You cannot invite yourself.");
    }
    const isAuthorizedInviter =
      community.createdBy?.toString() === authenticatedUser._id.toString() ||
      community.members.some((member: any) => member.toString() === authenticatedUser._id.toString());
    if (!isAuthorizedInviter) {
      throw new Error("Only community members can invite users.");
    }

    // Resolve the invitee separately from the authenticated inviter.
    const user = await User.findOne({ id: userId });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user is already a member of the community
    const alreadyMember = community.members.some(
      (member: any) => member.toString() === user._id.toString()
    );
    if (alreadyMember) throw new Error("User is already a member of the community");

    await Community.updateOne(
      { _id: community._id },
      { $addToSet: { invitations: user._id } }
    );
    await User.updateOne(
      { _id: user._id },
      { $addToSet: { invitedTo: community._id } }
    );

    return community;
  } catch (error) {
    // Handle any errors
    console.error("Error sending invitation to community:", error);
    throw error;
  }
}
