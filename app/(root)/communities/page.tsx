import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import {
  fetchMyCommunities,
  fetchMyCommunityInvitations,
  fetchCommunities,
} from "@/lib/actions/community.actions";
import CommunityTabs from "@/components/shared/CommunityTabs";
import CommunityInvitationCard from "@/components/cards/CommunityInvitationCard";

const page = async () => {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  // Reconcile Clerk memberships before rendering the local community lists.
  const myCommunities = await fetchMyCommunities();
  const [invitations, result] = await Promise.all([
    fetchMyCommunityInvitations(),
    fetchCommunities({
      searchString: "",
      pageNumber: 1,
      pageSize: 25,
    }),
  ]);

  return (
    <section>
      <h1 className="head-text mb-7">Communities</h1>

      {invitations.length > 0 && (
        <section className="mb-8 flex flex-col gap-3">
          <h2 className="text-heading3-bold text-light-1">
            Your invitations ({invitations.length})
          </h2>
          {invitations.map((invitation: any) => (
            <CommunityInvitationCard
              key={invitation.id}
              community={invitation}
            />
          ))}
        </section>
      )}

      <CommunityTabs
        myCommunities={JSON.parse(JSON.stringify(myCommunities))}
        allCommunities={JSON.parse(JSON.stringify(result.communities))}
      />
    </section>
  );
};

export default page;
