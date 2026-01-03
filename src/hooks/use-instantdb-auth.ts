import { useEffect, useState, useRef } from "react";
import { useUser } from "@stackframe/stack";
import { db } from "@/lib/db";

/**
 * Hook to automatically sync Stack Auth users with InstantDB.
 *
 * This hook ensures InstantDB authentication state always follows Stack Auth:
 * - Sign in/Sign up: When a user authenticates with Stack Auth (via password, OAuth,
 *   magic link, or any other method), this hook fetches an InstantDB token from the
 *   backend and signs them into InstantDB.
 * - Sign out: When a user signs out of Stack Auth (via user.signOut(), /handler/sign-out,
 *   or any other method), this hook automatically signs them out of InstantDB.
 * - Account switching: When switching between different Stack Auth accounts, this hook
 *   properly clears the old InstantDB session before authenticating the new account,
 *   preventing data leakage.
 *
 * USAGE: Call this hook once at the root of your app (e.g., in layout.tsx or a global
 * provider component) to ensure it runs on all pages and handles all auth state changes.
 */
export function useInstantDBAuth() {
  const stackUser = useUser();
  const instantAuth = db.useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastStackUserIdRef = useRef<string | null>(null);
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const syncAuth = async () => {
      const currentStackUserId = stackUser?.id || null;

      // Case 1: Stack Auth signed out but InstantDB still signed in
      if (!stackUser && instantAuth.user) {
        if (isSigningOutRef.current) return;

        isSigningOutRef.current = true;
        try {
          await db.auth.signOut();
          lastStackUserIdRef.current = null;
        } catch (err) {
          console.error("InstantDB sign out error:", err);
          if (isMounted) {
            setError(err instanceof Error ? err.message : "Sign out failed");
          }
        } finally {
          isSigningOutRef.current = false;
          if (isMounted) {
            setIsAuthenticating(false);
          }
        }
        return;
      }

      // Case 2: No Stack user and no InstantDB user - nothing to do
      if (!stackUser) {
        if (isMounted) {
          setIsAuthenticating(false);
          setError(null);
        }
        return;
      }

      // Case 3: Account switch detected - sign out old InstantDB session first to prevent data leakage
      if (
        instantAuth.user &&
        lastStackUserIdRef.current &&
        lastStackUserIdRef.current !== currentStackUserId
      ) {
        if (isSigningOutRef.current) return;

        isSigningOutRef.current = true;
        try {
          console.log(
            "Account switch detected, signing out old InstantDB session"
          );
          await db.auth.signOut();
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (err) {
          console.error("InstantDB sign out error during account switch:", err);
        } finally {
          isSigningOutRef.current = false;
        }
      }

      // Case 4: Already authenticated with correct user
      if (
        instantAuth.user &&
        instantAuth.user.id === currentStackUserId &&
        lastStackUserIdRef.current === currentStackUserId
      ) {
        if (isMounted) {
          setIsAuthenticating(false);
          setError(null);
        }
        return;
      }

      // Case 5: Stack Auth signed in but InstantDB not authenticated (or wrong user)
      if (isMounted) {
        setIsAuthenticating(true);
        setError(null);
      }

      try {
        const response = await fetch("/api/auth/instantdb", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to authenticate: ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
          );
        }

        const { token } = await response.json();

        if (!isMounted) return;

        await db.auth.signInWithToken(token);

        lastStackUserIdRef.current = currentStackUserId;

        if (isMounted) {
          setError(null);
        }
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
  }, [stackUser?.id, instantAuth.user?.id]);

  return { isAuthenticating, error };
}
