"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { User as UserIcon, ShieldCheck, MonitorSmartphone, Settings2, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface TabDef {
  name: string;
  path: string;
  icon: LucideIcon;
}

const TABS: readonly TabDef[] = [
  { name: "Данные", path: "/profile/details", icon: UserIcon },
  { name: "Безопасность", path: "/profile/security", icon: ShieldCheck },
  { name: "Сессии", path: "/profile/sessions", icon: MonitorSmartphone },
  { name: "Настройки", path: "/profile/settings", icon: Settings2 },
];

interface TabProps {
  href: string;
  name: string;
  icon: LucideIcon;
  isActive: boolean;
}

const Tab = memo(function Tab({ href, name, icon: Icon, isActive }: TabProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium rounded-lg transition-all duration-200",
        isActive ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:bg-card hover:text-foreground",
      )}
    >
      <Icon className={cn("size-5 mb-0.5", isActive && "text-primary")} />
      {name}
    </Link>
  );
});

const withFrom = (path: string, from: string | null) => (from ? `${path}?from=${from}` : path);

export function MobileNav() {
  const pathname = usePathname();
  const from = useSearchParams().get("from");

  const items = useMemo(
    () =>
      TABS.map((tab) => ({
        name: tab.name,
        href: withFrom(tab.path, from),
        icon: tab.icon,
        isActive: !!pathname?.startsWith(tab.path),
      })),
    [from, pathname],
  );

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      {items.map((item) => (
        <Tab key={item.href} {...item} />
      ))}
    </div>
  );
}
