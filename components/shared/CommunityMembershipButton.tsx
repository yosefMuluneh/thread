"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  toggleCommunityMembership,
  cancelCommunityJoinRequest,
} from "@/lib/actions/community.actions";

interface Props {
  communityId: string;
  initialJoined: boolean;
  isCreator?: boolean;
  initialRequested?: boolean;\n  requiresApproval?: boolean;
}

export default function CommunityMembershipButton({
  communityId,
  initialJoined,
  isCreator = false,
  initialRequested = false,
}: Props) {
  const [joined, setJoined] = useState(initialJoined);
  const [requested, setRequested] = useState(initialRequested);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (requested && !joined) {
          await cancelCommunityJoinRequest(communityId);
          setRequested(false);
          return;
        }

        const result = await toggleCommunityMembership(communityId);
        setJoined(result.joined);
        setRequested(result.requested);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to update community membership."
        );
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        className="bg-primary-500"
        onClick={handleToggle}
        disabled={isPending || isCreator}
      >
        {isCreator
          ? "Owner"
          : isPending
            ? "Please wait..."
            : joined
              ? "Leave"
              : requested
                ? "Cancel request"
                : requiresApproval ? "Request to join" : "Join"}
      </Button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
