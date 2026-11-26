"use client";

import { useState, useTransition } from "react";
import { toggleFollowUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing: boolean;
}

export default function FollowButton({
  targetUserId,
  initialFollowing,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggleFollow = () => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await toggleFollowUser(targetUserId);
        setFollowing(result.following);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to update follow status."
        );
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        className="bg-primary-500"
        onClick={handleToggleFollow}
        disabled={isPending}
      >
        {isPending ? "Please wait..." : following ? "Unfollow" : "Follow"}
      </Button>
      {error && (
        <p role="alert" className="max-w-40 text-right text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
