"use server";

import { redirect } from "next/navigation";

import { createSession, addIdpLinkToUser, completeAuthRequest, deleteSession, searchUserSessions, getAuthRequest, listAuthMethods, hasTotpMethod, getSession } from "@/services/zitadel/api";
import { addSessionToCookie, getAllSessions, removeSessionFromCookie, setPreferredSessionId } from "@/services/zitadel/cookies";
import { extractIdpIntent, setIdpIntentCookie, setTotpPendingCookie } from "../../_lib/reg-flow";
import { env } from "@/shared/config/env";

async function evaluateTotpGate(
  sessionId: string,
  _sessionToken: string,
  cachedSession: any,
): Promise<{ required: boolean; userId: string | undefined; session: any }> {
  let session = cachedSession && cachedSession.factors?.user?.id ? cachedSession : undefined;
  if (!session) {
    const res = await getSession(sessionId);
    session = res.success ? res.data?.session : undefined;
  }

  const resolvedUserId: string | undefined = session?.factors?.user?.id;
  if (!resolvedUserId) {
    return { required: false, userId: undefined, session };
  }

  if (session?.factors?.totp) {
    return { required: false, userId: resolvedUserId, session };
  }

  const methods = await listAuthMethods(resolvedUserId);
  if (!methods.success) {
    // при ошибке чтения методов считаем TOTP включённым
    return { required: true, userId: resolvedUserId, session };
  }

  return {
    required: hasTotpMethod(methods.data.authMethodTypes),
    userId: resolvedUserId,
    session,
  };
}

export async function completeAuthFlow(sessionId: string, sessionToken: string, requestId: string): Promise<string> {
  const result = await completeAuthRequest(requestId, sessionId, sessionToken);

  if (!result.success) {
    console.error("Ошибка завершения Auth Request в ZITADEL:", result.error);
    redirect("/profile");
  }

  const callbackUrl = result.data.callbackUrl || result.data.url;

  if (!callbackUrl) {
    throw new Error("ZITADEL не вернул callbackUrl");
  }

  return callbackUrl;
}
export async function finishAuth(
  sessionResData: { sessionId: string; sessionToken: string; session?: any },
  requestId?: string,
  loginNameOverride?: string,
  userId?: string,
  opts?: { skipTotpGate?: boolean },
) {
  const gate = await evaluateTotpGate(
    sessionResData.sessionId,
    sessionResData.sessionToken,
    sessionResData.session,
  );

  const sessionDetails = gate.session || sessionResData.session || {};
  const userFactors = sessionDetails.factors?.user || {};
  const effectiveUserId = gate.userId || userId || userFactors.id;
  const loginName = loginNameOverride || userFactors.loginName || "unknown";

  if (gate.required && !opts?.skipTotpGate) {
    await setTotpPendingCookie({
      sessionId: sessionResData.sessionId,
      sessionToken: sessionResData.sessionToken,
      userId: effectiveUserId!,
      loginName,
      requestId,
    });
    const params = new URLSearchParams();
    if (requestId) params.set("requestId", requestId);
    redirect(`/login/totp${params.toString() ? `?${params}` : ""}`);
  }

  const newSessionCookie = {
    id: sessionResData.sessionId,
    token: sessionResData.sessionToken,
    creationTs: new Date(sessionDetails.creationDate || Date.now()).getTime().toString(),
    expirationTs: new Date(sessionDetails.expirationDate || Date.now() + 86400000).getTime().toString(),
    changeTs: new Date(sessionDetails.changeDate || Date.now()).getTime().toString(),
    loginName,
    organization: userFactors.organizationId || "",
    requestId: requestId,
  };

  await addSessionToCookie({
    session: newSessionCookie,
    cleanup: true,
  });
  await setPreferredSessionId(sessionResData.sessionId);

  if (requestId) {
    const redirectUrl = await completeAuthFlow(sessionResData.sessionId, sessionResData.sessionToken, requestId);
    redirect(redirectUrl);
  } else {
    redirect("/profile");
  }
}
// ==========================================
// ЭКШЕНЫ ДЛЯ КЛИЕНТСКОГО КОМПОНЕНТА
// ==========================================

export async function handleLoginAction(userId: string, intentId: string, intentToken: string, requestId?: string) {
  // --- НАЧАЛО БОРЬБЫ С ДУБЛИКАТАМИ ---
  const knownSessions = await getAllSessions(true);
  
  const userSessionsRes = await searchUserSessions(userId);
  if (userSessionsRes.success && userSessionsRes.data.sessions) {
    const activeSessions = userSessionsRes.data.sessions;
    
    // Ищем, есть ли среди активных сессий юзера те, что лежат у нас в браузере
    for (const activeSess of activeSessions) {
      const localSess = knownSessions.find(ks => ks.id === activeSess.id);
      if (localSess) {
        // Нашли старую сессию этого юзера в этом же браузере! Удаляем ее.
        await deleteSession(localSess.id, localSess.token);
        await removeSessionFromCookie(localSess.id);
      }
    }
  }
  // --- КОНЕЦ БОРЬБЫ С ДУБЛИКАТАМИ ---

  const sessionRes = await createSession(userId, intentId, intentToken);
  console.log("Ответ от createSession:", JSON.stringify(sessionRes));

  if (!sessionRes.success || !sessionRes.data?.sessionToken || !sessionRes.data?.sessionId) {
    throw new Error("Ошибка при создании сессии. Ответ ZITADEL: " + JSON.stringify(sessionRes));
  }

  await finishAuth(sessionRes.data, requestId, undefined, userId);
}

export async function saveIdpIntentAndRedirectAction(formData: FormData) {
  const intentId = formData.get("intentId") as string;
  const intentToken = formData.get("intentToken") as string;
  const requestId = formData.get("requestId") as string | undefined || undefined;
  const idpInformationRaw = formData.get("idpInformation") as string | null;
  const idpInformation = idpInformationRaw ? JSON.parse(idpInformationRaw) : undefined;

  await setIdpIntentCookie(
    await extractIdpIntent({ intentId, intentToken, idpInformation, requestId }),
  );

  const regParams = new URLSearchParams({ source: "idp" });
  if (requestId) regParams.set("requestId", requestId);
  redirect(`/login/register?${regParams}`);
}

export async function handleLinkAction(targetUserId: string, intentId: string, intentToken: string, idpInformation: any, requestId?: string) {
  const idpLink = {
    idpId: idpInformation.idpId,
    userId: idpInformation.userId,
    userName: idpInformation.userName,
  };

  const linkRes = await addIdpLinkToUser(targetUserId, idpLink);
  console.log("Ответ от addIdpLinkToUser:", JSON.stringify(linkRes));

  if (!linkRes.success) {
    throw new Error("Ошибка при привязке аккаунта: " + JSON.stringify(linkRes.error));
  }

  const sessionRes = await createSession(targetUserId, intentId, intentToken);
  console.log("Ответ от createSession:", JSON.stringify(sessionRes));

  if (!sessionRes.success || !sessionRes.data?.sessionToken || !sessionRes.data?.sessionId) {
    throw new Error("Аккаунт привязан, но не удалось создать сессию");
  }

  await finishAuth(sessionRes.data, requestId, undefined, targetUserId);
}

export async function selectAccountAction(sessionId: string, sessionToken: string, requestId: string) {
  console.log("[auth:selectAccount] sessionId=%s, requestId=%s", sessionId, requestId);

  // Определяем, чей это OIDC flow — наш NextAuth или внешний клиент
  const authReq = await getAuthRequest(requestId);
  const isOwnClient = authReq.success && authReq.data.authRequest?.clientId === env.APP_CLIENT_ID;

  if (isOwnClient) {
    // Наш NextAuth flow: PKCE cookies могут быть протухшими/перезаписанными.
    // Сохраняем выбранную сессию → клиент запустит свежий signIn() с новым PKCE.
    // Login page подхватит preferred session и auto-completит новый auth request.
    console.log("[auth:selectAccount] Свой клиент — сохраняем preferred session, клиент сделает signIn()");

    await setPreferredSessionId(sessionId);

    // Обновляем changeTs для корректной сортировки
    const sessions = await getAllSessions(true);
    const current = sessions.find(s => s.id === sessionId);
    if (current) {
      await addSessionToCookie({
        session: { ...current, changeTs: Date.now().toString() },
        cleanup: true,
      });
    }

    return { success: true as const, needsSignIn: true };
  }

  // Внешний OIDC клиент: завершаем auth request напрямую и редиректим на его callback
  console.log("[auth:selectAccount] Внешний клиент — completeAuthRequest напрямую");

  const result = await completeAuthRequest(requestId, sessionId, sessionToken);

  if (result.success) {
    const callbackUrl = result.data.callbackUrl || result.data.url;

    if (!callbackUrl) {
      console.error("[auth:selectAccount] Zitadel не вернул callbackUrl. Ответ:", JSON.stringify(result.data));
      return {
        success: false as const,
        error: { type: "API_ERROR" as const, message: "Сервер авторизации не вернул URL для перенаправления" },
      };
    }

    console.log("[auth:selectAccount] Редирект на callbackUrl: %s", callbackUrl);
    redirect(callbackUrl);
  }

  console.error("[auth:selectAccount] Ошибка completeAuthRequest:", JSON.stringify(result.error));
  return { success: false as const, error: result.error };
}