"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model";

interface Params {
    userId: string,
    username: string,
    name: string,
    bio: string,
    image: string,
    path: string
}

export async function updateUser(
    {userId,
    username,
    name,
    bio,
    image,
    path
} : Params
    ):Promise<void>{
    connectToDB()

    try{
        await User.findOneAndUpdate(
        {id: userId},
        {
            username: username.toLowerCase(),
            name,
            bio,
            image,
            onboarded: true,
        },
        {upsert: true}
        );

        if(path === '/profile/edit'){
            revalidatePath(path)
        }
    }catch(err: any){
        throw new Error(`failed to create/update user: ${err.message}`)
    }
}

export async function fetchUser(userId: string){
    try{
        connectToDB()
        const user = await User
        .findOne({id: userId})
        // .populate({
        //     path: 'communities',
        //     model: Community
        // })
        return user
    }catch(err: any){
        throw new Error(`failed to fetch user: ${err.message}`)
    }
}

export async function fetchUserThreads(userId:string) {
    try{
        connectToDB()

        //TODO: community populate
        const threads = await User.findOne({ id: userId })
        .populate({
            path:'threads',
            model: Thread,
            populate:{
                path: 'children',
                model: Thread,
                populate: {
                    path: 'author',
                    model: User,
                    select: "name image id"
                }
            }
        })
        return threads

    }catch(error:any){
        throw new Error(`Failed to fetch user's threads ${error.message}`)
    }
}