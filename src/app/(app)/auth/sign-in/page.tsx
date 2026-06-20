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
import { KeyRound, Loader2 } from "lucide-react";
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

function SignInContent() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // OTP states
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpCode, setOtpCode] = useState("");
  const [nonce, setNonce] = useState<string | null>(null);

  // Config checks
  const credentialEnabled = project.config.credentialEnabled;
  const magicLinkEnabled = project.config.magicLinkEnabled;
  const passkeyEnabled = project.config.passkeyEnabled;
  const oauthProviders = project.config.oauthProviders || [];

  // Handle Credential Sign In
  const handleCredentialSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await app.signInWithCredential({
        email,
        password,
        noRedirect: true,
      });

      if (result.status === "error") {
        setError(result.error.message || "Invalid email or password.");
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

  // Handle Passkey Sign In
  const handlePasskeySignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await app.signInWithPasskey();
      if (result.status === "error") {
        setError(result.error.message || "Passkey authentication failed.");
      } else {
        setSuccess("Signed in successfully! Redirecting...");
        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Passkey authentication failed."));
    } finally {
      setLoading(false);
    }
  };

  const passwordForm = (
    <form onSubmit={handleCredentialSignIn} className="space-y-4">
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
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Sign in
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

  return (
    <AuthCard
      title="Sign in"
      description="to continue to Phantom App"
      footer={
        <div className="space-y-2">
          <p>
            Don&apos;t have an account?{" "}
            <a href={app.urls.signUp} className="font-medium text-foreground/90 underline-offset-4 hover:text-foreground hover:underline">
              Sign up
            </a>
          </p>
          <p>
            <a href={app.urls.forgotPassword} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Forgot your password?
            </a>
          </p>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {error && <MessageState type="error" message={error} />}
        {success && <MessageState type="success" message={success} />}
      </AnimatePresence>

      {(oauthProviders.length > 0 || passkeyEnabled) && (
        <div className="mb-2 flex flex-col items-stretch gap-3">
          {oauthProviders.length > 0 && (
            <OAuthButtons
              providers={oauthProviders}
              onSelect={handleOAuthSignIn}
              disabled={loading}
            />
          )}
          {passkeyEnabled && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePasskeySignIn}
              disabled={loading}
              className="w-full gap-2 border-black/8 bg-white shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              <KeyRound className="size-4" />
              Sign in with passkey
            </Button>
          )}
        </div>
      )}

      {(credentialEnabled || magicLinkEnabled) && (oauthProviders.length > 0 || passkeyEnabled) && (
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
          No email sign-in method is enabled.
        </p>
      )}
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading Sign In..." />}>
      <SignInContent />
    </Suspense>
  );
}
