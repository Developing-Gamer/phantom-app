"use client";

import "@/lib/dev-suppress-known-console-errors";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { useSyncExternalStore } from "react";
import { stackClientApp } from "@/stack/client";
import { AppProviders } from "@/components/app-providers";
import { AuthSyncProvider } from "@/components/auth-sync-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function RootProviders({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator label="Loading..." size="sm" />
      </div>
    );
  }

  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        <AppProviders>
          <AuthSyncProvider>
            {children}
          </AuthSyncProvider>
          <ThemeToggle />
        </AppProviders>
      </StackTheme>
    </StackProvider>
  );
}
