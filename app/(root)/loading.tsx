export default function Loading() {
  return (
    <div className="w-full animate-pulse" aria-label="Loading feed" role="status">
      <div className="mb-7 border-b border-white/[0.07] pb-6">
        <div className="mb-3 h-3 w-20 rounded-full bg-white/10" />
        <div className="h-8 w-36 rounded-lg bg-white/10" />
        <div className="mt-3 h-4 w-64 max-w-full rounded bg-white/[0.06]" />
      </div>
      <div className="mb-5 flex gap-3 border-b border-white/[0.07] pb-3">
        <div className="h-9 w-20 rounded-lg bg-white/[0.08]" />
        <div className="h-9 w-28 rounded-lg bg-white/[0.05]" />
      </div>
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-3xl border border-white/[0.07] bg-[var(--surface-1)] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="h-3 w-20 rounded bg-white/[0.06]" />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <div className="h-3 w-full rounded bg-white/[0.07]" />
              <div className="h-3 w-4/5 rounded bg-white/[0.07]" />
            </div>
            <div className="mt-5 h-40 rounded-2xl bg-white/[0.05]" />
            <div className="mt-5 h-8 w-2/3 rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading conversations…</span>
    </div>
  )
}
