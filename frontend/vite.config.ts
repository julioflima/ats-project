import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    // Dev-mode counterpart of the Caddy /graphql proxy used in the built image.
    proxy: {
      "/graphql": "http://localhost:8000",
      "/api": "http://localhost:8000",
    },
  },
});
