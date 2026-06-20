"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@hexclave/next";
import { db } from "@/lib/db";
import { trpc } from "@/lib/trpc/client";
import { useInstantAuthSyncState } from "@/components/auth-sync-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

function AuthenticatedContent() {
  const user = useUser();
  const instantAuth = db.useAuth();
  const sync = useInstantAuthSyncState();
  const health = trpc.health.useQuery({ source: "dashboard" });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-center max-w-md">
          Welcome! Please sign in to access your dashboard and sync with InstantDB.
        </p>
        <div className="flex gap-4">
          <Link
            href="/auth/sign-in"
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  const instantStatus = instantAuth.user
    ? "Synced"
    : sync.status === "error"
      ? "Sync failed"
      : "Connecting...";

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 max-w-2xl mx-auto text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground">
          Authenticated as <span className="text-foreground font-semibold">{user.displayName || user.primaryEmail}</span>
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
        <UserButton />
        <div className="text-left">
          <p className="text-sm font-medium leading-none">{user.displayName || "No Name Set"}</p>
          <p className="text-xs text-muted-foreground">{user.primaryEmail}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <StatusCard
          title="Hexclave"
          value={`User ID: ${user.id.substring(0, 8)}...`}
          status="Connected"
          connected
        />
        <StatusCard
          title="InstantDB"
          value={`User ID: ${instantAuth.user?.id.substring(0, 8) || "..."}`}
          status={instantStatus}
          connected={!!instantAuth.user}
          action={
            !instantAuth.user && sync.status === "error" ? (
              <Button size="sm" variant="outline" onClick={sync.retry}>
                Retry sync
              </Button>
            ) : undefined
          }
        />
        <StatusCard
          title="tRPC"
          value={health.data?.source ?? "dashboard"}
          status={health.data?.ok ? "Ready" : "Checking..."}
          connected={!!health.data?.ok}
        />
      </div>

      <Button
        variant="ghost"
        onClick={() => user.signOut()}
        className="text-muted-foreground hover:text-destructive"
      >
        Sign Out
      </Button>
    </div>
  );
}

function StatusCard({
  title,
  value,
  status,
  connected,
  action,
}: {
  title: string;
  value: string;
  status: string;
  connected: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Card size="sm" className="text-left">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{value}</p>
        <Badge variant={connected ? "secondary" : "outline"}>{status}</Badge>
        {action ? <div className="pt-1">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <LoadingIndicator label={message} />
  );
}

export function HomeContent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Suspense fallback={<LoadingState />}>
        <AuthenticatedContent />
      </Suspense>
    </div>
  );
}
