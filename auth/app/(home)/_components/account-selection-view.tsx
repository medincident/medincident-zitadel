"use client";

import { memo } from "react";
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

interface AccountRowProps {
  account: AccountDisplayItem;
  isSelected: boolean;
  isPending: boolean;
  onSelect: (id: string) => void;
}

const AccountRow = memo(function AccountRow({ account, isSelected, isPending, onSelect }: AccountRowProps) {
  return (
    <button
      onClick={() => onSelect(account.id)}
      disabled={isPending}
      className={cn(
        "w-full flex items-center gap-3 p-3 transition-colors hover:bg-secondary/20",
        isPending && "opacity-50 cursor-not-allowed"
      )}
    >
      <Avatar
        className={cn(
          "size-12 shrink-0 border transition-transform",
          isSelected ? "border-primary/30 scale-105" : "border-primary/10"
        )}
      >
        <AvatarImage src={account.avatarUrl} alt={account.title} />
        <AvatarFallback
          className={cn(
            "font-bold text-sm text-primary",
            isSelected ? "bg-primary/20" : "bg-primary/10"
          )}
        >
          {account.initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 overflow-hidden text-left">
        <p
          className={cn(
            "font-semibold truncate transition-colors",
            isSelected && "text-primary"
          )}
        >
          {account.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{account.subtitle}</p>
      </div>

      <div
        className={cn(
          "size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
        )}
      >
        <div
          className={cn(
            "size-1.5 rounded-full bg-card transition-transform",
            isSelected ? "scale-100" : "scale-0"
          )}
        />
      </div>
    </button>
  );
});

export function AccountSelectionView({
  accounts,
  selectedId,
  isPending,
  onSelect,
  onContinue,
  onAddAccount,
}: AccountSelectionViewProps) {
  return (
    <div className="relative w-full max-w-md mx-auto mt-auto mb-24 min-h-[500px] animate-in fade-in zoom-in-95 duration-500 md:mt-0 md:mb-0">
      <div className="absolute -top-[80%] -left-[80%] size-[80%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-[60%] -right-[60%] size-[80%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 py-6 sm:py-8">
        <h1 className="mb-8 flex items-center justify-center gap-2 text-xl md:text-2xl font-semibold tracking-tight">
          <AppLogoIcon className="size-5 md:size-6 text-primary shrink-0" />
          Выберите аккаунт
        </h1>

        <div className="rounded-xl border border-border bg-card backdrop-blur-sm divide-y divide-border overflow-hidden">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              isSelected={selectedId === account.id}
              isPending={isPending}
              onSelect={onSelect}
            />
          ))}

          <button
            onClick={onAddAccount}
            disabled={isPending}
            className={cn(
              "w-full flex items-center gap-3 px-4.5 py-2 transition-colors hover:bg-secondary/50",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="size-8 shrink-0 rounded-full border border-dashed border-primary/30 flex items-center justify-center bg-primary/5 text-primary">
              <Plus className="size-4" />
            </div>
            <span className="ml-2.5 text-sm font-medium">Добавить другой аккаунт</span>
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={onContinue}
            disabled={isPending || !selectedId}
            className="w-full max-w-[200px]"
          >
            {isPending && <Loader2 className="mr-2 animate-spin" />}
            Продолжить
          </Button>
        </div>
      </div>
    </div>
  );
}
