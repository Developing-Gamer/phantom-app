"use client";

import { Suspense } from "react";
import { useUser, UserButton } from "@stackframe/stack";

function AuthenticatedContent() {
  const user = useUser();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Welcome! Please sign in to continue.</p>
        <div className="flex gap-2">
          <a
            href="/handler/sign-in"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/handler/sign-up"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-lg">
        Welcome, <span className="font-semibold">{user.displayName || user.primaryEmail}</span>!
      </p>
      <UserButton />
      {/* Alternative sign out button using user.signOut() method */}
      <button
        onClick={() => user.signOut()}
        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
