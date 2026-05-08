"use client";

import { memo, useCallback, useEffect, useState, useTransition } from "react";
import { SmoothQr } from "@/shared/ui/smooth-qr";
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
import { toast } from "sonner";
import { registerTotpAction, verifyTotpRegistrationAction } from "../security.actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "loading" | "scan" | "error";

interface CopyContentProps {
  copied: boolean;
  secret: string;
}

const CopyContent = memo(function CopyContent({ copied, secret }: CopyContentProps) {
  const Icon = copied ? Check : Copy;
  return (
    <>
      <Icon className={`size-3 ${copied ? "text-success" : ""}`} />
      {secret}
    </>
  );
});

function TotpSetupContent({
  onOpenChange,
  onSuccess,
}: {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<Step>("loading");
  const [uri, setUri] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isVerifying, startVerify] = useTransition();

  const start = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    registerTotpAction().then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setStep("error");
        setError(res.error);
        return;
      }
      setUri(res.uri);
      setSecret(res.secret);
      setStep("scan");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useCallback(() => {
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
  }, [code, onOpenChange, onSuccess]);

  const handleCancel = useCallback(() => onOpenChange(false), [onOpenChange]);
  const renderCopy = useCallback(
    ({ copied }: { copied: boolean }) => <CopyContent copied={copied} secret={secret} />,
    [secret],
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Настройка двухфакторной аутентификации</DialogTitle>
        <DialogDescription className="pt-1">
          Отсканируйте QR-код в приложении-аутентификаторе и введите сгенерированный код
        </DialogDescription>
      </DialogHeader>

      {step === "loading" && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="size-8 text-muted-foreground animate-spin" />
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
              <SmoothQr value={uri} size={180} quietZone={0} />
            </div>
            <CopyButton
              text={secret}
              className="inline-flex items-center gap-1.5 text-3xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              {renderCopy}
            </CopyButton>
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">Введите код из приложения</p>
            <CodeInput
              name="totp-code"
              length={6}
              mode="numeric"
              autoFocus
              disabled={isVerifying}
              error={!!error && code.length === 0}
              onComplete={setCode}
            />
            {error && (
              <span className="text-2xs font-medium text-destructive">{error}</span>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel}>
              Отмена
            </Button>
            <Button onClick={submit} disabled={isVerifying || code.length !== 6} className="gap-2">
              {isVerifying ? <Loader2 className="animate-spin" /> : <ShieldCheck className="size-4" />}
              Включить 2FA
            </Button>
          </DialogFooter>
        </div>
      )}
    </>
  );
}

export function TotpSetupDialog({ open, onOpenChange, onSuccess }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <TotpSetupContent onOpenChange={onOpenChange} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
