"use client";

import * as React from "react";
import { Suspense, useState, useSyncExternalStore } from "react";
import { useHexclaveApp } from "@hexclave/next";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import {
  AuthCard,
  OTPField,
  MessageState,
  LoadingScreen,
  getErrorMessage,
} from "@/components/auth/shared";
import { useRedirectSignedInUser } from "@/components/auth/redirect-signed-in";

function getMfaAttemptCode() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    sessionStorage.getItem("hexclave_mfa_attempt_code") ||
    sessionStorage.getItem("stack_mfa_attempt_code")
  );
}

function MfaContent() {
  const app = useHexclaveApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectingSignedInUser = useRedirectSignedInUser();
  const next = searchParams.get("next") || "/";

  const attemptCode = useSyncExternalStore(
    () => () => undefined,
    getMfaAttemptCode,
    () => null
  );
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleVerify = async (code: string) => {
    if (!attemptCode) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await app.signInWithMfa(code, attemptCode, {
        noRedirect: true,
      });

      if (result.status === "error") {
        setError(result.error.message || "Invalid authenticator code. Please try again.");
      } else {
        setSuccess("Verification successful! Redirecting...");
        
        // Clear both attempt code keys from session storage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("hexclave_mfa_attempt_code");
          sessionStorage.removeItem("stack_mfa_attempt_code");
        }

        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  if (redirectingSignedInUser) {
    return <LoadingScreen message="Redirecting..." />;
  }

  if (!attemptCode) {
    return (
      <AuthCard
        title="MFA Session Expired"
        description="No active multi-factor authentication session found"
        footer={
          <p>
            Back to{" "}
            <a href={app.urls.signIn} className="font-semibold text-primary hover:underline">
              Sign In
            </a>
          </p>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
          <ShieldAlert className="size-12 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Your multi-factor authentication session has expired or is invalid. Please sign in again to start a new session.
          </p>
          <a
            href={app.urls.signIn}
            className={buttonVariants({ className: "w-full mt-4" })}
          >
            Sign In Again
          </a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Two-Factor Verification"
      description="Enter the 6-digit code from your authenticator app"
      footer={
        <p>
          Need help? Contact your administrator or{" "}
          <a href={app.urls.signIn} className="font-semibold text-primary hover:underline">
            Sign In
          </a>
        </p>
      }
    >
      <AnimatePresence mode="wait">
        {error && <MessageState type="error" message={error} />}
        {success && <MessageState type="success" message={success} />}
      </AnimatePresence>

      <div className="flex flex-col items-center justify-center py-4">
        <ShieldCheck className="size-12 text-primary mb-6 animate-pulse" />
        
        <OTPField
          value={totpCode}
          onChange={(val) => {
            setTotpCode(val);
            if (val.length === 6) {
              handleVerify(val);
            }
          }}
          disabled={loading}
          label="Authenticator Code"
        />
      </div>
    </AuthCard>
  );
}

export default function MfaPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading MFA Verification..." />}>
      <MfaContent />
    </Suspense>
  );
}
