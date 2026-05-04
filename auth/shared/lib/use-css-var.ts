"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const noopSubscribe = () => () => {};

export function useCssVar(name: string): string {
  // Re-read on theme switch: parent re-renders → useSyncExternalStore polls getSnapshot.
  useTheme();
  const getSnapshot = () =>
    typeof document === "undefined"
      ? ""
      : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return useSyncExternalStore(noopSubscribe, getSnapshot, () => "");
}
