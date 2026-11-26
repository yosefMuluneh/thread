'use client'
import { handleLike } from '@/lib/actions/user.actions'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useLikeState } from '@/components/providers/LikeStateProvider'


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

    const [likes, setLikes] = useState(upvotes)
    const [isLiking, setIsLiking] = useState(false)
    const [shareMessage, setShareMessage] = useState("")
    const pathname = usePathname()
    const { likedThreadIds, setLiked, isLoading } = useLikeState()
    const hasLiked = likedThreadIds.has(id)

    const handleLikeDislike = async () => {
        if (isLiking) return;
        setIsLiking(true);
        try {
            const response = await handleLike(id, currentUserId, pathname);
            setLiked(id, !hasLiked);
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
              disabled={isLiking || isLoading}
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
            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}/thread/${id}`;
                setShareMessage("");

                try {
                  if (typeof navigator.share === "function") {
                    await navigator.share({
                      title: "Thread",
                      text: "Check out this thread",
                      url,
                    });
                  } else if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(url);
                    setShareMessage("Link copied");
                  } else {
                    window.prompt("Copy this thread link:", url);
                  }
                } catch (error) {
                  if (error instanceof Error && error.name === "AbortError") return;

                  try {
                    await navigator.clipboard.writeText(url);
                    setShareMessage("Link copied");
                  } catch (clipboardError) {
                    console.error("Unable to share thread:", clipboardError);
                  }
                }
              }}
              aria-label="Share thread"
              title="Share thread"
              className="cursor-pointer"
            >
              <Image
                src='/assets/share.svg'
                alt=''
                width={24}
                height={24}
                className='object-contain'
              />
            </button>
            {shareMessage && (
              <span role="status" className="text-xs text-gray-1">
                {shareMessage}
              </span>
            )}   </button>
        </div>
                
                        
  )
}

export default InteractionCard