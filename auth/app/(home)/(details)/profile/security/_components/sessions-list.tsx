import { UserSession } from "@/domain/profile/types";
import { Button } from "@/shared/ui/button";
import {
  Laptop,
  Smartphone,
  LogOut,
  Loader2,
  Info,
  Globe,
  Clock,
  Monitor,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { formatRelativeTime } from "@/shared/lib/relative-time";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/ui/popover";
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

function SessionInfoPopover({
  session,
  children
}: {
  session: UserSession;
  children: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-90 p-3 space-y-2"
      >
        {/* User Agent */}
        <div className="rounded-lg section-surface py-1.5 px-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-3xs text-muted-foreground uppercase tracking-wider font-medium">User Agent</span>
            </div>
            <CopyButton text={session.userAgent} />
          </div>
          <p className="text-2xs font-mono text-muted-foreground leading-relaxed break-all select-all">{session.userAgent}</p>
        </div>

        {/* IP и Активность */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2.5 rounded-lg section-surface">
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-3xs text-muted-foreground uppercase tracking-wider font-medium">IP</p>
              <p className="text-xs font-mono text-foreground truncate">{session.ip}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg section-surface">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-3xs text-muted-foreground uppercase tracking-wider font-medium">Активность</p>
              <p className="text-xs text-foreground truncate">
                {new Date(session.lastActive).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RevokeAllConfirmDialog({ children, onConfirm }: { children: React.ReactNode; onConfirm: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
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

const DeviceIcon = ({ name, className }: { name: string; className?: string }) => {
  const isMobile = name.toLowerCase().includes("iphone") || name.toLowerCase().includes("android");
  const Icon = isMobile ? Smartphone : Laptop;
  return <Icon className={cn("w-5 h-5", className)} />;
};

function SessionItem({
  session,
  activeActionId,
  onRevoke,
}: {
  session: UserSession,
  activeActionId: string | null,
  onRevoke: (id: string) => void,
}) {
  const isRevokingThis = activeActionId === `sess_${session.id}`;
  const isRevokingAll = activeActionId === "all";
  const isLoading = isRevokingThis;
  const isDisabled = isRevokingThis || isRevokingAll;

  return (
    <div className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card transition-all hover:border-border/80">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-muted/20 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
          <DeviceIcon name={session.deviceName} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground text-sm truncate">
              {session.deviceName}
            </h4>
            <SessionInfoPopover session={session}>
              <button
                className="text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer outline-none focus-visible:text-primary p-0.5 rounded-sm shrink-0"
                title="Показать технические данные"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </SessionInfoPopover>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{session.ip}</span>
            <span className="text-muted-foreground/30">•</span>
            <time
              dateTime={new Date(session.lastActive).toISOString()}
              title={new Date(session.lastActive).toLocaleString("ru-RU")}
            >
              {formatRelativeTime(session.lastActive)}
            </time>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRevoke(session.id)}
        disabled={isDisabled}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-lg shrink-0 ml-2"
        aria-label="Завершить сессию"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <LogOut />
        )}
      </Button>
    </div>
  );
}

export function SessionsList({
  sessions,
  activeActionId,
  onRevokeSession,
  onRevokeAllOthers,
}: Props) {
  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const isRevokingAll = activeActionId === "all";

  return (
    <div className="space-y-8">
      {/* 1. Текущая сессия */}
      <div className="space-y-3">
        <h4 className="section-label">
          Текущая сессия
        </h4>
        {currentSession && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <DeviceIcon name={currentSession.deviceName} />
            </div>

            <div className="flex-1 z-10 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground truncate">
                  {currentSession.deviceName}
                </h4>
                <SessionInfoPopover session={currentSession}>
                  <button
                    className="text-primary/40 hover:text-primary transition-colors cursor-pointer outline-none p-0.5 rounded-sm shrink-0"
                    title="Показать технические данные"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </SessionInfoPopover>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-muted-foreground">{currentSession.ip}</span>
                <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
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
        )}
      </div>

      {/* 2. Другие сессии */}
      {otherSessions.length > 0 && (
         <div className="space-y-4">
           <div className="flex items-center justify-between">
            <h3 className="section-label">
              Другие сессии
            </h3>
            <RevokeAllConfirmDialog onConfirm={onRevokeAllOthers}>
              <Button
                variant="outline"
                size="sm"
                disabled={isRevokingAll}
                className="h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 bg-transparent"
              >
                {isRevokingAll && (
                  <Loader2 className="mr-2 animate-spin" />
                )}
                Завершить все ({otherSessions.length})
              </Button>
            </RevokeAllConfirmDialog>
          </div>

          <div className="flex flex-col gap-3">
            {otherSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                activeActionId={activeActionId}
                onRevoke={onRevokeSession}
              />
            ))}
          </div>
         </div>
      )}
    </div>
  );
}
