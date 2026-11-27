'use client'
import React from 'react'
import { sidebarLinks} from "@/constants"
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignOutButton, Show, useAuth } from '@clerk/nextjs'

export const LeftSideBar = ({ unreadCount = 0 }: { unreadCount?: number }) => {

  const pathname = usePathname();
  const {userId } = useAuth();
  return (
    <section className='custom-scrollbar leftsidebar'>
      <div className='flex w-full flex-1 flex-col gap-6 px-6'>
        {
          sidebarLinks.map((link)=>{
            const isActive = (pathname.includes(link.route) && link.route.length > 1) || (pathname === link.route);
            
            const href = link.route === '/profile'
              ? (userId ? `/profile/${userId}` : '/sign-in')
              : link.route

            return(
            <Link 
            href={href} 
            key={link.label}
            className={`leftsidebar_link ${isActive && 'bg-primary-500'}`}>
              <Image 
              src={link.imgURL}
              alt={link.label}
              width={24}
              height={24}
              />
              <div className="flex flex-1 items-center justify-between gap-2 max-lg:hidden"><p className="text-light-1">{link.label}</p>{link.route === "/notifications" && unreadCount > 0 && <span className="min-w-5 rounded-full bg-primary-500 px-1.5 py-0.5 text-center text-xs font-semibold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</div>
            </Link>
            )})
        }
      </div>
      <div className='mt-10 px-6'>
      <Show when="signed-in">
              <SignOutButton redirectUrl='/sign-in'>
                <div className='flex cursor-pointer gap-4 p-4'>
                  <Image src='/assets/logout.svg' alt='logout' width={24} height={24}/>
            <p className='text-light-2 max-lg:hidden'>Logout</p>

                </div>
              </SignOutButton>
            </Show>
      </div>
    </section>
  )
}
