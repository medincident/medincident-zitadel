import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AlertTriangle, MonitorSmartphone, Clock, AppWindow, KeyRound } from "lucide-react";
import { AppLogoIcon } from "@/app/_components/icons";
import { getOptionalSession } from "@/services/zitadel/session";
import { getSession, getDeviceAuthorization } from "@/services/zitadel/api";
import { unsealDeviceHint } from "@/services/zitadel/device-context";
import { rateLimit } from "@/shared/lib/rate-limit";
import { formatRelativeTime } from "@/shared/lib/relative-time";
import { DeviceApprovalForm } from "./_components/device-approval-form";

interface Props {
  searchParams: Promise<{ user_code?: string; state?: string; hint?: string }>;
}

const USER_CODE_RE = /^[A-Z0-9-]{4,16}$/;

export default async function DevicePage({ searchParams }: Props) {
  const { user_code, hint } = await searchParams;

  if (!user_code || !USER_CODE_RE.test(user_code)) {
    redirect("/login?error=device_invalid");
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  const rl = rateLimit(`device-lookup:${ip}`, 30, 60_000);
  if (!rl.ok) {
    redirect("/login?error=rate_limited");
  }

  const session = await getOptionalSession();
  if (!session) {
    const callbackUrl =
      `/device?user_code=${encodeURIComponent(user_code)}` +
      (hint ? `&hint=${encodeURIComponent(hint)}` : "");
    redirect(`/api/auth/signin/zitadel?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const deviceAuthRes = await getDeviceAuthorization(user_code);
  if (!deviceAuthRes.success || !deviceAuthRes.data?.deviceAuthorizationRequest) {
    redirect("/login?error=device_expired");
  }

  const deviceAuthRequest = deviceAuthRes.data.deviceAuthorizationRequest!;
  const appName = deviceAuthRequest.appName || "Приложение";
  const scopes: string[] = Array.isArray(deviceAuthRequest.scope)
    ? deviceAuthRequest.scope
    : [];

  const sessionRes = await getSession(session.currentSessionId);
  const factors = sessionRes.success ? sessionRes.data?.session?.factors : undefined;
  const displayName =
    factors?.user?.displayName || factors?.user?.loginName || "Пользователь";

  const deviceHint = hint ? await unsealDeviceHint(hint) : null;
  const codeShort = user_code.slice(-4);

  return (
    <main className="h-dvh overflow-y-auto overflow-x-hidden flex flex-col items-center px-4 pt-8 pb-8 sm:pt-16 md:pt-24 bg-background font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <div className="size-14 sm:size-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-primary border border-primary/20">
            <AppLogoIcon className="size-7 sm:size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Вход с другого устройства
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Подтвердите доступ для нового устройства
          </p>
        </div>

        <div className="flex flex-col items-center mb-6">
          <p className="text-2xs uppercase tracking-wider text-muted-foreground mb-1">
            Код подтверждения
          </p>
          <p className="text-4xl sm:text-5xl font-mono font-bold tracking-[0.3em] text-foreground">
            {codeShort}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col gap-3 mb-4">
          <InfoRow icon={<AppWindow className="size-4" />} label="Приложение" value={appName} />
          {deviceHint?.browser && (
            <InfoRow
              icon={<MonitorSmartphone className="size-4" />}
              label="Устройство"
              value={deviceHint.browser}
            />
          )}
          {deviceHint?.createdAt && (
            <InfoRow
              icon={<Clock className="size-4" />}
              label="Инициировано"
              value={formatRelativeTime(new Date(deviceHint.createdAt))}
            />
          )}
          {scopes.length > 0 && (
            <InfoRow
              icon={<KeyRound className="size-4" />}
              label="Запрашивает"
              value={formatScopes(scopes)}
            />
          )}
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/5 p-3 sm:p-4 text-xs text-warning leading-relaxed mb-6">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <p>
            Не подтверждайте вход по просьбе незнакомых людей. Сверьте код выше с
            тем, что показан на устройстве, в которое вы хотите войти.
          </p>
        </div>

        <DeviceApprovalForm userCode={user_code} hint={hint} displayName={displayName} />
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

const SCOPE_LABELS: Record<string, string> = {
  openid: "идентификация",
  profile: "профиль",
  email: "email",
  offline_access: "автономный доступ",
};

function formatScopes(scopes: string[]): string {
  const mapped = scopes
    .map((s) => SCOPE_LABELS[s] ?? s)
    .filter((s, i, a) => a.indexOf(s) === i);
  return mapped.join(", ");
}
