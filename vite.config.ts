import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages (project pages) では相対パスで参照する
  base: "./",
  build: {
    target: "es2022",
  },
});
