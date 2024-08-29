import AccountProfile from '@/components/forms/AccountProfile'
import React from 'react'
import { currentUser } from '@clerk/nextjs'
import { fetchUser } from '@/lib/actions/user.actions'
import { redirect } from 'next/navigation'

const  page = async () => {
  const user = await currentUser()
  if (!user) {
    return null
  }
  const userInfos = await fetchUser(user.id)
  const userInfo = JSON.parse(JSON.stringify(userInfos))
  if (userInfo?.onboarded) redirect('/')
  const userData = {
    id : user?.id,
    objectid : userInfo ?  userInfo?._id : user?.id,
    username : userInfo ?  userInfo?.username : user?.username,
    name : userInfo ?  userInfo?.name : user?.firstName,
    bio : userInfo ?  userInfo?.bio : '',
    image : userInfo ?  userInfo?.image : user?.imageUrl,
  }
  return (
    <main className='mx-auto flex max-w-3xl flex-col justify-start px-10 py-20'>
        <h1 className='head-text'>Onboarding</h1>
        <p className='mt-3 text-base-regular text-light-2'>
          Complete your profile now to use Threads
        </p>
        <section className='mt-9 bg-dark-2 p-10'>
          <AccountProfile
            user={userData}
            btnTitle="Continue"/>
        </section>
    </main>
  )
}

export default page