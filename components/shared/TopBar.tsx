import { OrganizationSwitcher, SignOutButton, Show } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { dark } from '@clerk/themes'

const TopBar = () => {
  return (
    <nav className='topbar'>
        <Link href='/'>
        <Image src='/assets/logo.svg' alt='logo' 
        width={28}
        height={30}/>
        <p className='text-heading3-bold text-light-1 max-xs:hidden'>Threads</p>
        </Link>
        <div className='flex items-center gap-1'>
          <div className='block md:hidden'>
            <Show when="signed-in">
              <SignOutButton>
                <div className='flex cursor-pointer'>
                  <Image src='/assets/logout.svg' alt='logout' width={24} height={24}/>
                </div>
              </SignOutButton>
            </Show>
          </div>
          <Show when="signed-in">
          <OrganizationSwitcher
          appearance={{
            theme: dark,
            elements:{
              organizationSwitcherTrigger:
                "py-2 px-4"
              
            }
          }}
          />
          </Show>
        </div>
    </nav>
  )
}

export default TopBar