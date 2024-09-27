'use client'
import { handleLike } from '@/lib/actions/user.actions'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'


interface InteractionProps {
    upvotes?: number,
    comments?: any[],
    id: string,
    isComment?: boolean,
    author: any
}
const InteractionCard = ({ 
   thread
 }: {thread :  any}) => {
    const { upvotes, comments, id, currentUserId } = JSON.parse(thread)

    const [hasLiked, setHasLiked] = useState(false)
    const [likes, setLikes] = useState(upvotes)
    const pathname = usePathname()

    const handleLikeDislike =async () => {
        const response =  await handleLike(id, currentUserId, pathname)
        setHasLiked(!hasLiked)
        setLikes(response)

    }

  return (
    <div className='flex gap-3.5'>
            <div className='flex items-center gap-1'>
                
            <Image
            src={`${likes > 0 ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'}`}
            alt='heart'
            width={24}
            height={24}
            onClick={handleLikeDislike}
            className='cursor-pointer object-contain'/>
            {
                likes > 0 && (
                    <p className='text-subtle-medium text-gray-1'>
                        {likes}
                    </p>
                )
            }
            </div>                   
            
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
            
            <Link href={`/repost/${id}`}>
            
            <Image
            src='/assets/repost.svg'
            alt='repost'
            width={24}
            height={24}
            className='cursor-pointer object-contain'/>
            </Link>
            <Image
            src='/assets/share.svg'
            alt='share'
            width={24}
            height={24}
            className='cursor-pointer object-contain'/>
        </div>
                
                        
  )
}

export default InteractionCard