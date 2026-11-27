'use client'

import { handleLike } from '@/lib/actions/user.actions'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useLikeState } from '@/components/providers/LikeStateProvider'

const InteractionCard = ({ thread }: { thread: string }) => {
  const { upvotes, comments, id, currentUserId } = JSON.parse(thread)
  const [likes, setLikes] = useState<number>(upvotes ?? 0)
  const [isLiking, setIsLiking] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const pathname = usePathname()
  const { likedThreadIds, setLiked, isLoading } = useLikeState()
  const hasLiked = likedThreadIds.has(id)

  const handleLikeDislike = async () => {
    if (isLiking || isLoading) return
    setIsLiking(true)
    try {
      const response = await handleLike(id, currentUserId, pathname)
      setLiked(id, !hasLiked)
      setLikes(response)
    } catch (error) {
      console.error('Unable to update like:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const shareThread = async () => {
    const url = `${window.location.origin}/thread/${id}`
    setShareMessage('')
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Thread', text: 'Check out this thread', url })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setShareMessage('Link copied')
      } else {
        window.prompt('Copy this thread link:', url)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(url)
        setShareMessage('Link copied')
      } catch {
        setShareMessage('Unable to share link')
      }
    }
  }

  const actionClass = 'inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-medium text-gray-1 transition hover:bg-white/[0.06] hover:text-light-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="flex flex-nowrap items-start gap-1 border-t border-white/[0.07] pt-3">
      <button
        type="button"
        onClick={handleLikeDislike}
        disabled={isLiking || isLoading}
        aria-label={hasLiked ? 'Unlike thread' : 'Like thread'}
        aria-pressed={hasLiked}
        className={`${actionClass} ${hasLiked ? 'text-rose-400 hover:text-rose-300' : ''}`}
      >
        <Image
          src={hasLiked ? '/assets/heart-filled.svg' : '/assets/heart-gray.svg'}
          alt=""
          width={19}
          height={19}
          className="shrink-0 object-contain"
        />
        {likes > 0 && <span>{likes}</span>}
      </button>

      <Link href={`/thread/${id}`} className={actionClass} aria-label="Reply to thread">
        <Image src="/assets/reply.svg" alt="" width={19} height={19} className="shrink-0 object-contain" />
        {comments?.length > 0 && <span>{comments.length}</span>}
      </Link>

      <Link href={`/repost/${id}`} className={actionClass} aria-label="Repost thread">
        <Image src="/assets/repost.svg" alt="" width={19} height={19} className="shrink-0 object-contain" />
      </Link>

      <button type="button" onClick={shareThread} aria-label="Share thread" className={actionClass}>
        <Image src="/assets/share.svg" alt="" width={19} height={19} className="shrink-0 object-contain" />
      </button>

      {shareMessage && <span role="status" className="sr-only">{shareMessage}</span>}
    </div>
  )
}

export default InteractionCard
