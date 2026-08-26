import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Predictable, non-hashed filenames so the Thymeleaf template can
// reference chess-app.js and chess-app.css directly without needing
// to read a manifest on the server side.
export default defineConfig(({ command }) => {
  const isThymeleafBuild = command === "build" && process.env.DEPLOY_TARGET === "thymeleaf";

  return {
    plugins: [react()],
    // Standalone deploys (Vercel, Netlify, GitHub Pages, `npm run dev`)
    // serve from the root, so base stays "/". Only the Thymeleaf embed
    // build (`npm run build:thymeleaf`) needs the "/chess/" prefix to
    // match the static resource path on the Java server.
    base: isThymeleafBuild ? "/chess/" : "/",
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          entryFileNames: "chess-app.js",
          chunkFileNames: "chess-app-[name].js",
          assetFileNames: (info) =>
            info.name && info.name.endsWith(".css") ? "chess-app.css" : "assets/[name][extname]",
        },
      },
    },
    server: {
      port: 5173,
    },
    optimizeDeps: {
      // Prevent Vite from scanning other .html files in this folder
      // (like the Thymeleaf template) during dev.
      entries: ["index.html"],
    },
  };
});
