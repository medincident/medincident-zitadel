"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
import { AuthLoader } from "@/shared/ui/auth-loader";
import { startZitadelSignIn } from "@/services/zitadel/user/sign-in";
import { loadSessionsAction, type AccountDisplayItem } from "../actions";
import { selectAccountAction } from "../(auth)/login/callback/success/actions";
import { AccountSelectionView } from "./account-selection-view";
import { NoAccountsView } from "./no-accounts-view";

interface AccountSelectionContainerProps {
  requestId: string;
}

export function AccountSelectionContainer({ requestId }: AccountSelectionContainerProps) {
  const router = useRouter();
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

        console.error("Account selection error:", error);
        toast.error("Системная ошибка", {
          description: "Не удалось продолжить. Попробуйте обновить страницу.",
        });
      }
    });
  };

  if (!isLoaded) {
    return <AuthLoader />;
  }

  const handleAddAccount = () => {
    router.push(`/login?requestId=${requestId}&account=new`);
  };

  if (accounts.length === 0) {
    return <NoAccountsView onAddAccount={handleAddAccount} />;
  }

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
