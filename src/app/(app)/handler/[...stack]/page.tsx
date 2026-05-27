import { StackHandler } from "@stackframe/stack";
import { RootProviders } from "@/components/root-providers";
import { stackServerApp } from "@/stack/server";

export const metadata = {
  title: "Authentication | Phantom App",
  description: "Stack Auth handler for Phantom App.",
};

export default function Handler(_props: {
  params: Promise<{ stack?: string[] }>;
  searchParams: Promise<Record<string, string>>;
}) {
  // Pass server app explicitly for proper cookie handling
  return (
    <RootProviders>
      <StackHandler app={stackServerApp} fullPage />
    </RootProviders>
  );
}
