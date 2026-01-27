import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    conditions: ["development", "browser"],
    alias: [
      {
        find: /^lucide-solid\/icons\/.*/,
        replacement: resolve(
          __dirname,
          "./src/__mocks__/lucide-icon-default.tsx",
        ),
      },
      {
        find: "lucide-solid",
        replacement: resolve(__dirname, "./src/__mocks__/lucide-solid.tsx"),
      },
      {
        find: "virtual:pwa-register",
        replacement: resolve(__dirname, "./src/__mocks__/virtual-pwa-register.ts"),
      },
      {
        find: "~",
        replacement: resolve(__dirname, "./src"),
      },
    ],
  },
});
