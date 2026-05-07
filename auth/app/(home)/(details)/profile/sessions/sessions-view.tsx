"use client";

import { SessionsList } from "../security/_components/sessions-list";
import { useUserSessions, useSecurityMutations } from "../security/security.hooks";
import { Skeleton } from "@/shared/ui/skeleton";

function ShimmerBlock({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="shimmer shimmer-primary" />
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="space-y-3">
        <h4 className="section-label">Текущая сессия</h4>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <ShimmerBlock className="size-12 shrink-0 rounded-xl bg-primary/15" />
          <div className="flex-1 min-w-0 space-y-2">
            <ShimmerBlock className="h-4 w-40 rounded-md bg-primary/15" />
            <ShimmerBlock className="h-3 w-32 rounded-md bg-primary/10" />
          </div>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <h3 className="section-label">Другие сессии</h3>
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SessionsView() {
  const { sessions, isLoading } = useUserSessions();
  const { activeActionId, actions } = useSecurityMutations(undefined);

  if (isLoading || !sessions) return <SessionsSkeleton />;

  return (
    <div className="animate-in fade-in duration-500">
      <SessionsList
        sessions={sessions}
        activeActionId={activeActionId}
        onRevokeSession={actions.onRevokeSession}
        onRevokeAllOthers={actions.onRevokeAllOthers}
      />
    </div>
  );
}
