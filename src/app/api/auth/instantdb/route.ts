import { NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { init } from "@instantdb/admin";

// Initialize InstantDB Admin SDK
const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_ADMIN_TOKEN!,
});

/**
 * API endpoint to generate InstantDB authentication tokens for Stack Auth users.
 * This bridges Stack Auth and InstantDB authentication systems.
 *
 * Referenced from InstantDB docs:
 * https://www.instantdb.com/docs/backend
 */
export async function POST() {
  try {
    // Get the currently authenticated Stack Auth user
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: No Stack Auth session found" },
        { status: 401 }
      );
    }

    // Generate an InstantDB token for this user
    // CRITICAL: createToken expects an object with an 'email' property
    // InstantDB's authentication system is email-based
    const token = await adminDb.auth.createToken({
      email: user.primaryEmail!,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating InstantDB token:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication token" },
      { status: 500 }
    );
  }
}
