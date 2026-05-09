"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  createHumanUser,
  createSession,
  updateUserMetadata,
  updateUserMiddleName,
} from "@/services/zitadel/api";
import {
  getIdpIntentCookie,
  deleteIdpIntentCookie,
  setRegFlowCookie,
} from "../_lib/reg-flow";
import { env } from "@/shared/config/env";
import { nameFieldsSchema } from "@/domain/profile/schema";
import type { RegisterFormState } from "./_components/register-view";


function extractFormFields(formData: FormData) {
  return {
    givenName: (formData.get("givenName") as string)?.trim() ?? "",
    familyName: (formData.get("familyName") as string)?.trim() ?? "",
    middleName: (formData.get("middleName") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    password: (formData.get("password") as string) ?? "",
    confirm: (formData.get("confirm") as string) ?? "",
    agreeTerms: formData.get("agreeTerms") === "1",
    agreePdn: formData.get("agreePdn") === "1",
  };
}

function validateConsents(fields: { agreeTerms: boolean; agreePdn: boolean }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.agreeTerms) {
    errors.agreeTerms = "Необходимо принять пользовательское соглашение и политику конфиденциальности";
  }
  if (!fields.agreePdn) {
    errors.agreePdn = "Необходимо согласие на обработку персональных данных";
  }
  return errors;
}

// Сохраняем факт согласия в metadata пользователя — нужно для аудита/152-ФЗ.
async function persistConsentMetadata(userId: string) {
  const now = new Date().toISOString();
  // updateUserMetadata кодирует значение в Base64 сама.
  await updateUserMetadata(userId, "consent_terms_accepted_at", now);
  await updateUserMetadata(userId, "consent_pdn_accepted_at", now);
}

function validateNameFields(
  fields: { givenName: string; familyName: string; middleName: string }
): Record<string, string> {
  const result = nameFieldsSchema.safeParse(fields);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path[0], issue.message])
  );
}

// ==========================================
// ПАРСИНГ ОШИБОК ZITADEL
// ==========================================

const ZITADEL_FIELD_MAP: Record<string, string> = {
  GivenName: "givenName",
  FamilyName: "familyName",
  DisplayName: "givenName",
  NickName: "givenName",
  Email: "email",
  Username: "email",
};

function parseZitadelError(rawMessage: string): Record<string, string> | null {
  // Извлекаем JSON из строки вида "Ошибка при создании пользователя: {...}"
  let zitadelMsg = rawMessage;
  let details: any[] = [];
  const jsonStart = rawMessage.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(rawMessage.slice(jsonStart));
      zitadelMsg = parsed.message ?? rawMessage;
      details = parsed.details ?? [];
    } catch {
      // оставляем исходную строку
    }
  }

  // Ошибки политики пароля — id начинается с "COMMA-"
  const isPasswordError = details.some((d: any) => typeof d.id === "string" && d.id.startsWith("COMMA-"));
  if (isPasswordError) {
    // Убираем суффикс вида " (COMMA-co3Xw)" из сообщения
    return { password: zitadelMsg.replace(/\s*\([A-Z0-9-]+\)\s*$/, "").trim() };
  }

  // Ошибки профиля: "SetHumanProfile.GivenName: reason" или "AddHumanUser.Username: reason"
  const match = zitadelMsg.match(/\bSet\w+\.(\w+):\s*(.+?)(?:\s*\||$)/i)
    ?? zitadelMsg.match(/\bAdd\w+\.(\w+):\s*(.+?)(?:\s*\||$)/i);

  if (!match) return null;

  const [, fieldRaw, reason] = match;
  const field = ZITADEL_FIELD_MAP[fieldRaw] ?? "form";

  const humanReason = reason.includes("length must be between")
    ? "Поле не может быть пустым или слишком длинным"
    : reason.includes("invalid format") || reason.includes("value does not match")
    ? "Недопустимый формат"
    : reason.trim();

  return { [field]: humanReason };
}

function formatUnexpectedError(error: any): string {
  const raw: string = error?.message ?? "";
  const jsonStart = raw.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart));
      if (env.isDev) return raw;
      return parsed.message ?? "Ошибка регистрации";
    } catch {
      // не JSON — возвращаем как есть в dev, generic в prod
    }
  }
  if (env.isDev) return raw || "Ошибка регистрации";
  console.error("[register] unexpected error:", error);
  return "Ошибка регистрации";
}

// ==========================================
// IDP ПУТЬ: создаём пользователя, сохраняем userId → /verify
// ==========================================

export async function continueRegisterIdp(
  requestId: string | undefined,
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const fields = extractFormFields(formData);
  const { givenName, familyName, middleName, email, agreeTerms, agreePdn } = fields;
  const values = { givenName, familyName, middleName, email };
  const errors: Record<string, string> = {
    ...validateNameFields({ givenName, familyName, middleName }),
    ...validateConsents({ agreeTerms, agreePdn }),
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Введите корректный email адрес";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors, values };

  const intent = await getIdpIntentCookie();
  if (!intent) return { success: false, errors: { form: "Сессия устарела. Войдите снова." }, values };

  try {
    const rawInfo = intent.idpInformation?.rawInformation ?? {};
    const requestBody = {
      username: rawInfo.preferred_username ?? email,
      profile: {
        givenName,
        familyName,
        displayName: `${givenName} ${familyName}`,
        preferredLanguage:
          rawInfo.preferredLanguage === "und" ? "ru" : (rawInfo.preferredLanguage ?? "ru"),
      },
      email: { email, sendCode: {} },
      idpLinks: [
        {
          idpId: intent.idpInformation?.idpId,
          userId: intent.idpInformation?.userId,
          userName: intent.idpInformation?.userName,
        },
      ],
    };

    const userRes = await createHumanUser(requestBody);
    if (!userRes.success || !userRes.data?.userId) {
      const errMsg = !userRes.success ? JSON.stringify((userRes as any).error) : "userId отсутствует";
      throw new Error("Ошибка при создании пользователя: " + errMsg);
    }

    const userId = userRes.data.userId;

    if (middleName) await updateUserMiddleName(userId, middleName);
    await persistConsentMetadata(userId);

    // Создаём сессию с idpIntent пока интент свежий.
    const sessionRes = await createSession(userId, intent.intentId, intent.intentToken);
    if (!sessionRes.success || !sessionRes.data?.sessionId || !sessionRes.data?.sessionToken) {
      const msg = (sessionRes as any).error?.message ?? "";
      const expired = msg.includes("Intent.Expired") || msg.includes("Intent.NotSucceeded");
      await deleteIdpIntentCookie();
      return {
        success: false,
        errors: {
          form: expired
            ? "Сессия Telegram истекла. Аккаунт создан — войдите через Telegram заново."
            : "Не удалось создать сессию. Войдите через Telegram заново.",
        },
        values,
      };
    }

    await setRegFlowCookie({
      givenName, familyName, middleName, email,
      source: "idp",
      requestId,
      userId,
      loginName: email,
      sessionId: sessionRes.data.sessionId,
      sessionToken: sessionRes.data.sessionToken,
    });

    await deleteIdpIntentCookie();

    const params = new URLSearchParams({ requestId: requestId ?? "" });
    redirect(`/login/email/verify?${params}`);
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    const zitadelFields = parseZitadelError(error.message ?? "");
    const errorFields = zitadelFields ?? { form: formatUnexpectedError(error) };
    return { success: false, errors: errorFields, values };
  }
}

// ==========================================
// EMAIL ПУТЬ: создаём пользователя с паролем → /verify
// ==========================================

export async function continueRegisterEmail(
  requestId: string | undefined,
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const fields = extractFormFields(formData);
  const { givenName, familyName, middleName, email, password, confirm, agreeTerms, agreePdn } = fields;
  const values = { givenName, familyName, middleName, email };
  const errors: Record<string, string> = {
    ...validateNameFields({ givenName, familyName, middleName }),
    ...validateConsents({ agreeTerms, agreePdn }),
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Введите корректный email адрес";
  }
  if (!password || password.length < 1) {
    errors.password = "Введите пароль";
  } else if (password.length < 8) {
    errors.password = "Пароль должен содержать не менее 8 символов";
  } else if (password.length > 70) {
    errors.password = "Пароль должен быть не более 70 символов";
  } else if (!/[A-ZА-ЯЁ]/.test(password)) {
    errors.password = "Пароль должен содержать заглавную букву";
  } else if (!/[a-zа-яё]/.test(password)) {
    errors.password = "Пароль должен содержать строчную букву";
  } else if (!/\d/.test(password)) {
    errors.password = "Пароль должен содержать цифру";
  } else if (!/[^a-zA-Zа-яА-ЯёЁ0-9\s]/.test(password)) {
    errors.password = "Пароль должен содержать символ или знак пунктуации";
  }
  if (password !== confirm) {
    errors.confirm = "Пароли не совпадают";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors, values };

  try {
    const userRes = await createHumanUser({
      username: email,
      profile: {
        givenName,
        familyName,
        displayName: `${givenName} ${familyName}`,
        preferredLanguage: "ru",
      },
      email: { email, sendCode: {} },
      password: { password, changeRequired: false },
    });

    if (!userRes.success || !userRes.data?.userId) {
      const errMsg = !userRes.success ? JSON.stringify((userRes as any).error) : "userId отсутствует";
      throw new Error("Ошибка при создании пользователя: " + errMsg);
    }

    const userId = userRes.data.userId;

    if (middleName) await updateUserMiddleName(userId, middleName);
    await persistConsentMetadata(userId);

    await setRegFlowCookie({
      givenName, familyName, middleName, email,
      source: "email",
      requestId,
      userId,
      loginName: email,
      password,
    });

    const params = new URLSearchParams();
    if (requestId) params.set("requestId", requestId);
    redirect(`/login/email/verify?${params}`);
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    const zitadelFields = parseZitadelError(error.message ?? "");
    const errorFields = zitadelFields ?? { form: formatUnexpectedError(error) };
    return { success: false, errors: errorFields, values };
  }
}
