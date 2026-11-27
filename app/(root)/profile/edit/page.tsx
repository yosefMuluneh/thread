import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import AccountProfile from "@/components/forms/AccountProfile"
import { fetchUser } from "@/lib/actions/user.actions"

export default async function EditProfilePage() {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect("/sign-in")

  const user = await fetchUser(clerkUser.id)
  if (!user?.onboarded) redirect("/onboarding")

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">Account settings</p>
        <h1 className="head-text">Edit profile</h1>
        <p className="mt-2 text-sm leading-6 text-gray-1">Update how people see you across the community.</p>
      </div>
      <div className="rounded-3xl border border-white/[0.08] bg-[var(--surface-1)] p-5 shadow-xl shadow-black/10 sm:p-7">
        <AccountProfile
          user={{
            id: user.id,
            objectid: user._id.toString(),
            username: user.username,
            name: user.name,
            bio: user.bio ?? "",
            image: user.image,
          }}
          btnTitle="Save profile"
        />
      </div>
    </section>
  )
}