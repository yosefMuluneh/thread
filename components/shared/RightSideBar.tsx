import React from 'react'
import UserCard from '../cards/UserCard'
import { fetchUsers } from '@/lib/actions/user.actions'
import { currentUser } from '@clerk/nextjs'
import { fetchCommunities } from '@/lib/actions/community.actions'
import CommunityCard from '../cards/CommunityCard'

const RightSideBar = async () => {
  const user = await currentUser()
  if(!user) return null
  const users = await fetchUsers({ userId: user.id, pageNumber: 1, pageSize: 5 })
  const communities = await fetchCommunities({ searchString: '', pageNumber: 1, pageSize: 5 })
  return (
    <section className='custom-scrollbar rightsidebar'>
      <div className='flex flex-col'>
        <h3 className='text-heading4-medium text-light-1 mb-5'>Suggested Communities</h3>
          {
            communities.communities.map((community) => (
              <div key={community.id} className='mb-5'>
                <CommunityCard id={community.id} name={community.name} username={community.username} imgUrl={community.image} bio={community.bio} members={community.members}/>
              </div>
            ))
          }
      </div>
      <div className='flex border-y border-y-dark-4'/>
      <div className='flex flex-col'>
        <h3 className='text-heading4-medium text-light-1 mb-5'>Suggested Users</h3>
        <div  className='flex flex-col gap-4' >

        {
          users.users.map((user) => (
            <div key={user._id} className='rounded border-1 community-card p-3 '>
              <UserCard  id={user.id} name={user.name} imgUrl={user.image} username={user.username} personType='User'/>
            </div>
            
          ))

        }
        
        </div>
      </div>
    </section>
  )
}

export default RightSideBar