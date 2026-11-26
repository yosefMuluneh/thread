"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  cancelCommunityInvitation,
  reviewCommunityJoinRequest,
  searchCommunityInviteCandidates,
  sendInvitationsToUsers,
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
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<Person[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Person[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState(invitations);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(initialRequiresApproval);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setCandidates([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCommunityInviteCandidates(communityId, term);
        if (active) setCandidates(results);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to search users.");
      } finally {
        if (active) setIsSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [communityId, search]);

  const toggleSelected = (person: Person) => {
    setSelectedUsers((current) =>
      current.some((item) => item.id === person.id)
        ? current.filter((item) => item.id !== person.id)
        : [...current, person]
    );
  };

  const invite = () => {
    if (selectedUsers.length === 0) return;
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await sendInvitationsToUsers(
          communityId,
          selectedUsers.map((person) => person.id)
        );
        setMessage(`Sent ${result.invitedCount} invitation${result.invitedCount === 1 ? "" : "s"}.`);
        setSelectedUsers([]);
        setSearch("");
        setCandidates([]);
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to send invitations.");
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
        window.location.reload();
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
        setPendingInvitations((current) => current.filter((item) => item.user.id !== userId));
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
            className="h-4 w-4 accent-primary-500"
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
        <h3 className="text-base-semibold text-light-1">Invite members</h3>
        <p className="mt-1 text-small-regular text-gray-1">
          Search for people by name or username, then select everyone you want to invite.
        </p>
        <div className="mt-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people by name or username..."
            aria-label="Search users to invite"
            className="w-full rounded-lg border border-dark-4 bg-dark-3 px-3 py-2.5 text-light-1 outline-none placeholder:text-gray-1 focus:border-primary-500"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-1">
              {selectedUsers.length} selected
            </p>
            {selectedUsers.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedUsers([])}
                className="text-xs font-medium text-primary-500 hover:text-primary-500/80"
              >
                Clear selection
              </button>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedUsers.map((person) => (
                <button
                  type="button"
                  key={person.id}
                  onClick={() => toggleSelected(person)}
                  className="rounded-full border border-primary-500/40 bg-primary-500/10 px-3 py-1 text-xs text-light-1 hover:bg-primary-500/20"
                  aria-label={`Remove @${person.username} from selection`}
                >
                  @{person.username} ×
                </button>
              ))}
            </div>
          )}

          {search.trim().length >= 2 && (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-dark-4 bg-dark-3">
              {isSearching ? (
                <p className="p-3 text-small-regular text-gray-1">Searching users...</p>
              ) : candidates.length === 0 ? (
                <p className="p-3 text-small-regular text-gray-1">No eligible users found.</p>
              ) : (
                candidates.map((person) => {
                  const checked = selectedUsers.some((item) => item.id === person.id);
                  return (
                    <label
                      key={person.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-dark-4 px-3 py-3 last:border-b-0 hover:bg-dark-4"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelected(person)}
                        className="h-4 w-4 accent-primary-500"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-small-semibold text-light-1">{person.name}</p>
                        <p className="truncate text-xs text-gray-1">@{person.username}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={invite}
          disabled={isPending || selectedUsers.length === 0}
          className="mt-4 bg-primary-500 text-white hover:bg-primary-500/90"
        >
          {isPending ? "Sending..." : `Send invitation${selectedUsers.length > 1 ? "s" : ""} (${selectedUsers.length})`}
        </Button>
        {message && <p role="status" className="mt-3 text-xs text-green-500">{message}</p>}
      </section>

      <section>
        <h3 className="text-base-semibold text-light-1">Join requests ({requests.length})</h3>
        {requests.length === 0 ? (
          <p className="mt-3 text-small-regular text-gray-1">There are no pending join requests.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {requests.map((request) => (
              <div key={request.user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dark-4 bg-dark-2 p-3">
                <div>
                  <p className="text-small-semibold text-light-1">{request.user.name}</p>
                  <p className="text-xs text-gray-1">@{request.user.username}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" disabled={isPending} onClick={() => review(request.user.id, "approve")} className="bg-primary-500 text-white hover:bg-primary-500/90">Approve</Button>
                  <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => review(request.user.id, "reject")} className="border border-dark-4 bg-dark-3 text-light-1 hover:bg-dark-4 hover:text-light-1">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-base-semibold text-light-1">Pending invitations ({pendingInvitations.length})</h3>
        {pendingInvitations.length === 0 ? (
          <p className="mt-3 text-small-regular text-gray-1">There are no pending invitations.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dark-4 bg-dark-2 p-4">
                <div>
                  <p className="text-small-semibold text-light-1">{invitation.user.name}</p>
                  <p className="text-xs text-gray-1">@{invitation.user.username}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => revoke(invitation.user.id)}
                  className="border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
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
