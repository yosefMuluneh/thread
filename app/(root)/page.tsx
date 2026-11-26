import { currentUser } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";

import ThreadCard from "@/components/cards/ThreadCard";

import { fetchThreads } from "@/lib/actions/thread.actions";
import { fetchUser } from "@/lib/actions/user.actions";

async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await currentUser();
  if (!user) return redirect('/sign-in');

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const pageParam = resolvedSearchParams.page;
  const pageNumber = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const result = await fetchThreads(pageNumber ? Number(pageNumber) : 1, 30);
  return (
    <>
      <h1 className='head-text text-left'>Home</h1>

      <section className='mt-9 flex flex-col gap-5'>
        {result.posts.length === 0 ? (
          <p className='no-result'>No threads found</p>
        ) : (
          <>
            {result.posts.map((post) => (

                <ThreadCard
                  key={post._id}
                  id={post._id}
                  currentUserId={user.id}
                  parentId={post.parentId}
                  content={post.text}
                  author={post.author}
                  community={post.community}
                  createdAt={post.createdAt}
                  comments={post.children}
                  repost={post?.repost[0]}
                  upvotes={post.upvotes}
                />
                
            ))}
          </>
        )}
      </section>
    </>
  );
}

export default Home;