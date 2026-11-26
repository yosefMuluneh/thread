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
    invitedBy?: { id?: string; name?: string; username?: string; image?: string } | null;
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
    <article className="rounded-xl border border-dark-4 bg-dark-2 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base-semibold text-light-1">{community.name}</h3>
          <p className="mt-1 text-small-regular text-gray-1">
            @{community.username}
            {community.invitedBy?.username ? ` · invited by @${community.invitedBy.username}` : ""}
          </p>
          <p className="mt-2 text-xs text-gray-1">
            You have been invited to join this community.
          </p>
        </div>
        {status === "pending" ? (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => respond("accept")}
              className="!bg-primary-500 !text-white hover:!bg-primary-500/90"
            >
              {isPending ? "Please wait..." : "Accept"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => respond("decline")}
              className="!border-dark-4 !bg-dark-3 !text-light-1 hover:!bg-dark-4 hover:!text-light-1"
            >
              Decline
            </Button>
          </div>
        ) : (
          <p className="text-small-medium text-light-2">
            {status === "accepted" ? "Invitation accepted" : "Invitation declined"}
          </p>
        )}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-500">{error}</p>}
    </article>
  );
}
