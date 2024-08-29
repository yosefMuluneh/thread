"use server";

import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";

import User from "../models/user.model";
import Thread from "../models/thread.model";
import Community from "../models/community.model";

export async function fetchThreads(pagenumber = 1, pagesize = 20) {
    try{
        connectToDB()
        const skipAmount = (pagenumber - 1) * pagesize

        //threads with no parents
        const threadsQuery = Thread.find({
            parentId: { $in: [null, undefined]}
        })
        .sort({createdAt: 'desc'})
        .skip(skipAmount)
        .limit(pagesize)
        .populate({ path: 'author', model: User })
        .populate({ 
            path : 'children',
            populate:{
                path: 'author', 
                model: User, 
                select:"_id name parentId image"}
        })

        const totalThreadsCount = await Thread.countDocuments({
            parentId :{ $in: [null,undefined]}
        })

        const threads = await threadsQuery.exec()

        const isNext = totalThreadsCount > skipAmount + threads.length

        return { threads, isNext}
    }catch(error:any){
        throw new Error(`Failed to fetch threads ${error.message}`)
    }
}



interface Params {
  text: string,
  author: string,
  communityId: string | null,
  path: string,
}


export async function createThread({ text, author, communityId, path }: Params
) {
  try {
    connectToDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    console.log('creratedIdObect',communityIdObject);

    const createdThread = await Thread.create({
        text,
        author,
        upvotes: 0,
        downvotes: 0,
        comments: [],
        createdAt: new Date(),
        community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
    });

    console.log('createdThread',createdThread);

    // Update User model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
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
    connectToDB();

    // Find the thread to be deleted (the main thread)
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Thread not found");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}

export async function fetchThreadById(threadId: string) {
  connectToDB();

  try {
    const thread = await Thread.findById(threadId)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
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
  connectToDB();

  try {
    // Find the original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if (!originalThread) {
      throw new Error("Thread not found");
    }

    // Create the new comment thread
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId, // Set the parentId to the original thread's ID
    });

    // Save the comment thread to the database
    const savedCommentThread = await commentThread.save();

    // Add the comment thread's ID to the original thread's children array
    originalThread.children.push(savedCommentThread._id);

    // Save the updated original thread to the database
    await originalThread.save();

    revalidatePath(path);
  } catch (err) {
    console.error("Error while adding comment:", err);
    throw new Error("Unable to add comment");
  }
}



















// 'use server'
// import { connectToDB } from "../mongoose";
// import Thread from "../models/thread.model";
// import { revalidatePath } from "next/cache";
// import User from "../models/user.model";

// interface Params {
//     author: string,
//     text: string,
//     communityId: string | null,
//     path: string
// }

// export async function createThread(
//     {
//         author,
//         text,
//         communityId,
//         path
// } : Params
//     ):Promise<void>{
    

//     try{
//         connectToDB()
//         const createdThread = await Thread.create({
//             text,
//             community: communityId,
//             author,
//             upvotes: 0,
//             downvotes: 0,
//             comments: [],
//             createdAt: new Date()
//         });

//         //update user model
//         await User.findByIdAndUpdate(author, {
//             $push: {threads: createdThread._id
//             }
//         })

//         revalidatePath(path)
//     }catch(err: any){
//         throw new Error(`failed to create thread: ${err.message}`)
//     }
// }

// export async function fetchThreads(pagenumber = 1, pagesize = 20) {
//     try{
//         connectToDB()
//         const skipAmount = (pagenumber - 1) * pagesize

//         //threads with no parents
//         const threadsQuery = Thread.find({
//             parentId: { $in: [null, undefined]}
//         })
//         .sort({createdAt: 'desc'})
//         .skip(skipAmount)
//         .limit(pagesize)
//         .populate({ path: 'author', model: User })
//         .populate({ 
//             path : 'children',
//             populate:{
//                 path: 'author', 
//                 model: User, 
//                 select:"_id name parentId image"}
//         })

//         const totalThreadsCount = await Thread.countDocuments({
//             parentId :{ $in: [null,undefined]}
//         })

//         const threads = await threadsQuery.exec()

//         const isNext = totalThreadsCount > skipAmount + threads.length

//         return { threads, isNext}
//     }catch(error:any){
//         throw new Error(`Failed to fetch threads ${error.message}`)
//     }
// }

// export async function fetchThreadById(id: string){
//     try{
//         connectToDB()
//         //TODO: populate community
//         const thread = await Thread.findById(id)
//         .populate({
//             path: 'author',
//             model: User,
//             select: "_id id image name"
//         })
//         .populate({
//             path: "children",
//             populate:[
//                 {
//                     path:"author",
//                     model: User,
//                     select: "_id id name parentId image"
//                 },
//                 {
//                     path:"children",
//                     model: Thread,
//                     populate:{
//                         path:"author",
//                         model: User,
//                         select: "_id id name parentid image"
//                     }
//                 }
//             ]
//         }).exec()
//         // .populate({
//         //     path: 'community',
//         //     model: community,

//         // })

//         return thread

//     }catch(err: any){
//         throw new Error(`Failed to fetch the thread ${err.message}`)
//     }

// }

// export async function addComment(
//     threadId:string,
//     commentText:string,
//     userId:string,
//     path:string
//     ){
//         try{
//             connectToDB()
//             const originalThread = await Thread.findById(threadId)

//             if(!originalThread) throw new Error("Thread not found")

//             //new thread of the comment

//             const newThread = new Thread({
//                 author:userId,
//                 text:commentText,
//                 parentId:threadId,
//             })

//             const savedcommentThread = await newThread.save()

//             originalThread.children.push(savedcommentThread._id)
//             await originalThread.save()
//             revalidatePath(path)
//         }catch(error:any){
//             throw new Error(`Failed to add comment ${error.message}`)
//         }
//     }