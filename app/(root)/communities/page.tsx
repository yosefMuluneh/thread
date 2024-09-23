import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { fetchUser } from '@/lib/actions/user.actions'
import { fetchCommunities } from '@/lib/actions/community.actions'
import CommunityCard from '@/components/cards/CommunityCard'

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

    const result = await fetchCommunities({
        searchString: '',
        pageNumber: 1,
        pageSize: 25,
    })
  return (
    <section>
        <h1 className="head-text mb-7">Communities</h1>

        <div className='mt-14 grid grid-cols-1 sm:grid-cols-2 gap-9'>
  {
    result.communities.length === 0 ? (
      <p className='no-result'>No community yet</p>
    ) : (
      <>
        {
          result.communities.map((community: any) => (
            <CommunityCard
              key={community.id}
              id={community.id}
              name={community.name}
              username={community.username}
              imgUrl={community.image}
              bio={community.bio}
              members={community.members}
            />
          ))
        }
      </>
    )
  }
</div>

    </section>
  )
}

export default page