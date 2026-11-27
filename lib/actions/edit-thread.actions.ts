"use server"

import mongoose from "mongoose"
import { revalidatePath } from "next/cache"
import { getAuthenticatedUser } from "@/lib/auth"
import { connectToDB } from "@/lib/mongoose"
import Thread from "@/lib/models/thread.model"

export async function updateThreadContent(threadId: string, text: string, imageUrl: string | null, pathname: string) {
  const user = await getAuthenticatedUser()
  if (!mongoose.isValidObjectId(threadId)) throw new Error("Invalid thread ID.")
  const normalizedText = (text ?? "").trim()
  if (normalizedText.length > 5000 || (!normalizedText && !imageUrl)) throw new Error("Add text or an image. Thread text cannot exceed 5000 characters.")
  if (imageUrl) {
    let parsedUrl: URL
    try { parsedUrl = new URL(imageUrl) } catch { throw new Error("The image URL is invalid.") }
    if (parsedUrl.protocol !== "https:") throw new Error("Thread images must use HTTPS.")
  }
  await connectToDB()
  const topics = normalizedText.match(/#\w+/g)?.map((tag) => tag.slice(1)) ?? []
  const updated = await Thread.findOneAndUpdate(
    { _id: threadId, author: user._id },
    { $set: { text: normalizedText, imageUrl, topics } },
    { new: true, runValidators: true }
  )
  if (!updated) throw new Error("Thread not found or you are not allowed to edit it.")
  revalidatePath(pathname)
  revalidatePath("/")
  revalidatePath(`/profile/${user.id}`)
}
