import { defineConfig } from "astro/config";

const base = process.env.TANEM_BASE || "/";

export default defineConfig({
  output: "static",
  base,
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
  vite: {
    build: {
      cssMinify: true,
      minify: "esbuild",
    },
  },
});
