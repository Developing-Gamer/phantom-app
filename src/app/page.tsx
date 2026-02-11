"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@stackframe/stack";
import { db } from "@/lib/db";

function AuthenticatedContent() {
  const stackUser = useUser();
  const instantAuth = db.useAuth();
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
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/handler/sign-up"
            className="px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-all font-medium"
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
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
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
        <div className="p-4 border rounded-lg text-left space-y-2">
          <h3 className="font-semibold">Stack Auth</h3>
          <p className="text-sm text-muted-foreground">User ID: {stackUser.id.substring(0, 8)}...</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Connected</span>
          </div>
        </div>
        <div className="p-4 border rounded-lg text-left space-y-2">
          <h3 className="font-semibold">InstantDB</h3>
          <p className="text-sm text-muted-foreground">User ID: {instantAuth.user?.id.substring(0, 8) || "..."}</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${instantAuth.user ? "bg-green-500" : "bg-yellow-500"}`} />
            <span className="text-xs font-medium uppercase tracking-wider">
              {instantAuth.user ? "Synced" : "Connecting..."}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => stackUser.signOut()}
        className="text-sm text-muted-foreground hover:text-destructive transition-colors underline underline-offset-4"
      >
        Sign Out
      </button>
    </div>
  );
}

function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium animate-pulse text-muted-foreground">{message}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Suspense fallback={<LoadingState />}>
        <AuthenticatedContent />
      </Suspense>
    </div>
  );
}
