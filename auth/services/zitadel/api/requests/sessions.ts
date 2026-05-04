"server only";

import { headers } from "next/headers";
import { z } from "zod";
import { Result } from "@/domain/error";
import { handleZitadelRequest } from "../client-helper";
import { zitadelApi } from "../client";
import { ZitadelGenericUpdateResponseSchema } from "./shared";

async function getRequestUserAgent() {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
    const ua = h.get("user-agent") ?? undefined;
    if (!ip && !ua) return undefined;
    return {
      ...(ip && { ip }),
      ...(ua && { description: ua, header: { "user-agent": { values: [ua] } } }),
    };
  } catch {
    return undefined;
  }
}

// --- Схемы ---

export const ZitadelSessionUserFactorSchema = z.object({
  verifiedAt: z.string().optional(),
  id: z.string().optional(),
  loginName: z.string().optional(),
  displayName: z.string().optional(),
  organizationId: z.string().optional(),
}).catchall(z.any());

export const ZitadelSessionFactorsSchema = z.object({
  user: ZitadelSessionUserFactorSchema.optional(),
  password: z.any().optional(),
}).catchall(z.any());

export const ZitadelSessionSchema = z.object({
  id: z.string(),
  creationDate: z.string().optional(),
  changeDate: z.string().optional(),
  factors: ZitadelSessionFactorsSchema.optional(),
}).catchall(z.any());

export const ZitadelSearchSessionsResponseSchema = z.object({
  details: z.any().optional(),
  sessions: z.array(ZitadelSessionSchema).optional(),
}).catchall(z.any());

export const ZitadelSessionResponseSchema = z.object({
  sessionId: z.string().optional(),
  sessionToken: z.string().optional(),
  details: z.any().optional(),
}).catchall(z.any());

export const ZitadelCreateSessionResponseSchema = z.object({
  sessionId: z.string(),
  sessionToken: z.string(),
}).catchall(z.any());

// --- Запросы ---

export async function searchSessions(
  sessionIds: string[]
): Promise<Result<z.infer<typeof ZitadelSearchSessionsResponseSchema>>> {
  if (!sessionIds || sessionIds.length === 0) {
    return { success: true, data: { sessions: [] } };
  }

  const body = {
    query: { offset: "0", limit: 100, asc: true },
    queries: [{ idsQuery: { ids: sessionIds } }]
  };

  return handleZitadelRequest(
    () => zitadelApi.post("/v2/sessions/search", body),
    ZitadelSearchSessionsResponseSchema
  );
}

export async function searchUserSessions(
  userId: string
): Promise<Result<z.infer<typeof ZitadelSearchSessionsResponseSchema>>> {
  const body = {
    queries: [{ userIdQuery: { id: userId } }]
  };

  return handleZitadelRequest(
    () => zitadelApi.post("/v2/sessions/search", body),
    ZitadelSearchSessionsResponseSchema
  );
}

export async function createSession(
  userId: string,
  idpIntentId: string,
  idpIntentToken: string
): Promise<Result<z.infer<typeof ZitadelCreateSessionResponseSchema>>> {
  const body = {
    checks: {
      user: { userId },
      idpIntent: { idpIntentId, idpIntentToken }
    },
    userAgent: await getRequestUserAgent(),
  };

  return handleZitadelRequest(
    () => zitadelApi.post("/v2/sessions", body),
    ZitadelCreateSessionResponseSchema
  );
}

export async function updateSession(
  sessionId: string,
  sessionToken: string,
  checks: any
): Promise<Result<z.infer<typeof ZitadelSessionResponseSchema>>> {
  const body = { sessionToken, checks };

  return handleZitadelRequest(
    () => zitadelApi.patch(`/v2/sessions/${sessionId}`, body),
    ZitadelSessionResponseSchema
  );
}

export async function createSessionWithPassword(
  loginName: string,
  password: string
): Promise<Result<z.infer<typeof ZitadelCreateSessionResponseSchema>>> {
  const useragent = await getRequestUserAgent();
  return handleZitadelRequest(
    () => zitadelApi.post("/v2/sessions", {
      checks: {
        user: { loginName },
        password: { password },
      },
      userAgent: useragent,
    }),
    ZitadelCreateSessionResponseSchema
  );
}

export const ZitadelGetSessionResponseSchema = z.object({
  session: ZitadelSessionSchema.optional(),
}).catchall(z.any());

export async function createSessionByUserId(
  userId: string
): Promise<Result<z.infer<typeof ZitadelCreateSessionResponseSchema>>> {
  const useragent = await getRequestUserAgent();
  return handleZitadelRequest(
    () => zitadelApi.post("/v2/sessions", {
      checks: { user: { userId } },
      userAgent: useragent,
    }),
    ZitadelCreateSessionResponseSchema
  );
}

export async function getSession(
  sessionId: string
): Promise<Result<z.infer<typeof ZitadelGetSessionResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.get(`/v2/sessions/${sessionId}`),
    ZitadelGetSessionResponseSchema
  );
}

export async function deleteSession(
  sessionId: string,
  sessionToken?: string
): Promise<Result<z.infer<typeof ZitadelGenericUpdateResponseSchema>>> {
  return handleZitadelRequest(
    () => zitadelApi.delete(`/v2/sessions/${sessionId}`, {
      data: sessionToken ? { sessionToken } : {},
    }),
    ZitadelGenericUpdateResponseSchema
  );
}
