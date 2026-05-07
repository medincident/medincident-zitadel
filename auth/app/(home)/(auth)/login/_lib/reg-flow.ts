"use server";

import { cookies } from "next/headers";

const IDP_INTENT_COOKIE = "zitadel_idp_intent";
const REG_FLOW_COOKIE = "zitadel_reg_flow";
const TOTP_PENDING_COOKIE = "zitadel_totp_pending";
const PASSWORD_RESET_COOKIE = "zitadel_password_reset";
const COOKIE_MAX_AGE = 60 * 15; // 15 минут

// Данные IDP intent (для пути через внешний провайдер)
export interface IdpIntentData {
  intentId: string;
  intentToken: string;
  idpInformation: any;
  requestId?: string;
}

// Состояние многошагового flow регистрации
export interface RegFlowData {
  // Профиль
  givenName: string;
  familyName: string;
  middleName?: string;
  email: string;
  // Путь
  source: "idp" | "email" | "login";
  requestId?: string;
  // После создания пользователя
  userId?: string;
  loginName?: string;
  // Для email-пути регистрации (хранится кратко)
  password?: string;
  // Для IDP-пути
  intentId?: string;
  intentToken?: string;
  // Для login-пути (сессия уже создана до верификации)
  sessionId?: string;
  sessionToken?: string;
}

async function setCookie(name: string, data: object, maxAge = COOKIE_MAX_AGE) {
  const store = await cookies();
  store.set(name, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

async function getCookie<T>(name: string): Promise<T | null> {
  const store = await cookies();
  const value = store.get(name)?.value;
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function deleteCookie(name: string) {
  const store = await cookies();
  store.set(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// IDP Intent cookie
export const setIdpIntentCookie = async (data: IdpIntentData) => setCookie(IDP_INTENT_COOKIE, data);
export const getIdpIntentCookie = async () => getCookie<IdpIntentData>(IDP_INTENT_COOKIE);
export const deleteIdpIntentCookie = async () => deleteCookie(IDP_INTENT_COOKIE);

// Reg Flow cookie
export const setRegFlowCookie = async (data: RegFlowData) => setCookie(REG_FLOW_COOKIE, data);
export const getRegFlowCookie = async () => getCookie<RegFlowData>(REG_FLOW_COOKIE);
export const deleteRegFlowCookie = async () => deleteCookie(REG_FLOW_COOKIE);

// Состояние ожидания TOTP-кода (после успешной проверки пароля)
export interface TotpPendingData {
  sessionId: string;
  sessionToken: string;
  userId: string;
  loginName: string;
  requestId?: string;
}

export const setTotpPendingCookie = async (data: TotpPendingData) => setCookie(TOTP_PENDING_COOKIE, data);
export const getTotpPendingCookie = async () => getCookie<TotpPendingData>(TOTP_PENDING_COOKIE);
export const deleteTotpPendingCookie = async () => deleteCookie(TOTP_PENDING_COOKIE);

// Forgot password flow: после запроса reset храним userId, чтобы на шаге verify
// не дёргать поиск ещё раз. Email/loginName тут не сохраняем — они не нужны для
// /password endpoint и нет смысла продлевать жизнь PII в cookie.
export interface PasswordResetPendingData {
  userId: string;
  requestId?: string;
}

export const setPasswordResetCookie = async (data: PasswordResetPendingData) =>
  setCookie(PASSWORD_RESET_COOKIE, data);
export const getPasswordResetCookie = async () =>
  getCookie<PasswordResetPendingData>(PASSWORD_RESET_COOKIE);
export const deletePasswordResetCookie = async () => deleteCookie(PASSWORD_RESET_COOKIE);
