"server only";

import { client } from "@/lib/generated/openapi/client.gen";
import { auth } from "@/services/zitadel/user/auth";
import { type LogBodyMode, logRequest, logResponse, logResponseError } from "@/shared/lib/http-logger";

const LOG_BODY: LogBodyMode = "compact";
const LOG_HEADERS = false;
const TAG = "[backend]";

client.instance.interceptors.request.use(async (config) => {
  const session = await auth();
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    console.warn("[backend] accessToken ОТСУТСТВУЕТ! session=%s, error=%s",
      session ? "exists" : "null", (session as { error?: string } | null)?.error);
  }
  return config;
});

client.instance.interceptors.request.use((config) => {
  (config as { _startTime?: number })._startTime = Date.now();
  console.log(TAG);
  logRequest(
    config.method ?? "?", config.url ?? "",
    config.data, LOG_BODY,
    LOG_HEADERS ? (config.headers as unknown as Record<string, unknown>) : undefined, LOG_HEADERS,
  );
  return config;
});

client.instance.interceptors.response.use(
  (response) => {
    const ms = Date.now() - ((response.config as { _startTime?: number })._startTime ?? Date.now());
    console.log(TAG);
    logResponse(
      response.config.method ?? "?", response.config.url ?? "",
      response.status, ms,
      response.data, LOG_BODY,
      LOG_HEADERS ? (response.headers as unknown as Record<string, unknown>) : undefined, LOG_HEADERS,
    );
    return response;
  },
  (error) => {
    const config = error.config ?? {};
    const ms = Date.now() - ((config as { _startTime?: number })._startTime ?? Date.now());
    console.error(TAG);
    logResponseError(
      config.method ?? "?", config.url ?? "",
      error.response?.status ?? "ERR", ms,
      error.response?.data, LOG_BODY,
      LOG_HEADERS ? (error.response?.headers as Record<string, unknown>) : undefined, LOG_HEADERS,
    );
    return Promise.reject(error);
  },
);
