"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function getServerSnapshot() {
  return false;
}

export function useIsInIframe() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
