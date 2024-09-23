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
import { CommentValidation, ThreadValidation } from '@/lib/validations/thread'
import * as z from 'zod'
import { Input } from '../ui/input'
import { redirect, usePathname, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { addComment, createThread } from '@/lib/actions/thread.actions'
import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";


interface Props{
    userId:string,
    threadId:string,
    currentUserImage:string,
    currentUserId: string
}
const RepostThread = ({userId,threadId, currentUserImage, currentUserId}:Props) => {
    
    const pathname = usePathname()
    const router = useRouter()
    const { organization } = useOrganization()
  
    const form = useForm({
          resolver: zodResolver(ThreadValidation),
          defaultValues:{
            thread: '',
            accountId: userId
                  }
      })
      const onSubmit = async (value: z.infer<typeof ThreadValidation>) => {
        // Extract tagged users (words starting with '@') and remove the '@'
        const taggedUsers = value.thread.match(/@(\w+)/g)?.map((tag) => tag.substring(1)) || [];
      
        // Extract topics (words starting with '#') and remove the '#'
        const topics = value.thread.match(/#(\w+)/g)?.map((tag) => tag.substring(1)) || [];
      
        await createThread({
          author: userId,
          communityId: organization ? organization.id : null,
          path: pathname,
          text: value.thread,
          taggedUsers,  // Pass the extracted tagged users
          topics,        // Pass the extracted topics
          repost: threadId
        });
      
        router.push('/');
      };

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} 
    className="comment-form">
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
              placeholder="Quote here..."
              className="no-focus text-light-1 outline-none"
              {...field}
              />
            </FormControl>
            
          </FormItem>
        )}
      />
      <Button type='submit' className='comment-form_btn'> 
        Repost
      </Button>
      </form>
      </Form>
  )
}

export default RepostThread