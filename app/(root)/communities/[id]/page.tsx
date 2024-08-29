'use server'
import { currentUser } from '@clerk/nextjs'
import ProfileHeader from '@/components/shared/ProfileHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import ThreadsTab from '@/components/shared/ThreadsTab'
import { communityTabs } from '@/constants'
import { fetchCommunityDetails } from '@/lib/actions/community.actions'
import UserCard from '@/components/cards/UserCard'

const page = async ({ params } : { params :{ id : string}}) => {
    const user = await currentUser()

    if (!user) return null;

    const communityDetail = await fetchCommunityDetails(params.id)

   
   
    return (
        <section>
            <ProfileHeader
            accountId={communityDetail.id}
            authUserId={user.id}
            name={communityDetail.name}
            username={communityDetail.username}
            imgUrl={communityDetail.image}
            bio={communityDetail.bio} />

        <div className='mt-9'>
            <Tabs defaultValue='threads' className='w-full'>
                <TabsList className='tab'>
                    {
                        communityTabs.map((tab)=>(
                            <TabsTrigger key={tab.label} value={tab.value} className='tab'>
                                <Image
                                src={tab.icon}
                                alt={tab.label}
                                width={24}
                                height={24}
                                className='object-contain'
                                />
                                <p className='max-sm:hidden'>{tab.label}</p>
                                {
                                    tab.label === 'Threads' && (
                                        <p className='ml-1 rounded-sm bg-light-4 px-2 py-1 !item-tiny-medium text-light-2'>
                                            {communityDetail?.threads?.length}
                                        </p>
                                    )
                                }
                            </TabsTrigger>
                        ))
                    }
                </TabsList>
                
                        <TabsContent value='threads' className='w-full text-light-1'>
                            <ThreadsTab
                            currentUserId={user.id}
                            accountId={communityDetail?.id}
                            accountType="Community" />
                        </TabsContent>

                        <TabsContent value='members' className='w-full text-light-1'>
                          <section className='mt-9 flex flex-col gap-10'>
                            {
                                communityDetail?.members.map((mem:any) => (
                                    <UserCard 
                                    key={mem.id}
                                    id={mem.id}
                                    name={mem.name}
                                    username={mem.username}
                                    imgUrl={mem.image}
                                    personType='User' />
                                ))
                            }
                          </section>
                        </TabsContent>
                        <TabsContent value='threads' className='w-full text-light-1'>
                            <ThreadsTab
                            currentUserId={user.id}
                            accountId={communityDetail?.id}
                            accountType="Community" />
                        </TabsContent>
                  
            </Tabs>
        </div>
    </section>
        )
}

export default page