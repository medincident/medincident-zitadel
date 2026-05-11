"server only";

import axios from "axios";
import type { AxiosError } from "axios";
import { Result, ResultError } from "@/domain/error";

import "./client";

// hey-api опция `throwOnError: true` кидает ошибки, зато видно, что происходит и в чем проблема
interface BackendErrorBody {
  code?: string;
  message?: string;
  details?: unknown;
}

export async function handleBackendRequest<T>(
  requestFn: () => Promise<{ data: T }>,
): Promise<Result<T>> {
  try {
    const { data } = await requestFn();
    return { success: true, data };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<BackendErrorBody>;
      const status = axiosError.response?.status;
      const body = axiosError.response?.data;

      let type: ResultError["type"] = "API_ERROR";
      if (!axiosError.response) {
        type = "NETWORK_ERROR";
      } else if (status === 401 || status === 403) {
        type = "AUTH_ERROR";
      }

      return {
        success: false,
        error: {
          type,
          message: body?.message ?? axiosError.message,
          code: body?.code ?? status ?? axiosError.code,
          details: body?.details ?? body ?? {
            axiosCode: axiosError.code,
            axiosMessage: axiosError.message,
            cause: (axiosError.cause as { code?: string; message?: string } | undefined) ?? undefined,
          },
        },
      };
    }

    return {
      success: false,
      error: {
        type: "ERROR",
        message: error instanceof Error ? error.message : "Произошла неизвестная системная ошибка",
        details: error instanceof Error ? { name: error.name, stack: error.stack } : error,
      },
    };
  }
}
