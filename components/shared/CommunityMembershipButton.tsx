"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleCommunityMembership } from "@/lib/actions/community.actions";

interface Props {
  communityId: string;
  initialJoined: boolean;
}

export default function CommunityMembershipButton({ communityId, initialJoined }: Props) {
  const [joined, setJoined] = useState(initialJoined);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await toggleCommunityMembership(communityId);
        setJoined(result.joined);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update membership.");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" className="bg-primary-500" onClick={handleToggle} disabled={isPending}>
        {isPending ? "Please wait..." : joined ? "Leave" : "Join"}
      </Button>
      {error && <p role="alert" className="max-w-48 text-right text-xs text-red-500">{error}</p>}
    </div>
  );
}
