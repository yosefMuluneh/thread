import { currentUser } from "@clerk/nextjs/server";
import ProfileHeader from "@/components/shared/ProfileHeader";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Image from "next/image";
import ThreadsTab from "@/components/shared/ThreadsTab";
import { communityTabs } from "@/constants";
import {
  fetchCommunityDetails,
  fetchCommunityAdminData,
} from "@/lib/actions/community.actions";
import CommunityAdminPanel from "@/components/shared/CommunityAdminPanel";
import UserCard from "@/components/cards/UserCard";

const page = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const routeParams = await params;
  const user = await currentUser();

  if (!user) return null;

  await fetchMyCommunities();\n  const communityDetail = await fetchCommunityDetails(routeParams.id);
  if (!communityDetail) return null;

  let adminData: { requests: any[]; invitations: any[] } | null = null;
  try {
    adminData = await fetchCommunityAdminData(routeParams.id);
  } catch {
    // Non-admin members can view the community without management controls.
  }

  const isCreator = (communityDetail.createdBy as any)?.id === user.id;
  const isJoined =
    communityDetail.members?.some((member: any) => member.id === user.id) ||
    isCreator;
  const hasRequested =
    communityDetail.joinRequests?.some(
      (request: any) => request.user?.id === user.id
    ) ?? false;

  const visibleTabs = communityTabs.filter(
    (tab: any) => tab.value !== "requests" || adminData !== null
  );

  return (
    <section>
      <ProfileHeader
        accountId={communityDetail.id}
        authUserId={user.id}
        name={communityDetail.name}
        username={communityDetail.username}
        imgUrl={communityDetail.image}
        bio={communityDetail.bio}
        type="Community"
        joined={isJoined}
        isCommunityCreator={isCreator}
        communityRequested={hasRequested}
      />

      <div className="mt-9">
        <Tabs defaultValue="threads" className="w-full">
          <TabsList className="tab">
            {visibleTabs.map((tab: any) => (
              <TabsTrigger
                key={tab.label}
                value={tab.value}
                className="tab"
              >
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <p className="max-sm:hidden">{tab.label}</p>
                {tab.label === "Threads" && (
                  <p className="ml-1 rounded-sm bg-light-4 px-2 py-1 !item-tiny-medium text-light-2">
                    {communityDetail.threads?.length ?? 0}
                  </p>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="threads" className="w-full text-light-1">
            <ThreadsTab
              currentUserId={user.id}
              accountId={communityDetail.id}
              accountType="Community"
            />
          </TabsContent>

          <TabsContent value="members" className="w-full text-light-1">
            <section className="mt-9 flex flex-col gap-10">
              {communityDetail.members?.map((member: any) => (
                <UserCard
                  key={member.id}
                  id={member.id}
                  name={member.name}
                  username={member.username}
                  imgUrl={member.image}
                  personType="User"
                />
              ))}
            </section>
          </TabsContent>

          {adminData && (
            <TabsContent value="requests" className="w-full text-light-1">
              <CommunityAdminPanel
                communityId={communityDetail.id}
                requests={adminData.requests}
                invitations={adminData.invitations}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </section>
  );
};

export default page;
