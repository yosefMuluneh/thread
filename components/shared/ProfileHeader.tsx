import Image from "next/image"
import { Button } from "../ui/button"

interface Props {
    accountId: string
    authUserId: string
    name: string
    username: string
    imgUrl: string
    bio: string
    type? : 'User' | 'Community'
    joined?: false | true
    following?: false | true
}

const ProfileHeader = ({
    accountId,
    authUserId,
    name,
    username,
    imgUrl,
    bio,
    type = 'User',
    joined = false,
    following = false
}: Props) => {
  return (
    <div className="flex w-full flex-col justify-start">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative h-20 w-20 object-cover">
                    <Image
                    src={imgUrl}
                    alt="profile picture"
                    fill
                    className="rounded-full object-cover shadow-2xl" />
                </div>
                <div className="flex-1 flex-col">
                    <h2 className="text-2xl text-heading3-bold text-light-1">{name}</h2>
                    <p className="text-lg text-gray-500">@{username}</p>
                    </div>
            </div>
            <div>
                {
        accountId !== authUserId &&
            <Button type='submit' className='bg-primary-500 '> 
                {
                    type === 'User' ?
                    following ? 'Unfollow' : 'Follow' :
                    joined ? 'Leave' : 'Join'
                }
      </Button>
      }
                </div>
                
        </div>
        <p className="mt-6 max-w-lg text-base-regular text-light-2">{bio}</p>
                <div  className="mt-12 h-0.5 w-full bg-dark-3"/>
    </div>
  )
}

export default ProfileHeader