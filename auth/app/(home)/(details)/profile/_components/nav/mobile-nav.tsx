"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { User as UserIcon, ShieldCheck, MonitorSmartphone, Settings2, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface Tab {
  name: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string | null) => boolean;
}

const TABS: Tab[] = [
  { name: "Данные", href: "/profile/details", icon: UserIcon, match: (p) => p === "/profile/details" },
  { name: "Безопасность", href: "/profile/security", icon: ShieldCheck, match: (p) => !!p?.startsWith("/profile/security") },
  { name: "Сессии", href: "/profile/sessions", icon: MonitorSmartphone, match: (p) => !!p?.startsWith("/profile/sessions") },
  { name: "Настройки", href: "/profile/settings", icon: Settings2, match: (p) => !!p?.startsWith("/profile/settings") },
];

export function MobileNav() {
  const pathname = usePathname();
  const from = useSearchParams().get("from");

  return (
    <div className="flex items-center justify-between gap-4 w-full">
      {TABS.map(({ name, href, icon: Icon, match }) => {
        const isActive = match(pathname);
        return (
          <Link
            key={href}
            href={from ? `${href}?from=${from}` : href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:bg-card hover:text-foreground",
            )}
          >
            <Icon className={cn("size-5 mb-0.5", isActive && "text-primary")} />
            {name}
          </Link>
        );
      })}
    </div>
  );
}
