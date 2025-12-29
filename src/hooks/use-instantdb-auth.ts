import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { db } from "@/lib/db";

/**
 * Hook to automatically sync Stack Auth users with InstantDB.
 * - When a user signs in with Stack Auth, this hook fetches an InstantDB
 *   token from our backend and signs them into InstantDB.
 * - When a user signs out of Stack Auth (including via /handler/sign-out),
 *   this hook signs them out of InstantDB.
 *
 * Referenced from InstantDB docs:
 * https://www.instantdb.com/docs/backend
 */
export function useInstantDBAuth() {
  const stackUser = useUser();
  const instantAuth = db.useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncAuth = async () => {
      // Case 1: Stack Auth signed out but InstantDB still signed in
      // This handles /handler/sign-out redirects and any other sign-out method
      if (!stackUser && instantAuth.user) {
        try {
          db.auth.signOut();
        } catch (err) {
          console.error("InstantDB sign out error:", err);
        }
        return;
      }

      // Case 2: No Stack user and no InstantDB user - nothing to do
      if (!stackUser) {
        return;
      }

      // Case 3: Already authenticated with InstantDB
      if (instantAuth.user) {
        return;
      }

      // Case 4: Stack Auth signed in but InstantDB not - sign in to InstantDB
      setIsAuthenticating(true);
      setError(null);

      try {
        // Request an InstantDB token from our backend
        const response = await fetch("/api/auth/instantdb", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to authenticate: ${response.statusText}`);
        }

        const { token } = await response.json();

        if (!isMounted) return;

        // Sign in to InstantDB with the token
        await db.auth.signInWithToken(token);
      } catch (err) {
        if (!isMounted) return;

        console.error("InstantDB authentication error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        if (isMounted) {
          setIsAuthenticating(false);
        }
      }
    };

    syncAuth();

    return () => {
      isMounted = false;
    };
  }, [stackUser?.id, instantAuth.user]);

  return { isAuthenticating, error };
}
