import { fetchThreadById } from "@/lib/actions/thread.actions"
import { formatDateString } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import InteractionCard from "./InteractionCard"
import MorePopup from "./MorePopup"

interface Props {
  id: string
  currentUserId: string | undefined
  parentId: string | null
  content: string
  imageUrl?: string | null
  author: {
    name: string
    image: string
    id: string
    username: string
  }
  community: {
    id: string
    name: string
    image: string
  } | null
  createdAt: string
  comments: {
    author: {
      image: string
    }
  }[]
  upvotes?: number | 0
  downvotes?: number
  isComment?: boolean
  repost?: string
}

const Content = ({ content }: { content: string }) => {
  const regex = /(@\w+|#\w+)/g
  const parts = content.split(regex)

  return (
    <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-[1.75] text-light-2 sm:text-base">
      {parts.map((part, index) => {
        if (part.match(/@\w+/)) {
          return (
            <Link key={index} href={`/profile/${part.slice(1)}`} className="font-medium text-blue-400 transition hover:text-blue-300">
              {part}
            </Link>
          )
        }

        if (part.match(/#\w+/)) {
          return (
            <Link key={index} href={`/topic/${part.slice(1)}`} className="font-medium text-blue-400 transition hover:text-blue-300">
              {part}
            </Link>
          )
        }

        return <span key={index}>{part}</span>
      })}
    </p>
  )
}

const ThreadCard = async ({
  id,
  currentUserId,
  parentId,
  content,
  imageUrl,
  author,
  community,
  createdAt,
  comments,
  upvotes,
  downvotes,
  isComment,
  repost,
}: Props) => {
  let repostedThread = null

  if (repost) {
    repostedThread = await fetchThreadById(repost)
  }

  return (
    <article
      className={`group flex w-full flex-col overflow-hidden rounded-3xl border border-white/[0.075] transition duration-200 hover:border-primary-500/30 hover:shadow-xl hover:shadow-black/20 ${
        isComment
          ? "bg-transparent px-0 py-2 xs:px-5"
          : "bg-[var(--surface-1)] p-5 shadow-lg shadow-black/10 sm:p-6"
      }`}
    >
      <div className="flex flex-col w-full items-start gap-3.5 sm:gap-4">
        <div className="flex items-center w-full">
          {author?.id ? (
            <div className="flex justify-between w-full items-center">
              <div className="flex gap-3 w-full items-center">
              <Link href={`/profile/${author.id}`} className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-white/[0.08] transition hover:ring-primary-500/70 sm:h-12 sm:w-12">
                <Image src={author.image} alt={`${author.name}'s profile picture`} fill sizes="44px" className="object-cover" />
              </Link>
              <Link href={`/profile/${author.id}`} className="flex max-w-full flex-col items-baseline gap-x-2 rounded-sm hover:opacity-80">
                <span className="truncate text-sm font-semibold tracking-tight text-light-1 sm:text-[15px]">{author.name}</span>
                <span className="truncate text-xs text-gray-1 sm:text-sm">@{author.username}</span>
              </Link>
              </div>
              {currentUserId === author.id && (
                <div className="shrink-0 items-end">
                  <MorePopup id={JSON.stringify(id)} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-1 w-full">
              <Image src={author.image} alt="Profile picture" fill sizes="44px" className="object-cover" />
              <div className="flex flex-col items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-light-1 sm:text-base">{author.name}</span>
                  <span className="text-sm text-gray-1">@{author.username}</span>
                </div>
                {currentUserId === author.id && (
              <div className="shrink-0">
                <MorePopup id={JSON.stringify(id)} />
              </div>
            )}
            </div>
          )}
          <div className="thread-card_bar" />
        </div>

        <div className="min-w-0 flex-1">

          {content && <Content content={content} />}

          {imageUrl && (
            <Link
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open attached image in a new tab"
              className="group/media relative mt-4 block aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30 shadow-lg shadow-black/20"
            >
              <Image
                src={imageUrl}
                alt="Image attached to thread"
                fill
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-contain p-1 transition duration-300 group-hover/media:scale-[1.025]"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-4 pb-3 pt-10 text-right text-[11px] font-medium text-white/75 opacity-0 transition group-hover/media:opacity-100">
                Open image
              </span>
            </Link>
          )}

          {repostedThread && (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/10 p-3 sm:p-4">
              <ThreadCard
                id={repostedThread._id.toString()}
                currentUserId={currentUserId}
                parentId={repostedThread.parentId}
                content={repostedThread.text}
                imageUrl={repostedThread.imageUrl}
                author={repostedThread.author}
                community={repostedThread.community}
                createdAt={repostedThread.createdAt}
                comments={repostedThread.children}
                upvotes={repostedThread.upvotes}
              />
              <Link
                href={`/thread/${repostedThread._id}`}
                className="mt-3 inline-flex text-sm font-semibold text-blue-400 transition hover:text-blue-300"
              >
                View original thread
              </Link>
            </div>
          )}

          <div className={`mt-4 flex flex-col gap-3 ${isComment ? "mb-8" : ""}`}>
            <InteractionCard
              thread={JSON.stringify({
                upvotes,
                comments,
                id,
                currentUserId,
              })}
            />
          </div>
        </div>
      </div>

      {!community ? (
        <p className="mt-3 pl-0.5 text-[11px] font-medium tracking-wide text-gray-1">{formatDateString(createdAt)}</p>
      ) : (
        !isComment && (
          <Link href={`/communities/${community.id}`} className="mt-4 inline-flex w-fit items-center gap-2 text-xs text-gray-1 transition hover:text-light-2">
            <span>{formatDateString(createdAt)} · {community.name} Community</span>
            <Image src={community.image} alt={community.name} width={18} height={18} className="rounded-full object-cover" />
          </Link>
        )
      )}
    </article>
  )
}

export default ThreadCard
