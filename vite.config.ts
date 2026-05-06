import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { APP_REPO_SLUG } from "./src/lib/appConstants";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? `/${APP_REPO_SLUG}/` : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true
  }
});
