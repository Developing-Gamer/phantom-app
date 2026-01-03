"use client";

import { useInstantDBAuth } from "@/hooks/use-instantdb-auth";

/**
 * Global provider component that syncs Stack Auth with InstantDB.
 * 
 * This component should be placed at the root of your app (in layout.tsx)
 * to ensure authentication sync works on all pages and routes.
 * 
 * It automatically handles:
 * - Sign in (any method: password, OAuth, magic link, etc.)
 * - Sign up (any method)
 * - Sign out (user.signOut(), /handler/sign-out, or any other method)
 * - Account switching (switching between different Stack Auth accounts)
 * 
 * The component renders its children immediately and handles auth sync
 * in the background, so it doesn't block your UI.
 */
export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const { error } = useInstantDBAuth();

  if (error) {
    console.error("Auth sync error:", error);
  }

  return <>{children}</>;
}
