'use client'
import { sidebarLinks } from '@/constants'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

const BottomBar = ({ unreadCount = 0 }: { unreadCount?: number }) => {
  const pathname = usePathname();
  const { userId } = useAuth();
  return (
    <section className='bottombar'>
      <div className='bottombar_container'>
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
            className={`bottombar_link ${isActive && 'bg-primary-500'}`}>
              <Image 
              src={link.imgURL}
              alt={link.label}
              width={24}
              height={24}
              />
              <div className="relative flex items-center gap-1"><p className="text-subtle-medium text-light-1 max-sm:hidden">{link.label.split(/\s+/)[0]}</p>{link.route === "/notifications" && unreadCount > 0 && <span className="absolute -right-3 -top-2 min-w-4 rounded-full bg-primary-500 px-1 text-center text-[10px] font-semibold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</div>
            </Link>
            )})
        }
      </div>
    </section>
  )
}

export default BottomBar