import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import CommunityCard from '../cards/CommunityCard'
import UserCard from '../cards/UserCard'

const SuggestedUsers = ({ users } : { users : any[]}) => {
  return (
    <ScrollArea className="w-full max-h-96 border border-gray-700 rounded-md px-2">
      <div  className='flex flex-col gap-4' >

{
  users.map((user) => (
    <div key={user._id} className='rounded border-1 community-card p-3 '>
      <UserCard  id={user.id} name={user.name} imgUrl={user.image} username={user.username} personType='User'/>
    </div>
    
  ))

}

</div>
     
    </ScrollArea>
  )
}

export default SuggestedUsers