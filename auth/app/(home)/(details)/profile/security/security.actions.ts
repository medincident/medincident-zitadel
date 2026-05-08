"use server";

import { UserSession } from "@/domain/profile/types";
import { requireValidSession } from "@/services/zitadel/session";
import { deleteSession, deleteUserLink, getActiveIdps as getActiveIdps, searchUserLinks, searchUserSessions, startIdpIntent, changeUserPassword, retrieveIdpIntent, addIdpLinkToUser, registerTotp, verifyTotpRegistration, removeTotp, listAuthMethods, hasTotpMethod } from "@/services/zitadel/api";
import { env } from "@/shared/config/env";
import { redirect } from "next/navigation";
import { parseUserAgent } from "@/shared/lib/user-agent";
import { getAllSessions } from "@/services/zitadel/cookies";

// GET: Получить все активные сессии пользователя
export async function getSessionsAction(): Promise<UserSession[]> {
  const { userId, currentSessionId } = await requireValidSession();

  const response = await searchUserSessions(userId);
  if (!response.success) return [];

  const rawSessions = response.data.sessions || [];

  // 3. Форматируем данные под интерфейс твоего компонента SessionsList
  const formattedSessions: UserSession[] = rawSessions.map((sess: any) => {
    const ua = sess.userAgent || {};

    // Получаем сырую строку
    const rawDescription = ua.header?.["user-agent"]?.values?.join(" ") || ua.description || "";

    // Прогоняем через наш кастомный парсер
    const prettyDeviceName = parseUserAgent(rawDescription);

    return {
      id: sess.id,
      deviceName: prettyDeviceName,
      ip: ua.ip || "IP скрыт",
      userAgent: rawDescription || "Неизвестно",
      lastActive: sess.changeDate || sess.creationDate,
      isCurrent: sess.id === currentSessionId,
    };
  });

  // 4. Сортируем: текущая сессия на самом верху, остальные по убыванию даты активности
  return formattedSessions.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
  });
}

// REVOKE SESSION (Отзыв конкретной сессии)
export async function revokeSessionAction(
  targetSessionId: string
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await requireValidSession();

  // Проверяем, что сессия принадлежит текущему пользователю (защита от IDOR)
  const userSessions = await searchUserSessions(userId);
  if (!userSessions.success) {
    return { success: false, error: "Не удалось проверить сессии" };
  }
  const owned = (userSessions.data.sessions || []).some((s: any) => s.id === targetSessionId);
  if (!owned) {
    return { success: false, error: "Сессия не найдена" };
  }

  // Если это сессия в текущем браузере — подтягиваем её токен из кук, иначе удаляем
  // правами service account (v2 DELETE /sessions/{id} без токена)
  const knownSessions = await getAllSessions();
  const localToken = knownSessions.find((s) => s.id === targetSessionId)?.token;

  const result = await deleteSession(targetSessionId, localToken);
  if (!result.success) {
    return { success: false, error: "Не удалось завершить сессию" };
  }

  return { success: true };
}

// REVOKE ALL OTHERS (Отзыв всех остальных сессий)
export async function revokeAllOthersAction(): Promise<{
  success: boolean;
  error?: string;
  failedCount?: number;
}> {
  const { userId, currentSessionId } = await requireValidSession();
  const response = await searchUserSessions(userId);
  const knownSessions = await getAllSessions();

  if (!response.success) {
    return { success: false, error: "Не удалось получить список сессий" };
  }

  const sessionsToDelete = (response.data.sessions || []).filter(
    (s: any) => s.id !== currentSessionId
  );

  const results = await Promise.all(
    sessionsToDelete.map((s: any) => {
      const localToken = knownSessions.find((ls) => ls.id === s.id)?.token;
      return deleteSession(s.id, localToken);
    })
  );

  const failedCount = results.filter((r) => !r.success).length;
  if (failedCount > 0) {
    return {
      success: false,
      failedCount,
      error: `Не удалось завершить ${failedCount} из ${sessionsToDelete.length} сессий`,
    };
  }

  return { success: true };
}

// GET LINKED ACCOUNTS
export async function getLinkedAccountsAction() {
  const { userId } = await requireValidSession();

  const activeIdspResp = await getActiveIdps();
  if (!activeIdspResp.success || !activeIdspResp.data?.identityProviders) return [];
  const activeIdps = activeIdspResp.data.identityProviders;

  const linksResp = await searchUserLinks(userId);
  const linkedIdps = linksResp.success ? (linksResp.data.result || []) : [];

  return activeIdps.map((idp: any) => ({
    id: idp.id,
    name: idp.name,
    isConnected: linkedIdps.some((link: any) => link.idpId === idp.id),
  }));
}

// TOGGLE LINK
export async function toggleLinkedAccountAction(idpId: string, isCurrentlyConnected: boolean) {
  const { userId } = await requireValidSession();

  if (isCurrentlyConnected) {
    const linksResp = await searchUserLinks(userId);
    if (!linksResp.success) return { success: false, error: "Не удалось получить привязки" };

    const existingLink = (linksResp.data.result || []).find((link: any) => link.idpId === idpId);
    if (existingLink) {
      const linkedUserId = existingLink.linkedUserId || existingLink.externalUserId;
      await deleteUserLink(userId, idpId, linkedUserId);
    }
    return { success: true, action: "unlinked" };
  } else {
    return linkProvider(idpId);
  }
}

export async function linkProvider(idpId: string) {
  const response = await startIdpIntent({
    idpId,
    urls: {
      successUrl: `${env.APP_URL}/profile/security?link=success`,
      failureUrl: `${env.APP_URL}/profile/security?link=failed`,
    },
  });

  if (!response.success || !response.data?.authUrl) {
    throw new Error("Не удалось запустить авторизацию");
  }

  redirect(response.data.authUrl);
}

// COMPLETE IDP LINK (завершить привязку после OAuth-callback)
export async function completeLinkAction(intentId: string, intentToken: string): Promise<{ success: boolean; error?: string }> {
  const { userId } = await requireValidSession();

  const intentRes = await retrieveIdpIntent(intentId, { idpIntentToken: intentToken });
  if (!intentRes.success) {
    return { success: false, error: "Не удалось получить данные провайдера" };
  }

  const idpInfo = (intentRes as { success: true; data: any }).data?.idpInformation;
  if (!idpInfo?.idpId) {
    return { success: false, error: "Провайдер не вернул данные" };
  }

  const linkRes = await addIdpLinkToUser(userId, {
    idpId: idpInfo.idpId,
    userId: idpInfo.userId,
    userName: idpInfo.userName,
  });

  if (!linkRes.success) {
    return { success: false, error: "Не удалось привязать аккаунт" };
  }

  return { success: true };
}

// TOTP STATUS — проверить, включён ли TOTP у текущего пользователя
export async function getTotpStatusAction(): Promise<{ enabled: boolean }> {
  const { userId } = await requireValidSession();
  const methods = await listAuthMethods(userId);
  if (!methods.success) return { enabled: false };
  return { enabled: hasTotpMethod(methods.data.authMethodTypes) };
}

// TOTP REGISTER — получить otpauth:// URI и секрет для показа QR-кода
export async function registerTotpAction(): Promise<
  { success: true; uri: string; secret: string } | { success: false; error: string }
> {
  const { userId } = await requireValidSession();
  const res = await registerTotp(userId);
  if (!res.success || !res.data?.uri || !res.data?.secret) {
    return { success: false, error: "Не удалось запустить настройку TOTP" };
  }
  return { success: true, uri: res.data.uri, secret: res.data.secret };
}

// TOTP VERIFY — завершить регистрацию вводом первого кода из приложения
export async function verifyTotpRegistrationAction(
  code: string
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await requireValidSession();
  if (!/^\d{6}$/.test(code)) {
    return { success: false, error: "Введите 6-значный код" };
  }
  const res = await verifyTotpRegistration(userId, code);
  if (!res.success) {
    return { success: false, error: "Неверный код. Проверьте время на устройстве и попробуйте снова." };
  }
  return { success: true };
}

// TOTP REMOVE — отключить 2FA у пользователя
export async function removeTotpAction(): Promise<{ success: boolean; error?: string }> {
  const { userId } = await requireValidSession();
  const res = await removeTotp(userId);
  if (!res.success) {
    return { success: false, error: "Не удалось отключить 2FA" };
  }
  return { success: true };
}

// CHANGE PASSWORD (Смена пароля)
export async function changePasswordAction(currentPassword: string, newPassword: string) {
  const { userId } = await requireValidSession();

  const result = await changeUserPassword(userId, currentPassword, newPassword);

  if (!result.success) {
    const message = result.error?.type === "ZITADEL_ERROR" || result.error?.type === "API_ERROR"
      ? "Неверный текущий пароль или новый пароль не соответствует требованиям"
      : "Не удалось сменить пароль";
    return { success: false, error: message };
  }

  return { success: true };
}