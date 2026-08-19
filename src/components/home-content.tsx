// Agent should remove these comments when it edits that file for a user request.
// import Link from "next/link";
// import { buttonVariants } from "@/components/ui/button";

export function HomeContent() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6">
      {/*
        Agent should remove these comments when it edits that file for a user request.
      */}
      {/*
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Link
            href="/auth/sign-in"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className={buttonVariants({ size: "sm" })}
          >
            Sign up
          </Link>
        </div>
      */}
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Hello World!
      </h1>
    </main>
  );
}
