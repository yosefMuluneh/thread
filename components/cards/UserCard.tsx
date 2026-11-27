'use client'
import Image from "next/image"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

interface Props {
    id: string,
    name: string,
    username: string,
    imgUrl: string,
    personType: string,
    currentUserId?: string

}
const UserCard = ({
    id,
    name,
    username,
    imgUrl,
    personType,
    currentUserId

}:Props) => {
    const router = useRouter()
  return (
    <article className="user-card">
        <div className="user-card_avatar">
            <Image
            src={imgUrl}
            alt="profile pic"
            width={48}
            height={48}
            className="rounded-full" />
            <div className="flex-1 text-ellipsis">
                <h4 className="text-base-semibold text-light-1">{name}</h4>
                <p className="text-small-medium text-gray-1">@{username}</p>
            </div>
        </div>
        {id !== currentUserId && (
          <Button disabled={!id} onClick={()=>{if (id) router.push(`/profile/${id}`)}} className="user-card_btn">
              View
          </Button>
        )}
    </article>
  )
}

export default UserCard