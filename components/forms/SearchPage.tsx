'use client'
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form"
import { useForm } from 'react-hook-form';
import {  SearchValidation } from '@/lib/validations/thread'
import * as z from 'zod'
import { Input } from '../ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from "react";
import UserCard from "../cards/UserCard";
import ThreadCard from "../cards/ThreadCard";
import CommunityCard from "../cards/CommunityCard";
import Link from "next/link";
import Image from "next/image";


interface Props{
    users:any[],
    communities:any[],
    topics: any[],
    userId: string
}
const SearchPage = ({ users, communities, topics, userId} : Props) => {
    const form = useForm({
        resolver: zodResolver(SearchValidation),
        defaultValues:{
          entity: '',
                }
    })


    const [fetchedUsers,setFetchedUsers] = useState(users)
    const [fetchedCommunities, setFetchedCommunities] = useState(communities)
    const [fetchedTopics, setFetchedTopics] = useState(topics)

    {console.log('topics------', topics)}

    const [searchEntity,setSearchEntity] = useState('user')
    const onSubmit =  (value: z.infer<typeof SearchValidation>)=>{
        form.reset()
      }

    const fetchSearchEntity =  (searchString:string,) => {

        if(searchEntity === 'user'){
            // set users based on the searchString which is the name or username of the user
            setFetchedUsers(users.filter((user)=>user.name.includes(searchString) || user.username.includes(searchString)))
        }
        else if(searchEntity === 'community'){
          {console.log('communities here==',communities)}
            // set communities based on the searchString which is the name or username of the community
            setFetchedCommunities(communities.filter((community)=>community.name.includes(searchString) || community.username.includes(searchString)))
        }
        else if(searchEntity === 'topic'){
          {console.log('topics here==',topics)}
            // set topics based on the searchString which is the text of the topic
            setFetchedTopics(topics.filter((topic)=>topic.text.includes(searchString)))
        }

    }

  return (
    <section className="flex flex-col gap-9 ">

    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} onChange={()=>fetchSearchEntity(form.getValues().entity)}
    className="flex flex-col justify-center pb-3 gap-3 sticky top-[85px] z-50 bg-black">
        <h1 className="text-heading2-bold text-light-1">Search</h1>

        <div className="search-form mt-0">

      <FormField
        control={form.control}
        name="entity"
        render={({ field }) => (
          <FormItem className='flex items-center gap-3 w-full'> 
            
            <FormControl className='border-none bg-transparent'>
              <Input
              type="text"
              placeholder={`Search ${searchEntity}`}
              className="no-focus text-light-1 outline-none"
              {...field}
              />
            </FormControl>
            
          </FormItem>
        )}
      />
      <Button type='submit'  className='bg-primary-500'> 
        Search
      </Button>
        </div>
      <div className="flex items-center gap-5 ">
        <Button type='button' onClick={()=>{setSearchEntity('user')}} className={`${searchEntity === 'user' && 'bg-primary-500'}`}>
            User
        </Button>
        <Button type='button' onClick={()=>{setSearchEntity('topic')}} className={`${searchEntity === 'topic' && 'bg-primary-500'}`}>
            Topic
        </Button>
        <Button type='button' onClick={()=>{setSearchEntity('community')}} className={`${searchEntity === 'community' && 'bg-primary-500'}`}>
            Community
        </Button>
        
      </div>
      </form>
      </Form>
      {
       searchEntity === 'user' &&  fetchedUsers.map((person: any) => (
            <UserCard
            key={person.id}
            id={person.id}
            name={person.name}
            username={person.username}
            imgUrl={person.image}
            personType="User" />
        )
    )}
    {
        searchEntity === 'community' && fetchedCommunities.map((community) => (
            <div key={community.id} className='mb-5'>
              <CommunityCard id={community.id} name={community.name} username={community.username} imgUrl={community.image} bio={community.bio} members={community.members}/>
            </div>
          ))
    }
    {
        searchEntity === 'topic' && fetchedTopics.map((post)=>(
          <Link key={post._id} href={`/thread/${post._id}`} className="bg-gray-900 px-2 py-5 rounded-md" >
            <div className='flex w-full flex-1 flex-row gap-4'>

            <div className='flex flex-col items-center'>
                    <Link
                    href={`/profile/${post.author.id}`}
                    className='relative h-11 w-11'>
                        <Image 
                        src={post.author.image}
                        alt='profile image'
                        fill
                        className='cursor-pointer rounded-full'/>
                        </Link>
                        <div className='thread-card_bar'/>
                </div>
                <div className='flex w-full flex-col'>
                    <Link href={`/profile/${post.author.id}`} className='w-fit flex gap-2'>
                        <h4 className='cursor-pointer text-base-semibold text-light-1'>
                            {post.author.name}
                        </h4>
                        <h4 className='cursor-pointer  text-gray-1'>
                            @{post.author.username}
                        </h4>
                    </Link>
                        
            <p className="text-white">{post.text}</p>
                        
                </div>
            </div>
            
          </Link>
          
        ))
    }
    
    </section>
  )
}

export default SearchPage