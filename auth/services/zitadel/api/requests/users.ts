"server only";

import { z } from "zod";
import { Result } from "@/domain/error";
import { handleZitadelRequest } from "../client-helper";
import { zitadelApi } from "../client";
import { zitadelUserApi } from "../../user/client"; // для user self-service endpoints
import { env } from "@/shared/config/env";
import { PaginationRequest, TextFilterMethod, ZitadelGenericUpdateResponseSchema } from "./shared";

// ==========================================
// 1. СХЕМЫ ОТВЕТОВ (RESPONSES)
// ==========================================

export const ZitadelCreateHumanUserResponseSchema = z.object({
  userId: z.string(),
  details: z.any().optional(),
}).catchall(z.any());

export const ZitadelGetUserResponseSchema = z.object({
  user: z.object({
    id: z.string().optional(),
    human: z.any().optional(),
    preferredLoginName: z.string().optional()
  }).catchall(z.any()).optional()
}).catchall(z.any());

export const ZitadelMetadataSchema = z.object({
  key: z.string().optional(),
  value: z.string().optional(), // Значение приходит в Base64
}).catchall(z.any());

export const ZitadelSearchMetadataResponseSchema = z.object({
  details: z.any().optional(),
  result: z.array(ZitadelMetadataSchema).optional(),
}).catchall(z.any());


// ==========================================
// 2. МОДЕЛИ ТЕЛ ЗАПРОСОВ (REQUEST BODIES)
// ==========================================

export interface ZitadelUpdateHumanProfileRequest {
  profile: {
    givenName: string;
    familyName: string;
    nickName?: string;
    displayName?: string;
    preferredLanguage?: string;
    gender?: number;
  };
}

export interface ZitadelUpdateHumanEmailRequest {
  email: string;
  sendCode: Record<string, never>;
}

export interface ZitadelUpdateUserMetadataRequest {
  metadata: Array<{
    key: string;
    value: string; // В API ZITADEL это поле ожидает строку в Base64
  }>;
}

export interface MetadataKeyFilter {
  key?: string;
  method?: TextFilterMethod;
}

export interface MetadataSearchFilter {
  keyQuery?: MetadataKeyFilter;
}

export interface ZitadelSearchMetadataRequest {
  query?: PaginationRequest | null;
  queries?: MetadataSearchFilter[];
}


// ==========================================
// 3. API МЕТОДЫ
// ==========================================

export async function createHumanUser(
  body: any // Можно заменить на конкретный тип Request, если он у вас описан
): Promise<Result<z.infer<typeof ZitadelCreateHumanUserResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.post("/v2/users/human", body, {
      headers: { "x-zitadel-orgid": env.ZITADEL_ORG_ID },
    }),
    ZitadelCreateHumanUserResponseSchema
  );
}

export async function getUserById(
  userId: string
): Promise<Result<z.infer<typeof ZitadelGetUserResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.get(`/v2/users/${userId}`),
    ZitadelGetUserResponseSchema
  );
}

export async function updateHumanProfile(
  userId: string,
  givenName: string,
  familyName: string,
  nickName?: string,
  displayName?: string,
  preferredLanguage?: string,
  gender?: number
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {

  // Формируем строго типизированный body
  const body: ZitadelUpdateHumanProfileRequest = {
    profile: { givenName, familyName, nickName, displayName, preferredLanguage, gender }
  };

  return handleZitadelRequest(
    () => zitadelApi.put(`/v2/users/human/${userId}`, body),
    ZitadelGenericUpdateResponseSchema
  );
}

export async function updateHumanEmail(
  userId: string,
  email: string
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {

  const body: ZitadelUpdateHumanEmailRequest = { email, sendCode: {} };

  return handleZitadelRequest(
    () => zitadelApi.post(`/v2/users/${userId}/email`, body),
    ZitadelGenericUpdateResponseSchema
  );
}

export async function updateHumanAvatar(
  userId: string,
  file: File | Blob
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {

  const formData = new FormData();
  formData.append("file", file);

  return handleZitadelRequest(
    () => zitadelApi.post(`/v2/users/${userId}/avatar`, formData, {
      // Axios должен сам выставить boundary, но мы явно указываем тип
      headers: { "Content-Type": "multipart/form-data" }
    }),
    ZitadelGenericUpdateResponseSchema
  );
}

// ==========================================
// МЕТАДАННЫЕ (METADATA)
// ==========================================

export async function updateUserMiddleName(userId: string, value: string) {
  // Теперь передаем оригинальную строку, updateUserMetadata сама переведет ее в Base64
  return await updateUserMetadata(userId, "middleName", value);
}

export async function getUserMiddleName(userId: string): Promise<string | undefined> {
  const body: ZitadelSearchMetadataRequest = {
    query: { offset: 0, limit: 1, asc: true },
    queries: [{ keyQuery: { key: "middleName" } }]
  };

  const response = await searchUserMetadata(userId, body);

  if (!response.success || !response.data) {
    return undefined;
  }

  const metadataArray = response.data.metadata;
  if (!metadataArray || metadataArray.length === 0) {
    return undefined;
  }

  const field = metadataArray[0];
  // Декодируем из Base64 обратно в utf-8
  return field.value ? Buffer.from(field.value, "base64").toString("utf-8") : undefined;
}

export async function updateUserMetadata(
  userId: string,
  key: string,
  value: string // Принимаем обычную строку
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {

  // Надежно переводим строку в Base64
  const base64Value = Buffer.from(value).toString('base64');

  const body: ZitadelUpdateUserMetadataRequest = {
    metadata: [
      { key, value: base64Value }
    ]
  };

  return handleZitadelRequest(
    () => zitadelApi.post(`/v2/users/${userId}/metadata`, body),
    ZitadelGenericUpdateResponseSchema
  );
}

export async function searchUserMetadata(
  userId: string,
  body: ZitadelSearchMetadataRequest
): Promise<Result<z.infer<typeof ZitadelSearchMetadataResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.post(`/v2/users/${userId}/metadata/search`, body),
    ZitadelSearchMetadataResponseSchema
  );
}

// ==========================================
// СМЕНА ПАРОЛЯ
// ==========================================

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelUserApi.post(`/v2/users/${userId}/password`, {
      currentPassword,
      newPassword: { password: newPassword },
    }),
    ZitadelGenericUpdateResponseSchema
  );
}

// ==========================================
// СБРОС ПАРОЛЯ (forgot password)
// ==========================================

// Просим Zitadel выслать пользователю код сброса на email.
// Используем sendCode (не sendLink), чтобы пользователь возвращался в наш UI и
// вводил код руками — это защищает от утечки кода через referer/clipboard.
export async function requestPasswordReset(
  userId: string
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.post(`/v2/users/${userId}/password_reset`, { sendCode: {} }),
    ZitadelGenericUpdateResponseSchema
  );
}

// Установка нового пароля по verificationCode (без current password).
export async function setPasswordWithCode(
  userId: string,
  verificationCode: string,
  newPassword: string
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.post(`/v2/users/${userId}/password`, {
      verificationCode,
      newPassword: { password: newPassword },
    }),
    ZitadelGenericUpdateResponseSchema
  );
}

// ==========================================
// ПОИСК ПОЛЬЗОВАТЕЛЕЙ
// ==========================================

export const ZitadelSearchUsersResponseSchema = z.object({
  details: z.any().optional(),
  result: z.array(
    z.object({
      userId: z.string().optional(),
      preferredLoginName: z.string().optional(),
      human: z.object({
        email: z.object({
          email: z.string().optional(),
          isVerified: z.boolean().optional(),
        }).catchall(z.any()).optional(),
        profile: z.object({
          givenName: z.string().optional(),
          familyName: z.string().optional(),
        }).optional(),
      }).optional(),
    }).catchall(z.any())
  ).optional(),
}).catchall(z.any());

export async function verifyUserEmail(
  userId: string,
  code: string
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.post(`/v2/users/${userId}/email/verify`, { verificationCode: code }),
    ZitadelGenericUpdateResponseSchema
  );
}

export async function resendEmailVerification(
  userId: string
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {
  // Zitadel v2: POST /v2/users/{userId}/email с sendCode:{} повторно отправляет код верификации
  return handleZitadelRequest(
    () => zitadelApi.post(`/v2/users/${userId}/email`, { sendCode: {} }),
    ZitadelGenericUpdateResponseSchema
  );
}

export async function searchUserByEmail(
  email: string
): Promise<Result<z.infer<typeof ZitadelSearchUsersResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.post("/v2/users", {
      queries: [
        {
          emailQuery: {
            emailAddress: email,
            method: "TEXT_FILTER_METHOD_EQUALS",
          },
        },
      ],
    }),
    ZitadelSearchUsersResponseSchema
  );
}

export async function searchUserByLoginName(
  loginName: string
): Promise<Result<z.infer<typeof ZitadelSearchUsersResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.post("/v2/users", {
      queries: [
        {
          loginNameQuery: {
            loginName,
            method: "TEXT_FILTER_METHOD_EQUALS",
          },
        },
      ],
    }),
    ZitadelSearchUsersResponseSchema
  );
}

