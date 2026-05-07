"use client";

import { useState, useTransition } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/shared/ui/skeleton";
import { getTotpStatusAction, removeTotpAction } from "../security.actions";
import { TotpSetupDialog } from "./totp-setup-dialog";

const TOTP_KEY = "profile-totp-status";

export function TotpCard() {
  const { data, isLoading } = useSWR(TOTP_KEY, getTotpStatusAction);
  const { mutate } = useSWRConfig();
  const [setupOpen, setSetupOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [isRemoving, startRemove] = useTransition();

  const enabled = data?.enabled ?? false;

  function handleRemove() {
    startRemove(async () => {
      const res = await removeTotpAction();
      if (res.success) {
        toast.success("2FA отключена");
        setRemoveOpen(false);
        await mutate(TOTP_KEY);
      } else {
        toast.error(res.error || "Не удалось отключить 2FA");
      }
    });
  }

  if (isLoading) {
    return <Skeleton className="h-[74px] w-full rounded-xl" />;
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={
              "w-10 h-10 shrink-0 rounded-xl flex items-center justify-center " +
              (enabled
                ? "bg-success/10 text-success border border-success/20"
                : "bg-muted/30 text-muted-foreground border border-border")
            }
          >
            {enabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h4 className="font-medium text-foreground text-sm truncate">
              Приложение-аутентификатор
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {enabled ? "Подключено" : "Аутентификация по коду из приложения"}
            </p>
          </div>
        </div>

        {enabled ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRemoveOpen(true)}
            className="shrink-0 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          >
            Отключить
          </Button>
        ) : (
          <Button size="sm" onClick={() => setSetupOpen(true)} className="shrink-0">
            Настроить
          </Button>
        )}
      </div>

      <TotpSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onSuccess={() => mutate(TOTP_KEY)}
      />

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Отключить 2FA</DialogTitle>
            <DialogDescription className="pt-2">
              Вход будет возможен только по паролю. Продолжить?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={isRemoving}>Отмена</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
              {isRemoving && <Loader2 className="mr-2 animate-spin" />}
              Отключить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
