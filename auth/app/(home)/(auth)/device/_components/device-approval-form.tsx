"use client";

import { useEffect, useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { approveDeviceAction, denyDeviceAction } from "../actions";

interface DeviceApprovalFormProps {
  userCode: string;
  hint?: string;
  displayName: string;
}

const COOLDOWN_SECONDS = 5;

export function DeviceApprovalForm({ userCode, hint, displayName }: DeviceApprovalFormProps) {
  const [isApproving, startApprove] = useTransition();
  const [isDenying, startDeny] = useTransition();
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const busy = isApproving || isDenying;

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function handleApprove() {
    startApprove(async () => {
      try {
        await approveDeviceAction(userCode, hint);
      } catch (e) {
        if (isRedirectError(e)) throw e;
        const msg = e instanceof Error ? e.message : "Попробуйте ещё раз";
        toast.error("Не удалось подтвердить вход", { description: msg });
      }
    });
  }

  function handleDeny() {
    startDeny(async () => {
      try {
        await denyDeviceAction();
      } catch (e) {
        if (isRedirectError(e)) throw e;
        const msg = e instanceof Error ? e.message : "Попробуйте ещё раз";
        toast.error("Не удалось отменить", { description: msg });
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-sm">Вы входите как</p>
        <p className="text-lg font-semibold text-foreground">{displayName}</p>
      </div>

      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Разрешить вход в ваш аккаунт с другого устройства?
      </p>

      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        <Button
          onClick={handleApprove}
          disabled={busy || cooldown > 0}
          size="md"
          className="w-full"
        >
          {isApproving ? (
            <Loader2 className="mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2" />
          )}
          {cooldown > 0 ? `Подтвердить вход (${cooldown})` : "Подтвердить вход"}
        </Button>

        <Button
          variant="ghost"
          size="md"
          onClick={handleDeny}
          disabled={busy}
          className="w-full"
        >
          <X className="mr-2" />
          Отмена
        </Button>
      </div>
    </div>
  );
}
