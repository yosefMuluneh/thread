"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
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

const entityOptions: { value: SearchEntity; label: string; description: string }[] = [
  { value: "user", label: "People", description: "Find people to follow" },
  { value: "community", label: "Communities", description: "Explore groups and interests" },
  { value: "topic", label: "Threads", description: "Discover conversations" },
];

const SearchPage = ({ users, communities, topics, userId }: Props) => {
  const [searchEntity, setSearchEntity] = useState<SearchEntity>("user");
  const [searchString, setSearchString] = useState("");
  const [fetchedUsers, setFetchedUsers] = useState(users);
  const [fetchedCommunities, setFetchedCommunities] = useState(communities);
  const [fetchedTopics, setFetchedTopics] = useState(topics);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const runSearch = (nextPage: number, append: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await searchEntities({
          entity: searchEntity,
          searchString: searchString.trim(),
          userId,
          pageNumber: nextPage,
        });
        const results = response.results;
        if (searchEntity === "user") setFetchedUsers((current) => append ? [...current, ...results] : results);
        if (searchEntity === "community") setFetchedCommunities((current) => append ? [...current, ...results] : results);
        if (searchEntity === "topic") setFetchedTopics((current) => append ? [...current, ...results] : results);
        setPageNumber(nextPage);
        setHasMore(response.isNext);
        setHasSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      }
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(1, false);
  };

  const changeEntity = (entity: SearchEntity) => {
    if (entity === searchEntity) return;
    setSearchEntity(entity);
    setError(null);
    setHasSearched(false);
    setPageNumber(1);
    setHasMore(false);
  };

  const resultCount =
    searchEntity === "user"
      ? fetchedUsers.length
      : searchEntity === "community"
        ? fetchedCommunities.length
        : fetchedTopics.length;

  const activeOption = entityOptions.find((option) => option.value === searchEntity)!;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-400">Explore Thread</p>
        <h1 className="text-3xl font-bold tracking-tight text-light-1 sm:text-4xl">Find your people.</h1>
        <p className="max-w-xl text-sm leading-6 text-light-3 sm:text-base">
          Search people, communities, and conversations worth joining.
        </p>
      </header>

      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:p-5">
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl border border-white/[0.06] bg-black/20 p-1">
          {entityOptions.map((option) => {
            const active = searchEntity === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => changeEntity(option.value)}
                aria-pressed={active}
                className={`rounded-xl px-2 py-3 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                  active
                    ? "bg-primary-500/15 text-primary-200 shadow-[inset_0_0_0_1px_rgba(139,124,255,0.22)]"
                    : "text-light-3 hover:bg-white/[0.04] hover:text-light-1"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[0.09] bg-black/25 px-4 transition focus-within:border-primary-500/60 focus-within:ring-2 focus-within:ring-primary-500/10">
            <Image src="/assets/search.svg" alt="" width={19} height={19} className="shrink-0 opacity-60" />
            <input
              type="search"
              value={searchString}
              onChange={(event) => setSearchString(event.target.value)}
              placeholder={`Search ${searchEntity === "user" ? "people" : searchEntity === "topic" ? "threads" : "communities"}...`}
              aria-label={`Search ${searchEntity}`}
              className="no-focus min-w-0 flex-1 border-none bg-transparent text-sm text-light-1 outline-none placeholder:text-light-3"
            />
            {searchString && (
              <button
                type="button"
                onClick={() => setSearchString("")}
                aria-label="Clear search"
                className="rounded-full px-2 py-1 text-xs text-light-3 transition hover:bg-white/[0.07] hover:text-light-1"
              >
                Clear
              </button>
            )}
          </label>
          <Button
            type="submit"
            disabled={isPending}
            className="min-h-14 rounded-2xl bg-primary-500 px-7 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
          >
            {isPending ? "Searching..." : "Search"}
          </Button>
        </form>
        <p className="mt-3 px-1 text-xs text-light-3">{activeOption.description}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-light-1">{hasSearched ? "Search results" : "Explore"}</h2>
          <p className="mt-1 text-xs text-light-3">
            {hasSearched ? `${resultCount} results shown` : `Discover ${activeOption.label.toLowerCase()} on Thread`}
          </p>
        </div>
        {isPending && (
          <span className="flex items-center gap-2 text-xs text-primary-300" role="status">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-400" />
            Updating results
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className={`flex flex-col gap-3 transition-opacity duration-200 ${isPending ? "opacity-50" : "opacity-100"}`}>
        {searchEntity === "user" &&
          fetchedUsers.map((person: any) => (
            <div key={person.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 transition-colors hover:border-primary-500/25 hover:bg-white/[0.04] sm:p-4">
              <UserCard
                id={person.id}
                name={person.name}
                username={person.username}
                imgUrl={person.image}
                personType="User"
              />
            </div>
          ))}

        {searchEntity === "community" &&
          fetchedCommunities.map((community: any) => (
            <div key={community.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 transition-colors hover:border-primary-500/25 hover:bg-white/[0.04] sm:p-4">
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
            <article key={topic._id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-primary-500/25 hover:bg-white/[0.04] sm:p-5">
              <div className="flex items-start gap-3">
                <Link href={`/profile/${topic.author.id}`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                  <Image
                    src={topic.author.image}
                    alt={topic.author.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Link href={`/profile/${topic.author.id}`} className="w-fit text-sm font-semibold text-light-1 transition hover:text-primary-300">
                    {topic.author.name}
                    <span className="ml-2 font-normal text-light-3">@{topic.author.username}</span>
                  </Link>
                  <Link href={`/thread/${topic._id}`} className="whitespace-pre-wrap break-words text-sm leading-6 text-light-2 transition hover:text-light-1">
                    {topic.text}
                  </Link>
                </div>
              </div>
            </article>
          ))}

        {!isPending && resultCount === 0 && (
          <div className="rounded-3xl border border-dashed border-white/[0.12] px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10">
              <Image src="/assets/search.svg" alt="" width={21} height={21} className="opacity-80" />
            </div>
            <p className="font-semibold text-light-1">{hasSearched ? "No results found" : "Nothing to show yet"}</p>
            <p className="mt-1 text-sm text-light-3">
              {hasSearched ? "Try a different keyword or switch to another category." : "Try searching to discover something new."}
            </p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-4">
          <Button
            type="button"
            onClick={() => runSearch(pageNumber + 1, true)}
            disabled={isPending}
            variant="outline"
            className="rounded-full border-white/10 bg-white/[0.03] px-6 text-light-1 hover:bg-white/[0.07]"
          >
            {isPending ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </section>
  );
};

export default SearchPage;
