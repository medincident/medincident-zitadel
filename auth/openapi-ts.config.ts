import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./medincident.swagger.json",
  output: "./lib/generated/openapi",
  plugins: [
    "@hey-api/typescript",
    "@hey-api/sdk",
    {
      name: "@hey-api/client-axios",
      runtimeConfigPath: "./services/backend/hey-api.runtime.ts",
    },
  ],
});
