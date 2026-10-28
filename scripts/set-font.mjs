import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (args[0] === "--") args.shift();
const [fontPackage, fontFamily, ...extraArgs] = args;

if (
  extraArgs.length > 0 ||
  !fontPackage ||
  !/^@fontsource(?:-variable)?\/[a-z0-9][a-z0-9._-]*$/.test(fontPackage) ||
  !fontFamily ||
  !/^[\p{L}\p{N} _.-]+$/u.test(fontFamily)
) {
  console.error(
    'Usage: pnpm font:set -- @fontsource/<font-package> "<Font Family>"',
  );
  process.exit(1);
}

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const currentPackages = Object.keys(packageJson.dependencies).filter((name) =>
  /^@fontsource(?:-variable)?\//.test(name),
);

if (currentPackages.length !== 1) {
  throw new Error(
    `Expected exactly one Fontsource dependency, found ${currentPackages.length}.`,
  );
}

const currentPackage = currentPackages[0];
const mainPath = new URL("../src/main.tsx", import.meta.url);
const appPath = new URL("../src/components/App.tsx", import.meta.url);
const cssPath = new URL("../src/index.css", import.meta.url);
const main = readFileSync(mainPath, "utf8");
const app = readFileSync(appPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const importPattern = new RegExp(
  `import\\s+${JSON.stringify(currentPackage).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*;`,
);
const appFamily = app.match(/fontFamily:\s*"([^"]+)"/);
const cssFamily = css.match(/font-family:\s*'([^']+)'(?:,\s*([^;]+))?;/);

if (
  !importPattern.test(main) ||
  !appFamily ||
  !cssFamily ||
  appFamily[1] !== cssFamily[1]
) {
  throw new Error("Could not find matching Fontsource and font family settings.");
}

if (fontPackage !== currentPackage) {
  execFileSync("pnpm", ["add", fontPackage], { cwd: root, stdio: "inherit" });
  execFileSync("pnpm", ["remove", currentPackage], {
    cwd: root,
    stdio: "inherit",
  });
}

writeFileSync(
  mainPath,
  main.replace(importPattern, `import ${JSON.stringify(fontPackage)};`),
);
writeFileSync(
  appPath,
  app.replace(appFamily[0], `fontFamily: ${JSON.stringify(fontFamily)}`),
);
writeFileSync(
  cssPath,
  css.replace(
    cssFamily[0],
    `font-family: '${fontFamily}'${cssFamily[2] ? `, ${cssFamily[2]}` : ""};`,
  ),
);

console.log(`Replaced ${currentPackage} with ${fontPackage} (${fontFamily}).`);
