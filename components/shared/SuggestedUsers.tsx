import FollowButton from "@/components/shared/FollowButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserCard from "../cards/UserCard";

interface SuggestedUsersProps {
  users: any[];
  followingIds: string[];
}

const SuggestedUsers = ({ users, followingIds }: SuggestedUsersProps) => {
  return (
    <ScrollArea className="w-full max-h-96 rounded-2xl border border-white/[0.08] bg-[var(--surface-1)] px-3">
      <h3 className="sticky top-0 z-10 mb-4 bg-[var(--surface-1)] py-3 text-heading4-medium text-light-1">
        Suggested Users
      </h3>

      <div className="mb-4 flex flex-col gap-3">
        {users.map((user) => {
          const isFollowing = followingIds.includes(user._id.toString());

          return (
            <div
              key={user._id}
              className="rounded-xl border border-white/[0.06] bg-[var(--surface-2)] p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <UserCard
                    id={user.id}
                    name={user.name}
                    imgUrl={user.image}
                    username={user.username}
                    personType="User"
                    hideViewButton
                  />
                </div>
                {!isFollowing && (
                  <FollowButton
                    targetUserId={user.id}
                    initialFollowing={false}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default SuggestedUsers;
