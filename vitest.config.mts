import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.{ts,tsx}"], environment: "node", testTimeout: 120000 /* Full SVG contact matrices exceed Vitest’s 5s default when native builds share this Mac. Assertions are unchanged. */ } });
