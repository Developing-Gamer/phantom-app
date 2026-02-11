import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";

export default function Handler(_props: {
  params: Promise<{ stack?: string[] }>;
  searchParams: Promise<Record<string, string>>;
}) {
  // Pass server app explicitly for proper cookie handling
  return <StackHandler app={stackServerApp} fullPage />;
}