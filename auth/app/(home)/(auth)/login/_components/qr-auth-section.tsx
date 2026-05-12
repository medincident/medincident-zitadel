"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { SmoothQr } from "@/shared/ui/smooth-qr";
import { useQrAuth, useQrStatus } from "../login.hooks";
import { applyDeviceFlowAction } from "../actions";

interface QrAuthSectionProps {
  requestId?: string;
}

export function QrAuthSection({ requestId }: QrAuthSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { qrUrl, qrUserCode, isError, isLoading, refresh } = useQrAuth(isVisible, requestId);
  const { status } = useQrStatus(isVisible && !isError && !isLoading && !!qrUrl);
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // SSE может прислать confirmed дважды
    if (status === "confirmed" && qrUserCode && !appliedRef.current) {
      appliedRef.current = true;
      startTransition(() => applyDeviceFlowAction(qrUserCode));
    }
  }, [status, qrUserCode]);

  const hasValidQr = !!qrUrl && qrUrl.trim() !== "";
  const isConfirmed = status === "confirmed" || isPending;
  const isExpired = status === "expired";
  const showError = !isConfirmed && (isError || isExpired);
  const showSpinner = !isConfirmed && isLoading;
  const isQrFaded = isLoading || !hasValidQr;

  const showCode = !isConfirmed && qrUserCode && hasValidQr && !isLoading;

  return (
    <div ref={containerRef} className="relative z-10 flex w-full flex-col items-center">
      <div
        className={cn(
          "relative mb-8 flex w-full max-w-[256px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 bg-background/60 backdrop-blur-md transition-colors duration-300",
          showCode ? "pb-3" : "aspect-square",
          isConfirmed ? "border-success" : "border-border"
        )}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div
          className={cn(
            "relative flex items-center justify-center",
            showCode ? "w-full aspect-square" : "w-full h-full",
          )}
        >
          {isConfirmed && (
            <div className="z-20 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95">
              <CheckCircle2 className="size-12 text-success" />
              <span className="text-xs text-muted-foreground">Входим...</span>
            </div>
          )}

          {showError && (
            <div className="z-20 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95">
              <AlertCircle className="size-8 text-destructive/50" />
              <button
                onClick={() => refresh()}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
              >
                <RefreshCw className="size-3" /> Повторить
              </button>
            </div>
          )}

          {showSpinner && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Loader2 className="size-10 animate-spin text-primary" />
            </div>
          )}

          {!isConfirmed && (
            <div
              className={cn(
                "transition-all duration-500",
                isQrFaded ? "opacity-20 scale-95" : "opacity-86 scale-100",
              )}
            >
              {!showError && !isLoading && qrUrl && qrUrl.trim() !== "" && (
                <SmoothQr value={qrUrl} size={220} quietZone={7} />
              )}
            </div>
          )}
        </div>

        {showCode && (
          <p className="font-mono text-base font-semibold tracking-[0.3em] text-foreground/80">
            {qrUserCode!.slice(-4)}
          </p>
        )}
      </div>

      <h2 className="mb-3 text-2xl font-bold tracking-tight">
        {isConfirmed ? "Подтверждено!" : "Вход по QR-коду"}
      </h2>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        {isConfirmed ? (
          "Выполняем вход..."
        ) : (
          <>
            Наведите камеру телефона на код,
            <br />
            чтобы войти мгновенно.
          </>
        )}
      </p>
    </div>
  );
}
