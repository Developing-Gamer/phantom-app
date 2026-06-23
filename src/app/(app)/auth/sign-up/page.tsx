"use client";

import * as React from "react";
import { Suspense, useState } from "react";
import { useHexclaveApp } from "@hexclave/next";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShieldAlert } from "lucide-react";
import {
  AuthCard,
  AuthSeparator,
  PasswordField,
  OTPField,
  OAuthButtons,
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

function SignUpContent() {
  const app = useHexclaveApp();
  const project = app.useProject();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectingSignedInUser = useRedirectSignedInUser();

  // Redirect target
  const next = searchParams.get("next") || "/";

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // OTP states
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpCode, setOtpCode] = useState("");
  const [nonce, setNonce] = useState<string | null>(null);

  // Config checks
  const signUpEnabled = project.config.signUpEnabled;
  const credentialEnabled = project.config.credentialEnabled;
  const magicLinkEnabled = project.config.magicLinkEnabled ?? true;
  const oauthProviders = (project.config.oauthProviders || []).filter(
    (provider) => provider.id.toLowerCase() !== "github"
  );

  // Handle Credential Sign Up
  const handleCredentialSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
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
    setSuccess(null);

    try {
      const result = await app.signUpWithCredential({
        email,
        password,
        noRedirect: true,
      });

      if (result.status === "error") {
        setError(result.error.message || "Failed to create account.");
      } else {
        setSuccess("Account created successfully! Redirecting...");
        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  // Handle Send Magic Link / OTP
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await app.sendMagicLinkEmail(email);

      if (result.status === "error") {
        setError(result.error.message || "Failed to send magic link.");
      } else {
        setNonce(result.data.nonce);
        setOtpStep("code");
        setSuccess("Verification code sent to your email!");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (code: string) => {
    if (!nonce) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const verificationCode = code + nonce;
      const result = await app.signInWithMagicLink(verificationCode, {
        noRedirect: true,
      });

      if (result.status === "error") {
        setError(result.error.message || "Invalid verification code.");
      } else {
        setSuccess("Signed in successfully! Redirecting...");
        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth Sign In
  const handleOAuthSignIn = async (provider: string) => {
    setError(null);
    try {
      await app.signInWithOAuth(provider);
    } catch (err: unknown) {
      setError(getErrorMessage(err, `Failed to sign in with ${provider}.`));
    }
  };

  const passwordForm = (
    <form onSubmit={handleCredentialSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-password">Email Address</Label>
        <Input
          id="email-password"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <PasswordField
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
      />
      <PasswordField
        id="confirm-password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        required
        disabled={loading}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Sign up
      </Button>
    </form>
  );

  const magicLinkForm = otpStep === "email" ? (
    <form onSubmit={handleSendMagicLink} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-otp">Email Address</Label>
        <Input
          id="email-otp"
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
        Send magic link
      </Button>
    </form>
  ) : (
    <div className="space-y-4">
      <OTPField
        value={otpCode}
        onChange={(val) => {
          setOtpCode(val);
          if (val.length === 6) {
            handleVerifyOtp(val);
          }
        }}
        disabled={loading}
      />
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOtpStep("email")}
        disabled={loading}
      >
        Change email
      </Button>
    </div>
  );

  if (redirectingSignedInUser) {
    return <LoadingScreen message="Redirecting..." />;
  }

  if (!signUpEnabled) {
    return (
      <AuthCard
        title="Sign Up Disabled"
        description="Public registration is currently closed"
        footer={
          <p>
            Already have an account?{" "}
            <a href={app.urls.signIn} className="font-semibold text-primary hover:underline">
              Sign In
            </a>
          </p>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
          <ShieldAlert className="size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign-ups are currently disabled by the administrator. Please contact support or try again later.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create account"
      description="to get started with Phantom App"
      footer={
        <p>
          Already have an account?{" "}
          <a href={app.urls.signIn} className="font-medium text-foreground/90 underline-offset-4 hover:text-foreground hover:underline">
            Sign in
          </a>
        </p>
      }
    >
      <AnimatePresence mode="wait">
        {error && <MessageState type="error" message={error} />}
        {success && <MessageState type="success" message={success} />}
      </AnimatePresence>

      {oauthProviders.length > 0 && (
        <div className="mb-2 flex flex-col items-stretch gap-3">
          <OAuthButtons
            providers={oauthProviders}
            onSelect={handleOAuthSignIn}
            disabled={loading}
          />
        </div>
      )}

      {(credentialEnabled || magicLinkEnabled) && oauthProviders.length > 0 && (
        <AuthSeparator />
      )}

      {credentialEnabled && magicLinkEnabled ? (
        <Tabs defaultValue="otp" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="otp">Email</TabsTrigger>
            <TabsTrigger value="password">Email & Password</TabsTrigger>
          </TabsList>

          <TabsContent value="otp">{magicLinkForm}</TabsContent>
          <TabsContent value="password">{passwordForm}</TabsContent>
        </Tabs>
      ) : credentialEnabled ? (
        passwordForm
      ) : magicLinkEnabled ? (
        magicLinkForm
      ) : (
        <p className="py-4 text-center text-sm text-destructive">
          No email sign-up method is enabled.
        </p>
      )}
    </AuthCard>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Sign Up..." />}>
      <SignUpContent />
    </Suspense>
  );
}
