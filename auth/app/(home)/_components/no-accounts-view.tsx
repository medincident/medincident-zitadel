"use client";

import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { AppLogoIcon } from "@/app/_components/icons";

interface NoAccountsViewProps {
  onAddAccount: () => void;
}

export function NoAccountsView({ onAddAccount }: NoAccountsViewProps) {
  return (
    <div className="relative w-full max-w-md mx-auto min-h-[500px] animate-in fade-in zoom-in-95 duration-500">
      <div className="absolute -top-[80%] -left-[80%] size-[80%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[60%] -right-[60%] size-[80%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col py-6 sm:py-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="size-12 md:size-16 mb-4 md:mb-6 flex items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <AppLogoIcon className="size-6 md:size-8" />
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-center">
            Нет активных сессий
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Все сессии были завершены или истекли
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={onAddAccount}>
            <Plus className="mr-2" />
            Войти
          </Button>
        </div>
      </div>
    </div>
  );
}
