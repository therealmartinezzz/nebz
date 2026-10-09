import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" Next.js xaricində xəta atır — testlərdə boş modul.
      "server-only": path.resolve(__dirname, "tests/support/empty.ts"),
    },
  },
  test: {
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // İnteqrasiya testləri ortaq demo bazasına yazır — ardıcıl işləsin.
    fileParallelism: false,
  },
});
