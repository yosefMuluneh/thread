'use server'
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { fetchUser } from '@/lib/actions/user.actions'
import PostThread from '@/components/forms/PostThread'

const page = async () => {
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


    return (
        <>
        <h1 className='head-text'>Create Thread</h1>
        <PostThread userId={userId} />
        </>
    )
}
}

export default page