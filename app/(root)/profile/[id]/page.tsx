'use server'
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { fetchTaggedInThreads, fetchUser, fetchUserThreads } from '@/lib/actions/user.actions'
import ProfileHeader from '@/components/shared/ProfileHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import ThreadsTab from '@/components/shared/ThreadsTab'
import { profileTabs } from '@/constants'
import Comment from '@/components/forms/Comment'
import ThreadCard from '@/components/cards/ThreadCard'

const page = async ({ params } : { params :{ id : string}}) => {
    const user = await currentUser()

    if (!user) {
        redirect('/sign-in')
    }

   
    const userInfo = await fetchUser(params.id)
    if(!userInfo?.onboarded){
        redirect('/onboarding')
    
    }

    const threads = await fetchUserThreads(params.id)

    //check if each thread inside threads has children
    const threadsWithReplies = threads.threads.filter((thread:any)=>thread.children.length > 0)

    const taggedIn = await fetchTaggedInThreads(userInfo.taggedIn)

    return (
        <section>
            <ProfileHeader
            accountId={userInfo.id}
            authUserId={user.id}
            name={userInfo.name}
            username={userInfo.username}
            imgUrl={userInfo.image}
            bio={userInfo.bio} />

        <div className='mt-9'>
            <Tabs defaultValue='threads' className='w-full'>
                <TabsList className='tab'>
                    {
                        profileTabs.map((tab)=>(
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
                                            {userInfo?.threads?.length}
                                        </p>
                                    )
                                }
                            </TabsTrigger>
                        ))
                    }
                </TabsList>
                
                    
                <TabsContent  value='threads' className='w-full text-light-1'>
                {
                threads.threads.length === 0 ? 
                     <div className='flex mt-10 justify-center w-full'>
                         <p className='font-semibold'> No threads yet</p> 
                     </div>  :
                    <ThreadsTab
                    currentUserId={user.id.toString()}
                    accountId={userInfo?.id}
                    accountType="User" />}
                </TabsContent>

                <TabsContent value='replies' className='w-full text-light-1'>

                    {
                     
                      threadsWithReplies.length === 0 ?
                      <div key='no-replies' className='flex mt-10 justify-center w-full'>
       
                      <p className='font-semibold'> No replies yet</p> 
                  </div>  : 

                       threads.threads.map((thread:any)=>(
                            
                            
                           

                            
                            <div key={thread.id} >
                                
                                <section className='relative'>
                                    <div>
                                    <ThreadCard
                                        key={thread._id}
                                        id={thread._id}
                                        currentUserId={user?.id}
                                        parentId={thread.parentId}
                                        content={thread.text}
                                        author={thread.author}
                                           
                                        community={thread.community}
                                        createdAt={thread.createdAt}
                                        comments={thread.children}
                                        downvotes={thread.downvotes}
                                            />
                                    </div>
        

                                    <div className='mb-10 mt-5'>
                                        {
                                            thread.children.map((childItem: any)=>(
                                                <div key={childItem._id} className='mb-5'>

                                                    <ThreadCard
                                                        id={childItem._id}
                                                        currentUserId={user?.id}
                                                        parentId={childItem.parentId}
                                                        content={childItem.text}
                                                        author={childItem.author}
                                                        community={childItem.community}
                                                        createdAt={childItem.createdAt}
                                                        comments={childItem.children}
                                                        downvotes={childItem.downvotes}
                                                        isComment
                                                />
                                                </div>
                                            ))
                                        }
                                    </div>
                                </section>
                                

                            </div>
                            )
                        )
                    }
                </TabsContent>
                
                <TabsContent value='tagged' className='w-full text-light-1'>
                    {
                     taggedIn.length === 0 ? 
                     <div className='flex mt-10 justify-center w-full'>

                         <p className='font-semibold'> Tagged in no threads yet</p> 
                     </div>
                                    :
                        taggedIn.map((thread:any)=>(
                            <div key={thread.id}>
                                <ThreadCard
                                    id={thread._id}
                                    currentUserId={user.id}
                                    parentId={thread.parentId}
                                    content={thread.text}
                                    author={thread.author}
                                    community={thread.community}
                                    createdAt={thread.createdAt}
                                    comments={thread.children}
                                    downvotes={thread.downvotes}
                                />
                            </div>
                        ))
                    }
                </TabsContent>


                   
                
            </Tabs>
        </div>
    </section>
        )
}

export default page