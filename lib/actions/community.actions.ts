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
  await connectToDB();

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

      const clerk = await clerkClient();
      await clerk.organizations.deleteOrganizationMembership({
        organizationId: community.id,
        userId: authenticatedUser.id,
      });

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

    const clerk = await clerkClient();
    await clerk.organizations.createOrganizationMembership({
      organizationId: community.id,
      userId: authenticatedUser.id,
      role: "org:member",
    });

    await Promise.all([
      Community.updateOne(
        { _id: community._id },
        {
          $addToSet: { members: authenticatedUser._id },
        }
      ),
      User.updateOne(
        { _id: authenticatedUser._id },
        {
          $addToSet: { communities: community._id },
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

