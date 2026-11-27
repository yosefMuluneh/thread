"use client"

import { sidebarLinks } from "@/constants"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Show, useAuth } from "@clerk/nextjs"

export const LeftSideBar = ({ unreadCount = 0 }: { unreadCount?: number }) => {
  const pathname = usePathname()
  const { userId } = useAuth()

  return (
    <aside className="custom-scrollbar leftsidebar">
      <div className="flex w-full flex-1 flex-col px-4">
        <p className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-light-3">
          Workspace
        </p>

        <Link
          href="/create-thread"
          className="mb-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-2"
        >
          <span aria-hidden="true" className="text-lg leading-none">＋</span>
          <span>Start thread</span>
        </Link>

        <nav aria-label="Main navigation" className="flex flex-col gap-1.5">
          {sidebarLinks.map((link) => {
            const isActive =
              (pathname.includes(link.route) && link.route.length > 1) ||
              pathname === link.route

            const href =
              link.route === "/profile"
                ? userId
                  ? `/profile/${userId}`
                  : "/sign-in"
                : link.route

            return (
              <Link
                href={href}
                key={link.label}
                aria-current={isActive ? "page" : undefined}
                className={`leftsidebar_link ${isActive ? "bg-primary-500" : ""}`}
              >
                <Image
                  src={link.imgURL}
                  alt=""
                  width={21}
                  height={21}
                  className={isActive ? "opacity-100" : "opacity-65"}
                />
                <span className="min-w-0 flex-1 truncate">{link.label}</span>
                {link.route === "/notifications" && unreadCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-count-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mx-4 border-t border-white/[0.07] pt-4">
        <Show when="signed-in">
          <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-light-3">
            Account
          </p>
          <div className="rounded-2xl transition hover:bg-white/[0.04]">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]" />
              <span className="text-xs font-medium text-light-2">Signed in</span>
            </div>
          </div>
        </Show>
      </div>
    </aside>
  )
}
