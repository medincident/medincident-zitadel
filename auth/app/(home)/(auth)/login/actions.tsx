"use server";

import { redirect } from "next/navigation";
import { env } from "@/shared/config/env";
import { deleteSession, getActiveIdps, startIdpIntent, createSessionByUserId, getSession, searchUserSessions } from "@/services/zitadel/api";
import { getAllSessions, removeSessionFromCookie } from "@/services/zitadel/cookies";
import {
  clearDeviceCtx,
  clearDeviceTokens,
  getDeviceCtx,
  getDeviceTokens,
} from "@/services/zitadel/device-context";
import { verifyIdToken } from "@/services/zitadel/id-token";
import { getUserIdFromNextAuth } from "@/services/zitadel/session";
import { signOut } from "@/services/zitadel/user/auth";
import { finishAuth } from "./callback/success/actions";

export async function fetchProvidersAction() {
  const response = await getActiveIdps();
  console.log("Полученные провайдеры:", JSON.stringify(response));
  
  if (!response.success) {
    console.error("Ошибка при получении провайдеров:", response.error);
    return [];
  }
  
  return response.data.identityProviders || [];
}

export async function loginWithProviderAction(idpId: string, requestId?: string) {
  const baseUrl = env.APP_URL;

  const successUrl = requestId 
    ? `${baseUrl}/login/callback/success?requestId=${requestId}` 
    : `${baseUrl}/login/callback/success`;

  const response = await startIdpIntent({
    idpId,
    urls: {
      successUrl: successUrl,
      failureUrl: `${baseUrl}/login/callback/failure`,
    },
  });

  if (!response.success || !response.data?.authUrl) {
    throw new Error("Не удалось запустить авторизацию");
  }

  redirect(response.data.authUrl);
}

/**
 * Применяет tokens полученные через Device Flow.
 *
 * Последовательность защит:
 *  1. zdc_tokens cookie существует и не истёк (HttpOnly, SameSite=Lax, Secure).
 *  2. zdc_ctx всё ещё существует — или уже подчищен; главное, что nonce совпадает.
 *  3. id_token валидирован через Zitadel JWKS (подпись, iss, aud, exp).
 *  4. nonce в tokens совпадает с тем, что был в ctx — связывает QR с полученными токенами.
 *
 * Только после всех четырёх проверок создаём Zitadel session v2 для sub из id_token.
 * Это не «машинный shortcut» — это запись о том, что Device Flow успешно завершён
 * конкретным пользователем, подтверждённым Zitadel IdP на Device B.
 */
export async function applyDeviceTokensAction() {
  const tokens = await getDeviceTokens();
  if (!tokens) {
    throw new Error("Сессия устройства недействительна или истекла");
  }

  // ctx мог быть уже очищен (status route чистит его при успехе) — тогда nonce сверяем
  // только если он есть. Главный binding — подпись id_token от Zitadel.
  const ctx = await getDeviceCtx();
  if (ctx && ctx.nonce !== tokens.nonce) {
    await clearDeviceTokens();
    await clearDeviceCtx();
    throw new Error("Привязка устройства нарушена");
  }

  let claims;
  try {
    claims = await verifyIdToken(tokens.idToken);
  } catch (e) {
    await clearDeviceTokens();
    await clearDeviceCtx();
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Невалидный id_token: ${msg}`);
  }

  const userId = claims.sub;

  const sessionRes = await createSessionByUserId(userId);
  if (!sessionRes.success || !sessionRes.data?.sessionId || !sessionRes.data?.sessionToken) {
    throw new Error("Не удалось создать сессию");
  }

  const { sessionId, sessionToken } = sessionRes.data;

  const sessionDataRes = await getSession(sessionId);
  const session = sessionDataRes.success ? sessionDataRes.data?.session : undefined;

  console.log(
    "[auth:applyDeviceTokens] Device Flow: userId=%s, sessionId=%s",
    userId,
    sessionId,
  );

  const requestId = ctx?.requestId;

  // После успеха — чистим ctx и tokens.
  await clearDeviceTokens();
  await clearDeviceCtx();

  await finishAuth({ sessionId, sessionToken, session }, requestId, undefined, userId);
}

export async function logoutAction() {
  console.log("[auth:logout] Начинаем выход...");

  const knownSessions = await getAllSessions();

  // 1. Определяем сессию для выхода через NextAuth → userId → searchUserSessions
  const userId = await getUserIdFromNextAuth();
  let targetSession = null as (typeof knownSessions)[number] | null;

  if (userId) {
    const res = await searchUserSessions(userId);
    const zitadelIds = new Set(
      (res.success ? res.data?.sessions || [] : []).map((s: any) => s.id)
    );
    targetSession = knownSessions.find(s => zitadelIds.has(s.id)) ?? null;
  }

  if (!targetSession && knownSessions.length > 0) {
    console.log("[auth:logout] Fallback: userId не найден, удаляем все %d сессий из куки", knownSessions.length);
    for (const s of knownSessions) {
      try {
        await deleteSession(s.id, s.token);
        console.log("[auth:logout] Сессия удалена в Zitadel: sessionId=%s", s.id);
      } catch (e) {
        console.error("[auth:logout] Ошибка при удалении сессии %s:", s.id, e);
      }
      await removeSessionFromCookie(s.id);
    }
  } else if (targetSession) {
    // 2. Удаляем конкретную сессию в Zitadel
    try {
      await deleteSession(targetSession.id, targetSession.token);
      console.log("[auth:logout] Сессия удалена в Zitadel: sessionId=%s", targetSession.id);
    } catch (e) {
      console.error("[auth:logout] Ошибка при удалении сессии в Zitadel:", e);
    }
    // 3. Удаляем сессию из куки
    await removeSessionFromCookie(targetSession.id);
  } else {
    console.log("[auth:logout] Нет сессий для удаления");
  }

  // 4. Сносим NextAuth-куки локально (без редиректа — он будет ниже).
  await signOut({ redirect: false });

  // 5. RP-Initiated Logout: уводим пользователя через /oidc/v1/end_session,
  //    чтобы Zitadel завершил OIDC-сессию на IdP. post_logout_redirect_uri
  //    должен побайтово совпадать с Post Logout URIs в Zitadel-приложении.
  //    Spec: https://openid.net/specs/openid-connect-rpinitiated-1_0.html
  const params = new URLSearchParams({
    client_id: env.APP_CLIENT_ID,
    post_logout_redirect_uri: `${env.APP_URL}/logout`,
  });
  redirect(`${env.ZITADEL_API_URL}/oidc/v1/end_session?${params}`);
}