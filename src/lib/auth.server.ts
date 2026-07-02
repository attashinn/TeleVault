// Clerk server-side auth helper for TanStack Start API routes.
// Import this inside server handlers to get the current authenticated user ID.
// Usage:
//   const { userId } = await getServerAuth();
//   if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

import { auth } from "@clerk/tanstack-react-start/server";

export async function getServerAuth(_request?: Request): Promise<{ userId: string | null }> {
  try {
    const { userId } = await auth();
    return { userId };
  } catch {
    return { userId: null };
  }
}
