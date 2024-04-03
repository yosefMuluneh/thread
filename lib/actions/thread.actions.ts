'use server'
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import { revalidatePath } from "next/cache";
import User from "../models/user.model";

interface Params {
    author: string,
    text: string,
    communityId: string | null,
    path: string
}

export async function createThread(
    {
        author,
        text,
        communityId,
        path
} : Params
    ):Promise<void>{
    

    try{
        connectToDB()
        const createdThread = await Thread.create({
            text,
            community: null,
            author,
            upvotes: 0,
            downvotes: 0,
            comments: [],
            createdAt: new Date()
        });

        //update user model
        await User.findByIdAndUpdate(author, {
            $push: {threads: createdThread._id
            }
        })

        revalidatePath(path)
    }catch(err: any){
        throw new Error(`failed to create thread: ${err.message}`)
    }
}

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

export async function fetchThreadById(id: string){
    try{
        connectToDB()
        //TODO: populate community
        const thread = await Thread.findById(id)
        .populate({
            path: 'author',
            model: User,
            select: "_id id image name"
        })
        .populate({
            path: "children",
            populate:[
                {
                    path:"author",
                    model: User,
                    select: "_id id name parentId image"
                },
                {
                    path:"children",
                    model: Thread,
                    populate:{
                        path:"author",
                        model: User,
                        select: "_id id name parentid image"
                    }
                }
            ]
        }).exec()
        // .populate({
        //     path: 'community',
        //     model: community,

        // })

        return thread

    }catch(err: any){
        throw new Error(`Failed to fetch the thread ${err.message}`)
    }

}

export async function addComment(
    threadId:string,
    commentText:string,
    userId:string,
    path:string
    ){
        try{
            connectToDB()
            const originalThread = await Thread.findById(threadId)

            if(!originalThread) throw new Error("Thread not found")

            //new thread of the comment

            const newThread = new Thread({
                author:userId,
                text:commentText,
                parentId:threadId,
            })

            const savedcommentThread = await newThread.save()

            originalThread.children.push(savedcommentThread._id)
            await originalThread.save()
            revalidatePath(path)
        }catch(error:any){
            throw new Error(`Failed to add comment ${error.message}`)
        }
    }