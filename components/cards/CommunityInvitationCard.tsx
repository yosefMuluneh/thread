"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptCommunityInvitation } from "@/lib/actions/community.actions";

interface Props {
  community: {
    id: string;
    name: string;
    username: string;
    image: string;
    bio?: string;
  };
}

export default function CommunityInvitationCard({ community }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    setError(null);
    startTransition(async () => {
      try {
        await acceptCommunityInvitation(community.id);
        setAccepted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to accept invitation.");
      }
    });
  };

  if (accepted) {
    return (
      <article className="community-card">
        <p className="text-sm text-green-500">Invitation accepted.</p>
        <Link href={`/communities/${community.id}`} className="text-blue">
          Visit {community.name}
        </Link>
      </article>
    );
  }

  return (
    <article className="community-card">
      <div className="flex items-center gap-3">
        <Image src={community.image} alt={community.name} width={48} height={48} className="rounded-full object-cover" />
        <div>
          <h3 className="text-base-semibold text-light-1">{community.name}</h3>
          <p className="text-small-regular text-gray-1">@{community.username} invited you to join</p>
        </div>
      </div>
      {community.bio && <p className="mt-3 text-subtle-medium text-gray-1">{community.bio}</p>}
      <div className="mt-4">
        <Button type="button" className="bg-primary-500" onClick={handleAccept} disabled={isPending}>
          {isPending ? "Accepting..." : "Accept invitation"}
        </Button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
    </article>
  );
}
