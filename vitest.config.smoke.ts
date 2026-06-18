import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/component/**/*.test.ts", "tests/component/**/*.test.cjs"],
    environment: "node",
    globals: true,
  },
});
