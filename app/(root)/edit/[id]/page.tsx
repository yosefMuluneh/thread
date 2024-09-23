'use server'
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { fetchUser } from '@/lib/actions/user.actions'
import PostThread from '@/components/forms/PostThread'
import EditThread from '@/components/forms/EditThread'
import { fetchThreadById } from '@/lib/actions/thread.actions'

const page = async ({ params } : { params : { id : string}}) => {
    const user = await currentUser()

    if (!user) {
        redirect('/sign-in')
    }

    if (user) {
        const userInfo = await fetchUser(user.id)
        const userId = userInfo._id.toString();
        if(!userInfo?.onboarded){
            redirect('/onboarding')
    }
    const thread = await fetchThreadById(params.id)

    return (
        <>
        <h1 className='head-text'>Create Thread</h1>
        <EditThread userId={userId} thread={JSON.stringify(thread)} />
        </>
    )
}
}

export default page