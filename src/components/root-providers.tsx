"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/stack/client";
import { AppProviders } from "@/components/app-providers";
import { AuthSyncProvider } from "@/components/auth-sync-provider";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        <AppProviders>
          <AuthSyncProvider>
            {children}
          </AuthSyncProvider>
        </AppProviders>
      </StackTheme>
    </StackProvider>
  );
}
