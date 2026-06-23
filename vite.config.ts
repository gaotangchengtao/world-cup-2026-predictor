import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "docs",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("officialSquads.json")) return "squads-data";
          if (id.includes("playerTournamentStats.json")) return "stats-data";
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) return "react-vendor";
            if (id.includes("lucide-react") || id.includes("lucide")) return "icons";
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});
