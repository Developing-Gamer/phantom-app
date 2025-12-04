"use client";

import { useUser, UserButton } from "@stackframe/stack";
import Link from "next/link";
import { db } from "@/lib/db";

export default function DashboardPage() {
  const user = useUser();
  const { isLoading, error, data } = db.useQuery({});

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-xl">
            Your App
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground"
            >
              Dashboard
            </Link>
            <UserButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.displayName || user?.primaryEmail || "User"}
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-2">Authentication</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Connected as {user?.primaryEmail}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-2">Database</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div
                className={`w-2 h-2 rounded-full ${isLoading
                    ? "bg-yellow-500"
                    : error
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
              />
              <span>
                {isLoading
                  ? "Connecting..."
                  : error
                    ? "Error connecting"
                    : "Connected to InstantDB"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border p-6">
            <h3 className="font-semibold mb-2">Ready to Build</h3>
            <p className="text-sm text-muted-foreground">
              Start adding your features and components here.
            </p>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Define your schema</p>
                <p>
                  Edit <code className="text-xs bg-muted px-1 py-0.5 rounded">src/instant.schema.ts</code> to add your data models.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Push your schema</p>
                <p>
                  Run <code className="text-xs bg-muted px-1 py-0.5 rounded">pnpm db:push</code> to sync your schema with InstantDB.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Query your data</p>
                <p>
                  Use <code className="text-xs bg-muted px-1 py-0.5 rounded">db.useQuery()</code> to fetch real-time data in your components.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
