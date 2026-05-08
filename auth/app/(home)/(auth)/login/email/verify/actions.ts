"use server";

import { verifyUserEmail, createSession, createSessionWithPassword, searchUserSessions } from "@/services/zitadel/api";
import { getRegFlowCookie, deleteRegFlowCookie } from "../../_lib/reg-flow";
import { getUserIdFromNextAuth } from "@/services/zitadel/session";
import { getSessionCookieById, getAllSessionCookieIds } from "@/services/zitadel/cookies";
import { finishAuth } from "../../callback/success/actions";

export interface VerifyState {
  errors?: { code?: string; form?: string; expired?: boolean };
}

export async function verifyEmailAction(
  prevState: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const code = (formData.get("code") as string)?.trim();

  if (!code) {
    return { errors: { code: "Введите код подтверждения" } };
  }

  const flow = await getRegFlowCookie();

  // Получаем userId: из куки регистрации или из NextAuth
  let userId: string;
  if (flow?.userId) {
    userId = flow.userId;
  } else {
    const uid = await getUserIdFromNextAuth();
    if (!uid) return { errors: { form: "Сессия устарела. Войдите заново." } };
    userId = uid;
  }

  // Верифицируем email
  const verifyRes = await verifyUserEmail(userId, code);
  if (!verifyRes.success) {
    return { errors: { code: "Неверный или просроченный код. Запросите новый." } };
  }

  // Получаем данные сессии для finishAuth
  let sessionData: { sessionId: string; sessionToken: string };
  let requestId: string | undefined;
  let loginName: string | undefined;

  if (flow) {
    if (flow.source === "login" && flow.sessionId && flow.sessionToken) {
      sessionData = { sessionId: flow.sessionId, sessionToken: flow.sessionToken };
    } else if (flow.source === "idp" && flow.intentId && flow.intentToken) {
      const sessionRes = await createSession(flow.userId!, flow.intentId, flow.intentToken);
      if (!sessionRes.success) {
        const msg = (sessionRes as any).error?.message ?? "";
        if (msg.includes("Intent.Expired") || msg.includes("Intent.NotSucceeded")) {
          await deleteRegFlowCookie();
          return { errors: { form: "Сессия Telegram истекла — войдите через Telegram заново.", expired: true } };
        }
        return { errors: { form: "Не удалось создать сессию: " + JSON.stringify((sessionRes as any).error) } };
      }
      if (!sessionRes.data?.sessionId || !sessionRes.data?.sessionToken) {
        return { errors: { form: "Не удалось создать сессию: пустой ответ сервера." } };
      }
      sessionData = sessionRes.data;
    } else if (flow.source === "email" && flow.password) {
      const sessionRes = await createSessionWithPassword(flow.loginName!, flow.password);
      if (!sessionRes.success || !sessionRes.data?.sessionId || !sessionRes.data?.sessionToken) {
        return { errors: { form: "Не удалось создать сессию: " + JSON.stringify((sessionRes as any).error) } };
      }
      sessionData = sessionRes.data;
    } else {
      return { errors: { form: "Недостаточно данных для создания сессии." } };
    }
    requestId = flow.requestId;
    loginName = flow.loginName;
    await deleteRegFlowCookie();
  } else {
    // Путь из профиля — сессия уже активна, ищем через NextAuth + sessions cookie
    const userSessionsRes = await searchUserSessions(userId);
    const cookieIds = await getAllSessionCookieIds();
    const cookieIdSet = new Set(cookieIds);

    const zitadelSessions: any[] = userSessionsRes.success ? userSessionsRes.data?.sessions || [] : [];
    const match = zitadelSessions.find((s: any) => cookieIdSet.has(s.id));

    if (!match) return { errors: { form: "Сессия устарела. Войдите заново." } };

    const sessionCookie = await getSessionCookieById({ sessionId: match.id });
    if (!sessionCookie?.token) return { errors: { form: "Сессия устарела. Войдите заново." } };

    sessionData = { sessionId: match.id, sessionToken: sessionCookie.token };
    loginName = sessionCookie.loginName;
  }

  await finishAuth(sessionData, requestId, loginName, userId);
  return { errors: {} };
}
