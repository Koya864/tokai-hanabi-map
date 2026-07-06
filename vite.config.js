import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // カスタムドメイン(tokai-hanabi.lifeshift-group.com)直下で配信するため base は "/"
  base: "/",
  server: { port: 5175 },
});
