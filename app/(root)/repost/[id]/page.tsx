'use server'
import ThreadCard from '@/components/cards/ThreadCard'
import React from 'react'
import { currentUser } from '@clerk/nextjs/server'
import { fetchUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'
import { fetchThreadById } from '@/lib/actions/thread.actions'
import Comment from '@/components/forms/Comment'
import RepostThread from '@/components/forms/RepostThread'



const page =  async({ params } : { params: Promise<{ id: string }> }) => {
    const routeParams = await params;
    if(!routeParams.id) return null

    const user = await currentUser()

    if(!user) return null

    const userInfo = await fetchUser(user.id)
    if(!userInfo?.onboarded) return redirect('/onboarding')
    const userId = userInfo._id.toString();
    

    const thread = await fetchThreadById(routeParams.id)


  return (
    <section className='relative'>
        <div>
        <div className='my-3'>
            <RepostThread
            userId={userId}
            threadId={thread.id}
            currentUserImage={userInfo.image}
            currentUserId={JSON.stringify(userInfo._id)}/>
        </div>
        <ThreadCard
            key={thread._id}
            id={thread._id.toString()}
            currentUserId={user?.id}
            parentId={thread.parentId}
            content={thread.text}
            imageUrl={thread.imageUrl}
            author={thread.author}
            community={thread.community}
            createdAt={thread.createdAt}
            comments={thread.children}
            upvotes={thread.upvotes}
                />
        </div>
        
    </section>
  )
}

export default page
