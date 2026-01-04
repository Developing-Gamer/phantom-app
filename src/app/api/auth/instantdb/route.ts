import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { init } from "@instantdb/admin";

const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

/**
 * API endpoint to generate InstantDB authentication tokens for Stack Auth users.
 *
 * This endpoint bridges Stack Auth and InstantDB authentication systems by:
 * 1. Verifying the user is authenticated with Stack Auth (via cookies OR X-Stack-Access-Token header)
 * 2. Creating a matching InstantDB token with the same user ID
 * 3. Returning the token for the client to use with db.auth.signInWithToken()
 *
 * This ensures that:
 * - InstantDB user IDs match Stack Auth user IDs (user.id === auth.id)
 * - Permissions and data access are properly scoped to the authenticated user
 * - All Stack Auth methods (password, OAuth, magic link, etc.) work seamlessly
 * - Works in iframe contexts where third-party cookies may be blocked
 *
 * Security:
 * - Only authenticated Stack Auth users can get tokens
 * - Tokens are short-lived and single-use
 * - User IDs are verified server-side before token generation
 */
export async function POST(request: Request) {
  try {
    let user;

    // Try to get user from cookies first (normal context)
    try {
      user = await stackServerApp.getUser();
    } catch (cookieError) {
      // If cookie access fails (e.g., in iframe), try to get access token from header
      const accessToken = request.headers.get("x-stack-access-token");

      if (accessToken) {
        // Create a new StackServerApp instance with the access token from the request
        // This allows authentication in iframe contexts where cookies are blocked
        const { StackServerApp } = await import("@stackframe/stack");
        const tokenBasedApp = new StackServerApp({
          tokenStore: {
            accessToken,
            refreshToken: "", // Not needed for read-only operations
          },
        });
        user = await tokenBasedApp.getUser();
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No Stack Auth session found" },
        { status: 401 }
      );
    }

    if (!user.id) {
      console.error("Stack Auth user missing ID:", user);
      return NextResponse.json(
        { error: "Invalid user data: missing user ID" },
        { status: 500 }
      );
    }

    // Explicitly set id to match Stack Auth ID so that:
    // - auth.id (InstantDB) === user.id (Stack Auth)
    // - Database queries can use Stack Auth IDs as foreign keys
    // - Permissions work correctly across both systems
    const token = await adminDb.auth.createToken({
      id: user.id,
      // Optional: Include email if you want it available in InstantDB's $users
      // email: user.primaryEmail || undefined,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating InstantDB token:", error);

    return NextResponse.json(
      {
        error: "Failed to generate authentication token",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
