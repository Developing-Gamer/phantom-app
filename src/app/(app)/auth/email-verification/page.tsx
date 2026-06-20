"use client";

import * as React from "react";
import { Suspense, useState } from "react";
import { useHexclaveApp } from "@hexclave/next";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert, Loader2, Mail } from "lucide-react";
import {
  AuthCard,
  LoadingScreen,
  getErrorMessage,
} from "@/components/auth/shared";

function EmailVerificationContent() {
  const app = useHexclaveApp();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (verificationCode: string) => {
    setVerifying(true);
    setError(null);

    try {
      const result = await app.verifyEmail(verificationCode);

      if (result.status === "ok") {
        setStatus("success");
      } else {
        const errCode = result.error.errorCode;
        if (errCode === "VERIFICATION_CODE_ALREADY_USED") {
          // Treat already-used as success
          setStatus("success");
        } else {
          setStatus("error");
          if (errCode === "VERIFICATION_CODE_EXPIRED") {
            setError("This verification link has expired. Please request a new one.");
          } else if (errCode === "VERIFICATION_CODE_NOT_FOUND") {
            setError("This verification link is invalid.");
          } else if (errCode === "VERIFICATION_CODE_MAX_ATTEMPTS_REACHED") {
            setError("Too many verification attempts. Please request a new verification email.");
          } else {
            setError(result.error.message || "Failed to verify email.");
          }
        }
      }
    } catch (err: unknown) {
      setStatus("error");
      setError(getErrorMessage(err, "An unexpected error occurred."));
    } finally {
      setVerifying(false);
    }
  };

  if (!code) {
    return (
      <AuthCard
        title="Invalid Link"
        description="Missing email verification code"
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
            No verification code was found in the URL. Please check the link in your email and try again.
          </p>
        </div>
      </AuthCard>
    );
  }

  if (verifying) {
    return <LoadingScreen message="Verifying your email address..." />;
  }

  if (status === "success") {
    return (
      <AuthCard
        title="Email Verified"
        description="Your email address has been verified successfully"
        footer={
          <p>
            Ready to continue?{" "}
            <a href={app.urls.home} className="font-semibold text-primary hover:underline">
              Go to Dashboard
            </a>
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
            Thank you for verifying your email. Your account is now fully active.
          </p>
          <a
            href={app.urls.home}
            className={buttonVariants({ className: "w-full mt-4" })}
          >
            Go to Dashboard
          </a>
        </div>
      </AuthCard>
    );
  }

  if (status === "error") {
    return (
      <AuthCard
        title="Verification Failed"
        description="We couldn't verify your email address"
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
            {error || "The email verification link you clicked is invalid or expired."}
          </p>
          <Button onClick={() => handleVerify(code)} className="w-full mt-4" disabled={verifying}>
            {verifying ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Retry Verification
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify Email"
      description="Verify your email address to secure your account"
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
        <Mail className="size-12 text-primary" />
        <p className="text-sm text-muted-foreground">
          Click the button below to verify your email address and activate your account.
        </p>
        <Button onClick={() => handleVerify(code)} className="w-full mt-4">
          Verify Email Address
        </Button>
      </div>
    </AuthCard>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Email Verification..." />}>
      <EmailVerificationContent />
    </Suspense>
  );
}
