"server only";

import type { CreateClientConfig } from "@/lib/generated/openapi/client.gen";
import { env } from "@/shared/config/env";

// hey-api инициализация
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseURL: env.API_URL,
});
