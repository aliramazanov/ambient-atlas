import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },

      // Static SPA build. The app is client-rendered (Three.js is browser only),
      // so we ship a fallback shell and route entirely on the client.
      adapter: adapter({ fallback: "index.html" }),
    }),
  ],
});
