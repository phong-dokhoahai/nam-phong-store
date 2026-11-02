import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import svgr from "vite-plugin-svgr";

/**
 * Emits `sw-manifest.js` (imported by `public/sw.js`): the build's asset list
 * to precache and a version derived from it. Every build with changed assets
 * gets a new version, so the browser installs the new service worker.
 */
function pwaManifestPlugin(): Plugin {
  return {
    name: "nam-phong-pwa-manifest",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter(
          (fileName) =>
            !fileName.endsWith(".map") && !fileName.endsWith(".html"),
        )
        .sort()
        .map((fileName) => `/${fileName}`);
      let hash = 5381;
      for (const char of assets.join("|")) {
        hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0;
      }
      const manifest = { version: hash.toString(36), assets };

      this.emitFile({
        type: "asset",
        fileName: "sw-manifest.js",
        source: `self.__PWA_MANIFEST__ = ${JSON.stringify(manifest)};\n`,
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
    pwaManifestPlugin(),
  ],
  build: {
    rolldownOptions: {
      onwarn(warning, warn) {
        // Skip eval warnings from react-jvectormap
        if (
          warning.code === "EVAL" &&
          warning.id?.includes("@react-jvectormap")
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
});
