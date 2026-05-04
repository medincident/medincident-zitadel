"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";

let isInitialLoad = true;

export function TabTransition({ children }: { children: React.ReactNode }) {
  const [shouldAnimate] = useState(() => {
    if (isInitialLoad) {
      isInitialLoad = false;
      return false;
    }
    return true;
  });

  return (
    <div
      className={cn(
        shouldAnimate &&
          "animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
      )}
    >
      {children}
    </div>
  );
}