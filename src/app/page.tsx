"use client";

import { useUser, UserButton } from "@stackframe/stack";
import Link from "next/link";
import { db } from "@/lib/db";

export default function Home() {
  const user = useUser();
  const { isLoading, error } = db.useQuery({});

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl">
            Your App
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  href="/handler/sign-in"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/handler/sign-up"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Build Your Next
            <br />
            <span className="text-muted-foreground">Great Idea</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A minimal SaaS template with authentication and real-time database
            ready to go. Start building your application today.
          </p>
          <div className="flex items-center justify-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/handler/sign-up"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/handler/sign-in"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Status indicators */}
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${user ? "bg-green-500" : "bg-muted-foreground"
                  }`}
              />
              <span>Auth: {user ? "Connected" : "Not signed in"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isLoading
                    ? "bg-yellow-500"
                    : error
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
              />
              <span>
                Database:{" "}
                {isLoading ? "Connecting..." : error ? "Error" : "Connected"}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with Stack Auth & InstantDB
        </div>
      </footer>
    </div>
  );
}
