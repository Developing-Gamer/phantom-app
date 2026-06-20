"use client";

import { Suspense, createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  useInstantDBAuth,
  type InstantAuthSyncState,
} from "@/hooks/use-instantdb-auth";

/**
 * Global provider component that syncs Hexclave auth with InstantDB.
 *
 * This component should be placed at the root of your app (in layout.tsx)
 * to ensure authentication sync works on all pages and routes.
 *
 * It automatically handles:
 * - Sign in (any method: password, OAuth, magic link, etc.)
 * - Sign up (any method)
 * - Sign out (user.signOut(), /handler/sign-out, or any other method)
 * - Account switching (switching between different Hexclave accounts)
 *
 * The component renders its children immediately and handles auth sync
 * in the background, so it doesn't block your UI. The current sync state is
 * exposed via `useInstantAuthSyncState()` so pages can surface a
 * syncing/error indicator without spawning their own sync loop.
 */

const defaultSyncState: InstantAuthSyncState = {
  status: "idle",
  error: null,
  retry: () => {},
};

const InstantAuthSyncContext =
  createContext<InstantAuthSyncState>(defaultSyncState);

export function useInstantAuthSyncState(): InstantAuthSyncState {
  return useContext(InstantAuthSyncContext);
}

function isHexclaveHandlerPath(pathname: string | null) {
  return pathname === "/handler" || pathname?.startsWith("/handler/");
}

function AuthSyncLogic({
  onStateChange,
}: {
  onStateChange: (state: InstantAuthSyncState) => void;
}) {
  const state = useInstantDBAuth();

  useEffect(() => {
    if (state.error) {
      console.error("Auth sync error:", state.error);
    }
  }, [state.error]);

  useEffect(() => {
    onStateChange({
      status: state.status,
      error: state.error,
      retry: state.retry,
    });
  }, [state.status, state.error, state.retry, onStateChange]);

  return null;
}

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldRunSync = !isHexclaveHandlerPath(pathname);
  const [syncState, setSyncState] =
    useState<InstantAuthSyncState>(defaultSyncState);

  return (
    <InstantAuthSyncContext.Provider
      value={shouldRunSync ? syncState : defaultSyncState}
    >
      {shouldRunSync ? (
        <Suspense fallback={null}>
          <AuthSyncLogic onStateChange={setSyncState} />
        </Suspense>
      ) : null}
      {children}
    </InstantAuthSyncContext.Provider>
  );
}
