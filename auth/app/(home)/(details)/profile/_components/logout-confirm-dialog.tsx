"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
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

export function LogoutConfirmDialog({ children }: { children: React.ReactNode }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await logoutClient();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Выход из системы</DialogTitle>
          <DialogDescription className="pt-2">
            Вы уверены, что хотите завершить текущую сессию на этом устройстве?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut && <Loader2 className="mr-2 animate-spin" />}
            Да, выйти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
