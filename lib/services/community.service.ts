import { connectToDB } from "@/lib/mongoose";
import Community from "@/lib/models/community.model";
import Thread from "@/lib/models/thread.model";
import User from "@/lib/models/user.model";

/** Internal Clerk webhook handlers. This module is not a Server Action module. */
export async function createCommunity(
  id: string,
  name: string,
  username: string,
  image: string,
  bio: string,
  createdById: string
) {
  await connectToDB();

  const user = await User.findOne({ id: createdById });
  if (!user) throw new Error("Community creator was not found.");

  const community = await Community.findOneAndUpdate(
    { id },
    {
      $setOnInsert: {
        id,
        name,
        username,
        image,
        bio,
        createdBy: user._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (!community) throw new Error("Unable to create or retrieve the community.");

  await Promise.all([
    User.updateOne(
      { _id: user._id },
      { $addToSet: { communities: community._id } }
    ),
    Community.updateOne(
      { _id: community._id },
      { $addToSet: { members: user._id } }
    ),
  ]);

  return community;
}

export async function addMemberToCommunity(communityId: string, memberId: string) {
  await connectToDB();

  const [community, user] = await Promise.all([
    Community.findOne({ id: communityId }).select("_id"),
    User.findOne({ id: memberId }).select("_id"),
  ]);

  if (!community) throw new Error("Community not found.");
  if (!user) throw new Error("User not found.");

  await Promise.all([
    Community.updateOne(
      { _id: community._id },
      { $addToSet: { members: user._id }, $pull: { invitations: user._id } }
    ),
    User.updateOne(
      { _id: user._id },
      { $addToSet: { communities: community._id }, $pull: { invitedTo: community._id } }
    ),
  ]);

  return { success: true };
}

export async function removeUserFromCommunity(userId: string, communityId: string) {
  await connectToDB();

  const [user, community] = await Promise.all([
    User.findOne({ id: userId }).select("_id"),
    Community.findOne({ id: communityId }).select("_id"),
  ]);

  if (!user) throw new Error("User not found.");
  if (!community) throw new Error("Community not found.");

  await Promise.all([
    Community.updateOne(
      { _id: community._id },
      { $pull: { members: user._id, invitations: user._id } }
    ),
    User.updateOne(
      { _id: user._id },
      { $pull: { communities: community._id, invitedTo: community._id } }
    ),
  ]);

  return { success: true };
}

export async function updateCommunityInfo(
  communityId: string,
  name: string,
  username: string,
  image: string
) {
  await connectToDB();

  const community = await Community.findOneAndUpdate(
    { id: communityId },
    { $set: { name, username, image } },
    { new: true, runValidators: true }
  );

  if (!community) throw new Error("Community not found.");
  return community;
}

export async function deleteCommunity(communityId: string) {
  await connectToDB();

  const community = await Community.findOne({ id: communityId }).select("_id");
  if (!community) return { success: true };

  const rootThreads = await Thread.find({ community: community._id }).select("_id");
  const rootIds = rootThreads.map((thread) => thread._id.toString());

  // Replies use parentId as a string, so collect descendants before deleting roots.
  const allThreadIds = new Set(rootIds);
  let frontier = [...rootIds];

  while (frontier.length > 0) {
    const children = await Thread.find({ parentId: { $in: frontier } }).select("_id");
    frontier = children
      .map((thread) => thread._id.toString())
      .filter((threadId) => !allThreadIds.has(threadId));
    frontier.forEach((threadId) => allThreadIds.add(threadId));
  }

  const threadObjectIds = [...allThreadIds];
  await Community.deleteOne({ _id: community._id });
  await Thread.deleteMany({ _id: { $in: threadObjectIds } });
  await Thread.updateMany(
    {},
    {
      $pull: {
        children: { $in: threadObjectIds },
        repost: { $in: threadObjectIds },
        repostedIn: { $in: threadObjectIds },
      },
    }
  );
  await User.updateMany(
    {},
    {
      $pull: {
        communities: community._id,
        invitedTo: community._id,
        threads: { $in: threadObjectIds },
        likedThreads: { $in: threadObjectIds },
        myLikedThreads: { $in: threadObjectIds },
        taggedIn: { $in: threadObjectIds },
      },
    }
  );

  return { success: true };
}
