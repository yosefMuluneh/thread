"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelCommunityInvitation,
  reviewCommunityJoinRequest,
  sendInvitationToUser,
  updateCommunityJoinPolicy,
} from "@/lib/actions/community.actions";

interface Person {
  id: string;
  name: string;
  username: string;
  image?: string;
}
interface Props {
  communityId: string;
  requests: { user: Person; requestedAt?: string }[];
  invitations: { user: Person; invitedBy?: Person; createdAt?: string }[];
  requiresApproval: boolean;
}

export default function CommunityAdminPanel({
  communityId,
  requests,
  invitations,
  requiresApproval: initialRequiresApproval,
}: Props) {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(initialRequiresApproval);
  const [isPending, startTransition] = useTransition();

  const invite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await sendInvitationToUser(communityId, username);
        setMessage(`Invitation sent to @${result.invitedUsername}.`);
        setUsername("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to send invitation.");
      }
    });
  };

  const updatePolicy = (enabled: boolean) => {
    setError("");
    setRequiresApproval(enabled);
    startTransition(async () => {
      try {
        await updateCommunityJoinPolicy(communityId, enabled);
      } catch (err) {
        setRequiresApproval(!enabled);
        setError(err instanceof Error ? err.message : "Unable to update join settings.");
      }
    });
  };

  const review = (userId: string, decision: "approve" | "reject") => {
    setError("");
    startTransition(async () => {
      try {
        await reviewCommunityJoinRequest(communityId, userId, decision);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update join request.");
      }
    });
  };

  const revoke = (userId: string) => {
    setError("");
    startTransition(async () => {
      try {
        await cancelCommunityInvitation(communityId, userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to cancel invitation.");
      }
    });
  };

  return (
    <div className="mt-6 flex flex-col gap-8">
      <section className="rounded-xl border border-dark-4 bg-dark-2 p-4">
        <h3 className="text-base-semibold text-light-1">Membership settings</h3>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-small-regular text-light-1">
          <input
            type="checkbox"
            checked={requiresApproval}
            disabled={isPending}
            onChange={(event) => updatePolicy(event.target.checked)}
          />
          Require owner/admin approval before users can join
        </label>
        <p className="mt-2 text-xs text-gray-1">
          {requiresApproval
            ? "People must request to join. Owners and admins can approve or reject requests."
            : "Anyone can join immediately. Owners and admins can still invite specific users."}
        </p>
      </section>

      <section className="rounded-xl border border-dark-4 bg-dark-2 p-4">
        <h3 className="text-base-semibold text-light-1">Invite a member</h3>
        <p className="mt-1 text-small-regular text-gray-1">
          Enter an existing member's username. They will receive an invitation in My Communities.
        </p>
        <form onSubmit={invite} className="mt-4 flex flex-wrap gap-2">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
            aria-label="Username to invite"
            className="min-w-0 flex-1 rounded-lg border border-dark-4 bg-dark-3 px-3 py-2 text-light-1 outline-none"
          />
          <Button type="submit" disabled={isPending || !username.trim()}>
            {isPending ? "Please wait..." : "Send invitation"}
          </Button>
        </form>
        {message && <p role="status" className="mt-2 text-xs text-green-500">{message}</p>}
      </section>

      <section>
        <h3 className="text-base-semibold text-light-1">Join requests ({requests.length})</h3>
        {requests.length === 0 ? (
          <p className="mt-3 text-small-regular text-gray-1">There are no pending join requests.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {requests.map((request) => (
              <div key={request.user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dark-4 p-3">
                <div>
                  <p className="text-small-semibold text-light-1">{request.user.name}</p>
                  <p className="text-xs text-gray-1">@{request.user.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" disabled={isPending} onClick={() => review(request.user.id, "approve")}>Approve</Button>
                  <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => review(request.user.id, "reject")}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-base-semibold text-light-1">Pending invitations ({invitations.length})</h3>
        {invitations.length === 0 ? (
          <p className="mt-3 text-small-regular text-gray-1">There are no pending invitations.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {invitations.map((invitation) => (
              <div key={invitation.user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dark-4 p-3">
                <div>
                  <p className="text-small-semibold text-light-1">{invitation.user.name}</p>
                  <p className="text-xs text-gray-1">@{invitation.user.username}</p>
                </div>
                <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => revoke(invitation.user.id)}>
                  Cancel invitation
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
