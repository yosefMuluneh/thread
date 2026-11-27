"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";
import { getAuthenticatedUser } from "@/lib/auth";

import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";
import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { createNotification } from "@/lib/actions/notification.actions";

export async function fetchThreads(pageNumber = 1, pageSize = 20) {
  await connectToDB();

  // Calculate the number of posts to skip based on the page number and page size.
  const skipAmount = (pageNumber - 1) * pageSize;

  // Create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply).
  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
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
        select: "_id name parentId image username", // Select only _id and username fields of the author
      },
    })
    // .populate({
    //   path: 'repost',
    //   model: Thread
    // });

  // Count the total number of top-level posts (threads) i.e., threads that are not comments.
  const totalPostsCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  }); // Get the total count of posts

  const posts = await postsQuery.exec();

  const isNext = totalPostsCount > skipAmount + posts.length;

  return { posts, isNext };
}



interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
  taggedUsers?: string[],
  topics?: string[],
  repost?: string
  imageUrl?: string | null
}


export async function createThread({ text, author, communityId, path, taggedUsers = [], topics = [], repost, imageUrl }: Params
) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!mongoose.isValidObjectId(author) || authenticatedUser._id.toString() !== author) {
      throw new Error("You are not allowed to create a thread for this user.");
    }
    const normalizedText = (text ?? "").trim();
    if ((!normalizedText && !imageUrl) || normalizedText.length > 5000) {
      throw new Error("Add text or an image. Thread text cannot exceed 5000 characters.");
    }
    if (imageUrl) {
      let parsedImageUrl: URL;
      try {
        parsedImageUrl = new URL(imageUrl);
      } catch {
        throw new Error("The uploaded image URL is invalid.");
      }
      if (parsedImageUrl.protocol !== "https:") {
        throw new Error("Thread images must use a secure HTTPS URL.");
      }
    }
    const communityIdObject = communityId
      ? await Community.findOne({ id: communityId }, { _id: 1, members: 1 })
      : null;
    if (communityId && (!communityIdObject || !communityIdObject.members.some(
      (member: mongoose.Types.ObjectId) => member.toString() === authenticatedUser._id.toString()
    ))) {
      throw new Error("You must be a member of this community to post there.");
    }


    let originalThread = null;
    if (repost) {
      if (!mongoose.isValidObjectId(repost)) throw new Error("Invalid repost target.");
      originalThread = await Thread.findById(repost);
      if (!originalThread) throw new Error("Original thread not found.");
    }

    const createdThread = await Thread.create({
        text: normalizedText,
        imageUrl: imageUrl ?? null,
        author,
        upvotes: 0,
        downvotes: 0,
        comments: [],
        createdAt: new Date(),
        topics,
        repost,
        repostedIn : [],
        community: communityIdObject?._id ?? null,
    });



    //handle tagged users
    if (taggedUsers.length > 0) {
      // Update User model for tagged users
      await User.updateMany(
        { username: { $in: taggedUsers } },
        {
          $addToSet: { taggedIn: createdThread._id },
        }
      );
    }


    // Update User model
    await User.findByIdAndUpdate(author, {
      $addToSet: { threads: createdThread._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject._id, {
        $addToSet: { threads: createdThread._id },
      });
    }
    if (originalThread) {
      await Thread.updateOne(
        { _id: originalThread._id },
        { $addToSet: { repostedIn: createdThread._id } }
      );
      await createNotification({
        recipientId: originalThread.author,
        actorId: authenticatedUser._id,
        type: "repost",
        entityType: "thread",
        entityId: originalThread._id.toString(),
        message: "reposted your thread.",
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}
    

export async function fetchAllChildThreads(threadId: string): Promise<any[]> {
  const childThreads = await Thread.find({ parentId: threadId });

  const descendantThreads = [];
  for (const childThread of childThreads) {
    const descendants = await fetchAllChildThreads(childThread._id);
    descendantThreads.push(childThread, ...descendants);
  }

  return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
  try {
    await connectToDB();

    if (!mongoose.isValidObjectId(id)) throw new Error("Invalid thread ID.");
    const authenticatedUser = await getAuthenticatedUser();
    const mainThread = await Thread.findById(id);
    if (!mainThread) throw new Error("Thread not found.");
    if (mainThread.author.toString() !== authenticatedUser._id.toString()) {
      throw new Error("You are not allowed to delete this thread.");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueCommunityIds = new Set(
      [...descendantThreads.map((thread) => thread.community?.toString()), mainThread.community?.toString()]
        .filter((value): value is string => Boolean(value))
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      {},
      { $pull: {
        threads: { $in: descendantThreadIds },
        likedThreads: { $in: descendantThreadIds },
        myLikedThreads: { $in: descendantThreadIds },
        taggedIn: { $in: descendantThreadIds },
      } }
    );
    await Thread.updateMany(
      {},
      {
        $pull: {
          children: { $in: descendantThreadIds },
          repost: { $in: descendantThreadIds },
          repostedIn: { $in: descendantThreadIds },
        },
      }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    const repostedThreadId = mainThread.repost?.[0];
    const repostedThread = repostedThreadId ? await Thread.findById(repostedThreadId) : null;

    // Update the reposted thread's repostedIn array
    if (repostedThread) {
      repostedThread.repostedIn = repostedThread.repostedIn.filter(
        (threadId: string) => threadId.toString() !== mainThread._id.toString()
      );
      await repostedThread.save();
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}

export async function fetchThreadById(threadId: string) {
  await connectToDB();

  try {
    if (!mongoose.isValidObjectId(threadId)) {
      throw new Error("Invalid thread ID.");
    }
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image username",
      }) // Populate the author field with _id and username
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      }) // Populate the community field with _id and name
      .populate({
        path: "children", // Populate the children field
        populate: [
          {
            path: "author", // Populate the author field within children
            model: User,
            select: "_id id name parentId image", // Select only _id and username fields of the author
          },
          {
            path: "children", // Populate the children field within children
            model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
            populate: {
              path: "author", // Populate the author field within nested children
              model: User,
              select: "_id id name parentId image", // Select only _id and username fields of the author
            },
          },
        ],
      })
      .exec();

    return thread;
  } catch (err) {
    console.error("Error while fetching thread:", err);
    throw new Error("Unable to fetch thread");
  }
}

export async function addComment(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!mongoose.isValidObjectId(threadId)) throw new Error("Invalid thread ID.");
    if (authenticatedUser._id.toString() !== userId) {
      throw new Error("You are not allowed to comment as this user.");
    }
    if (!commentText || commentText.trim().length < 3 || commentText.length > 2000) {
      throw new Error("Comment must be between 3 and 2000 characters.");
    }
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    // Create the new comment thread
    const commentThread = new Thread({
      text: commentText,
      author: authenticatedUser._id,
      parentId: threadId,
    });

    // Save the comment thread to the database
    const savedCommentThread = await commentThread.save();

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id);

    // Save the updated original thread to the database
    await originalThread.save();

    await createNotification({
      recipientId: originalThread.author,
      actorId: authenticatedUser._id,
      type: originalThread.parentId ? "reply" : "comment",
      entityType: "thread",
      entityId: threadId,
      message: originalThread.parentId ? "replied to your comment." : "commented on your thread.",
    });

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error(
      err instanceof Error ? err.message : "Unable to add comment. Please try again."
    );
  }
}


export async function fetchThreadsByTopic({
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

    

    // Create an initial query object to filter communities.
    const query: FilterQuery<typeof Thread> = {};

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { topics: { $regex: searchString } },
        { text: { $regex: `#${searchString}` } },
      ];
    }

    // Define the sort options for the fetched communities based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    // Create a query to fetch the communities based on the search and sort criteria.
    const threadsQuery = Thread.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: 'author',
        model: User

      })

    // Count the total number of communities that match the search criteria (without pagination).
    const totalThreadsCount = await Thread.countDocuments(query);

    const threads = await threadsQuery.exec();


    //filter those who have topics.length > 0
    const filteredThreads =searchString.trim() !== "" ? threads : threads.filter((thread) => thread?.topics?.length > 0);

    // Check if there are more communities beyond the current page.
    const isNext = totalThreadsCount > skipAmount + filteredThreads.length;

    return { filteredThreads, isNext };
  } catch (error) {
    console.error("Error fetching communities:", error);
    throw error;
  }
}
