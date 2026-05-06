import { redirect } from "next/navigation";
import { AppLogoIcon } from "@/app/_components/icons";
import { getOptionalSession } from "@/services/zitadel/session";
import { getSession, getDeviceAuthorization } from "@/services/zitadel/api";
import { unsealDeviceHint } from "@/services/zitadel/device-context";
import { DeviceApprovalForm } from "./_components/device-approval-form";

interface Props {
  searchParams: Promise<{ user_code?: string; state?: string; hint?: string }>;
}

// Код вида 4–8 латинских букв/цифр; отсекаем мусор.
const USER_CODE_RE = /^[A-Z0-9-]{4,16}$/;

export default async function DevicePage({ searchParams }: Props) {
  const { user_code, hint } = await searchParams;

  if (!user_code || !USER_CODE_RE.test(user_code)) {
    redirect("/login?error=device_invalid");
  }

  // Device B должен быть залогинен. Если нет — запускаем штатный OIDC flow
  // через NextAuth с callbackUrl=/device?..., чтобы Zitadel вернул юзера
  // на кастомную /login?authRequest=... (как настроено в консоли), а после
  // успешного логина NextAuth привёл его обратно на /device.
  const session = await getOptionalSession();
  if (!session) {
    const callbackUrl =
      `/device?user_code=${encodeURIComponent(user_code)}` +
      (hint ? `&hint=${encodeURIComponent(hint)}` : "");
    redirect(`/api/auth/signin/zitadel?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // Метадата запроса из Zitadel: appName, scope, clientId.
  const deviceAuthRes = await getDeviceAuthorization(user_code);
  if (!deviceAuthRes.success || !deviceAuthRes.data?.deviceAuthorizationRequest) {
    redirect("/login?error=device_expired");
  }

  const deviceAuthRequest = deviceAuthRes.data.deviceAuthorizationRequest!;
  const appName = deviceAuthRequest.appName || "Приложение";
  const scopes: string[] = Array.isArray(deviceAuthRequest.scope)
    ? deviceAuthRequest.scope
    : [];

  // Информация о текущем юзере.
  const sessionRes = await getSession(session.currentSessionId);
  const factors = sessionRes.success ? sessionRes.data?.session?.factors : undefined;
  const displayName =
    factors?.user?.displayName || factors?.user?.loginName || "Пользователь";

  // Расшифровываем hint — browser Device A (если был передан).
  const deviceHint = hint ? await unsealDeviceHint(hint) : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        <AppLogoIcon className="h-10 w-10" />

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Вход с другого устройства
          </h1>
          <p className="text-sm text-muted-foreground">
            Подтвердите доступ для нового устройства
          </p>
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <InfoRow label="Приложение" value={appName} />
          {deviceHint?.browser && (
            <InfoRow label="Устройство" value={deviceHint.browser} />
          )}
          {scopes.length > 0 && (
            <InfoRow label="Запрашивает" value={formatScopes(scopes)} />
          )}
          <InfoRow label="Код" value={user_code} mono />
        </div>

        <DeviceApprovalForm userCode={user_code} displayName={displayName} />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-4">
      <span className="text-2xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={
          "text-sm text-foreground text-right break-all" +
          (mono ? " font-mono tracking-wider" : "")
        }
      >
        {value}
      </span>
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
