'use client'
import { deleteThread } from '@/lib/actions/thread.actions'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState } from 'react'

const MorePopup = ({ id }: { id: string}) => {
    const router = useRouter()
    const pathname = usePathname()

    const [isClicked, setIsClicked] = useState(false)

    const handleDelete = async()=>{
        await deleteThread(JSON.parse(id),pathname)
        setIsClicked(false)

    }
  return (
    <div className='flex flex-col gap-2'>
        <Image
        src='/assets/more.svg'
        alt='delete'
        width={20}
        height={20}
        onClick={()=>setIsClicked(!isClicked)}
        className='cursor-pointer object-contain'/>
        {
            isClicked && (
                <div className='flex flex-col gap-2'>
                    <Link href={`/edit/${JSON.parse(id)}`}>
                    <Image
                        src='/assets/edit.svg'
                        alt='delete'
                        width={20}
                        height={20}
                        className='cursor-pointer object-contain'/>
                    </Link>
                    <Image
                        src='/assets/delete.svg'
                        alt='delete'
                        width={20}
                        height={20}
                        onClick={handleDelete}
                        className='cursor-pointer object-contain'/>
                </div>
            )
        }

    </div>
    
  )
}

export default MorePopup