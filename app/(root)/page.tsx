import { currentUser } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <div className="w-full">
      <header className="mb-7 flex flex-col gap-2 border-b border-white/[0.07] pb-6 sm:mb-8 sm:pb-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">Your space</p>
            <h1 className="text-2xl font-bold tracking-tight text-light-1 sm:text-3xl">Home</h1>
          </div>
          <Link
            href="/create-thread"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary-500 px-4 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-2"
          >
            Start a thread
          </Link>
        </div>
        <p className="max-w-xl text-sm leading-6 text-gray-1">
          Catch up on conversations and ideas from your community.
        </p>
      </header>

      <nav aria-label="Feed sections" className="mb-5 flex items-center gap-1 border-b border-white/[0.07]">
        <Link href="/" aria-current="page" className="relative -mb-px inline-flex min-h-11 items-center border-b-2 border-primary-500 px-4 text-sm font-semibold text-light-1">
          For you
        </Link>
        <Link href="/communities" className="inline-flex min-h-11 items-center rounded-t-xl px-4 text-sm font-medium text-gray-1 transition hover:bg-white/[0.04] hover:text-light-1">
          Communities
        </Link>
      </nav>

      <section aria-label="Latest threads" className="flex flex-col gap-4 sm:gap-5">
        {result.posts.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-2xl text-primary-500">✦</div>
            <h2 className="text-lg font-semibold text-light-1">Your feed is quiet</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-1">
              Start a conversation or explore communities to find people and topics you care about.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/create-thread" className="rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600">
                Create a thread
              </Link>
              <Link href="/communities" className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-light-2 transition hover:border-white/20 hover:bg-white/[0.04]">
                Explore communities
              </Link>
            </div>
          </div>
        ) : (
          result.posts.map((post) => (
            <ThreadCard
              key={post._id}
              id={post._id}
              currentUserId={user.id}
              parentId={post.parentId}
              content={post.text}
              imageUrl={post.imageUrl}
              author={post.author}
              community={post.community}
              createdAt={post.createdAt}
              comments={post.children}
              repost={post?.repost?.[0]?.toString()}
              upvotes={post.upvotes}
            />
          ))
        )}
      </section>
    </div>
  );
}

export default Home;
