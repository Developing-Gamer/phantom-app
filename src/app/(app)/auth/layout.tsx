import * as React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-hexclave-handler-page
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6"
    >
      <div className="relative z-10 flex w-full justify-center">
        {children}
      </div>
    </div>
  );
}
