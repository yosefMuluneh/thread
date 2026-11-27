'use client'

import Image from "next/image"
import Link from "next/link"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

interface Props {
  id: string
  name: string
  username: string
  imgUrl: string
  personType: string
  currentUserId?: string
  profileLink?: boolean
  hideViewButton?: boolean
}

const UserCard = ({
  id,
  name,
  username,
  imgUrl,
  personType,
  currentUserId,
  profileLink = false,
  hideViewButton = false,
}: Props) => {
  const router = useRouter()

  const identity = (
    <div className="user-card_avatar">
      <Image
        src={imgUrl}
        alt={`${name}'s profile picture`}
        width={48}
        height={48}
        className="rounded-full object-cover"
      />
      <div className="min-w-0 flex-1 text-ellipsis">
        <h4 className="text-base-semibold text-light-1">{name}</h4>
        <p className="text-small-medium text-gray-1">@{username}</p>
      </div>
    </div>
  )

  return (
    <article className="user-card">
      {profileLink && id ? (
        <Link
          href={`/profile/${id}`}
          className="min-w-0 flex-1 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={`View ${name}'s profile`}
        >
          {identity}
        </Link>
      ) : (
        identity
      )}

      {!hideViewButton && id !== currentUserId && (
        <Button
          disabled={!id}
          onClick={() => {
            if (id) router.push(`/profile/${id}`)
          }}
          className="user-card_btn"
        >
          View
        </Button>
      )}
    </article>
  )
}

export default UserCard
