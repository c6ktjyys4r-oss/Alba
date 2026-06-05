import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

// =============================================================================
// Optional Analytics Plugin (retained - no Manus dependency)
// =============================================================================

function vitePluginOptionalAnalytics(): Plugin {
  return {
    name: "optional-analytics",
    transformIndexHtml(html) {
      const endpoint = process.env.VITE_ANALYTICS_ENDPOINT?.trim();
      const websiteId = process.env.VITE_ANALYTICS_WEBSITE_ID?.trim();

      if (!endpoint || !websiteId || endpoint.includes("%VITE_")) {
        return html.replace(
          /\s*<script\b[^>]*%VITE_ANALYTICS[^>]*>[\s\S]*?<\/script>\s*/i,
          "\n"
        );
      }

      return html
        .replace(/%VITE_ANALYTICS_ENDPOINT%/g, endpoint)
        .replace(/%VITE_ANALYTICS_WEBSITE_ID%/g, websiteId);
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginOptionalAnalytics(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
