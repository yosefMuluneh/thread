"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDB } from "@/lib/mongoose";
import Notification from "@/lib/models/notification.model";
import User from "@/lib/models/user.model";

export type NotificationType =
  | "follow"
  | "like"
  | "comment"
  | "reply"
  | "community_invitation"
  | "community_join_approved"
  | "community_join_rejected";

type CreateNotificationInput = {
  recipientId: mongoose.Types.ObjectId | string;
  actorId: mongoose.Types.ObjectId | string;
  type: NotificationType;
  entityType: "user" | "thread" | "community";
  entityId: string;
  message: string;
};

/** Internal server-side helper used by social and community mutations. */
export async function createNotification(input: CreateNotificationInput) {
  await connectToDB();

  const recipientId = String(input.recipientId);
  const actorId = String(input.actorId);

  if (
    !mongoose.isValidObjectId(recipientId) ||
    !mongoose.isValidObjectId(actorId) ||
    recipientId === actorId ||
    !input.entityId ||
    !input.message.trim()
  ) {
    return null;
  }

  return Notification.create({
    recipient: recipientId,
    actor: actorId,
    type: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    message: input.message.trim().slice(0, 240),
  });
}

export async function fetchNotifications(pageNumber = 1, pageSize = 20) {
  const user = await getAuthenticatedUser();
  await connectToDB();

  const page = Math.max(1, Math.floor(pageNumber));
  const limit = Math.min(50, Math.max(1, Math.floor(pageSize)));
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "actor", model: User, select: "id name username image" })
      .lean(),
    Notification.countDocuments({ recipient: user._id }),
    Notification.countDocuments({ recipient: user._id, isRead: false }),
  ]);

  return {
    notifications: JSON.parse(JSON.stringify(notifications)),
    unreadCount,
    isNext: total > skip + notifications.length,
  };
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getAuthenticatedUser();
  await connectToDB();

  if (!mongoose.isValidObjectId(notificationId)) {
    throw new Error("Invalid notification.");
  }

  const result = await Notification.updateOne(
    { _id: notificationId, recipient: user._id, isRead: false },
    { $set: { isRead: true } }
  );

  revalidatePath("/notifications");
  return { updated: result.modifiedCount > 0 };
}

export async function markAllNotificationsAsRead() {
  const user = await getAuthenticatedUser();
  await connectToDB();

  const result = await Notification.updateMany(
    { recipient: user._id, isRead: false },
    { $set: { isRead: true } }
  );

  revalidatePath("/notifications");
  return { updatedCount: result.modifiedCount };
}

export async function getUnreadNotificationCount() {
  const user = await getAuthenticatedUser();
  await connectToDB();
  return Notification.countDocuments({ recipient: user._id, isRead: false });
}
