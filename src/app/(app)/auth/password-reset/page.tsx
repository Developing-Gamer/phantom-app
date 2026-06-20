"use client";

import * as React from "react";
import { Suspense, useState, useEffect } from "react";
import { useHexclaveApp } from "@hexclave/next";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  AuthCard,
  PasswordField,
  MessageState,
  LoadingScreen,
  getErrorMessage,
} from "@/components/auth/shared";
import { useRedirectSignedInUser } from "@/components/auth/redirect-signed-in";

// Client-side password validation helper
function getPasswordError(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null;
}

function PasswordResetContent() {
  const app = useHexclaveApp();
  const searchParams = useSearchParams();
  const redirectingSignedInUser = useRedirectSignedInUser();
  const code = searchParams.get("code");

  const [verifying, setVerifying] = useState(() => Boolean(code));
  const [codeValid, setCodeValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!code) {
      return;
    }

    const checkCode = async () => {
      try {
        const result = await app.verifyPasswordResetCode(code);
        if (result.status === "error") {
          setError(result.error.message || "Invalid or expired password reset link.");
          setCodeValid(false);
        } else {
          setCodeValid(true);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to verify password reset link."));
      } finally {
        setVerifying(false);
      }
    };

    checkCode();
  }, [code, app]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordError = getPasswordError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await app.resetPassword({ password, code });

      if (result.status === "error") {
        setError(result.error.message || "Failed to reset password.");
      } else {
        setSuccess(true);
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

  if (verifying) {
    return <LoadingScreen message="Verifying password reset link..." />;
  }

  if (success) {
    return (
      <AuthCard
        title="Password Reset"
        description="Your password has been successfully updated"
        footer={
          <p>
            Ready to sign in?{" "}
            <a href={app.urls.signIn} className="font-semibold text-primary hover:underline">
              Sign In
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
            You can now sign in to your account with your new password.
          </p>
        </div>
      </AuthCard>
    );
  }

  if (!codeValid) {
    return (
      <AuthCard
        title="Invalid Link"
        description="This password reset link is invalid or expired"
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
            {error || "The password reset link you clicked is invalid, expired, or has already been used. Please request a new link."}
          </p>
          <a
            href={app.urls.forgotPassword}
            className={buttonVariants({ className: "w-full mt-4" })}
          >
            Request New Link
          </a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your new password below"
      footer={
        <p>
          Back to{" "}
          <a href={app.urls.signIn} className="font-semibold text-primary hover:underline">
            Sign In
          </a>
        </p>
      }
    >
      <AnimatePresence mode="wait">
        {error && <MessageState type="error" message={error} />}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="password"
          label="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <PasswordField
          id="confirm-password"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Reset Password
        </Button>
      </form>
    </AuthCard>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Password Reset..." />}>
      <PasswordResetContent />
    </Suspense>
  );
}
