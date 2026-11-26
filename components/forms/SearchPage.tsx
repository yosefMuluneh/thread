"use client";

import { FormEvent, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserCard from "../cards/UserCard";
import CommunityCard from "../cards/CommunityCard";
import { searchEntities } from "@/lib/actions/user.actions";

interface Props {
  users: any[];
  communities: any[];
  topics: any[];
  userId: string;
}

type SearchEntity = "user" | "topic" | "community";

const SearchPage = ({ users, communities, topics, userId }: Props) => {
  const [searchEntity, setSearchEntity] = useState<SearchEntity>("user");
  const [searchString, setSearchString] = useState("");
  const [fetchedUsers, setFetchedUsers] = useState(users);
  const [fetchedCommunities, setFetchedCommunities] = useState(communities);
  const [fetchedTopics, setFetchedTopics] = useState(topics);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const results = await searchEntities({
          entity: searchEntity,
          searchString,
          userId,
        });

        if (searchEntity === "user") setFetchedUsers(results);
        if (searchEntity === "community") setFetchedCommunities(results);
        if (searchEntity === "topic") setFetchedTopics(results);
        setHasSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      }
    });
  };

  const changeEntity = (entity: SearchEntity) => {
    setSearchEntity(entity);
    setError(null);
    setHasSearched(false);
  };

  const resultCount =
    searchEntity === "user"
      ? fetchedUsers.length
      : searchEntity === "community"
        ? fetchedCommunities.length
        : fetchedTopics.length;

  return (
    <section className="flex flex-col gap-9">
      <form
        onSubmit={handleSearch}
        className="sticky top-[85px] z-50 flex flex-col justify-center gap-3 bg-black pb-3"
      >
        <h1 className="text-heading2-bold text-light-1">Search</h1>
        <div className="search-form mt-0">
          <input
            type="search"
            value={searchString}
            onChange={(event) => setSearchString(event.target.value)}
            placeholder={`Search ${searchEntity}`}
            aria-label={`Search ${searchEntity}`}
            className="no-focus w-full border-none bg-transparent text-light-1 outline-none"
          />
          <Button type="submit" className="bg-primary-500" disabled={isPending}>
            {isPending ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          {(["user", "topic", "community"] as SearchEntity[]).map((entity) => (
            <Button
              key={entity}
              type="button"
              onClick={() => changeEntity(entity)}
              className={searchEntity === entity ? "bg-primary-500" : ""}
              aria-pressed={searchEntity === entity}
            >
              {entity.charAt(0).toUpperCase() + entity.slice(1)}
            </Button>
          ))}
        </div>
      </form>

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      {!isPending && resultCount === 0 && (
        <p className="no-result">
          {hasSearched ? "No results found. Try another search." : "No results available."}
        </p>
      )}

      {searchEntity === "user" &&
        fetchedUsers.map((person: any) => (
          <UserCard
            key={person.id}
            id={person.id}
            name={person.name}
            username={person.username}
            imgUrl={person.image}
            personType="User"
          />
        ))}

      {searchEntity === "community" &&
        fetchedCommunities.map((community: any) => (
          <div key={community.id} className="mb-5">
            <CommunityCard
              id={community.id}
              name={community.name}
              username={community.username}
              imgUrl={community.image}
              bio={community.bio}
              members={community.members ?? []}
            />
          </div>
        ))}

      {searchEntity === "topic" &&
        fetchedTopics.map((topic: any) => (
          <article key={topic._id} className="rounded-md bg-gray-900 px-4 py-5">
            <div className="flex items-start gap-4">
              <Link href={`/profile/${topic.author.id}`} className="relative h-11 w-11 shrink-0">
                <Image
                  src={topic.author.image}
                  alt={topic.author.name}
                  fill
                  className="rounded-full object-cover"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Link href={`/profile/${topic.author.id}`} className="w-fit text-base-semibold text-light-1">
                  {topic.author.name} <span className="text-gray-1">@{topic.author.username}</span>
                </Link>
                <Link href={`/thread/${topic._id}`} className="text-small-regular text-light-2">
                  {topic.text}
                </Link>
              </div>
            </div>
          </article>
        ))}
    </section>
  );
};

export default SearchPage;
