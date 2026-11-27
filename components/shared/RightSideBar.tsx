import { currentUser } from "@clerk/nextjs/server";
import { fetchUsers } from "@/lib/actions/user.actions";
import { fetchCommunities } from "@/lib/actions/community.actions";
import { getAuthenticatedUser } from "@/lib/auth";
import SuggestedCommunities from "./SuggestedCommunities";
import SuggestedUsers from "./SuggestedUsers";

const RightSideBar = async () => {
  const user = await currentUser();
  if (!user) return null;

  const [users, communities, authenticatedUser] = await Promise.all([
    fetchUsers({ userId: user.id, pageNumber: 1, pageSize: 5 }),
    fetchCommunities({ searchString: "", pageNumber: 1, pageSize: 5 }),
    getAuthenticatedUser(),
  ]);

  const followingIds = (authenticatedUser.following ?? []).map(
    (followedUserId: { toString(): string }) => followedUserId.toString()
  );

  return (
    <aside className="custom-scrollbar rightsidebar">
      <SuggestedCommunities communities={communities.communities} />
      <SuggestedUsers users={users.users} followingIds={followingIds} />
    </aside>
  );
};

export default RightSideBar;
