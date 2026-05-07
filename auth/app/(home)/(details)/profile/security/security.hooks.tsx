"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

import {
  getSessionsAction,
  getLinkedAccountsAction,
  revokeSessionAction,
  revokeAllOthersAction,
  toggleLinkedAccountAction,
  linkProvider,
} from "./security.actions";

const KEYS = {
  LINKS: "profile-links",
  SESSIONS: "profile-sessions",
} as const;

export function useLinkedAccounts() {
  const { data, error, isLoading } = useSWR(KEYS.LINKS, getLinkedAccountsAction);
  return { links: data, isLoading, isError: error };
}

export function useUserSessions() {
  const { data, error, isLoading } = useSWR(KEYS.SESSIONS, getSessionsAction);
  return { sessions: data, isLoading, isError: error };
}

export type SecurityActionId = "telegram" | "max" | "revoke_all" | `sess_${string}`;

export function useSecurityMutations(links: any[] | undefined) {
  const { mutate } = useSWRConfig();
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<SecurityActionId | null>(null);

  const runAction = useCallback(
    (id: SecurityActionId, actionFn: () => Promise<any>, keysToInvalidate: readonly string[]) => {
      setActiveActionId(id);
      startTransition(async () => {
        try {
          const result = await actionFn();
          if (!result) return;

          if (!result.success) {
            console.error("Action failed:", result.error);
            toast.error(result.error || "Не удалось выполнить действие");
          }
          await Promise.all(keysToInvalidate.map((key) => mutate(key)));
        } catch (e) {
          console.error("Unexpected error:", e);
          toast.error("Произошла непредвиденная ошибка");
        } finally {
          setActiveActionId(null);
        }
      });
    },
    [mutate],
  );

  const onToggleAccount = useCallback(
    (provider: string) => {
      const isConnected = links ? (links as any)[provider] : false;
      runAction(
        provider as SecurityActionId,
        () => (isConnected ? toggleLinkedAccountAction(provider, isConnected) : linkProvider(provider)),
        [KEYS.LINKS],
      );
    },
    [links, runAction],
  );

  const onRevokeAllOthers = useCallback(
    () => runAction("revoke_all", revokeAllOthersAction, [KEYS.SESSIONS]),
    [runAction],
  );

  const onRevokeSession = useCallback(
    (id: string) => runAction(`sess_${id}`, () => revokeSessionAction(id), [KEYS.SESSIONS]),
    [runAction],
  );

  const actions = useMemo(
    () => ({ onToggleAccount, onRevokeAllOthers, onRevokeSession }),
    [onToggleAccount, onRevokeAllOthers, onRevokeSession],
  );

  return { isMutating: isPending, activeActionId, actions };
}
