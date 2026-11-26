import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { fetchUser } from '@/lib/actions/user.actions'
import { fetchMyCommunities, fetchCommunities } from '@/lib/actions/community.actions'
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

    // Sync the current user's Clerk organization memberships first, then
    // fetch the all-communities list so newly synced organizations are included.
    const myCommunities = await fetchMyCommunities()
    const result = await fetchCommunities({
        searchString: '',
        pageNumber: 1,
        pageSize: 25,
    })

    return (
        <section>
            <h1 className="head-text mb-7">Communities</h1>

            <CommunityTabs
                myCommunities={JSON.parse(JSON.stringify(myCommunities))}
                allCommunities={JSON.parse(JSON.stringify(result.communities))}
            />
        </section>
    )
}

export default page
