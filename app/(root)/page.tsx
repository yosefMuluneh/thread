import { currentUser } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import ThreadCard from "@/components/cards/ThreadCard";
import { fetchThreads, fetchCommunityThreads, fetchFollowingThreads } from "@/lib/actions/thread.actions";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";

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
  const activeTab = ["communities", "following"].includes(String(resolvedSearchParams.tab))
    ? String(resolvedSearchParams.tab)
    : "for-you";
  const [result, peopleResult] = await Promise.all([
    activeTab === "communities"
      ? fetchCommunityThreads(pageNumber ? Number(pageNumber) : 1, 30)
      : activeTab === "following"
        ? fetchFollowingThreads(pageNumber ? Number(pageNumber) : 1, 30)
        : fetchThreads(pageNumber ? Number(pageNumber) : 1, 30),
    fetchUsers({ userId: user.id, pageNumber: 1, pageSize: 8 }),
  ]);

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

      <section aria-label="People to discover" className="mb-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[var(--surface-1)] px-4 py-4 sm:px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-light-1">People</h2>
          <Link href="/search" className="text-xs font-medium text-primary-500 transition hover:text-primary-400">Discover</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          <Link href={`/profile/${user.id}`} className="flex w-14 shrink-0 flex-col items-center gap-2 text-center">
            <span className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary-500/70 p-0.5">
              <Image src={userInfo.image} alt="Your profile" fill sizes="48px" className="rounded-full object-cover" />
            </span>
            <span className="w-full truncate text-[10px] font-medium text-gray-1">You</span>
          </Link>
          {peopleResult.users.map((person: any) => (
            <Link key={person.id} href={`/profile/${person.id}`} className="flex w-14 shrink-0 flex-col items-center gap-2 text-center transition hover:opacity-80">
              <span className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 p-0.5">
                <Image src={person.image} alt={person.name} fill sizes="48px" className="rounded-full object-cover" />
              </span>
              <span className="w-full truncate text-[10px] font-medium text-gray-1">{person.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <nav aria-label="Feed sections" className="mb-5 flex items-center gap-1 border-b border-white/[0.07]">
        <Link href="/" aria-current={activeTab === "for-you" ? "page" : undefined} className={`relative -mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-sm transition ${activeTab === "for-you" ? "border-primary-500 font-semibold text-light-1" : "border-transparent font-medium text-gray-1 hover:bg-white/[0.04] hover:text-light-1"}`}>
          For you
        </Link>
        <Link href="/?tab=communities" aria-current={activeTab === "communities" ? "page" : undefined} className={`relative -mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-sm transition ${activeTab === "communities" ? "border-primary-500 font-semibold text-light-1" : "border-transparent font-medium text-gray-1 hover:bg-white/[0.04] hover:text-light-1"}`}>
          Communities
        </Link>
        <Link href="/?tab=following" aria-current={activeTab === "following" ? "page" : undefined} className={`relative -mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-sm transition ${activeTab === "following" ? "border-primary-500 font-semibold text-light-1" : "border-transparent font-medium text-gray-1 hover:bg-white/[0.04] hover:text-light-1"}`}>
          Following
        </Link>
      </nav>

      <section aria-label={activeTab === "communities" ? "Community threads" : activeTab === "following" ? "Threads from people you follow" : "Latest threads"} className="flex flex-col gap-4 sm:gap-5">
        {result.posts.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-2xl text-primary-500">✦</div>
            <h2 className="text-lg font-semibold text-light-1">{activeTab === "communities" ? "No community threads yet" : activeTab === "following" ? "No threads from people you follow yet" : "Your feed is quiet"}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-1">
              {activeTab === "communities" ? "Join a community and its conversations will appear here." : activeTab === "following" ? "Follow people to see their conversations here." : "Start a conversation or explore communities to find people and topics you care about."}
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
