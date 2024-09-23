import React from 'react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import CommunityCard from '../cards/CommunityCard'

const SuggestedCommunities = ({ communities } : { communities : any[]}) => {
  return (
    <ScrollArea className="w-full max-h-96 border border-5 border-gray-700 rounded-md px-2">
        {
          communities.map((community) => (
            <div key={community.id} className='mb-5'>
              <CommunityCard id={community.id} name={community.name} username={community.username} imgUrl={community.image} bio={community.bio} members={community.members}/>
            </div>
          ))
        }
     
    </ScrollArea>
  )
}

export default SuggestedCommunities