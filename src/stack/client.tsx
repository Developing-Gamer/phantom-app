import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "cookie", // Changed from "nextjs-cookie" to work in iframes
  urls: {
    afterSignIn: "/",
    afterSignOut: "/",
  },
});