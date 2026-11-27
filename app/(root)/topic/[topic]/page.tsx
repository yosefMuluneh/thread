import ThreadCard from '@/components/cards/ThreadCard'
import { fetchThreadsByTopic } from '@/lib/actions/thread.actions'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import React from 'react'

const page = async (
    { params } : { params: Promise<{ topic: string }> }
) => {
    const routeParams = await params;
    const user = await currentUser()

    if (!user) {
        redirect('/sign-in')
    }

    const threadsByTopic = await fetchThreadsByTopic({ searchString: routeParams.topic })
  return (
    <section>
        <h1 className='head-text text-left mb-3'>Topic: <span className='text-blue'>#{routeParams.topic}</span></h1>
        <div className='flex flex-col flex-col-1 gap-10'>
            {threadsByTopic.filteredThreads.map((thread) => (
                <ThreadCard
                key={thread._id}
                id={thread._id}
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
            ))}
        </div>
    </section>
  )
}

export default page