import { memo, useCallback, useMemo } from "react";
import { UserSession } from "@/domain/profile/types";
import { Button } from "@/shared/ui/button";
import { Laptop, Smartphone, LogOut, Loader2, Info, Globe, Clock, Monitor } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatRelativeTime } from "@/shared/lib/relative-time";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import { CopyButton } from "@/shared/ui/copy-button";
import { LogoutConfirmDialog } from "../../_components/logout-confirm-dialog";
import { QrScannerButton } from "../../_components/qr-scanner-button";

interface Props {
  sessions: UserSession[];
  activeActionId: string | null;
  onRevokeSession: (id: string) => void;
  onRevokeAllOthers: () => void;
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function isMobileDevice(name: string) {
  const lower = name.toLowerCase();
  return lower.includes("iphone") || lower.includes("android");
}

function DeviceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = isMobileDevice(name) ? Smartphone : Laptop;
  return <Icon className={cn("size-5", className)} />;
}

function InfoButton({ tone = "muted" }: { tone?: "muted" | "primary" }) {
  return (
    <button
      type="button"
      title="Показать технические данные"
      className={cn(
        "transition-colors p-0.5 rounded-sm shrink-0 cursor-pointer outline-none",
        tone === "primary"
          ? "text-primary/40 hover:text-primary"
          : "text-muted-foreground/40 hover:text-primary focus-visible:text-primary",
      )}
    >
      <Info className="size-3.5" />
    </button>
  );
}

const SessionInfoPopover = memo(function SessionInfoPopover({
  session,
  children,
}: {
  session: UserSession;
  children: React.ReactNode;
}) {
  const lastActiveLabel = useMemo(
    () => new Date(session.lastActive).toLocaleString("ru-RU", DATE_FORMAT_OPTIONS),
    [session.lastActive],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-90 p-3 space-y-2">
        <div className="rounded-lg section-surface py-1.5 px-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Monitor className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-3xs text-muted-foreground uppercase tracking-wider font-medium">User Agent</span>
            </div>
            <CopyButton text={session.userAgent} />
          </div>
          <p className="text-2xs font-mono text-muted-foreground leading-relaxed break-all select-all">
            {session.userAgent}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InfoTile icon={Globe} label="IP" value={session.ip} mono />
          <InfoTile icon={Clock} label="Активность" value={lastActiveLabel} />
        </div>
      </PopoverContent>
    </Popover>
  );
});

function InfoTile({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg section-surface">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-3xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className={cn("text-xs text-foreground truncate", mono && "font-mono")}>{value}</p>
      </div>
    </div>
  );
}

function RevokeAllConfirmDialog({
  children,
  onConfirm,
}: {
  children: React.ReactNode;
  onConfirm: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Завершить все сессии</DialogTitle>
          <DialogDescription className="pt-2">
            Вы уверены, что хотите завершить все остальные активные сессии?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive" onClick={onConfirm}>
              Да, завершить все
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CurrentSessionCard = memo(function CurrentSessionCard({ session }: { session: UserSession }) {
  return (
    <div className="relative overflow-hidden p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4">
      <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="size-12 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <DeviceIcon name={session.deviceName} />
      </div>

      <div className="flex-1 z-10 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-foreground truncate">{session.deviceName}</h4>
          <SessionInfoPopover session={session}>
            <InfoButton tone="primary" />
          </SessionInfoPopover>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-xs text-muted-foreground">{session.ip}</span>
          <span className="size-1 rounded-full bg-primary shrink-0" />
          <span className="text-primary font-medium text-xs">В сети</span>
        </div>
      </div>

      <div className="z-10 ml-2 flex items-center gap-1">
        <QrScannerButton variant="compact-responsive" />
        <LogoutConfirmDialog>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Выйти"
            title="Выйти"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:gap-2"
          >
            <span className="hidden sm:inline">Выйти</span>
            <LogOut className="size-4" />
          </Button>
        </LogoutConfirmDialog>
      </div>
    </div>
  );
});

interface SessionItemProps {
  session: UserSession;
  isLoading: boolean;
  isDisabled: boolean;
  onRevoke: (id: string) => void;
}

const SessionItem = memo(function SessionItem({ session, isLoading, isDisabled, onRevoke }: SessionItemProps) {
  const handleRevoke = useCallback(() => onRevoke(session.id), [session.id, onRevoke]);
  const lastActiveISO = useMemo(() => new Date(session.lastActive).toISOString(), [session.lastActive]);
  const lastActiveTitle = useMemo(() => new Date(session.lastActive).toLocaleString("ru-RU"), [session.lastActive]);

  return (
    <div className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card transition-all hover:border-border/80">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="size-10 shrink-0 rounded-xl bg-muted/20 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
          <DeviceIcon name={session.deviceName} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground text-sm truncate">{session.deviceName}</h4>
            <SessionInfoPopover session={session}>
              <InfoButton />
            </SessionInfoPopover>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{session.ip}</span>
            <span className="text-muted-foreground/30">•</span>
            <time dateTime={lastActiveISO} title={lastActiveTitle}>
              {formatRelativeTime(session.lastActive)}
            </time>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRevoke}
        disabled={isDisabled}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-9 rounded-lg shrink-0 ml-2"
        aria-label="Завершить сессию"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : <LogOut />}
      </Button>
    </div>
  );
});

export function SessionsList({ sessions, activeActionId, onRevokeSession, onRevokeAllOthers }: Props) {
  const { currentSession, otherSessions } = useMemo(
    () => ({
      currentSession: sessions.find((s) => s.isCurrent),
      otherSessions: sessions.filter((s) => !s.isCurrent),
    }),
    [sessions],
  );

  const isRevokingAll = activeActionId === "all";

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h4 className="section-label">Текущая сессия</h4>
        {currentSession && <CurrentSessionCard session={currentSession} />}
      </div>

      {otherSessions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-label">Другие сессии</h3>
            <RevokeAllConfirmDialog onConfirm={onRevokeAllOthers}>
              <Button
                variant="outline"
                size="sm"
                disabled={isRevokingAll}
                className="h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 bg-transparent"
              >
                {isRevokingAll && <Loader2 className="mr-2 animate-spin" />}
                Завершить все ({otherSessions.length})
              </Button>
            </RevokeAllConfirmDialog>
          </div>

          <div className="flex flex-col gap-3">
            {otherSessions.map((session) => {
              const isThis = activeActionId === `sess_${session.id}`;
              return (
                <SessionItem
                  key={session.id}
                  session={session}
                  isLoading={isThis}
                  isDisabled={isThis || isRevokingAll}
                  onRevoke={onRevokeSession}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
