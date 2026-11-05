import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `--mode single` inlines every script, style and font into one shareable index.html.
export default defineConfig(({ mode }) => {
  const single = mode === "single";
  return {
    base: "./",
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    build: {
      outDir: single ? "dist-single" : "dist",
      assetsInlineLimit: single ? 100_000_000 : 4096,
    },
    test: { environment: "node", globals: true, include: ["src/**/*.test.ts"] },
  };
});
