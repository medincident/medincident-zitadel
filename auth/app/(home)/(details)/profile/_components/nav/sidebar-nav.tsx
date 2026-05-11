"use client";

import { memo, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShieldCheckIcon,
  LogOutIcon,
  ArrowLeft,
  MonitorSmartphone,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { QrScannerButton } from "../qr-scanner-button";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { SidebarUserCard } from "./sidebar-user-card";
import { LogoutConfirmDialog } from "../logout-confirm-dialog";

interface NavEntry {
  path: string;
  icon: LucideIcon;
  label: string;
}

const NAV_ENTRIES: readonly NavEntry[] = [
  { path: "/profile/security", icon: ShieldCheckIcon, label: "Безопасность" },
  { path: "/profile/sessions", icon: MonitorSmartphone, label: "Сессии" },
  { path: "/profile/settings", icon: Settings2, label: "Настройки" },
];

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}

const NavItem = memo(function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground/70")} />
      {label}
    </Link>
  );
});

const withFrom = (path: string, from: string | null) => (from ? `${path}?from=${from}` : path);

export function SidebarNav({ adminSlot }: { adminSlot?: ReactNode }) {
  const pathname = usePathname();
  const from = useSearchParams().get("from");

  const detailsHref = withFrom("/profile/details", from);
  const isDetailsActive = !!pathname?.startsWith("/profile/details");

  const items = useMemo(
    () =>
      NAV_ENTRIES.map((entry) => ({
        href: withFrom(entry.path, from),
        icon: entry.icon,
        label: entry.label,
        isActive: !!pathname?.startsWith(entry.path),
      })),
    [from, pathname],
  );

  return (
    <nav className="flex flex-col gap-2 h-full">
      <Link href={detailsHref} className="block group">
        <SidebarUserCard isActive={isDetailsActive} />
      </Link>

      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={item.isActive}
          />
        ))}

        <div className="px-2 my-1">
          <Separator />
        </div>

        {from && (
          <Button
            variant="ghost"
            asChild
            className="w-full justify-start gap-3 px-3 py-3 h-auto text-muted-foreground rounded-xl font-medium hover:bg-muted hover:text-primary"
          >
            <Link href={from}>
              <ArrowLeft className="size-5" />
              Вернуться
            </Link>
          </Button>
        )}

        <QrScannerButton />

        {adminSlot}

        <LogoutConfirmDialog>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-3 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-medium"
          >
            <LogOutIcon className="size-5" />
            Выйти
          </Button>
        </LogoutConfirmDialog>
      </div>
    </nav>
  );
}
