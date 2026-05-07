"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useRouter } from "next/navigation";

// BarcodeDetector — нативный браузерный API (Chrome 83+, Safari 17+)
declare const BarcodeDetector: any;

interface QrScannerButtonProps {
  variant?: "default" | "icon" | "compact" | "compact-responsive";
}

export function QrScannerButton({ variant = "default" }: QrScannerButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const router = useRouter();

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      stopCamera();
    } else {
      setError(null);
      setScanning(false);
    }
    setOpen(isOpen);
  }

  function handleDetected(rawValue: string) {
    try {
      const parsed = new URL(rawValue);
      // Принимаем только QR коды нашего приложения на /device.
      if (parsed.pathname === "/device" && parsed.searchParams.get("user_code")) {
        stopCamera();
        setOpen(false);
        router.push(parsed.pathname + parsed.search);
        return;
      }
    } catch {}
    // Неизвестный QR — продолжаем сканирование
  }

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function init() {
      setScanning(true);
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (typeof BarcodeDetector === "undefined") {
          setError("Ваш браузер не поддерживает сканирование QR-кодов.\nОбновите Chrome или Safari.");
          setScanning(false);
          return;
        }

        const detector = new BarcodeDetector({ formats: ["qr_code"] });

        async function scan() {
          if (cancelled || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) {
              handleDetected(results[0].rawValue);
              return;
            }
          } catch {}
          rafRef.current = requestAnimationFrame(scan);
        }

        scan();
      } catch {
        if (!cancelled) {
          setError("Нет доступа к камере. Разрешите доступ в настройках браузера.");
          setScanning(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open]);

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(true)}
        >
          <QrCode className="h-5 w-5" />
        </Button>
      ) : variant === "compact" ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2"
          onClick={() => setOpen(true)}
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
          onClick={() => setOpen(true)}
        >
          <span className="hidden sm:inline">Войти по QR</span>
          <QrCode />
        </Button>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-3 h-auto text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl text-sm font-medium"
          onClick={() => setOpen(true)}
        >
          <QrCode className="h-5 w-5 text-muted-foreground/70" />
          Сканировать QR
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm gap-4">
          <DialogTitle>Наведите на QR-код</DialogTitle>

          {error ? (
            <p className="text-sm text-destructive text-center py-4 whitespace-pre-line">
              {error}
            </p>
          ) : (
            <div className="relative aspect-square rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />

              {/* Рамка прицела */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 relative">
                  {/* Угловые маркеры */}
                  {[
                    "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
                    "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
                    "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
                    "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-6 h-6 border-white ${cls}`} />
                  ))}
                </div>
              </div>

              {scanning && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <div className="flex items-center gap-2 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
                    <Loader2 className="h-3 w-3 animate-spin" />
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
