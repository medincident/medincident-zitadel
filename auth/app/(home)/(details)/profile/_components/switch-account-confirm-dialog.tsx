"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { logoutClient } from "@/app/(home)/(auth)/login/login.hooks";
import { startZitadelSignIn } from "@/services/zitadel/user/sign-in";

export function SwitchAccountConfirmDialog({ children }: { children: React.ReactNode }) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [clearEverywhere, setClearEverywhere] = useState(false);

  const handleSwitch = useCallback(async () => {
    setIsSwitching(true);
    await logoutClient({ clearZitadelSession: clearEverywhere, skipRedirect: true });
    await startZitadelSignIn("select_account");
  }, [clearEverywhere]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Сменить аккаунт</DialogTitle>
          <DialogDescription className="pt-2">
            Текущая сессия будет завершена, и вы сможете войти под другим аккаунтом.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 rounded-lg section-surface p-3">
          <Checkbox
            name="clearEverywhere"
            checked={clearEverywhere}
            onCheckedChange={setClearEverywhere}
            disabled={isSwitching}
            align="center"
          >
            <span className="text-sm font-medium text-foreground">Завершить сессию</span>
          </Checkbox>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSwitching}>Отмена</Button>
          </DialogClose>
          <Button
            onClick={handleSwitch}
            disabled={isSwitching}
          >
            {isSwitching && <Loader2 className="mr-2 animate-spin" />}
            Сменить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
