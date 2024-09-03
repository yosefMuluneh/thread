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
import {  SearchValidation } from '@/lib/validations/thread'
import * as z from 'zod'
import { Input } from '../ui/input'
import { usePathname, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from "react";
import UserCard from "../cards/UserCard";
import ThreadCard from "../cards/ThreadCard";
import CommunityCard from "../cards/CommunityCard";


interface Props{
    users:any[],
    communities:any[],
    topics: any[],
    userId: string
}
const SearchPage = ({ users, communities, topics, userId} : Props) => {
    const pathname = usePathname()
    const form = useForm({
        resolver: zodResolver(SearchValidation),
        defaultValues:{
          entity: '',
                }
    })

    const [fetchedUsers,setFetchedUsers] = useState(users)
    const [fetchedCommunities, setFetchedCommunities] = useState(communities)
    const [fetchedTopics, setFetchedTopics] = useState(topics)

    const [searchEntity,setSearchEntity] = useState('user')
    const onSubmit = async (value: z.infer<typeof SearchValidation>)=>{
        
  
        form.reset()
      }

    const fetchSearchEntity = async (searchString:string,) => {

        if(searchEntity === 'user'){
            // set users based on the searchString which is the name or username of the user
            setFetchedUsers(users.filter((user)=>user.name.includes(searchString) || user.username.includes(searchString)))
        }
        else if(searchEntity === 'community'){
            // set communities based on the searchString which is the name or username of the community
            setFetchedCommunities(communities.filter((community)=>community.name.includes(searchString) || community.username.includes(searchString)))
        }
        else if(searchEntity === 'topic'){
            // set topics based on the searchString which is the text of the topic
            setFetchedTopics(topics.filter((topic)=>topic.text.includes(searchString)))
        }

    }

  return (
    <section className="flex flex-col gap-9">

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
        <Button type='button' onClick={()=>{setSearchEntity('community')}} className={`${searchEntity === 'community' && 'bg-primary-500'}`}>
            Community
        </Button>
        <Button type='button' onClick={()=>{setSearchEntity('topic'); }} className={`${searchEntity === 'topic' && 'bg-primary-500'}`}>
            Topic
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
        searchEntity === 'topic' && fetchedTopics.map((post: any)=>(
            <ThreadCard
                key={post._id}
                id={post._id}
                currentUserId={userId}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
              />
        ))
    }
    
    </section>
  )
}

export default SearchPage