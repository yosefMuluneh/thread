"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";
import { use } from "react";

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

export async function fetchUsers({
    userId,
    pageNumber=1,
    pageSize=20,
    searchQuery='',
    sortBy='desc'
}:{
    userId: string,
    pageNumber?: number,
    pageSize?: number,
    searchQuery?: string,
    sortBy?: SortOrder
}){
    try{
        connectToDB()
        const skipAmount = pageSize * (pageNumber - 1)
        const regex = new RegExp(searchQuery, 'i');
        const query: FilterQuery<typeof User> = {
            id:{
                $ne: userId
            },
        }
        if(searchQuery.trim() !== ''){
            query['$or'] = [
                {name: regex},
                {username: regex}
            ]
        }
        const sortOptions = {
            createdAt: sortBy
        
        }
        const usersQuery = User.find(query)
        .sort(sortOptions)
        .skip(skipAmount)
        .limit(pageSize)

        const totalUsers = await User.countDocuments(query)
        const users = await usersQuery.exec()

        const isNext = totalUsers > skipAmount + users.length
        return { users, isNext }
    }catch(err: any){
        throw new Error(`failed to fetch users: ${err.message}`)
    }
}

export async function getActivities(userId: string){
    try{
        connectToDB()
        const userThreads = await Thread.find({author: userId})

        const childThreadsId = userThreads.reduce((acc, thread) => {
            return acc.concat(thread.children)
        
        },[])

        const replies =  await Thread.find({
            _id : { $in: childThreadsId },
            author : { $ne: userId }
        }).populate({
            path:"author",
            model: "User",
            select: "name image _id"
        })

        return replies

    } catch(err: any){
        throw new Error(`failed to fetch user activities: ${err.message}`)
    }
}