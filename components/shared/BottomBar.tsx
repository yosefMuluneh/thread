"use client"

import { sidebarLinks } from "@/constants"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

const BottomBar = ({ unreadCount = 0 }: { unreadCount?: number }) => {
  const pathname = usePathname()
  const { userId } = useAuth()
  const mobileLinks = sidebarLinks.filter(
    (link) => link.route !== "/search" && link.route !== "/create-thread"
  )

  return (
    <nav className="bottombar" aria-label="Mobile navigation">
      <div className="bottombar_container">
        {mobileLinks.map((link) => {
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
              aria-label={link.label}
              aria-current={isActive ? "page" : undefined}
              className={`bottombar_link ${isActive ? "bg-primary-500" : ""}`}
            >
              <span className="relative">
                <Image
                  src={link.imgURL}
                  alt=""
                  width={21}
                  height={21}
                  className={isActive ? "opacity-100" : "opacity-60"}
                />
                {link.route === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate text-[10px] font-medium">
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomBar
