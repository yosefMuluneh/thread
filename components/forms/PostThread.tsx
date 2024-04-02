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
import { ThreadValidation } from '@/lib/validations/thread'
import * as z from 'zod'
import { Textarea } from '../ui/textarea'
import { usePathname, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { createThread } from '@/lib/actions/thread.actions'



const PostThread =  ({ userId }:{ userId : string}) => {
  
  const pathname = usePathname()
  const router = useRouter()

  const form = useForm({
        resolver: zodResolver(ThreadValidation),
        defaultValues:{
          thread: '',
          accountId: userId
                }
    })
    const onSubmit = async (value: z.infer<typeof ThreadValidation>)=>{
      await createThread({
        author: userId,
        communityId: null,
        path: pathname,
        text: value.thread
      })

      router.push('/')
    }

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} 
    className="mt-10 flex flex-col justify-start gap-10">
      <FormField
        control={form.control}
        name="thread"
        render={({ field }) => (
          <FormItem className='flex flex-col gap-3 w-full'> 
            <FormLabel className='text-base-semibold text-light-2'>
             Content
            </FormLabel>
            <FormControl className='no-focus border border-dark-4 bg-dark-3 text-light-1'>
              <Textarea
              rows={15}
              {...field}
              />
            </FormControl>
            <FormMessage/>
            
          </FormItem>
        )}
      />
      <Button type='submit' className='bg-primary-500'> 
        Post Thread
      </Button>
      </form>
      </Form>
  )
}

export default PostThread