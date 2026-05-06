"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface CodeInputProps {
  length?: number;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
  onComplete?: (value: string) => void;
}

export function CodeInput({
  length = 6,
  name = "code",
  defaultValue,
  disabled,
  error,
  autoFocus,
  className,
  onComplete,
}: CodeInputProps) {
  const ALLOWED = /[A-Z0-9]/g;
  const normalize = (s: string) => s.toUpperCase().match(ALLOWED)?.join("") ?? "";

  const [values, setValues] = React.useState<string[]>(() => {
    const seed = defaultValue ? normalize(defaultValue).slice(0, length) : "";
    return Array.from({ length }, (_, i) => seed[i] ?? "");
  });
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const combined = values.join("");

  React.useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  React.useEffect(() => {
    if (combined.length === length && onComplete) onComplete(combined);
  }, [combined, length, onComplete]);

  const focusAt = (i: number) => inputsRef.current[i]?.focus();

  const setChar = (index: number, char: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (index < length - 1) focusAt(index + 1);
  };

  const handleChange = (index: number, raw: string) => {
    const chars = normalize(raw);
    if (!chars) return;
    const current = values[index];
    const newChar = [...chars].find((c) => c !== current) ?? chars.slice(-1);
    setChar(index, newChar);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    if (key.length === 1 && /^[A-Za-z0-9]$/.test(key)) {
      e.preventDefault();
      setChar(index, key.toUpperCase());
      return;
    }

    if (key === "Backspace") {
      e.preventDefault();
      setValues((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
          focusAt(index - 1);
        }
        return next;
      });
    } else if (key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    } else if (key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = normalize(e.clipboardData.getData("text")).slice(0, length);
    if (!pasted) return;
    const next = Array.from({ length }, (_, i) => pasted[i] ?? "");
    setValues(next);
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input type="hidden" name={name} value={combined} />
      {values.map((value, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          pattern="[A-Z0-9]*"
          maxLength={1}
          disabled={disabled}
          value={value}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Символ ${i + 1}`}
          className={cn(
            "h-12 w-11 rounded-lg border bg-card text-center text-lg font-medium text-foreground transition-all",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive/30"
              : "border-border",
          )}
        />
      ))}
    </div>
  );
}
