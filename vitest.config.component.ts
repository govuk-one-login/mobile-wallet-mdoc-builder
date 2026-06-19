import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/component/**/*.test.ts", "tests/component/**/*.test.cjs"],
    environment: "node",
    // Required for the CJS consumer test (.test.cjs) — vitest is pure ESM and
    // cannot be require()d, so the CJS file relies on injected globals instead.
    globals: true,
  },
});
