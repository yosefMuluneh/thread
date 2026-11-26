import { auth } from "@clerk/nextjs/server";
import { connectToDB } from "@/lib/mongoose";
import User from "@/lib/models/user.model";

/**
 * Resolves the authenticated Clerk identity to its MongoDB user document.
 * Never trust a client-supplied user ID for authorization.
 */
export async function getAuthenticatedUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required.");
  }

  await connectToDB();

  const user = await User.findOne({ id: userId });

  if (!user) {
    throw new Error("Authenticated user profile was not found.");
  }

  return user;
}
