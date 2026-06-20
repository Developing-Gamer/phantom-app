"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useHexclaveApp } from "@hexclave/next";
import { buttonVariants } from "@/components/ui/button";
import { ShieldAlert, KeyRound, WifiOff, ArrowLeft } from "lucide-react";
import { AuthCard, LoadingScreen } from "@/components/auth/shared";

type KnownErrorJson = {
  errorCode?: string;
  code?: string;
  message?: string;
  error?: string;
  statusCode?: number;
  status?: number;
  details?: unknown;
};

class KnownError extends Error {
  statusCode: number;
  errorCode: string;
  humanReadableMessage: string;
  details?: unknown;

  constructor(errorCode: string, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.errorCode = errorCode;
    this.humanReadableMessage = message;
    this.statusCode = statusCode;
    this.details = details;
  }

  static fromJson(json: KnownErrorJson): KnownError {
    return new KnownError(
      json.errorCode || json.code || "UNKNOWN_ERROR",
      json.message || json.error || "An unknown error occurred.",
      json.statusCode || json.status || 500,
      json.details
    );
  }
}

function ErrorContent() {
  const app = useHexclaveApp();
  const searchParams = useSearchParams();

  const errorCode = searchParams.get("errorCode") || "UNKNOWN_ERROR";
  const message = searchParams.get("message") || "An unexpected error occurred.";
  const detailsStr = searchParams.get("details");

  let details: unknown = null;
  if (detailsStr) {
    try {
      details = JSON.parse(detailsStr);
    } catch {
      details = detailsStr;
    }
  }

  const error = KnownError.fromJson({ errorCode, message, details });

  // Special handling for OAuth errors
  const isAccessDenied = error.errorCode === "OAUTH_ACCESS_DENIED" || error.errorCode === "access_denied";
  const isConnectionError = error.errorCode === "OAUTH_CONNECTION_ERROR" || error.errorCode === "connection_error";

  return (
    <AuthCard
      title="Authentication Error"
      description="Something went wrong during authentication"
      footer={
        <a
          href={app.urls.signIn}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "text-xs text-muted-foreground hover:text-foreground",
          })}
        >
          <ArrowLeft className="size-3" />
          Back to Sign In
        </a>
      }
    >
      <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
        {isAccessDenied ? (
          <KeyRound className="size-12 text-amber-500 animate-bounce" />
        ) : isConnectionError ? (
          <WifiOff className="size-12 text-destructive animate-pulse" />
        ) : (
          <ShieldAlert className="size-12 text-destructive" />
        )}

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            {isAccessDenied
              ? "Access Denied"
              : isConnectionError
              ? "Connection Failed"
              : "An Error Occurred"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {isAccessDenied
              ? "You cancelled the authorization request or denied permission to access your account."
              : isConnectionError
              ? "We couldn't connect to the identity provider. Please check your network connection and try again."
              : error.humanReadableMessage}
          </p>
        </div>

        {error.details != null && (
          <div className="w-full mt-4 rounded-lg bg-muted p-3 text-left text-xs font-mono text-muted-foreground overflow-auto max-h-32">
            <p className="font-semibold text-foreground mb-1">Details:</p>
            <pre>{JSON.stringify(error.details, null, 2) ?? String(error.details)}</pre>
          </div>
        )}

        <a
          href={app.urls.signIn}
          className={buttonVariants({ className: "w-full mt-6" })}
        >
          Try Again
        </a>
      </div>
    </AuthCard>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading error page..." />}>
      <ErrorContent />
    </Suspense>
  );
}
