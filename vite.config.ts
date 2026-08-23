import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

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
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});
