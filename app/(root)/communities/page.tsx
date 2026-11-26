import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { fetchUser } from '@/lib/actions/user.actions'
import { fetchMyCommunities, fetchMyCommunityInvitations, fetchCommunities } from '@/lib/actions/community.actions'
import CommunityInvitationCard from '@/components/cards/CommunityInvitationCard'
import CommunityTabs from '@/components/shared/CommunityTabs'

const page = async () => {
    const user = await currentUser()

    if (!user) {
        redirect('/sign-in')
    }

    const userInfo = await fetchUser(user.id)
    if (!userInfo?.onboarded) {
        redirect('/onboarding')
    }

    const invitations = await fetchMyCommunityInvitations()
    const [myCommunities, result] = await Promise.all([
        fetchMyCommunities(),
        fetchCommunities({
            searchString: '',
            pageNumber: 1,
            pageSize: 25,
        }),
    ])

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

            <CommunityTabs
                myCommunities={JSON.parse(JSON.stringify(myCommunities))}
                allCommunities={JSON.parse(JSON.stringify(result.communities))}
            />
        </section>
    )
}

export default page
