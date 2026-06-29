import { defineHexclaveConfig } from "@hexclave/next/config";

// This file is intentionally kept at the repo root so AI agents can discover
// and edit Hexclave project settings, then sync them with `pnpm hexclave:push`.
const config = defineHexclaveConfig({
  apps: {
    installed: {
      authentication: { enabled: true },
      onboarding: { enabled: true },
      teams: { enabled: true },
      rbac: { enabled: true },
      "api-keys": { enabled: true },
      payments: { enabled: true },
      emails: { enabled: true },
      analytics: { enabled: true },
      "session-replays": { enabled: true },
    },
  },
  auth: {
    allowSignUp: true,
    password: {
      allowSignIn: true,
    },
    otp: {
      // Enables email magic-link / one-time-code sign-in by default.
      allowSignIn: true,
    },
    passkey: {
      allowSignIn: true,
    },
    oauth: {
      accountMergeStrategy: "link_method",
      providers: {
        google: {
          type: "google",
          allowSignIn: true,
          allowConnectedAccounts: true,
        },
        github: {
          type: "github",
          allowSignIn: false,
          allowConnectedAccounts: false,
        },
      },
    },
    signUpRules: {},
  },
  onboarding: {
    requireEmailVerification: true,
  },
  teams: {
    createPersonalTeamOnSignUp: false,
    allowClientTeamCreation: true,
  },
  rbac: {
    permissions: {},
    defaultPermissions: {
      teamCreator: {},
      teamMember: {},
      signUp: {},
    },
  },
  users: {
    allowClientUserDeletion: true,
  },
  apiKeys: {
    enabled: {
      user: true,
      team: true,
    },
  },
  payments: {
    blockNewPurchases: false,
    items: {},
    productLines: {},
    products: {},
  },
  emails: {
    themes: {},
    templates: {},
  },
  dbSync: {
    externalDatabases: {},
  },
  dataVault: {
    stores: {},
  },
});

export { config };
export default config;
