import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import checker from "vite-plugin-checker";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

function copySpessaSynthProcessor(): Plugin {
  return {
    name: "copy-spessasynth-processor",

    async buildStart() {
      const require = createRequire(import.meta.url);

      const packageRoot = dirname(require.resolve("spessasynth_lib/package.json"));

      const source = resolve(packageRoot, "dist/spessasynth_processor.min.js");

      const destination = resolve(process.cwd(), "public/audio/spessasynth_processor.min.js");

      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
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
