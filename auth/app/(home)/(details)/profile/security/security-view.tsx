"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LinkedAccountsCard } from "./_components/linked-accounts-card";
import { ChangePasswordDialog } from "./_components/change-password-dialog";
import { TotpCard } from "./_components/totp-card";
import { useLinkedAccounts, useSecurityMutations } from "./security.hooks";
import { Skeleton } from "@/shared/ui/skeleton";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SecurityViewProps {
  linkStatus?: string;
}

interface LinkRecord {
  id: string;
  name: string;
  isConnected: boolean;
}

function StatusBanner({ status }: { status: string | undefined }) {
  if (status === "success" || status === "done") {
    return (
      <div className="p-4 bg-success/10 text-success border border-success/20 rounded-xl flex items-center gap-3">
        <CheckCircle2 className="size-5 shrink-0" />
        <p className="text-sm font-medium">Аккаунт успешно привязан</p>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-3">
        <AlertCircle className="size-5 shrink-0" />
        <p className="text-sm font-medium">Не удалось привязать аккаунт. Возможно, он уже используется.</p>
      </div>
    );
  }
  return null;
}

function LinkedAccountsSkeleton() {
  return (
    <div className="space-y-4">
      <h3 className="section-label">Социальные сети и сервисы</h3>
      <div className="flex flex-wrap gap-4">
        <Skeleton className="flex-1 min-w-[300px] h-[74px] rounded-xl" />
        <Skeleton className="flex-1 min-w-[300px] h-[74px] rounded-xl" />
      </div>
    </div>
  );
}

export function SecurityView({ linkStatus }: SecurityViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { links, isLoading: loadingLinks } = useLinkedAccounts();
  const { isMutating, activeActionId, actions } = useSecurityMutations(links);

  const [statusMessage] = useState<string | undefined>(linkStatus);

  useEffect(() => {
    if (linkStatus) {
      router.replace(pathname, { scroll: false });
    }
  }, [linkStatus, pathname, router]);

  // Производим items только когда меняются вход. данные.
  const items = useMemo(() => {
    if (!links) return null;
    const typed = links as LinkRecord[];
    const connectedCount = typed.filter((l) => l.isConnected).length;
    const canUnlink = connectedCount > 1;
    return typed.map((link) => ({
      id: link.id,
      name: link.name,
      isConnected: link.isConnected,
      isLoading: isMutating && activeActionId === link.id,
      canUnlink,
    }));
  }, [links, isMutating, activeActionId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <StatusBanner status={statusMessage} />

      <div className="space-y-3">
        <h3 className="section-label">Пароль</h3>
        <ChangePasswordDialog />
      </div>

      <div className="space-y-3">
        <h3 className="section-label">Двухфакторная аутентификация</h3>
        <TotpCard />
      </div>

      {loadingLinks || !items ? (
        <LinkedAccountsSkeleton />
      ) : (
        <LinkedAccountsCard items={items} onToggle={actions.onToggleAccount} />
      )}
    </div>
  );
}
