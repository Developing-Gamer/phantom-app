"use client";

import * as React from "react";
import { Suspense, useState } from "react";
import { useHexclaveApp } from "@hexclave/next";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";
import {
  AuthCard,
  MessageState,
  LoadingScreen,
  getErrorMessage,
} from "@/components/auth/shared";
import { useRedirectSignedInUser } from "@/components/auth/redirect-signed-in";

function ForgotPasswordContent() {
  const app = useHexclaveApp();
  const redirectingSignedInUser = useRedirectSignedInUser();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await app.sendForgotPasswordEmail(email);

      if (result.status === "error") {
        setError(result.error.message || "Failed to send password reset email.");
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

  if (success) {
    return (
      <AuthCard
        title="Check Your Email"
        description="Password reset link sent"
        footer={
          <p>
            Remember your password?{" "}
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
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="rounded-full bg-emerald-500/10 p-3 text-emerald-500"
          >
            <MailCheck className="size-12" />
          </motion.div>
          <p className="text-sm text-muted-foreground">
            We have sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
            Please check your inbox and follow the instructions.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot Password"
      description="Enter your email to reset your password"
      footer={
        <p>
          Remember your password?{" "}
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
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Send Reset Link
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Forgot Password..." />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
