import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import electron from "vite-plugin-electron";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainEntry = path.resolve(__dirname, "electron/main.ts");
const preloadEntry = path.resolve(__dirname, "electron/preload.ts");
const external = [
  "electron",
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: mainEntry,
        vite: {
          build: {
            outDir: "dist-electron/main",
            sourcemap: true,
            lib: {
              entry: mainEntry,
              formats: ["es"],
              fileName: () => "index.js",
            },
            rolldownOptions: {
              external,
            },
          },
        },
      },
      {
        entry: preloadEntry,
        onstart({ reload }) {
          reload();
        },
        vite: {
          build: {
            outDir: "dist-electron/preload",
            sourcemap: true,
            lib: {
              entry: preloadEntry,
              formats: ["cjs"],
              fileName: () => "index.cjs",
            },
            rolldownOptions: {
              external,
              output: {
                codeSplitting: false,
              },
            },
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
    css: true,
    exclude: ["e2e/**", "node_modules/**"],
  },
});
