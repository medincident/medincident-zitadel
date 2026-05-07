"use client";

import { memo, useCallback } from "react";
import { Button } from "@/shared/ui/button";
import { TelegramLogoIcon, MaxLogoIcon } from "@/app/_components/icons";
import { Loader2, Link2, Unlink, KeyRound } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface LinkedAccountItemProps {
  id: string;
  name: string;
  isConnected: boolean;
  isLoading: boolean;
  canUnlink: boolean;
}

interface Props {
  items: LinkedAccountItemProps[];
  onToggle: (id: string) => void;
}

interface ProviderConfig {
  label: string;
  icon: React.FC<{ className?: string }>;
  activeClass: string;
  iconSize: string;
}

const PROVIDERS: ReadonlyArray<{ match: string; config: ProviderConfig }> = [
  {
    match: "telegram",
    config: { label: "Telegram", icon: TelegramLogoIcon, activeClass: "bg-[image:var(--telegram-gradient)]", iconSize: "size-6" },
  },
  {
    match: "max",
    config: { label: "MAX ID", icon: MaxLogoIcon, activeClass: "bg-[image:var(--max-gradient)]", iconSize: "size-7" },
  },
];

function resolveProvider(name: string): ProviderConfig {
  const lower = name.toLowerCase();
  const match = PROVIDERS.find((p) => lower.includes(p.match));
  return match?.config ?? { label: name, icon: KeyRound, activeClass: "bg-primary", iconSize: "size-6" };
}

interface ItemProps extends LinkedAccountItemProps {
  onToggle: (id: string) => void;
}

const LinkedAccountItem = memo(function LinkedAccountItem({
  id,
  name,
  isConnected,
  isLoading,
  canUnlink,
  onToggle,
}: ItemProps) {
  const { label, icon: Icon, activeClass, iconSize } = resolveProvider(name);
  const showButton = !isConnected || canUnlink;

  const handleClick = useCallback(() => onToggle(id), [id, onToggle]);

  return (
    <div className="flex-1 min-w-[300px] p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-4 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "size-10 shrink-0 rounded-xl flex items-center justify-center transition-all",
            isConnected ? cn("text-primary-foreground", activeClass) : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className={iconSize} />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{label}</span>
          <div className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", isConnected ? "bg-primary" : "bg-muted-foreground/30")} />
            <span className={cn("text-xs font-medium", isConnected ? "text-primary" : "text-muted-foreground")}>
              {isConnected ? "Подключен" : "Не подключен"}
            </span>
          </div>
        </div>
      </div>

      {showButton && (
        <Button
          size="sm"
          variant={isConnected ? "outline" : "default"}
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            "h-8 px-3 font-medium",
            isConnected
              ? "border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 bg-transparent"
              : cn("text-primary-foreground border-0 hover:opacity-90", activeClass),
          )}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : isConnected ? (
            <>
              <Unlink className="mr-2" />
              Отвязать
            </>
          ) : (
            <>
              <Link2 className="mr-2" />
              Привязать
            </>
          )}
        </Button>
      )}
    </div>
  );
});

export function LinkedAccountsCard({ items, onToggle }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="section-label">Социальные сети и сервисы</h3>

      <div className="flex flex-wrap gap-4">
        {items.map((item) => (
          <LinkedAccountItem key={item.id} {...item} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}
