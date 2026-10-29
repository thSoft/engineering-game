import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import { flattenSvgUse } from "./build/flattenSvgUse.ts";
import { copySpessaSynthProcessor } from "./build/copySpessaSynthProcessor.ts";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/engineering-game/",
  plugins: [
    flattenSvgUse(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    checker({
      typescript: {
        tsconfigPath: "./tsconfig.app.json",
      },
    }),
    copySpessaSynthProcessor(),
  ],
  css: {
    modules: {
      localsConvention: "dashes",
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});
