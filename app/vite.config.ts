import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        // Los demos (~13 MB de video) se cachean a demanda desde sw.ts, no
        // en el precache del app shell: ver src/sw.ts para el por qué.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      injectRegister: false,
      manifest: {
        name: "SanWoot",
        short_name: "SanWoot",
        description: "Acompaña a San en sus entrenamientos de fuerza, con o sin conexión.",
        start_url: "/",
        display: "standalone",
        background_color: "#FAF6F0",
        theme_color: "#6B46C1",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
