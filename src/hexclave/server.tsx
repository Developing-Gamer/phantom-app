import "server-only";

import { HexclaveServerApp } from "@hexclave/next";

export const hexclaveServerApp = new HexclaveServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    forgotPassword: "/auth/forgot-password",
    passwordReset: "/auth/password-reset",
    emailVerification: "/auth/email-verification",
    mfa: "/auth/mfa",
    onboarding: "/auth/onboarding",
    teamInvitation: "/auth/team-invitation",
    cliAuthConfirm: "/auth/cli-auth-confirm",
    accountSettings: "/auth/account-settings",
    error: "/auth/error",
    afterSignIn: "/",
    afterSignUp: "/",
    afterSignOut: "/",
    home: "/",
  },
});
