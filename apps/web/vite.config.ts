import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isPagesBuild = process.env.GITHUB_REPOSITORY === "Saithej2k/ContextBoard";

export default defineConfig({
  base: isPagesBuild ? "/ContextBoard/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom"
  }
});

