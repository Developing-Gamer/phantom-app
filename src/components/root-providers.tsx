"use client";

import "@/lib/dev-suppress-known-console-errors";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveClientApp } from "@/hexclave/client";
import { AppProviders } from "@/components/app-providers";
import { AuthSyncProvider } from "@/components/auth-sync-provider";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <HexclaveProvider app={hexclaveClientApp}>
      <HexclaveTheme>
        <AppProviders>
          <AuthSyncProvider>
            {children}
          </AuthSyncProvider>
        </AppProviders>
      </HexclaveTheme>
    </HexclaveProvider>
  );
}
