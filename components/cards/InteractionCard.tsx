'use client'
import Image from 'next/image'
import Link from 'next/link'
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

    const [hasLiked, setHasLiked] = useState(false)

    const { upvotes, comments, id } = JSON.parse(thread)



    const handleLike = () => {
        setHasLiked(!hasLiked)
    }

  return (
    <div className='flex gap-3.5'>
                                    
            <Image
            src={`${hasLiked ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'}`}
            alt='heart'
            width={24}
            height={24}
            onClick={handleLike}
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