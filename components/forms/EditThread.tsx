'use client'

import { useState, type ChangeEvent } from "react"
import Image from "next/image"
import { ImagePlus, LoaderCircle, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useUploadThing } from "@/lib/validations/uploadthing"
import { editThread } from "@/lib/actions/user.actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { ThreadValidation } from "@/lib/validations/thread"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

type ThreadData = { _id: string; text?: string; imageUrl?: string | null }

const EditThread = ({ userId, thread }: { userId: string; thread: string }) => {
  const initialThread = JSON.parse(thread) as ThreadData
  const pathname = usePathname()
  const router = useRouter()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialThread.imageUrl ?? null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const { startUpload } = useUploadThing("media")

  const form = useForm<z.infer<typeof ThreadValidation>>({
    resolver: zodResolver(ThreadValidation),
    defaultValues: { thread: initialThread.text ?? "", accountId: userId },
  })

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) {
      form.setError("thread", { type: "manual", message: "Choose an image up to 4 MB." })
      event.currentTarget.value = ""
      return
    }
    form.clearErrors("thread")
    setImageFile(file)
    setRemoveExistingImage(false)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(String(reader.result))
    reader.readAsDataURL(file)
    event.currentTarget.value = ""
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveExistingImage(true)
  }

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    const text = values.thread.trim()
    if (!text && !imagePreview) {
      form.setError("thread", { type: "manual", message: "Add text or an image before saving." })
      return
    }

    try {
      let imageUrl = removeExistingImage ? null : initialThread.imageUrl ?? null
      if (imageFile) {
        const uploaded = await startUpload([imageFile])
        imageUrl = uploaded?.[0]?.url ?? null
        if (!imageUrl) throw new Error("Image upload failed. Please try again.")
      }
      await editThread(initialThread._id, text, imageUrl, pathname)
      router.push("/")
      router.refresh()
    } catch (error) {
      form.setError("thread", {
        type: "server",
        message: error instanceof Error ? error.message : "Unable to update this thread.",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-[var(--surface-1)] shadow-xl shadow-black/10">
        <div className="border-b border-white/[0.07] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary-500" /><h2 className="text-base-semibold tracking-tight text-light-1">Edit thread</h2></div>
          <p className="mt-1 text-small-regular text-gray-1">Update your message or refresh the image you shared.</p>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <FormField control={form.control} name="thread" render={({ field }) => (
            <FormItem className="w-full space-y-2">
              <FormLabel className="sr-only">Thread content</FormLabel>
              <FormControl>
                <Textarea rows={5} maxLength={5000} placeholder="What's happening?" className="min-h-36 resize-y border-0 bg-transparent px-0 py-2 text-[15px] leading-7 text-light-1 shadow-none placeholder:text-gray-1 focus-visible:ring-0 sm:text-base" {...field} />
              </FormControl>
              <div className="flex items-center justify-between gap-3"><FormMessage /><span className="ml-auto shrink-0 text-xs text-gray-1">{field.value.length}/5000</span></div>
            </FormItem>
          )} />

          {imagePreview && (
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 p-1">
              <Image src={imagePreview} width={1200} height={800} alt="Thread image preview" className="max-h-[360px] w-full object-contain" unoptimized={imagePreview.startsWith("data:")} />
              <button type="button" onClick={removeImage} aria-label="Remove thread image" className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/75 p-2.5 text-white shadow-lg transition hover:bg-black"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-light-2 transition hover:border-primary-500/60 hover:bg-primary-500/10 hover:text-light-1">
              <ImagePlus className="h-4 w-4" />{imagePreview ? "Change image" : "Add image"}
              <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} disabled={form.formState.isSubmitting} />
            </label>
            <Button type="submit" disabled={form.formState.isSubmitting} className="min-h-10 min-w-36 rounded-full bg-primary-500 px-6 font-semibold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600">
              {form.formState.isSubmitting ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}

export default EditThread
