import { fetchUserThreads } from "@/lib/actions/user.actions"
import { redirect } from "next/navigation";
import ThreadCard from "../cards/ThreadCard";
import { fetchCommunityPosts } from "@/lib/actions/community.actions";


interface Props {
    currentUserId:string,
    accountId: string,
    accountType: string
}
const ThreadsTab = async ({
    currentUserId,
    accountId,
    accountType
}:Props) => {
    let threads :any;

    if(accountType === 'Community'){
        threads = await fetchCommunityPosts(accountId); 
    }else{
        threads = await fetchUserThreads(accountId)
    }
    if(!threads) redirect('/')
  return (
    <section className="mt-9 flex flex-col gap-10">
        {
            threads.threads.reverse().map((thread:any)=>(
                <ThreadCard
                key={thread._id}
                id={thread._id}
                currentUserId={currentUserId}
                parentId={thread.parentId}
                content={thread.text}
                author={ accountType === "User" ? 
            {name:threads.name, image:threads.image, id:threads.id, username:threads.username} :
            {name:threads.name, image:threads.image, id:threads.id, username:threads.username}
        }
                community={thread.community}
                createdAt={thread.createdAt}
                comments={thread.children}
                upvotes={thread.upvotes}
                />
            ))
        }
    </section>
  )
}

export default ThreadsTab