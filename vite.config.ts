import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/blitz-league/",
  plugins: [react()],
});
