"use client";

import * as React from "react";
import { Suspense } from "react";
import { useCliAuthConfirmation } from "@hexclave/next";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Terminal, ShieldAlert, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import {
  AuthCard,
  MessageState,
  LoadingScreen,
} from "@/components/auth/shared";

function CliAuthConfirmContent() {
  const cliAuth = useCliAuthConfirmation();
  const { status, loginCode, error, isLoading, authorize, retry } = cliAuth;

  const handleAuthorize = async () => {
    try {
      await authorize();
    } catch (err) {
      console.error("CLI authorization failed:", err);
    }
  };

  return (
    <AuthCard
      title="CLI Authorization"
      description="Authorize command-line access"
      footer={
        <p className="text-xs text-muted-foreground">
          Only authorize tools you trust. This will grant full access to your account.
        </p>
      }
    >
      <AnimatePresence mode="wait">
        {error && <MessageState type="error" message={error.message || "An error occurred during CLI authorization."} />}
      </AnimatePresence>

      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Terminal className="size-12 text-primary mb-6" />

        {status === "idle" && (
          <div className="space-y-6 w-full">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                A command-line tool is requesting access to your account.
              </p>
              {loginCode && (
                <div className="rounded-lg bg-muted p-3 font-mono text-lg font-bold tracking-wider text-foreground">
                  {loginCode}
                </div>
              )}
            </div>
            <Button onClick={handleAuthorize} className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Authorize CLI
            </Button>
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4 w-full">
            <ShieldAlert className="size-12 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">
              This CLI login request is invalid, expired, or has already been used.
            </p>
            <Button onClick={retry} className="w-full">
              <RefreshCw className="size-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {(status === "authorizing" || status === "redirecting") && (
          <div className="space-y-4 w-full">
            <Loader2 className="size-12 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              {status === "authorizing" ? "Authorizing CLI access..." : "Redirecting back to CLI..."}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 w-full">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full bg-emerald-500/10 p-3 text-emerald-500 mx-auto w-fit"
            >
              <CheckCircle2 className="size-12" />
            </motion.div>
            <h2 className="text-lg font-semibold text-foreground">CLI Authorized!</h2>
            <p className="text-sm text-muted-foreground">
              You have successfully authorized the CLI. You can now close this tab and return to your terminal.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 w-full">
            <ShieldAlert className="size-12 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">
              An error occurred while authorizing the CLI.
            </p>
            <Button onClick={retry} className="w-full">
              <RefreshCw className="size-4 mr-2" />
              Retry Authorization
            </Button>
          </div>
        )}
      </div>
    </AuthCard>
  );
}

export default function CliAuthConfirmPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading CLI Authorization..." />}>
      <CliAuthConfirmContent />
    </Suspense>
  );
}
