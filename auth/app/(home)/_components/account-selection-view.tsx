"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Loader2, Plus } from "lucide-react";
import { AppLogoIcon } from "@/app/_components/icons";
import { cn } from "@/shared/lib/utils";
import type { AccountDisplayItem } from "../actions";

interface AccountSelectionViewProps {
  accounts: AccountDisplayItem[];
  selectedId?: string;
  isPending: boolean;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onAddAccount: () => void;
}

export function AccountSelectionView({ accounts, selectedId, isPending, onSelect, onContinue, onAddAccount }: AccountSelectionViewProps) {
  return (
    <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-500 mx-auto min-h-[500px] flex flex-col justify-between">
      <div className="absolute -top-[80%] -left-[80%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[60%] -right-[60%] w-[80%] h-[80%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="flex flex-col relative z-10 py-6 sm:py-8 flex-1">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-primary border border-primary/20">
            <AppLogoIcon className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight text-center">
            Выберите аккаунт
          </h1>
        </div>

        <div className="flex flex-col rounded-xl border border-border bg-card backdrop-blur-sm divide-y divide-border overflow-hidden shadow-none max-w-[480px] mx-auto w-full">
          {accounts.map((account) => {
            const isSelected = selectedId === account.id;

            return (
              <button
                key={account.id}
                onClick={() => onSelect(account.id)}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center gap-3 p-3 transition-all text-left",
                  "hover:bg-secondary/20",
                  isPending && "opacity-50 cursor-not-allowed"
                )}
              >
                <Avatar className={cn(
                  "h-12 w-12 shrink-0 border transition-transform",
                  isSelected ? "border-primary/30 scale-105" : "border-primary/10"
                )}>
                  <AvatarImage src={account.avatarUrl} alt={account.title} />
                  <AvatarFallback className={cn(
                    "font-bold text-sm",
                    isSelected ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                  )}>
                    {account.initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 overflow-hidden flex flex-col">
                  <p className={cn(
                    "font-semibold text-md truncate transition-colors",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {account.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {account.subtitle}
                  </p>
                </div>

                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-transparent"
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full bg-card transition-transform duration-200",
                    isSelected ? "scale-100" : "scale-0"
                  )} />
                </div>
              </button>
            );
          })}

          <button
            onClick={onAddAccount}
            disabled={isPending}
            className={cn(
              "w-full flex items-center ml-1.5 gap-3 pl-3 pr-3 pt-2 pb-2 transition-all text-left hover:bg-secondary/50",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="h-8 w-8 shrink-0 rounded-full border border-dashed border-primary/30 flex items-center justify-center bg-primary/5 text-primary transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <div className="flex-1 ml-2 font-medium text-sm text-foreground">
              Добавить другой аккаунт
            </div>
          </button>
        </div>

        <div className="flex justify-center mt-6 mb-4">
          <Button
            onClick={onContinue}
            disabled={isPending || !selectedId}
            className="w-full max-w-[200px]"
          >
            {isPending ? <Loader2 className="mr-2 animate-spin" /> : null}
            Продолжить
          </Button>
        </div>
      </div>
    </div>
  );
}
