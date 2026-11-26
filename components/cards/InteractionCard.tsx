'use client'
import { getThreadLikeState, handleLike } from '@/lib/actions/user.actions'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'


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
    const [isLiking, setIsLiking] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        let active = true;
        getThreadLikeState(id)
            .then((state) => {
                if (!active) return;
                setHasLiked(state.hasLiked);
                setLikes(state.upvotes);
            })
            .catch((error) => console.error("Unable to load like state:", error));
        return () => { active = false; };
    }, [id]);

    const handleLikeDislike = async () => {
        if (isLiking) return;
        setIsLiking(true);
        try {
            const response = await handleLike(id, currentUserId, pathname);
            setHasLiked((current) => !current);
            setLikes(response);
        } catch (error) {
            console.error("Unable to update like:", error);
        } finally {
            setIsLiking(false);
        }
    }

  return (
    <div className='flex gap-3.5'>
            <div className='flex items-center gap-1'>
                
            <button
              type="button"
              onClick={handleLikeDislike}
              disabled={isLiking}
              aria-label={hasLiked ? "Unlike thread" : "Like thread"}
              aria-pressed={hasLiked}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Image
                src={hasLiked ? "/assets/heart-filled.svg" : "/assets/heart-gray.svg"}
                alt=""
                width={24}
                height={24}
                className="cursor-pointer object-contain"
              />
            </button>
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