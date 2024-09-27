"use server";

import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";
import path from "path";

export async function fetchUser(userId: string) {
  try {
    connectToDB();

    const regex = new RegExp(userId, "i");

    // Create an initial query object to filter communities.
    const query: FilterQuery<typeof User> = {};
    query.$or = [
      { username: { $regex: regex } },
      { id: { $regex: regex } },
    ];


    return await User.findOne(query).populate({
      path: "communities",
      model: Community,
    });
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
    connectToDB();

    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true }
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
    connectToDB();

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
    connectToDB();

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
    connectToDB();

    //convert userId to object id
    const userObjectId = await  User.findOne(
      { id: userId},
      { _id: 1}
    )

    // Find all threads created by the user
    const userThreads = await Thread.find({ author: userObjectId });

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
      author: { $ne: userObjectId }, // Exclude threads authored by the same user
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
      author: {$ne: userObjectId},
    }).populate({
      path: 'author',
      model: User,
      select: 'name image _id username',
    })

    const myLikedThreads = await User.findOne(
      { id: userId },
      { likedThreads: 1}
    ).populate({
      path: 'likedThreads',
      model: Thread,
      populate: {
        path: 'author',
        model: User,
        select: 'name image _id username',
      }
    })
    const likedThreads = myLikedThreads.likedThreads;

    console.log("myLikedThreads: ", myLikedThreads.likedThreads);

    return {replies:replies, repostedIn: repostedIn, myLikedThreads: myLikedThreads.likedThreads};
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
  }
}


export async function editThread(threadId: string, text: string, path: string) {
  try {
    connectToDB();

    await Thread.updateOne({ _id: threadId  }, { text });
    revalidatePath(path);
  }
  catch (error) {
    console.error("Error editing thread: ", error);
    throw error;
  }
}


export async function handleLike(threadId: string, userId: string, pathname: string) {
  try {
    connectToDB();

    const thread = await Thread.findOne(
      { _id : threadId },
    ).populate({
      path: 'author',
      model: User,
      select: 'id likedThreads',
    })
    //get the author
    const author = thread.author;
    //fetch users liked threads
    const likedThreads = author.likedThreads;
    //check if the thread is already liked
    const isLiked = likedThreads.likedThreads.includes(threadId);
    //if liked remove from liked threads
    if(isLiked){
      await User.updateOne(
        { id: userId },
        { $pull: { likedThreads: threadId } },

      )
      
      thread.likedBy = thread.likedBy.filter((id:any) => id !== userId);
      thread.upvotes = thread.upvotes - 1;
    }
    //else add to liked threads and increment upvotes
    else{
      await User.updateOne(
        {
          id: userId
        },
        { $push: { likedThreads: threadId } }
      )

      //change userID to ibjectID
      const userObjectId = await  User.findOne(
        { id: userId},
        { _id: 1}
      )
    
      thread.likedBy.push(userObjectId);
      thread.upvotes = thread.upvotes + 1;
    }
    await thread.save();
    console.log("thread after like: ", thread);
    revalidatePath(pathname);


    return thread.upvotes;
  }
  catch (error) {
    console.error("Error liking thread: ", error);
    throw error;
  }
}