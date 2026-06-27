import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base is './' so the built app works both on GitHub Pages and when
// the dist/ folder is opened/served from any sub-path.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
