"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { respondToCommunityInvitation } from "@/lib/actions/community.actions";

interface Props {
  community: {
    id: string;
    name: string;
    username: string;
    image?: string;
    invitedBy?: { name?: string; username?: string } | null;
  };
}

export default function CommunityInvitationCard({ community }: Props) {
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const respond = (response: "accept" | "decline") => {
    setError("");
    startTransition(async () => {
      try {
        await respondToCommunityInvitation(community.id, response);
        setStatus(response === "accept" ? "accepted" : "declined");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to respond to invitation.");
      }
    });
  };

  return (
    <article className="rounded-xl border border-dark-4 bg-dark-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base-semibold text-light-1">{community.name}</h3>
          <p className="text-small-regular text-gray-1">
            @{community.username}
            {community.invitedBy?.username ? ` · invited by @${community.invitedBy.username}` : ""}
          </p>
        </div>
        {status === "pending" ? (
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={isPending} onClick={() => respond("accept")}>
              {isPending ? "Please wait..." : "Accept"}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => respond("decline")}>
              Decline
            </Button>
          </div>
        ) : (
          <p className="text-small-medium text-light-2">
            {status === "accepted" ? "Invitation accepted" : "Invitation declined"}
          </p>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}
    </article>
  );
}
