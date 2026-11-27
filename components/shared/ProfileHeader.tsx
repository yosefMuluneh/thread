import Image from "next/image";
import Link from "next/link";
import FollowButton from "./FollowButton";
import CommunityMembershipButton from "./CommunityMembershipButton";
import { TabsTrigger } from "@/components/ui/tabs";

interface Props {
  accountId: string;
  authUserId: string;
  name: string;
  username: string;
  imgUrl: string;
  bio: string;
  type?: "User" | "Community";
  joined?: boolean;
  isCommunityCreator?: boolean;
  communityRequested?: boolean;
  requiresApproval?: boolean;
  following?: boolean;
  followerCount?: number;
  followingCount?: number;
}

const ProfileHeader = ({
  accountId,
  authUserId,
  name,
  username,
  imgUrl,
  bio,
  type = "User",
  joined = false,
  isCommunityCreator = false,
  communityRequested = false,
  requiresApproval = false,
  following = false,
  followerCount,
  followingCount,
}: Props) => {
  const isOwnProfile = accountId === authUserId;

  return (
    <div className="flex w-full flex-col justify-start">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 object-cover">
            <Image
              src={imgUrl}
              alt="profile picture"
              fill
              className="rounded-full object-cover shadow-2xl"
            />
          </div>
          <div className="flex-1 flex-col">
            <h2 className="text-2xl text-heading3-bold text-light-1">{name}</h2>
            <p className="text-lg text-gray-500">@{username}</p>
          </div>
        </div>
        {isOwnProfile && type === "User" ? (
          <Link href="/profile/edit" className="inline-flex min-h-10 items-center rounded-full border border-white/10 px-4 text-sm font-semibold text-light-1 transition hover:border-primary-500/50 hover:bg-primary-500/10">
            Edit profile
          </Link>
        ) : !isOwnProfile && (
          <div>
            {type === "User" ? (
              <FollowButton targetUserId={accountId} initialFollowing={following} />
            ) : (
              <CommunityMembershipButton
                communityId={accountId}
                initialJoined={joined}
                isCreator={isCommunityCreator}
                initialRequested={communityRequested}
                requiresApproval={requiresApproval}
              />
            )}
          </div>
        )}
      </div>
      <p className="mt-6 max-w-lg text-base-regular text-light-2">{bio}</p>

      {type === "User" && followerCount !== undefined && followingCount !== undefined && (
        <div className="mt-5 flex items-center gap-5 border-b border-white/[0.08] pb-5">
          <TabsTrigger
            value="followers"
            className="h-auto justify-start gap-1 rounded-none border-0 p-0 text-sm text-light-2 data-[state=active]:bg-transparent data-[state=active]:text-light-1"
          >
            <span className="font-semibold text-light-1">{followerCount}</span>
            <span>Followers</span>
          </TabsTrigger>
          <TabsTrigger
            value="following"
            className="h-auto justify-start gap-1 rounded-none border-0 p-0 text-sm text-light-2 data-[state=active]:bg-transparent data-[state=active]:text-light-1"
          >
            <span className="font-semibold text-light-1">{followingCount}</span>
            <span>Following</span>
          </TabsTrigger>
        </div>
      )}

      <div className="mt-8 h-0.5 w-full bg-dark-3" />
    </div>
  );
};

export default ProfileHeader;
