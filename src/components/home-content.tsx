"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@stackframe/stack";
import { db } from "@/lib/db";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AuthenticatedContent() {
  const stackUser = useUser();
  const instantAuth = db.useAuth();
  const health = trpc.health.useQuery({ source: "dashboard" });
  const [isForceIdle, setIsForceIdle] = useState(false);

  useEffect(() => {
    if (!stackUser) return;

    const timeout = setTimeout(() => {
      setIsForceIdle(true);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [stackUser]);

  const isLoading =
    !isForceIdle &&
    (stackUser && !instantAuth.user);

  if (isLoading) {
    return <LoadingState message="Syncing your account..." />;
  }

  if (!stackUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-center max-w-md">
          Welcome! Please sign in to access your dashboard and sync with InstantDB.
        </p>
        <div className="flex gap-4">
          <Link
            href="/handler/sign-in"
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            Sign In
          </Link>
          <Link
            href="/handler/sign-up"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 max-w-2xl mx-auto text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground">
          Authenticated as <span className="text-foreground font-semibold">{stackUser.displayName || stackUser.primaryEmail}</span>
        </p>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
        <UserButton />
        <div className="text-left">
          <p className="text-sm font-medium leading-none">{stackUser.displayName || "No Name Set"}</p>
          <p className="text-xs text-muted-foreground">{stackUser.primaryEmail}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <StatusCard
          title="Stack Auth"
          value={`User ID: ${stackUser.id.substring(0, 8)}...`}
          status="Connected"
          connected
        />
        <StatusCard
          title="InstantDB"
          value={`User ID: ${instantAuth.user?.id.substring(0, 8) || "..."}`}
          status={instantAuth.user ? "Synced" : "Connecting..."}
          connected={!!instantAuth.user}
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
        onClick={() => stackUser.signOut()}
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
}: {
  title: string;
  value: string;
  status: string;
  connected: boolean;
}) {
  return (
    <Card size="sm" className="text-left">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{value}</p>
        <Badge variant={connected ? "secondary" : "outline"}>{status}</Badge>
      </CardContent>
    </Card>
  );
}

function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      <p className="text-sm font-medium animate-pulse text-muted-foreground">{message}</p>
    </div>
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
