"use server";

import { updateSession, getSession } from "@/services/zitadel/api";
import { getTotpPendingCookie, deleteTotpPendingCookie } from "../_lib/reg-flow";
import { finishAuth } from "../callback/success/actions";

export interface TotpState {
  errors?: { code?: string; form?: string; expired?: boolean };
}

export async function verifyTotpLoginAction(
  prevState: TotpState,
  formData: FormData
): Promise<TotpState> {
  const code = (formData.get("code") as string)?.trim();

  if (!code || !/^\d{6}$/.test(code)) {
    return { errors: { code: "Введите 6-значный код из приложения" } };
  }

  const pending = await getTotpPendingCookie();
  if (!pending) {
    return { errors: { form: "Сессия входа истекла. Войдите заново.", expired: true } };
  }

  const { sessionId, sessionToken, loginName, requestId, userId } = pending;

  // По документации sessionToken устарел и игнорируется, но передаём для совместимости
  const res = await updateSession(sessionId, sessionToken, { totp: { code } });
  if (!res.success) {
    return { errors: { code: "Неверный код. Попробуйте снова." } };
  }

  // SetSession возвращает новый sessionToken — предыдущий инвалидирован
  const newToken = res.data?.sessionToken || sessionToken;

  // Получаем полные данные сессии (creation/expiration/factors) для finishAuth cookie
  const sessionRes = await getSession(sessionId);
  const session = sessionRes.success ? sessionRes.data?.session : undefined;

  await deleteTotpPendingCookie();

  await finishAuth(
    { sessionId, sessionToken: newToken, session },
    requestId,
    loginName,
    userId,
  );

  return { errors: {} };
}

export async function cancelTotpLoginAction() {
  await deleteTotpPendingCookie();
}
