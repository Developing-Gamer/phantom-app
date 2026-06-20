"use client";

import * as React from "react";
import { Suspense, useState, useEffect } from "react";
import { useUser, useHexclaveApp } from "@hexclave/next";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, LogOut } from "lucide-react";
import {
  AuthCard,
  MessageState,
  LoadingScreen,
  getErrorMessage,
} from "@/components/auth/shared";

function OnboardingContent() {
  const app = useHexclaveApp();
  const user = useUser({ includeRestricted: true });
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEditingEmail] = useState(false);

  // Redirect if not restricted or not signed in
  useEffect(() => {
    if (user && !user.isRestricted) {
      router.push(app.urls.afterSignIn || "/");
    }
  }, [user, router, app]);

  if (!user) {
    return <LoadingScreen message="Loading onboarding..." />;
  }

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await user.signOut();
      router.push(app.urls.signIn);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to sign out."));
    } finally {
      setLoading(false);
    }
  };

  const handleSetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create primary contact channel
      await user.createContactChannel({
        type: "email",
        value: email,
        usedForAuth: true,
        isPrimary: true,
      });
      setSuccess("Email address set and verification email sent!");
      setIsEditingEditingEmail(false);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to set email address."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const channels = await user.listContactChannels();
      const primaryChannel = channels.find((c) => c.isPrimary);
      if (primaryChannel) {
        await primaryChannel.sendVerificationEmail();
        setSuccess("Verification email resent successfully!");
      } else {
        setError("No primary email channel found. Please set your email.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to resend verification email."));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const channels = await user.listContactChannels();
      const primaryChannel = channels.find((c) => c.isPrimary);
      if (primaryChannel) {
        await primaryChannel.update({ value: email });
        setSuccess("Email updated and verification email sent!");
        setIsEditingEditingEmail(false);
      } else {
        setError("No primary email channel found.");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update email address."));
    } finally {
      setLoading(false);
    }
  };

  const isEmailNotVerified = user.restrictedReason?.type === "email_not_verified";
  const hasNoPrimaryEmail = !user.primaryEmail;

  return (
    <AuthCard
      title="Onboarding"
      description="Complete your account setup"
      footer={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          <LogOut className="size-3 mr-1" />
          Sign Out
        </Button>
      }
    >
      <AnimatePresence mode="wait">
        {error && <MessageState type="error" message={error} />}
        {success && <MessageState type="success" message={success} />}
      </AnimatePresence>

      {isEmailNotVerified ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Mail className="size-12 text-primary mb-4 animate-bounce" />
            <h2 className="text-lg font-semibold text-foreground">Verify Your Email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {hasNoPrimaryEmail
                ? "Please enter your email address to receive a verification link."
                : `We sent a verification link to ${user.primaryEmail}. Please verify your email to continue.`}
            </p>
          </div>

          {hasNoPrimaryEmail || isEditingEmail ? (
            <form onSubmit={hasNoPrimaryEmail ? handleSetEmail : handleChangeEmail} className="space-y-4">
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
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {hasNoPrimaryEmail ? "Set Email" : "Update Email"}
                </Button>
                {!hasNoPrimaryEmail && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingEditingEmail(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <Button onClick={handleResendVerification} className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Resend Verification Email
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEmail(user.primaryEmail || "");
                  setIsEditingEditingEmail(true);
                }}
                className="w-full"
                disabled={loading}
              >
                Change Email Address
              </Button>
            </div>
          )}
        </div>
      ) : user.restrictedReason?.type === "restricted_by_administrator" ? (
        <div className="space-y-4 text-center py-6">
          <h2 className="text-lg font-semibold text-foreground">Account Pending Review</h2>
          <p className="text-sm text-muted-foreground">
            Your account has been created but is currently pending review by an administrator.
            We will notify you once your account has been approved.
          </p>
        </div>
      ) : (
        <div className="space-y-4 text-center py-6">
          <h2 className="text-lg font-semibold text-foreground">Account Restricted</h2>
          <p className="text-sm text-muted-foreground">
            Your account is currently restricted. Please contact support for assistance.
          </p>
        </div>
      )}
    </AuthCard>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Onboarding..." />}>
      <OnboardingContent />
    </Suspense>
  );
}
