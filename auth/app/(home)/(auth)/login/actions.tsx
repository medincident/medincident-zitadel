"use server";

import { redirect } from "next/navigation";
import { env } from "@/shared/config/env";
import {
  createSessionByUserId,
  deleteSession,
  getActiveIdps,
  getSession,
  searchUserSessions,
  startIdpIntent,
} from "@/services/zitadel/api";
import { addSessionToCookie, getAllSessions, removeSessionFromCookie, setPreferredSessionId } from "@/services/zitadel/cookies";
import {
  clearDeviceCtx,
  getDeviceCtx,
  peekQrApproval,
} from "@/services/zitadel/device-context";
import { getUserIdFromNextAuth } from "@/services/zitadel/session";
import { signIn, signOut } from "@/services/zitadel/user/auth";

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

// Завершает QR Device Flow на Device A: токены получены SSE-handler'ом через
// device_code grant, здесь только создаём сессию для requireValidSession и
// делегируем выписку JWT NextAuth Credentials provider.
export async function applyDeviceFlowAction(userCode: string) {
  if (!userCode || typeof userCode !== "string") {
    throw new Error("Некорректный код устройства");
  }

  // action может вызвать только устройство, инициировавшее QR
  const ctx = await getDeviceCtx();
  if (!ctx || ctx.userCode !== userCode) {
    throw new Error("Контекст устройства не найден или не совпадает");
  }

  const approval = peekQrApproval(userCode);
  if (!approval) {
    throw new Error("Сессия одобрения устарела. Попробуйте снова.");
  }

  await clearDeviceCtx();

  try {
    const sessionRes = await createSessionByUserId(approval.userId);
    if (sessionRes.success && sessionRes.data?.sessionId && sessionRes.data?.sessionToken) {
      const { sessionId, sessionToken } = sessionRes.data;
      const sessionDataRes = await getSession(sessionId);
      const session = sessionDataRes.success ? sessionDataRes.data?.session : undefined;
      const userFactors = (session as { factors?: { user?: { loginName?: string; organizationId?: string } } })?.factors?.user || {};
      const creation = (session as { creationDate?: string })?.creationDate;
      const expiration = (session as { expirationDate?: string })?.expirationDate;
      const change = (session as { changeDate?: string })?.changeDate;

      await addSessionToCookie({
        session: {
          id: sessionId,
          token: sessionToken,
          creationTs: new Date(creation || Date.now()).getTime().toString(),
          expirationTs: new Date(expiration || Date.now() + 86400000).getTime().toString(),
          changeTs: new Date(change || Date.now()).getTime().toString(),
          loginName: userFactors.loginName || "unknown",
          organization: userFactors.organizationId || "",
        },
        cleanup: true,
      });
      await setPreferredSessionId(sessionId);
    }
  } catch (e) {
    console.error("[auth:applyDeviceFlow] Ошибка V2-сессии:", e instanceof Error ? e.message : e);
  }

  await signIn("qr-device-flow", {
    userCode,
    redirectTo: "/profile",
  });
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