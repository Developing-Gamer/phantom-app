import { useEffect, useState, useRef } from "react";
import { useUser } from "@stackframe/stack";
import { db } from "@/lib/db";

/**
 * Hook to automatically sync Stack Auth users with InstantDB.
 * - When a user signs in with Stack Auth, this hook fetches an InstantDB
 *   token from our backend and signs them into InstantDB.
 * - When a user signs out of Stack Auth (including via /handler/sign-out),
 *   this hook signs them out of InstantDB.
 * - Handles account switching by detecting when a different Stack Auth user
 *   signs in and properly clearing the old InstantDB session.
 *
 * Referenced from InstantDB docs:
 * https://www.instantdb.com/docs/backend
 */
export function useInstantDBAuth() {
  const stackUser = useUser();
  const instantAuth = db.useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which Stack Auth user is currently authenticated
  const lastStackUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncAuth = async () => {
      const currentStackUserId = stackUser?.id || null;

      // Case 1: Stack Auth signed out but InstantDB still signed in
      // This handles /handler/sign-out redirects and any other sign-out method
      if (!stackUser && instantAuth.user) {
        try {
          await db.auth.signOut();
          lastStackUserIdRef.current = null;
        } catch (err) {
          console.error("InstantDB sign out error:", err);
        } finally {
          setIsAuthenticating(false);
        }
        return;
      }

      // Case 2: No Stack user and no InstantDB user - nothing to do
      if (!stackUser) {
        setIsAuthenticating(false);
        return;
      }

      // Case 3: Account switch detected - sign out old InstantDB session
      // This prevents data leakage between different user accounts
      if (
        instantAuth.user &&
        lastStackUserIdRef.current &&
        lastStackUserIdRef.current !== currentStackUserId
      ) {
        try {
          await db.auth.signOut();
        } catch (err) {
          console.error("InstantDB sign out error during account switch:", err);
        }
        // Continue to Case 5 to authenticate new user
      }

      // Case 4: Already authenticated with correct user
      if (
        instantAuth.user &&
        lastStackUserIdRef.current === currentStackUserId
      ) {
        setIsAuthenticating(false);
        return;
      }

      // Case 5: Stack Auth signed in but InstantDB not - sign in to InstantDB
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

        // Track the authenticated user
        lastStackUserIdRef.current = currentStackUserId;
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
  }, [stackUser?.id]);

  return { isAuthenticating, error };
}
