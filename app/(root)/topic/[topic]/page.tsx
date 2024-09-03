import ThreadCard from '@/components/cards/ThreadCard'
import { fetchThreadsByTopic } from '@/lib/actions/thread.actions'
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import React from 'react'

const page = async (
    { params } : { params: { topic : string }}
) => {
    const user = await currentUser()

    if (!user) {
        redirect('/sign-in')
    }

    const threadsByTopic = await fetchThreadsByTopic({ searchString: params.topic })
  return (
    <section>
        <h1 className='head-text text-left mb-3'>Topic: <span className='text-blue'>#{params.topic}</span></h1>
        <div className='flex flex-col flex-col-1 gap-10'>
            {threadsByTopic.filteredThreads.map((thread) => (
                <ThreadCard
                key={thread._id}
                id={thread._id}
                currentUserId={user?.id}
                parentId={thread.parentId}
                content={thread.text}
                author={thread.author}
                   
                community={thread.community}
                createdAt={thread.createdAt}
                comments={thread.children}
                downvotes={thread.downvotes}
                    />
            ))}
        </div>
    </section>
  )
}

export default page