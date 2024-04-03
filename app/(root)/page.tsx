import { currentUser } from "@clerk/nextjs";
import { fetchThreads } from "@/lib/actions/thread.actions";
import { UserButton } from "@clerk/nextjs";
import ThreadCard from "@/components/cards/ThreadCard";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";

export default async function Home() {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }
  if (user) {
    const userInfo = await fetchUser(user.id)
    if(!userInfo?.onboarded){
        redirect('/onboarding')
    }
}
  const threads = await fetchThreads(1,30)
  
  return (
    <>
      <h1 className="head-text text-left">Home</h1>
      <section className="mt-9 flex flex-col gap-10">
        {
          threads.threads.length === 0 ? (
            <p className="no-result">No threads found</p>
          ):(
            <>
            {
              threads.threads.map((thread)=>(
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
                upvotes={thread.upvotes}
                downvotes={thread.downvotes}
                />
              ))
            }
            </>
          )
        }
      </section>
    </>
  );
}