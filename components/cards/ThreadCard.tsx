
import { formatDateString } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'


interface Props{
    id : string,
    currentUserId: string | undefined,
    parentId : string | null,
    content: string,
    author:{
        name: string,
        image: string,
        id: string
    },
    community: {
        id:string,
        name: string,
        image: string
    } | null,
    createdAt : string,
    comments:{
        author:{
            image: string
        }
    }[],
    upvotes ?: number | 0,
    downvotes?: number,
    isComment?: boolean
}

const Content = ({content}: {content: string}) => {
     // Regular expression to detect @username and #topic
  const regex = /(@\w+|#\w+)/g;

  // Split the content into an array of text and matches
  const parts = content.split(regex);


  return (
    <p className="mt-2 text-small-regular text-light-2">
      {parts.map((part, index) => {
        // Check if the part matches @username or #topic
        if (part.match(/@\w+/)) {
          return (
            <Link key={index} href={`/profile/${part.slice(1)}`} className="text-blue">
                {part}
            </Link>
            
          );
        }

        if (part.match(/#\w+/)) {
          return (
            <Link key={index} className='text-blue' href={`/topic/${part.slice(1)}`}>
                {part}
            </Link>
          );
        }

        // Return regular text
        return <span  key={index}>{part}</span>;
      })}
    </p>
  );
}



const ThreadCard = ({
    id,
currentUserId,
parentId,
content,
author,
community,
createdAt,
comments,
upvotes,
downvotes,
isComment
}: Props) => {
    
  return (
    <Link href={`/thread/${id}`}>
    
    <article className={`flex w-full flex-col rounded-xl 
    ${ isComment ? 'px-0 xs:px-7' : 'bg-dark-2 p-7'}`} >
        <div className='flex items-start justify-between'>
            <div className='flex w-full flex-1 flex-row gap-4'>
                <div className='flex flex-col items-center'>
                    <Link
                    href={`/profile/${author.id}`}
                    className='relative h-11 w-11'>
                        <Image 
                        src={author.image}
                        alt='profile image'
                        fill
                        className='cursor-pointer rounded-full'/>
                        </Link>
                        <div className='thread-card_bar'/>
                </div>
                <div className='flex w-full flex-col'>
                    <Link href={`/profile/${author.id}`} className='w-fit'>
                        <h4 className='cursor-pointer text-base-semibold text-light-1'>
                            {author.name}
                        </h4>
                    </Link>
                        <Content content={content} />
                    
                    <div className={`${ isComment && 'mb-10'} mt-5 flex flex-col gap-3`}>
                        <div className='flex gap-3.5'>
                                
                            <Image
                            src='/assets/heart-gray.svg'
                            alt='heart'
                            width={24}
                            height={24}
                            className='cursor-pointer object-contain'/>
                            {
                                upvotes && upvotes > 0 && (
                                    <p className='text-subtle-medium text-gray-1'>
                                        {upvotes}
                                    </p>
                                )
                            }
                            
                            <div className='flex items-center gap-1'>
                            <Link href={`/thread/${id}`}>
                                
                            <Image
                            src='/assets/reply.svg'
                            alt='reply'
                            width={24}
                            height={24}
                            className='cursor-pointer object-contain'/>
                            </Link>
                            {
                                comments && comments.length > 0 && (
                                    <p className='text-subtle-medium text-gray-1'>
                                        {comments.length}
                                    </p>
                                )
                            }
                            </div>
                            
                            <Image
                            src='/assets/repost.svg'
                            alt='repost'
                            width={24}
                            height={24}
                            className='cursor-pointer object-contain'/>
                            <Image
                            src='/assets/share.svg'
                            alt='share'
                            width={24}
                            height={24}
                            className='cursor-pointer object-contain'/>
                        </div>
                        

                    </div>
                        
                </div>
            </div>
            {/* {Delete Thread} */}
            {/* { Show comment logos } */}

        </div>{
            !community && (
                <div className='mt-5'>

                <p className='text-subtle-medium text-gray-1'>
                    { formatDateString(createdAt) }
                </p>
                </div>
            ) }
            
            {
                !isComment && community && (
                    <Link href={`communities/${community.id}`} className='mt-5 flex items-center' >
                        <p className='text-subtle-medium text-gray-1'>
                            { formatDateString(createdAt) }
                             {' '}- { community.name } Community
                        </p>

                        <Image src={community.image} alt={community.name} width={14} height={14}
                        className='ml-1 rounded-full object-cover' />

                    </Link>
                ) 
            }
        
    </article>
    </Link>
  )
}

export default ThreadCard