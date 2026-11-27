import { OrganizationSwitcher, SignOutButton, Show } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { dark } from "@clerk/themes"

const TopBar = () => {
  return (
    <header className="topbar">
      <Link href="/" className="group flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10 transition group-hover:bg-primary-500/15">
          <Image src="/assets/logo.svg" alt="Thread logo" width={25} height={27} />
        </span>
        <span className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-light-1">thread</span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-light-3 sm:block">
            conversations that connect
          </span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <Show when="signed-in">
          <div className="hidden sm:block">
            <OrganizationSwitcher
              appearance={{
                theme: dark,
                elements: {
                  organizationSwitcherTrigger:
                    "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 shadow-none hover:bg-white/[0.07]",
                },
              }}
            />
          </div>
          <div className="sm:hidden">
            <OrganizationSwitcher
              appearance={{
                theme: dark,
                elements: {
                  organizationSwitcherTrigger: "rounded-xl px-2 py-2 shadow-none",
                },
              }}
            />
          </div>
          <SignOutButton redirectUrl="/sign-in">
            <button
              type="button"
              aria-label="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <Image src="/assets/logout.svg" alt="" width={18} height={18} />
            </button>
          </SignOutButton>
        </Show>
      </div>
    </header>
  )
}

export default TopBar
