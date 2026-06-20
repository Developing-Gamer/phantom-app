"use client";

import * as React from "react";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useHexclaveApp } from "@hexclave/next";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Users, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import {
  AuthCard,
  MessageState,
  LoadingScreen,
  getErrorMessage,
} from "@/components/auth/shared";

function TeamInvitationContent() {
  const app = useHexclaveApp();
  const user = useUser({ includeRestricted: true });
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [teamDetails, setTeamDetails] = useState<{ teamDisplayName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect restricted users to onboarding
  useEffect(() => {
    if (user && user.isRestricted) {
      router.push("/auth/onboarding");
    }
  }, [user, router]);

  // Load invitation details
  useEffect(() => {
    if (!code) {
      return;
    }

    const loadDetails = async () => {
      try {
        const verifyResult = await app.verifyTeamInvitationCode(code);
        if (verifyResult.status === "error") {
          setError(verifyResult.error.message || "This invitation link is invalid or has expired.");
          setLoading(false);
          return;
        }

        const detailsResult = await app.getTeamInvitationDetails(code);
        if (detailsResult.status === "error") {
          setError(detailsResult.error.message || "Failed to load team invitation details.");
        } else {
          setTeamDetails(detailsResult.data);
        }
      } catch (err: unknown) {
        setError(
          getErrorMessage(
            err,
            "An unexpected error occurred while loading invitation details."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    if (user && !user.isRestricted) {
      loadDetails();
    }
  }, [code, user, app]);

  const handleAccept = async () => {
    if (!code) return;

    setVerifying(true);
    setError(null);

    try {
      const result = await app.acceptTeamInvitation(code);

      if (result.status === "error") {
        setError(result.error.message || "Failed to accept team invitation.");
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "An unexpected error occurred while accepting invitation."
        )
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleIgnore = () => {
    router.push("/");
  };

  if (!code) {
    return (
      <AuthCard
        title="Invalid Invitation"
        description="Missing team invitation code"
        footer={
          <p>
            Back to{" "}
            <Link href="/" className="font-semibold text-primary hover:underline">
              Dashboard
            </Link>
          </p>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
          <ShieldAlert className="size-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            No invitation code was found in the URL. Please check the link in your email and try again.
          </p>
        </div>
      </AuthCard>
    );
  }

  if (!user) {
    return (
      <AuthCard
        title="Team Invitation"
        description="You have been invited to join a team"
        footer={
          <p>
            Already have an account?{" "}
            <a href={`${app.urls.signIn}?next=${encodeURIComponent(`/auth/team-invitation?code=${code}`)}`} className="font-semibold text-primary hover:underline">
              Sign In
            </a>
          </p>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
          <Users className="size-12 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">
            Please sign in or create an account to accept this team invitation and join your colleagues.
          </p>
          <a
            href={`${app.urls.signIn}?next=${encodeURIComponent(`/auth/team-invitation?code=${code}`)}`}
            className={buttonVariants({ className: "w-full mt-4" })}
          >
            Sign In to Accept
          </a>
        </div>
      </AuthCard>
    );
  }

  if (loading) {
    return <LoadingScreen message="Loading invitation details..." />;
  }

  if (success) {
    return (
      <AuthCard
        title="Invitation Accepted!"
        description={`You have successfully joined ${teamDetails?.teamDisplayName || "the team"}`}
        footer={
          <p>
            Ready to collaborate?{" "}
            <Link href="/" className="font-semibold text-primary hover:underline">
              Go to Dashboard
            </Link>
          </p>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-full bg-emerald-500/10 p-3 text-emerald-500"
          >
            <CheckCircle2 className="size-12" />
          </motion.div>
          <p className="text-sm text-muted-foreground">
            You are now a member of <span className="font-semibold text-foreground">{teamDetails?.teamDisplayName}</span>.
            You can access team resources and collaborate with other members.
          </p>
          <Link href="/" className={buttonVariants({ className: "w-full mt-4" })}>
            Go to Dashboard
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (error) {
    return (
      <AuthCard
        title="Invalid Invitation"
        description="We couldn't verify this invitation"
        footer={
          <p>
            Back to{" "}
            <Link href="/" className="font-semibold text-primary hover:underline">
              Dashboard
            </Link>
          </p>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
          <ShieldAlert className="size-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error}
          </p>
          <Link href="/" className={buttonVariants({ className: "w-full mt-4" })}>
            Go to Dashboard
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Join Team"
      description="You have been invited to join a team"
      footer={
        <p>
          Signed in as <span className="font-semibold text-foreground">{user.primaryEmail}</span>
        </p>
      }
    >
      <AnimatePresence mode="wait">
        {error && <MessageState type="error" message={error} />}
      </AnimatePresence>

      <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
        <Users className="size-12 text-primary" />
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">You have been invited to join</p>
          <h2 className="text-xl font-bold text-foreground">{teamDetails?.teamDisplayName}</h2>
        </div>
        
        <div className="flex gap-2 w-full mt-6">
          <Button onClick={handleAccept} className="flex-1" disabled={verifying}>
            {verifying ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Join Team
          </Button>
          <Button variant="outline" onClick={handleIgnore} className="flex-1" disabled={verifying}>
            Ignore
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}

export default function TeamInvitationPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Team Invitation..." />}>
      <TeamInvitationContent />
    </Suspense>
  );
}
