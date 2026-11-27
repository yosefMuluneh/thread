'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Feed route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-[var(--surface-1)] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-xl text-rose-300" aria-hidden="true">!</div>
      <h2 className="text-lg font-semibold text-light-1">We couldn’t load this page</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-1">
        Something went wrong while loading the conversations. Your account and posts have not been changed.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-white transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        Try again
      </button>
    </div>
  )
}
