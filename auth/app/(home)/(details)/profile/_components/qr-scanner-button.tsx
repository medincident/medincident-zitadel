"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QrCode, Loader2 } from "lucide-react";
import jsQR from "jsqr";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { useRouter } from "next/navigation";

declare const BarcodeDetector: unknown;

type Variant = "default" | "icon" | "compact" | "compact-responsive";

interface QrScannerButtonProps {
  variant?: Variant;
}

const CORNER_CLASSES = [
  "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
  "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
  "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
  "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
] as const;

function tryExtractDevicePath(rawValue: string, expectedOrigin: string): string | null {
  try {
    const parsed = new URL(rawValue);
    if (parsed.origin !== expectedOrigin) return null;
    if (parsed.pathname !== "/device") return null;
    if (!parsed.searchParams.get("user_code")) return null;
    return parsed.pathname + parsed.search;
  } catch {
    return null;
  }
}

export function QrScannerButton({ variant = "default" }: QrScannerButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        stopCamera();
      } else {
        setError(null);
        setScanning(false);
      }
      setOpen(isOpen);
    },
    [stopCamera],
  );

  const openScanner = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const expectedOrigin = window.location.origin;

    async function init() {
      setScanning(true);
      setError(null);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      } catch {
        if (!cancelled) {
          setError("Нет доступа к камере. Разрешите доступ в настройках браузера.");
          setScanning(false);
        }
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          stopCamera();
          if (!cancelled) {
            setError("Не удалось запустить камеру");
            setScanning(false);
          }
          return;
        }
      }

      const hasBarcodeDetector = typeof BarcodeDetector !== "undefined";
      const getCanvas = (): HTMLCanvasElement => {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        return canvasRef.current;
      };

      let detector: { detect: (s: HTMLVideoElement) => Promise<{ rawValue: string }[]> } | null = null;
      if (hasBarcodeDetector) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        detector = new (BarcodeDetector as any)({ formats: ["qr_code"] });
      }

      async function scan() {
        if (cancelled || !videoRef.current) return;

        let rawValue: string | null = null;
        try {
          if (detector) {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) rawValue = results[0].rawValue;
          } else {
            const video = videoRef.current;
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (w > 0 && h > 0) {
              const canvas = getCanvas();
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, w, h);
                const img = ctx.getImageData(0, 0, w, h);
                const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
                if (code?.data) rawValue = code.data;
              }
            }
          }
        } catch {
        }

        if (rawValue) {
          const path = tryExtractDevicePath(rawValue, expectedOrigin);
          if (path) {
            stopCamera();
            setOpen(false);
            router.push(path);
            return;
          }
        }

        rafRef.current = requestAnimationFrame(scan);
      }

      scan();
    }

    init();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, router, stopCamera]);

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={openScanner}
        >
          <QrCode className="size-5" />
        </Button>
      ) : variant === "compact" ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2"
          onClick={openScanner}
        >
          Войти по QR
          <QrCode />
        </Button>
      ) : variant === "compact-responsive" ? (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Войти по QR"
          title="Войти по QR"
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 sm:gap-2"
          onClick={openScanner}
        >
          <span className="hidden sm:inline">Войти по QR</span>
          <QrCode />
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-3 h-auto text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl text-sm font-medium"
          onClick={openScanner}
        >
          <QrCode className="size-5 text-muted-foreground/70" />
          Сканировать QR
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm gap-4">
          <DialogTitle>Наведите на QR-код</DialogTitle>

          {error ? (
            <p className="text-sm text-destructive text-center py-4 whitespace-pre-line">{error}</p>
          ) : (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
              <video ref={videoRef} className="size-full object-cover" muted playsInline />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="size-52 relative">
                  {CORNER_CLASSES.map((cls) => (
                    <div key={cls} className={`absolute size-6 border-white ${cls}`} />
                  ))}
                </div>
              </div>

              {scanning && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <div className="flex items-center gap-2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
                    <Loader2 className="size-3 animate-spin" />
                    Сканирование...
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
