"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type Status = "idle" | "sending" | "sent" | "cooldown";

interface ResendCodeButtonProps {
  action: () => Promise<void>;
  cooldownSeconds?: number;
  className?: string;
}

export function ResendCodeButton({
  action,
  cooldownSeconds = 30,
  className,
}: ResendCodeButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "sent") return;
    const t = setTimeout(() => {
      setStatus("cooldown");
      setSecondsLeft(cooldownSeconds);
    }, 1500);
    return () => clearTimeout(t);
  }, [status, cooldownSeconds]);

  useEffect(() => {
    if (status !== "cooldown") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setStatus("idle");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  const handleClick = () => {
    if (status !== "idle" || isPending) return;
    setStatus("sending");
    startTransition(async () => {
      try {
        await action();
        setStatus("sent");
      } catch {
        setStatus("idle");
      }
    });
  };

  const disabled = status !== "idle" || isPending;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm transition-colors underline-offset-4",
        "disabled:cursor-not-allowed",
        status === "idle" && "text-muted-foreground hover:text-foreground hover:underline",
        status === "sending" && "text-muted-foreground",
        status === "sent" && "text-success",
        status === "cooldown" && "text-muted-foreground/70",
        className
      )}
    >
      {status === "sending" && (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>Отправляем…</span>
        </>
      )}
      {status === "sent" && (
        <span className="inline-flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-300">
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span>Отправлено</span>
        </span>
      )}
      {status === "cooldown" && <span>Повторить через {secondsLeft} с</span>}
      {status === "idle" && <span>Отправить код повторно</span>}
    </button>
  );
}
