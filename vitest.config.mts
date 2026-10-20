import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Do not read .env files, including .env.local, for tests.
  envDir: false,
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/server-only.ts", import.meta.url),
      ),
    },
  },
});
