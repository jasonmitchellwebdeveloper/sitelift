import { defineConfig } from "vitest/config";

export default defineConfig({
  // Do not read .env files, including .env.local, for tests.
  envDir: false,
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
