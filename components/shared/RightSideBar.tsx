import React from 'react'
import UserCard from '../cards/UserCard'
import { fetchUsers } from '@/lib/actions/user.actions'
import { currentUser } from '@clerk/nextjs'

const RightSideBar = async () => {
  const user = await currentUser()
  if(!user) return null
  const users = await fetchUsers({ userId: user.id, pageNumber: 1, pageSize: 5 })
  return (
    <section className='custom-scrollbar rightsidebar'>
      <div className='flex flex-1 flex-col justify start'>
        <h3 className='text-heading4-medium text-light-1'>Suggested Communities</h3>
      </div>
      <div className='flex flex-1 flex-col justify start'>
        <h3 className='text-heading4-medium text-light-1 mb-5'>Suggested Users</h3>
        <div  className='flex flex-col gap-4' >

        {
          users.users.map((user) => (
            <div key={user._id} className='rounded border-1 bg-gray-700 p-3 '>
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