"use client";

import { useState, useTransition, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { CodeInput } from "@/shared/ui/code-input";
import { CopyButton } from "@/shared/ui/copy-button";
import { Loader2, Copy, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { registerTotpAction, verifyTotpRegistrationAction } from "../security.actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "loading" | "scan" | "error";

export function TotpSetupDialog({ open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [uri, setUri] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | undefined>();
  const [isVerifying, startVerify] = useTransition();

  async function start() {
    setStep("loading");
    setError(undefined);
    setCode("");
    const res = await registerTotpAction();
    if (!res.success) {
      setStep("error");
      setError(res.error);
      return;
    }
    setUri(res.uri);
    setSecret(res.secret);
    setStep("scan");
  }

  // Запускаем генерацию ключа при открытии диалога (включая контролируемое открытие через parent)
  useEffect(() => {
    if (open) {
      start();
    } else {
      setCode("");
      setError(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  function submit() {
    if (code.length !== 6) {
      setError("Введите 6-значный код");
      return;
    }
    setError(undefined);
    startVerify(async () => {
      const res = await verifyTotpRegistrationAction(code);
      if (res.success) {
        toast.success("Двухфакторная аутентификация включена");
        onOpenChange(false);
        onSuccess();
      } else {
        setError(res.error || "Неверный код");
        setCode("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Настройка двухфакторной аутентификации</DialogTitle>
          <DialogDescription className="pt-1">
            Отсканируйте QR-код в приложении-аутентификаторе и введите сгенерированный код
          </DialogDescription>
        </DialogHeader>

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Генерируем ключ…</p>
          </div>
        )}

        {step === "error" && (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm text-destructive">{error || "Не удалось начать настройку"}</p>
            <Button onClick={start} variant="outline" size="sm">
              Попробовать снова
            </Button>
          </div>
        )}

        {step === "scan" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="rounded-lg bg-white p-3">
                <QRCode value={uri} size={180} quietZone={0} />
              </div>
              <CopyButton
                text={secret}
                className="inline-flex items-center gap-1.5 text-3xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                {({ copied }) => (
                  <>
                    {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                    {secret}
                  </>
                )}
              </CopyButton>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">Введите код из приложения</p>
              <CodeInput
                name="totp-code"
                length={6}
                autoFocus
                disabled={isVerifying}
                error={!!error && code.length === 0}
                onComplete={(v) => setCode(v)}
              />
              {error && code.length < 6 && (
                <span className="text-2xs font-medium text-destructive">{error}</span>
              )}
              {error && code.length === 6 && (
                <span className="text-2xs font-medium text-destructive">{error}</span>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button onClick={submit} disabled={isVerifying || code.length !== 6} className="gap-2">
                {isVerifying ? <Loader2 className="animate-spin" /> : <ShieldCheck className={cn("w-4 h-4")} />}
                Включить 2FA
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
