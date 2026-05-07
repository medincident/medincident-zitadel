"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShieldCheckIcon,
  LogOutIcon,
  ArrowLeft,
  MonitorSmartphone,
  Settings2,
  Settings,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { QrScannerButton } from "../qr-scanner-button";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { SidebarUserCard } from "./sidebar-user-card";
import { LogoutConfirmDialog } from "../logout-confirm-dialog";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
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
      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground/70")} />
      {label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const withFrom = (path: string) => (from ? `${path}?from=${from}` : path);

  const items: Array<Omit<NavItemProps, "isActive"> & { match: string }> = [
    { href: withFrom("/profile/security"), icon: ShieldCheckIcon, label: "Безопасность", match: "/profile/security" },
    { href: withFrom("/profile/sessions"), icon: MonitorSmartphone, label: "Сессии", match: "/profile/sessions" },
    { href: withFrom("/profile/settings"), icon: Settings2, label: "Настройки", match: "/profile/settings" },
  ];

  const isDetailsActive = !!pathname?.startsWith("/profile/details");

  return (
    <nav className="flex flex-col gap-2 h-full">
      <Link href={withFrom("/profile/details")} className="block group">
        <SidebarUserCard isActive={isDetailsActive} />
      </Link>

      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={!!pathname?.startsWith(item.match)}
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
              <ArrowLeft className="h-5 w-5" />
              Вернуться
            </Link>
          </Button>
        )}

        <QrScannerButton />

        <Button
          variant="ghost"
          asChild
          className="group w-full justify-start gap-3 px-3 py-3 h-auto text-muted-foreground rounded-xl font-medium hover:bg-muted hover:text-primary"
        >
          <a href="/ui/console" target="_blank" rel="noopener noreferrer">
            <Settings className="h-5 w-5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
            <span className="flex-1 text-left">Админизация</span>
            <ExternalLink className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </a>
        </Button>

        <LogoutConfirmDialog>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-3 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl font-medium"
          >
            <LogOutIcon className="h-5 w-5" />
            Выйти
          </Button>
        </LogoutConfirmDialog>
      </div>
    </nav>
  );
}
