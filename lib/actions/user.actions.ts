"use server";

import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";
import { getAuthenticatedUser } from "@/lib/auth";
import { userValidation } from "@/lib/validations/user";

export async function toggleFollowUser(targetUserId: string): Promise<{ following: boolean }> {
  try {
    const authenticatedUser = await getAuthenticatedUser();

    if (!targetUserId || !targetUserId.trim()) {
      throw new Error("A valid profile is required.");
    }

    const targetUser = await User.findOne({ id: targetUserId.trim() });
    if (!targetUser) {
      throw new Error("User not found.");
    }

    if (authenticatedUser._id.equals(targetUser._id)) {
      throw new Error("You cannot follow yourself.");
    }

    const isFollowing = (authenticatedUser.following ?? []).some(
      (id: mongoose.Types.ObjectId) => id.toString() === targetUser._id.toString()
    );

    if (isFollowing) {
      await Promise.all([
        User.updateOne(
          { _id: authenticatedUser._id },
          { $pull: { following: targetUser._id } }
        ),
        User.updateOne(
          { _id: targetUser._id },
          { $pull: { followers: authenticatedUser._id } }
        ),
      ]);
    } else {
      await Promise.all([
        User.updateOne(
          { _id: authenticatedUser._id },
          { $addToSet: { following: targetUser._id } }
        ),
        User.updateOne(
          { _id: targetUser._id },
          { $addToSet: { followers: authenticatedUser._id } }
        ),
      ]);
    }

    revalidatePath(`/profile/${targetUser.id}`);
    revalidatePath(`/profile/${authenticatedUser.id}`);

    return { following: !isFollowing };
  } catch (error) {
    console.error("Error updating follow relationship:", error);
    throw error;
  }
}

export async function fetchUser(userId: string) {
  try {
    if (!userId || !userId.trim()) return null;
    await connectToDB();

    // Profile routes accept either a Clerk user ID or a public username.
    // This also makes @username mentions resolve to the intended profile.
    const identifier = userId.trim();
    return await User.findOne({
      $or: [{ id: identifier }, { username: identifier.toLowerCase() }],
    }).populate([
      {
        path: "communities",
        model: Community,
      },
      {
        path: "following",
        model: User,
        select: "id name username image",
      },
    ]);
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
}: Params): Promise<void> {
  try {
    const { userId: authenticatedClerkId } = await auth();
    if (!authenticatedClerkId || authenticatedClerkId !== userId) {
      throw new Error("You are not allowed to update this profile.");
    }
    await connectToDB();

    const validatedProfile = userValidation.parse({
      profile_photo: image,
      name,
      username,
      bio,
    });

    await User.findOneAndUpdate(
      { id: authenticatedClerkId },
      {
        username: validatedProfile.username.toLowerCase(),
        name: validatedProfile.name,
        bio: validatedProfile.bio,
        image: validatedProfile.profile_photo,
        onboarded: true,
      },
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUserThreads(userId: string) {
  try {
    await connectToDB();

    // Find all threads authored by the user with the given userId
    const threads = await User.findOne({ id: userId }).sort({createdAt : 'desc'}).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "community",
          model: Community,
          select: "name id image _id", // Select the "name" and "_id" fields from the "Community" model
        },
        {
          path: "author",
          model: User,
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });
    return threads;
  } catch (error) {
    console.error("Error fetching user threads:", error);
    throw error;
  }
}

//fetch tagged in threads
export async function fetchTaggedInThreads(taggedIn: string[]) {
  try {
    await connectToDB();

    // Ensure that taggedIn contains thread IDs
    if (!taggedIn || taggedIn.length === 0) {
      return []; // Return an empty array if there are no tagged threads
    }


    const postsQuery = Thread.find({ _id: { $in: taggedIn } })
    .sort({ createdAt: "desc" })
    .populate({
      path: "author",
      model: User,
    })
    .populate({
      path: "community",
      model: Community,
    })
    .populate({
      path: "children", // Populate the children field
      populate: {
        path: "author", // Populate the author field within children
        model: User,
        select: "_id name parentId image", // Select only _id and username fields of the author
      },
    });
  const threads = await postsQuery.exec();


    return threads; // Return the fetched threads
  } catch (error: any) {
    throw new Error(`Failed to fetch tagged threads: ${error.message}`);
  }
}

// Almost similar to Thead (search + pagination) and Community (search + pagination)
export async function searchEntities({
  entity,
  searchString,
  userId,
  pageNumber = 1,
}: {
  entity: "user" | "community" | "topic";
  searchString: string;
  userId: string;
  pageNumber?: number;
}) {
  const authenticatedUser = await getAuthenticatedUser();
  if (authenticatedUser.id !== userId) {
    throw new Error("You are not allowed to perform this search.");
  }

  await connectToDB();
  const term = searchString.trim().split("").map((character) =>
    ".*+?^$()|[]{}\\".includes(character) ? "\\" + character : character
  ).join("");
  const regex = new RegExp(term, "i");
  const pageSize = 25;
  const skipAmount = (Math.max(1, pageNumber) - 1) * pageSize;

  if (entity === "user") {
    const query: any = { id: { $ne: userId } };
    if (term) query.$or = [{ name: regex }, { username: regex }];
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: "desc" }).skip(skipAmount).limit(pageSize).lean(),
      User.countDocuments(query),
    ]);
    return {
      results: JSON.parse(JSON.stringify(users)),
      isNext: total > skipAmount + users.length,
    };
  }

  if (entity === "community") {
    const query: any = term ? { $or: [{ name: regex }, { username: regex }] } : {};
    const [communities, total] = await Promise.all([
      Community.find(query)
        .sort({ createdAt: "desc" })
        .skip(skipAmount)
        .limit(pageSize)
        .populate({ path: "members", model: User, select: "name username image id" })
        .lean(),
      Community.countDocuments(query),
    ]);
    return {
      results: JSON.parse(JSON.stringify(communities)),
      isNext: total > skipAmount + communities.length,
    };
  }

  const query: any = term
    ? { $or: [{ topics: regex }, { text: regex }] }
    : { topics: { $exists: true, $ne: [] } };
  const [topics, total] = await Promise.all([
    Thread.find(query)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({ path: "author", model: User, select: "name username image id" })
      .lean(),
    Thread.countDocuments(query),
  ]);
  return {
    results: JSON.parse(JSON.stringify(topics)),
    isNext: total > skipAmount + topics.length,
  };
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    await connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getActivities(userId: string) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (authenticatedUser.id !== userId) {
      throw new Error("You are not allowed to view this activity.");
    }

    //convert userId to object id
    const userObjectId = await User.findOne({ id: userId }, { _id: 1 });
    if (!userObjectId) {
      throw new Error("User not found.");
    }

    // Find all threads created by the user
    const userThreads = await Thread.find({ author: userObjectId._id });

    // Collect all the child thread ids (replies) from the 'children' field of each user thread
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    //collect threads in which it is reposted
    const repostedInThreads = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.repostedIn);
    }
    , []);

    // Find and return the child threads (replies) excluding the ones created by the same user
    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userObjectId._id }, // Exclude threads authored by the same user
    }).populate({
      path: "author",
      model: User,
      select: "name image _id username",
    }).populate({
      path: 'parentId',
      model: Thread,
    });

    // exlude threads reposted by the same user
    const repostedIn = await Thread.find({
      _id: { $in: repostedInThreads},
      author: {$ne: userObjectId._id},
    }).populate({
      path: 'author',
      model: User,
      select: 'name image _id username',
    })

    const likedThreadsReceived = await Thread.find({
      author: userObjectId._id,
      likedBy: { $exists: true, $ne: [] },
    })
      .sort({ createdAt: "desc" })
      .populate({
        path: "likedBy",
        model: User,
        select: "name image _id username id",
      });

    return {
      replies,
      repostedIn,
      likedThreadsReceived,
    };
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
  }
}


export async function editThread(threadId: string, text: string, path: string) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!mongoose.isValidObjectId(threadId)) throw new Error("Invalid thread ID.");
    if (!text || text.trim().length < 3 || text.length > 5000) {
      throw new Error("Thread text must be between 3 and 5000 characters.");
    }

    const updatedThread = await Thread.findOneAndUpdate(
      { _id: threadId, author: authenticatedUser._id },
      { $set: { text: text.trim() } },
      { new: true, runValidators: true }
    );
    if (!updatedThread) throw new Error("Thread not found or you are not allowed to edit it.");

    revalidatePath(path);
  } catch (error) {
    console.error("Error editing thread:", error);
    throw error;
  }
}


export async function getLikedThreadIds(): Promise<string[]> {
  const authenticatedUser = await getAuthenticatedUser();
  return (authenticatedUser.likedThreads ?? []).map((threadId: mongoose.Types.ObjectId) =>
    threadId.toString()
  );
}

export async function handleLike(threadId: string, _userId: string, pathname: string) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!mongoose.isValidObjectId(threadId)) throw new Error("Invalid thread ID.");

    const thread = await Thread.findById(threadId).select("likedBy upvotes");
    if (!thread) throw new Error("Thread not found.");

    const alreadyLiked = thread.likedBy.some(
      (id: mongoose.Types.ObjectId) => id.toString() === authenticatedUser._id.toString()
    );

    if (alreadyLiked) {
      await Thread.updateOne(
        { _id: thread._id, likedBy: authenticatedUser._id },
        { $pull: { likedBy: authenticatedUser._id }, $inc: { upvotes: -1 } }
      );
      await User.updateOne({ _id: authenticatedUser._id }, { $pull: { likedThreads: thread._id } });
    } else {
      await Thread.updateOne(
        { _id: thread._id, likedBy: { $ne: authenticatedUser._id } },
        { $addToSet: { likedBy: authenticatedUser._id }, $inc: { upvotes: 1 } }
      );
      await User.updateOne({ _id: authenticatedUser._id }, { $addToSet: { likedThreads: thread._id } });
    }

    const updatedThread = await Thread.findById(thread._id).select("upvotes");
    revalidatePath(pathname);
    return updatedThread?.upvotes ?? 0;
  } catch (error) {
    console.error("Error updating thread like:", error);
    throw error;
  }
}
