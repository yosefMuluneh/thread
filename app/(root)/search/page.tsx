import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { fetchUser, fetchUsers } from '@/lib/actions/user.actions'
import SearchPage from '@/components/forms/SearchPage'
import { fetchCommunities } from '@/lib/actions/community.actions'
import { fetchThreadsByTopic } from '@/lib/actions/thread.actions'

const page = async ({ params } : { params: { id : string }}) => {
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

    const result = await fetchUsers({
        userId: user.id,
        searchString: '',
        pageNumber: 1,
        pageSize: 25
    })

    const communities = await fetchCommunities({ searchString: '', pageNumber: 1, pageSize: 5 })
    const threadsBytopic = await fetchThreadsByTopic({ searchString: '', pageNumber: 1, pageSize: 5 })

  return (
    <section>
            
        <SearchPage userId={user.id} users={JSON.parse(JSON.stringify(result.users))} communities={JSON.parse(JSON.stringify(communities.communities))} topics={JSON.parse(JSON.stringify(threadsBytopic.filteredThreads))}/>
             
    </section>
  )
}

export default page