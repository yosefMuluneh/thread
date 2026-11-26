"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleCommunityMembership, cancelCommunityJoinRequest } from "@/lib/actions/community.actions";

interface Props {
  communityId: string;
  initialJoined: boolean;
  isCreator?: boolean;\n  initialRequested?: boolean;
}

export default function CommunityMembershipButton({ communityId, initialJoined, isCreator = false, initialRequested = false }: Props) {
  const [joined, setJoined] = useState(initialJoined);\n  const [requested, setRequested] = useState(initialRequested);
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
      <Button type="button" className="bg-primary-500" onClick={handleToggle} disabled={isPending || isCreator}>
        {isCreator ? "Owner" : isPending ? "Please wait..." : joined ? "Leave" : requested ? "Cancel request" : "Request to join"}
      </Button>
      {error && <p role="alert" className="max-w-48 text-right text-xs text-red-500">{error}</p>}
    </div>
  );
}
