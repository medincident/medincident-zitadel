"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createSessionWithPassword, searchUserByEmail, searchUserByLoginName, resendEmailVerification, listAuthMethods, hasTotpMethod } from "@/services/zitadel/api";
import { setRegFlowCookie, setTotpPendingCookie } from "../_lib/reg-flow";
import { finishAuth } from "../callback/success/actions";

export interface EmailLoginState {
  errors?: { email?: string; password?: string; form?: string };
  values?: { email?: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[\p{L}0-9._-]{1,64}$/u;

export async function loginWithEmailAction(
  requestId: string | undefined,
  prevState: EmailLoginState,
  formData: FormData
): Promise<EmailLoginState> {
  const identifier = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  const isEmail = !!identifier && EMAIL_RE.test(identifier);
  const isUsername = !!identifier && !isEmail && USERNAME_RE.test(identifier);

  const errors: EmailLoginState["errors"] = {};

  if (!identifier || (!isEmail && !isUsername)) {
    errors.email = "Введите email или имя пользователя";
  }
  if (!password) {
    errors.password = "Введите пароль";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values: { email: identifier } };
  }

  // Резолвим до preferredLoginName, который ожидает Zitadel /v2/sessions:
  //  - email    → searchUserByEmail
  //  - username → searchUserByLoginName
  const lookup = isEmail
    ? await searchUserByEmail(identifier)
    : await searchUserByLoginName(identifier);
  const user = lookup.success ? lookup.data?.result?.[0] : undefined;
  const loginName = user?.preferredLoginName ?? identifier;

  const sessionRes = await createSessionWithPassword(loginName, password);

  if (!sessionRes.success || !sessionRes.data?.sessionId || !sessionRes.data?.sessionToken) {
    const errCode = (sessionRes as any).error?.code;
    const message =
      errCode === 4 || errCode === 5
        ? "Неверный email/имя пользователя или пароль"
        : "Ошибка входа. Проверьте данные и попробуйте снова.";
    return { errors: { form: message }, values: { email: identifier } };
  }

  const { sessionId, sessionToken } = sessionRes.data;
  const userEmail = user?.human?.email?.email ?? (isEmail ? identifier : "");

  try {
    // Проверяем, подтверждён ли email пользователя (user уже получен выше).
    const isVerified = user?.human?.email?.isVerified ?? true;

    if (!isVerified && user?.userId) {
      // Email не подтверждён — отправляем код и показываем экран верификации
      await resendEmailVerification(user.userId);
      await setRegFlowCookie({
        givenName: user.human?.profile?.givenName ?? "",
        familyName: user.human?.profile?.familyName ?? "",
        email: userEmail,
        source: "login",
        requestId,
        userId: user.userId,
        loginName,
        sessionId,
        sessionToken,
      });
      const params = new URLSearchParams();
      if (requestId) params.set("requestId", requestId);
      redirect(`/login/email/verify?${params}`);
    }

    // Если у юзера включён TOTP — запрашиваем код перед завершением входа
    if (user?.userId) {
      const methods = await listAuthMethods(user.userId);
      if (methods.success && hasTotpMethod(methods.data.authMethodTypes)) {
        await setTotpPendingCookie({
          sessionId,
          sessionToken,
          userId: user.userId,
          loginName,
          requestId,
        });
        const params = new URLSearchParams();
        if (requestId) params.set("requestId", requestId);
        redirect(`/login/totp?${params}`);
      }
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    // Если проверка не удалась — продолжаем без неё (не блокируем вход)
  }

  await finishAuth(sessionRes.data, requestId, loginName);
  // finishAuth вызывает redirect() — до этой строки не доходим
  return { errors: {}, values: { email: identifier } };
}
