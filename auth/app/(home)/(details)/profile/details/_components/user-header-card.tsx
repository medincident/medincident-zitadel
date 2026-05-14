"use client";

import { memo, useCallback, useMemo } from "react";
import { PersonalInfo } from "@/domain/profile/types";
import { EditableAvatar } from "./editable-avatar";
import { Check, UserRoundCog } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { CopyButton } from "@/shared/ui/copy-button";
import { startZitadelSignIn } from "@/services/zitadel/user/sign-in";

interface CopyContentProps {
  copied: boolean;
  id: string;
}

const CopyContent = memo(function CopyContent({ copied, id }: CopyContentProps) {
  return (
    <>
      {copied && <Check className="size-3.5 shrink-0 text-success" />}
      <span>{copied ? "Скопировано" : id}</span>
    </>
  );
});

const handleSwitchAccount = () => startZitadelSignIn("select_account");

export const UserHeaderCard = memo(function UserHeaderCard({ user }: { user: PersonalInfo }) {
  const initials = useMemo(
    () => `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase(),
    [user.firstName, user.lastName],
  );
  const fullName = useMemo(
    () => [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" "),
    [user.firstName, user.middleName, user.lastName],
  );

  const renderCopy = useCallback(
    ({ copied }: { copied: boolean }) => <CopyContent copied={copied} id={user.id} />,
    [user.id],
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary/5 border border-primary/20 p-5">
      <div className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-48 rounded-full bg-primary/5 blur-2xl" />

      <div className="flex items-center gap-5">
        <div className="shrink-0 group/avatar">
          <div className="rounded-full p-0.5 bg-gradient-to-br from-primary/60 via-primary/30 to-transparent group-hover/avatar:shadow-[0_0_16px_4px_color-mix(in_oklch,var(--color-primary)_40%,transparent)] transition-shadow duration-300">
            <div className="rounded-full bg-background">
              <EditableAvatar currentAvatarUrl={user.avatarUrl} initials={initials} />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <h2 className="text-xl font-bold text-foreground leading-tight truncate">{fullName}</h2>

          {user.position && (
            <p className="text-sm text-muted-foreground font-medium">{user.position}</p>
          )}

          {user.roles && user.roles.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {user.roles.map((r, i) => (
                <span
                  key={r}
                  className={
                    i === 0
                      ? "inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary text-primary-foreground"
                      : "inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary"
                  }
                >
                  {r}
                </span>
              ))}
            </div>
          )}

          <CopyButton
            text={user.id}
            className="flex items-center gap-1.5 font-mono text-xs rounded-md px-1.5 py-0.5 -ml-1.5 text-muted-foreground/60 hover:text-muted-foreground hover:bg-primary/10 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            {renderCopy}
          </CopyButton>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSwitchAccount}
          aria-label="Сменить аккаунт"
          title="Сменить аккаунт"
          className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 sm:gap-2"
        >
          <UserRoundCog />
          <span className="hidden sm:inline">Сменить аккаунт</span>
        </Button>
      </div>
    </div>
  );
});
