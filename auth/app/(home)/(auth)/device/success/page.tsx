import Link from "next/link";
import { CheckCircle2, MonitorSmartphone, Clock, AppWindow } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface Props {
  searchParams: Promise<{ app?: string; deviceUa?: string }>;
}

export default async function DeviceSuccessPage({ searchParams }: Props) {
  const { app, deviceUa } = await searchParams;
  const appName = app || "приложение";

  const timeLabel = new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="h-dvh overflow-y-auto overflow-x-hidden flex flex-col items-center px-4 pt-8 pb-8 sm:pt-16 md:pt-24 bg-background font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="size-14 sm:size-16 bg-success/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-success border border-success/20">
            <CheckCircle2 className="size-7 sm:size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Вход подтверждён
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Доступ для нового устройства разрешён
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col gap-3 mb-6">
          <InfoRow
            icon={<AppWindow className="size-4" />}
            label="Приложение"
            value={appName}
          />
          {deviceUa && (
            <InfoRow
              icon={<MonitorSmartphone className="size-4" />}
              label="Устройство"
              value={deviceUa}
            />
          )}
          <InfoRow icon={<Clock className="size-4" />} label="Время" value={timeLabel} />
        </div>

        <div className="flex flex-col gap-3 items-center">
          <Button asChild size="md" className="w-full max-w-[280px]">
            <Link href="/profile">Вернуться в профиль</Link>
          </Button>
          <Button asChild variant="ghost" size="md" className="w-full max-w-[280px]">
            <Link href="/profile/sessions">Это были не вы? Управление сессиями</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-2xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-sm text-foreground break-all">{value}</span>
      </div>
    </div>
  );
}
