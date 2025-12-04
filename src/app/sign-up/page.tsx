"use client";

import { SignUp } from "@stackframe/stack";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUp
          fullPage={false}
          automaticRedirect={true}
          firstTab="password"
        />
      </div>
    </div>
  );
}
