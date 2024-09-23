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
import { useOrganization } from "@clerk/nextjs";
import { editThread } from "@/lib/actions/user.actions";
import path from "path";

const EditThread =  ({ userId, thread }:{ userId : string, thread: any}) => {
  
  const pathname = usePathname()
  const router = useRouter()
  const { organization } = useOrganization()
  const oldText = JSON.parse(thread).text

  const form = useForm({
        resolver: zodResolver(ThreadValidation),
        defaultValues:{
          thread: oldText,
          accountId: userId
                }
    })
    {console.log('hey======',form)}
    const onSubmit = async (value: z.infer<typeof ThreadValidation>) => {
      // Extract tagged users (words starting with '@') and remove the '@'
      const taggedUsers = value.thread.match(/@(\w+)/g)?.map((tag) => tag.substring(1)) || [];
    
      // Extract topics (words starting with '#') and remove the '#'
      const topics = value.thread.match(/#(\w+)/g)?.map((tag) => tag.substring(1)) || [];
    
      await editThread(JSON.parse(thread)._id, form.getValues().thread, pathname)
    
      router.push('/');
    };

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
        Edit Thread
      </Button>
      </form>
      </Form>
  )
}

export default EditThread