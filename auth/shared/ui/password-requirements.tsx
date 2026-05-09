"use client";

import { cn } from "@/shared/lib/utils";
import { Check, X } from "lucide-react";
import { PASSWORD_RULES } from "@/domain/auth/password-policy";

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  return (
    <ul className={cn("space-y-1", className)}>
      {PASSWORD_RULES.map((rule) => {
        const passed = password.length > 0 && rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5 text-2xs transition-colors",
              password.length === 0
                ? "text-muted-foreground"
                : passed
                  ? "text-success"
                  : "text-destructive"
            )}
          >
            {password.length === 0 ? (
              <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
            ) : passed ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
