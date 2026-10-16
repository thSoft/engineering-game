import type { Plugin } from "vite";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { copyFile, mkdir } from "node:fs/promises";

/**
 * Vite plugin that copies the spessasynth_processor.min.js file from the spessasynth_lib package
 * to the public directory of the current project.
 * This is necessary because the spessasynth_processor.min.js file is required for the
 * SpessaSynth audio engine to function correctly in the browser.
 * See https://spessasus.github.io/spessasynth_lib/synthesizer/importing-the-worklet/.
 *
 * Usage:
 * - In your Vite config, add the plugin:
 * <pre>
 *   import { copySpessaSynthProcessor } from "./build/copySpessaSynthProcessor.ts";
 *   export default defineConfig({
 *     plugins: [copySpessaSynthProcessor(), ...otherPlugins],
 *   });
 * </pre>
 */
export function copySpessaSynthProcessor(): Plugin {
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
