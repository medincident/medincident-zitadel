"use server";

import { redirect } from "next/navigation";
import {
  getUserById,
  requestPasswordReset,
  searchUserByEmail,
  setHumanEmailVerified,
  setPasswordWithCode,
} from "@/services/zitadel/api";
import {
  deletePasswordResetCookie,
  getPasswordResetCookie,
  setPasswordResetCookie,
} from "../_lib/reg-flow";
import { testPasswordValid } from "@/domain/auth/password-policy";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Zitadel password_reset code = 6 alphanumeric uppercase chars (например `X5GAL0`).
// CodeInput на клиенте сам приводит к верхнему регистру, но на всякий случай — i.
const CODE_RE = /^[A-Z0-9]{6}$/i;

export interface ForgotPasswordRequestState {
  errors?: { email?: string; form?: string };
  values?: { email?: string };
  sent?: boolean;
}

export async function requestResetAction(
  requestId: string | undefined,
  _prev: ForgotPasswordRequestState,
  formData: FormData
): Promise<ForgotPasswordRequestState> {
  const email = (formData.get("email") as string)?.trim() ?? "";

  if (!email || !EMAIL_RE.test(email)) {
    return { errors: { email: "Введите корректный email адрес" }, values: { email } };
  }

  // Шаг 1: ищем юзера. Если не нашли — ВСЁ РАВНО возвращаем sent=true,
  // чтобы не раскрывать существование email.
  const lookup = await searchUserByEmail(email);
  const user = lookup.success ? lookup.data?.result?.[0] : undefined;

  if (user?.userId) {
    // Шаг 2: триггерим Zitadel password_reset. Он сам выслет код на email.
    const reset = await requestPasswordReset(user.userId);
    if (reset.success) {
      await setPasswordResetCookie({ userId: user.userId, requestId });
      const params = new URLSearchParams();
      if (requestId) params.set("requestId", requestId);
      redirect(`/login/forgot-password/verify?${params}`);
    }
    // Если reset не удался — логируем, но юзеру отдаём общий success, чтобы
    // не светить детали Zitadel.
    console.error("[forgot-password] requestPasswordReset failed for userId=%s", user.userId);
  }

  // Юзер не найден или reset не сработал — единообразный ответ.
  return { sent: true, values: { email } };
}

export interface ResetPasswordState {
  errors?: { code?: string; password?: string; confirm?: string; form?: string };
}

export async function submitResetAction(
  requestId: string | undefined,
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const code = (formData.get("code") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";
  const confirm = (formData.get("confirm") as string) ?? "";

  const errors: ResetPasswordState["errors"] = {};

  if (!CODE_RE.test(code)) {
    errors.code = "Введите код из письма (6 символов)";
  }
  const passwordValidation = testPasswordValid(password);
  if (!passwordValidation.ok) {
    errors.password = passwordValidation.error;
  }
  if (password !== confirm) {
    errors.confirm = "Пароли не совпадают";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const flow = await getPasswordResetCookie();
  if (!flow?.userId) {
    return { errors: { form: "Сессия сброса пароля устарела. Запросите код заново." } };
  }

  const res = await setPasswordWithCode(flow.userId, code, password);
  if (!res.success) {
    const errCode = (res as any).error?.code;
    // Zitadel возвращает 3 (INVALID_ARGUMENT) на неверный код, 9 (FAILED_PRECONDITION)
    // если код истёк, COMMA-* для несоответствия политике.
    const raw: string = (res as any).error?.message ?? "";
    if (raw.includes("COMMA-")) {
      return { errors: { password: "Пароль не соответствует политике безопасности" } };
    }
    if (errCode === 3 || errCode === 9) {
      return { errors: { code: "Код неверный или истёк. Запросите новый." } };
    }
    return { errors: { form: "Не удалось сменить пароль. Попробуйте снова." } };
  }

  const userRes = await getUserById(flow.userId);
  const email = userRes.success
    ? userRes.data?.user?.human?.email?.email
    : undefined;
  if (email) {
    const verifyRes = await setHumanEmailVerified(flow.userId, email);
    if (!verifyRes.success) {
      console.error(
        "[forgot-password] setHumanEmailVerified failed: userId=%s",
        flow.userId,
      );
    }
  }

  await deletePasswordResetCookie();
  const params = new URLSearchParams();
  if (requestId) params.set("requestId", requestId);
  params.set("reset", "ok");
  redirect(`/login/email?${params}`);
}
