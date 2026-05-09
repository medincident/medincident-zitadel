"use server";

import { verifyUserEmail, searchUserSessions } from "@/services/zitadel/api";
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
    if (!flow.sessionId || !flow.sessionToken) {
      return { errors: { form: "Сессия регистрации устарела. Войдите снова." } };
    }
    sessionData = { sessionId: flow.sessionId, sessionToken: flow.sessionToken };
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
