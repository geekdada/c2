import { builtinModules } from "node:module";

import { defineConfig } from "vite";

const external = ["electron", ...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

export default defineConfig({
  build: {
    lib: {
      entry: "./electron/main.ts",
      formats: ["es"],
      fileName: () => "main.js",
    },
    outDir: ".vite/build",
    rollupOptions: {
      external,
    },
  },
});
