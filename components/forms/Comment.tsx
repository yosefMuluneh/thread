'use client'
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from 'react-hook-form';
import { CommentValidation } from '@/lib/validations/thread'
import * as z from 'zod'
import { Input } from '../ui/input'
import { usePathname, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { addComment } from '@/lib/actions/thread.actions'
import Image from "next/image";


interface Props{
    threadId:string,
    currentUserImage:string,
    currentUserId: string
}
const Comment = ({threadId, currentUserImage, currentUserId}:Props) => {
    const pathname = usePathname()
    const form = useForm({
        resolver: zodResolver(CommentValidation),
        defaultValues:{
          thread: '',
                }
    })

    const onSubmit = async (value: z.infer<typeof CommentValidation>) => {
        try {
          await addComment(threadId, value.thread, currentUserId, pathname);
          form.reset();
        } catch (error) {
          form.setError('thread', {
            type: 'server',
            message: error instanceof Error ? error.message : 'Unable to add comment. Please try again.',
          });
        }
      }

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} 
    className="comment-form rounded-2xl border border-white/[0.07] bg-[var(--surface-1)] px-4 sm:px-5">
      <FormField
        control={form.control}
        name="thread"
        render={({ field }) => (
          <FormItem className='flex items-center gap-3 w-full'> 
            <FormLabel >
             <Image src={currentUserImage}
             alt="profile image"
             width={48}
             height={48}
             className="rounded-full object-cover"/>
            </FormLabel>
            <FormControl className='border-none bg-transparent'>
              <Input
              type="text"
              placeholder="Comment here..."
              className="no-focus min-h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-sm text-light-1 outline-none placeholder:text-gray-1 focus-visible:border-primary-500/50"
              {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button type='submit' className='comment-form_btn' disabled={form.formState.isSubmitting}> 
        {form.formState.isSubmitting ? 'Replying…' : 'Reply'}
      </Button>
      </form>
      </Form>
  )
}

export default Comment