"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

type CodeMode = "alphanumeric" | "numeric";

interface CodeInputProps {
  length?: number;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
  onComplete?: (value: string) => void;
  /**
   * "alphanumeric" — A-Z + 0-9, ввод приводится к верхнему регистру (Zitadel email/reset codes).
   * "numeric" — только 0-9 (TOTP, OTP).
   */
  mode?: CodeMode;
}

interface CodeModeConfig {
  allowed: RegExp; // глобальный — для match
  keyAllowed: RegExp; // одиночный символ — для keydown
  uppercase: boolean;
  inputMode: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  htmlPattern: string;
  autoCapitalize: "off" | "characters";
}

const MODES: Record<CodeMode, CodeModeConfig> = {
  alphanumeric: {
    allowed: /[A-Z0-9]/g,
    keyAllowed: /^[A-Za-z0-9]$/,
    uppercase: true,
    inputMode: "text",
    htmlPattern: "[A-Z0-9]*",
    autoCapitalize: "characters",
  },
  numeric: {
    allowed: /[0-9]/g,
    keyAllowed: /^[0-9]$/,
    uppercase: false,
    inputMode: "numeric",
    htmlPattern: "[0-9]*",
    autoCapitalize: "off",
  },
};

export function CodeInput({
  length = 6,
  name = "code",
  defaultValue,
  disabled,
  error,
  autoFocus,
  className,
  onComplete,
  mode = "alphanumeric",
}: CodeInputProps) {
  const config = MODES[mode];

  const normalize = React.useCallback(
    (s: string) => {
      const transformed = config.uppercase ? s.toUpperCase() : s;
      return transformed.match(config.allowed)?.join("") ?? "";
    },
    [config],
  );

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

    // Не перехватываем сочетания (Ctrl/Cmd+V/C/A и т.п.) — пусть отрабатывает paste/copy.
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (key.length === 1 && config.keyAllowed.test(key)) {
      e.preventDefault();
      setChar(index, config.uppercase ? key.toUpperCase() : key);
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

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = normalize(e.clipboardData.getData("text")).slice(0, length - index);
    if (!pasted) return;
    setValues((prev) => {
      const next = [...prev];
      for (let i = 0; i < pasted.length; i++) {
        next[index + i] = pasted[i];
      }
      return next;
    });
    focusAt(Math.min(index + pasted.length, length - 1));
  };

  return (
    <div className={cn("flex items-center gap-1.5 sm:gap-2", className)}>
      <input type="hidden" name={name} value={combined} />
      {values.map((value, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode={config.inputMode}
          autoComplete="one-time-code"
          autoCapitalize={config.autoCapitalize}
          pattern={config.htmlPattern}
          maxLength={1}
          disabled={disabled}
          value={value}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Символ ${i + 1}`}
          className={cn(
            "h-11 w-10 sm:h-12 sm:w-11 rounded-lg border bg-card text-center text-base sm:text-lg font-medium text-foreground transition-all",
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
