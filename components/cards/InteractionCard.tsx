'use client'
import Image from 'next/image'
import Link from 'next/link'


interface InteractionProps {
    upvotes?: number,
    comments?: any[],
    id: string,
    isComment?: boolean
}
const InteractionCard = ({ 
    upvotes,
    comments,
    id,
    isComment
 }: InteractionProps) => {

    const handleLike = () => {
        console.log('upvote')
    }
  return (
    <div className={`${ isComment && 'mb-10'} mt-5 flex flex-col gap-3`}>
        <div className='flex gap-3.5'>
                                    
            <Image
            src='/assets/heart-gray.svg'
            alt='heart'
            width={24}
            height={24}
            onClick={handleLike}
            className='cursor-pointer object-contain'/>
            {
                upvotes && upvotes > 0 && (
                    <p className='text-subtle-medium text-gray-1'>
                        {upvotes}
                    </p>
                )
            }
            
            <div className='flex items-center gap-1'>
            <Link href={`/thread/${id}`}>
                
            <Image
            src='/assets/reply.svg'
            alt='reply'
            width={24}
            height={24}
            className='cursor-pointer object-contain'/>
            </Link>
            {
                comments && comments.length > 0 && (
                    <p className='text-subtle-medium text-gray-1'>
                        {comments.length}
                    </p>
                )
            }
            </div>
            
            <Image
            src='/assets/repost.svg'
            alt='repost'
            width={24}
            height={24}
            className='cursor-pointer object-contain'/>
            <Image
            src='/assets/share.svg'
            alt='share'
            width={24}
            height={24}
            className='cursor-pointer object-contain'/>
        </div>
    </div>
                
                        
  )
}

export default InteractionCard