import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/actions/notification.actions";

function getNotificationHref(notification: any) {
  if (notification.entityType === "thread") return `/thread/${notification.entityId}`;
  if (notification.entityType === "community") return `/communities/${notification.entityId}`;
  if (notification.entityType === "user") return `/profile/${notification.entityId}`;
  return "/notifications";
}

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { notifications, unreadCount } = await fetchNotifications();

  async function markAllReadAction() {
    "use server";
    await markAllNotificationsAsRead();
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="head-text">Notifications</h1>
          <p className="mt-2 text-small-regular text-light-3">
            {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllReadAction}>
            <button
              type="submit"
              className="rounded-lg border border-dark-4 px-4 py-2 text-small-semibold text-light-2 transition hover:bg-dark-3"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dark-4 px-6 py-12 text-center">
          <h2 className="text-heading3-bold text-light-1">You’re all caught up</h2>
          <p className="mt-2 text-small-regular text-light-3">
            Notifications about follows and activity will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-dark-4 rounded-xl border border-dark-4">
          {notifications.map((notification: any) => {
            const href = getNotificationHref(notification);
            const actor = notification.actor;
            return (
              <form
                key={notification._id}
                action={async () => {
                  "use server";
                  await markNotificationAsRead(notification._id);
                  redirect(href);
                }}
              >
                <button
                  type="submit"
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-dark-3 ${notification.isRead ? "" : "bg-dark-2"}`}
                >
                  {actor?.image ? (
                    <Image
                      src={actor.image}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-dark-4" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-small-regular text-light-1">
                      <strong>{actor?.name || "A user"}</strong> {notification.message}
                    </span>
                    <span className="mt-1 block text-subtle-medium text-light-3">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </span>
                  {!notification.isRead && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-label="Unread" />
                  )}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </section>
  );
}
