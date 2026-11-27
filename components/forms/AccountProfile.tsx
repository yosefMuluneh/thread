'use client'
import React, { useState } from 'react'
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
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { userValidation } from '@/lib/validations/user'
import * as z from 'zod'
import Image from 'next/image'
import { Textarea } from '../ui/textarea'
import { isBase64Image } from '@/lib/utils'
import { useUploadThing } from '@/lib/validations/uploadthing'
import { updateUser } from '@/lib/actions/user.actions'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
    user: {
        id: string,
        objectid: string,
        username: string,
        name: string,
        bio: string,
        image: string
    },
    btnTitle: string
    
}

const AccountProfile = ({ user, btnTitle } : Props) => {
  const [files, setFiles ] = useState<File[]>([])
  const { startUpload } = useUploadThing("media")
  const pathname = usePathname()
  const router = useRouter()

  const form = useForm<z.infer<typeof userValidation>>({
        resolver: zodResolver(userValidation),
        defaultValues:{
          profile_photo:user?.image || "",
          name: user?.name || "",
          username: user?.username || "",
          bio: user?.bio || ""
                }
    })

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
        e.preventDefault();
     
        const fileReader = new FileReader()
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0]
          setFiles(Array.from(e.target.files))

          if (!file.type.includes('image')) return;

          fileReader.onload = async (event) => {
            const imageDataUrl = event.target?.result?.toString() || "";

            onChange(imageDataUrl)
          }

          fileReader.readAsDataURL(file)
        }
      }

    async function onSubmit(values: z.infer<typeof userValidation>) {
      try {
        let profileImage = values.profile_photo;
        if (isBase64Image(profileImage)) {
          if (!files.length) throw new Error('Choose a profile image before saving.');
          const uploaded = await startUpload(files);
          profileImage = uploaded?.[0]?.url ?? '';
          if (!profileImage) throw new Error('Profile image upload failed. Please try again.');
        }
        await updateUser({
          userId: user.id,
          username: values.username,
          name: values.name,
          bio: values.bio,
          image: profileImage,
          path: pathname,
        });
        router.push(`/profile/${user.id}`);
        router.refresh();
      } catch (error) {
        form.setError('root.server', {
          type: 'server',
          message: error instanceof Error ? error.message : 'Unable to update your profile.',
        });
      }
    }


  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} 
    className="flex flex-col justify-start gap-10">
      <FormField
        control={form.control}
        name="profile_photo"
        render={({ field }) => (
          <FormItem className='flex items-center gap-4'> 
            <FormLabel className='account-form_image-label'>
              { field.value ?
                (<Image src={field.value} alt='profile photo'
                width={96} height={96}
                priority
                className='rounded-full object-contain'/>
                ) : (
                  <Image src='assets/profile.svg' alt='profile photo'
                width={24} height={24}
                priority
                className='rounded-full object-contain'/>
                )
              }
            </FormLabel>
            <FormControl className='flex-1 text-base-semibold text-gray-200'>
              <Input 
              type='file'
              accept='image/*'
              placeholder="Upload a photo" 
              className='account-form_image-input'
              onChange={e => handleImage(e,field.onChange)}/>
            </FormControl>
            <FormMessage/>
          </FormItem>
        )}
      />

<FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className='flex flex-col gap-3 w-full'> 
            <FormLabel className='text-base-semibold text-light-2'>
             Name
            </FormLabel>
            <FormControl>
              <Input 
              type='text'
              className='account-form_input text-light-2'
              {...field}/>
            </FormControl>
            <FormMessage/>
            
          </FormItem>
        )}
      />

<FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem className='flex flex-col gap-3 w-full'> 
            <FormLabel className='text-base-semibold text-light-2'>
             Username
            </FormLabel>
            <FormControl>
              <Input 
              type='text'
              className='account-form_input text-light-2'
              {...field}/>
            </FormControl>
            <FormMessage/>
            
          </FormItem>
        )}
      />

<FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem className='flex flex-col gap-3 w-full'> 
            <FormLabel className='text-base-semibold text-light-2'>
             Bio
            </FormLabel>
            <FormControl>
              <Textarea
              rows={3} 
              className='account-form_input text-light-2'
              {...field}/>
            </FormControl>
            <FormMessage/>
            
          </FormItem>
        )}
      />
      {form.formState.errors.root?.server?.message && <p role="alert" className="text-sm text-red-400">{form.formState.errors.root.server.message}</p>}
      <Button type="submit" disabled={form.formState.isSubmitting} className="min-h-11 rounded-full bg-primary-500 px-6 font-semibold text-white hover:bg-primary-600 disabled:opacity-60">{form.formState.isSubmitting ? 'Saving...' : btnTitle}</Button>
    </form>
  </Form>
  )
}

export default AccountProfile