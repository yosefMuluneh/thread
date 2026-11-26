"use client";

import CommunityCard from "@/components/cards/CommunityCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Community {
  id: string;
  name: string;
  username: string;
  image: string;
  bio: string;
  members: { image: string }[];
}

interface Props {
  myCommunities: Community[];
  allCommunities: Community[];
}

function CommunityTabs({ myCommunities, allCommunities }: Props) {
  const renderCommunities = (communities: Community[], emptyMessage: string) => {
    if (communities.length === 0) {
      return <p className="no-result">{emptyMessage}</p>;
    }

    return (
      <div className="mt-8 flex flex-col gap-9">
        {communities.map((community) => (
          <CommunityCard
            key={community.id}
            id={community.id}
            name={community.name}
            username={community.username}
            imgUrl={community.image}
            bio={community.bio ?? ""}
            members={community.members ?? []}
          />
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="my-communities" className="w-full">
      <TabsList className="tab">
        <TabsTrigger value="my-communities" className="tab">
          My Communities ({myCommunities.length})
        </TabsTrigger>
        <TabsTrigger value="all-communities" className="tab">
          All Communities ({allCommunities.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-communities">
        {renderCommunities(myCommunities, "You haven't joined any communities yet.")}
      </TabsContent>

      <TabsContent value="all-communities">
        {renderCommunities(allCommunities, "No communities have been created yet.")}
      </TabsContent>
    </Tabs>
  );
}

export default CommunityTabs;
