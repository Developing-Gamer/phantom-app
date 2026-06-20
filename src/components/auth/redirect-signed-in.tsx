"use client";

import * as React from "react";
import { useUser } from "@hexclave/next";
import { useRouter } from "next/navigation";

export function useRedirectSignedInUser() {
  const router = useRouter();
  const user = useUser({ includeRestricted: false, or: "return-null" });

  React.useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

  return Boolean(user);
}
