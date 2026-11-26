import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { fetchUser } from '@/lib/actions/user.actions'
import { fetchCommunities, fetchMyCommunityInvitations } from '@/lib/actions/community.actions'
import CommunityInvitationCard from '@/components/cards/CommunityInvitationCard'
import CommunityCard from '@/components/cards/CommunityCard'

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

    const invitations = await fetchMyCommunityInvitations()

    const result = await fetchCommunities({
        searchString: '',
        pageNumber: 1,
        pageSize: 25,
    })
  return (
    <section>
        <h1 className="head-text mb-7">Communities</h1>

        {invitations.length > 0 && (
          <section className="mb-10 flex flex-col gap-4">
            <h2 className="text-heading3-bold text-light-1">Your invitations</h2>
            {invitations.map((community: any) => (
              <CommunityInvitationCard key={community.id} community={community} />
            ))}
          </section>
        )}

        <div className='mt-14 flex flex-col gap-9'>
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