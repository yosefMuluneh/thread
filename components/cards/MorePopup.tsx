'use client'

import { deleteThread } from '@/lib/actions/thread.actions'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const MorePopup = ({ id }: { id: string }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const threadId = JSON.parse(id)

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await deleteThread(threadId, pathname)
      setIsOpen(false)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Thread options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-1 transition hover:bg-white/[0.07] hover:text-light-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 top-10 z-30 min-w-40 overflow-hidden rounded-xl border border-white/10 bg-[#171925] p-1.5 shadow-2xl shadow-black/40">
          <Link
            href={`/edit/${threadId}`}
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-light-2 transition hover:bg-white/[0.06]"
          >
            <Pencil className="h-4 w-4 text-gray-1" />
            Edit thread
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting…' : 'Delete thread'}
          </button>
        </div>
      )}
    </div>
  )
}

export default MorePopup
