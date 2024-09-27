import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { fetchUser, fetchUsers, fetchUserThreads, getActivities } from '@/lib/actions/user.actions'
import ProfileHeader from '@/components/shared/ProfileHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { profileTabs } from '@/constants'
import Image from 'next/image'
import ThreadsTab from '@/components/shared/ThreadsTab'
import UserCard from '@/components/cards/UserCard'
import Link from 'next/link'

const page = async () => {
    const user = await currentUser()

    var userInfo : any = null

    if (!user) {
        redirect('/sign-in')
    }

    if (user) {
        userInfo = await fetchUser(user.id)
        if(!userInfo?.onboarded){
            redirect('/onboarding')
        }
    }

  const response = await getActivities(userInfo.id)

  return (
    <section >
      <h1 className='head-text mb-10'> Activities</h1>
      <section className='mt-10 flex flex-col gap-5'>
        {
          response.replies.length > 0 && (
            <>
            {
              response.replies.map((activity: any) => (
                <Link key={activity._id} href={`/thread/${activity.parentId.parentId}`} >
                  <article className='activity-card'>
                    <Image 
                    src={activity.author.image}
                    alt='profile picture'
                    width={20}
                    height={20}
                    className='rounded-full object-cover' />
                    <p className='!text-small-regular text-light-1'>
                      <span className='mr-1 text-primary-500'>
                        {activity.author.name}
                      </span>
                      replied to your thread
                    </p>
                  </article>
                </Link>
              ))
            }
            
            </>
          ) 
        }
        {
          response.repostedIn.length > 0 && (
            <>
            {
              response.repostedIn.map((activity: any) => (
                <Link key={activity._id} href={`/thread/${activity._id}`} >
                  <article className='activity-card'>
                    <Image 
                    src={activity.author.image}
                    alt='profile picture'
                    width={20}
                    height={20}
                    className='rounded-full object-cover' />
                    <p className='!text-small-regular text-light-1'>
                      <span className='mr-1 text-primary-500'>
                        {activity.author.name}
                      </span>
                      reposted your thread
                    </p>
                  </article>
                </Link>
              ))
            }
            
            </>
          )
        }
        {
          response.myLikedThreads.length > 0 &&(
            <>
            {
              response.myLikedThreads.map((activity: any) => (
                <Link key={activity._id} href={`/thread/${activity._id}`} >
                  <article className='activity-card'>
                    <Image 
                    src={activity.author.image}
                    alt='profile picture'
                    width={20}
                    height={20}
                    className='rounded-full object-cover' />
                    <p className='!text-small-regular text-light-1'>
                      <span className='mr-1 text-primary-500'>
                        {activity.author.name}
                      </span>
                      liked your thread
                    </p>
                  </article>
                </Link>
              ))
            }
            
            </>
          ) 
        }
      </section>
    </section>
  )
}

export default page