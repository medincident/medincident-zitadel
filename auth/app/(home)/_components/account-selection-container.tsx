"use client";

import { useState, useEffect, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { AuthLoader } from "@/shared/ui/auth-loader";
import { AppLogoIcon } from "@/app/_components/icons";
import { Plus } from "lucide-react";
import { startZitadelSignIn } from "@/services/zitadel/user/sign-in";
import { loadSessionsAction, type AccountDisplayItem } from "../actions";
import { selectAccountAction } from "../(auth)/login/callback/success/actions";
import { AccountSelectionView } from "./account-selection-view";

interface AccountSelectionContainerProps {
  requestId: string;
}

export function AccountSelectionContainer({ requestId }: AccountSelectionContainerProps) {
  const [accounts, setAccounts] = useState<AccountDisplayItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    loadSessionsAction()
      .then((result) => {
        if (cancelled) return;
        setAccounts(result.accounts);
        setSelectedId(result.defaultSelectedId);
        setIsLoaded(true);

        if (result.removedCount > 0) {
          toast.info("Сессии завершены", {
            description: `${result.removedCount} сессий были завершены или истекли, авторизируйтесь заново`,
          });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[account-selection] Ошибка загрузки сессий:", error);
        setIsLoaded(true);
        toast.error("Ошибка загрузки", {
          description: "Не удалось загрузить сессии. Попробуйте обновить страницу.",
        });
      });

    return () => { cancelled = true; };
  }, []);

  const handleContinue = () => {
    if (!selectedId) return;
    const account = accounts.find((a) => a.id === selectedId);
    if (!account) return;

    startTransition(async () => {
      try {
        const result = await selectAccountAction(account.id, account.token, requestId);

        if (result && "needsSignIn" in result && result.needsSignIn) {
          startZitadelSignIn();
          return;
        }

        if (result && !result.success) {
          console.error("Zitadel Select Account Error:", result.error);
          toast.error("Сессия входа истекла", {
            description: "Пожалуйста, войдите заново",
            action: {
              label: "Войти заново",
              onClick: () => startZitadelSignIn(),
            },
          });
        }
      } catch (error) {
        if (isRedirectError(error)) throw error;

        toast.error("Системная ошибка", {
          description: "Не удалось продолжить. Попробуйте обновить страницу.",
        });
        console.error("Account selection error:", error);
      }
    });
  };

  const handleAddAccount = () => {
    startZitadelSignIn("login");
  };

  // Загрузка
  if (!isLoaded) {
    return <AuthLoader />;
  }

  // Нет активных сессий
  if (accounts.length === 0) {
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
              Нет активных сессий
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Все сессии были завершены или истекли
            </p>
          </div>

          <div className="flex justify-center mt-6 mb-4">
            <Button onClick={handleAddAccount}>
              <Plus className="mr-2" />
              Войти
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Есть аккаунты
  return (
    <AccountSelectionView
      accounts={accounts}
      selectedId={selectedId}
      isPending={isPending}
      onSelect={setSelectedId}
      onContinue={handleContinue}
      onAddAccount={handleAddAccount}
    />
  );
}
