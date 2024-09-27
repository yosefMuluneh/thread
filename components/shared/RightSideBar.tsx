import React from 'react'
import UserCard from '../cards/UserCard'
import { fetchUsers } from '@/lib/actions/user.actions'
import { currentUser } from '@clerk/nextjs'
import { fetchCommunities } from '@/lib/actions/community.actions'
import CommunityCard from '../cards/CommunityCard'
import SuggestedCommunities from './SuggestedCommunities'
import SuggestedUsers from './SuggestedUsers'
import { Separator } from '../ui/separator'

const RightSideBar = async () => {
  const user = await currentUser()
  if(!user) return null
  const users = await fetchUsers({ userId: user.id, pageNumber: 1, pageSize: 5 })
  const communities = await fetchCommunities({ searchString: '', pageNumber: 1, pageSize: 5 })
  return (
    <section className='custom-scrollbar rightsidebar'>
      <div className='flex flex-col'>
        <SuggestedCommunities communities={communities.communities}/>
        
      </div>
      <div className='flex flex-col'>
        <SuggestedUsers users={users.users}/>
      </div>
    </section>
  )
}

export default RightSideBar