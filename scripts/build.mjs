import { mkdir, copyFile } from "node:fs/promises";
import { build } from "esbuild";

const plugin = "revenge-backup";
const sourceRoot = `src/plugins/${plugin}`;
const outputRoot = `dist/${plugin}`;

await mkdir(outputRoot, { recursive: true });

await build({
  entryPoints: [`${sourceRoot}/src/index.tsx`],
  bundle: true,
  format: "iife",
  globalName: "revengeBackupPlugin",
  outfile: `${outputRoot}/index.js`,
  external: ["@vendetta", "@vendetta/*", "react", "react/*", "react-native", "react-native/*"],
  jsx: "automatic",
  loader: { ".ts": "ts", ".tsx": "tsx" },
  sourcemap: false,
  minify: false,
});

await copyFile(`${sourceRoot}/manifest.json`, `${outputRoot}/manifest.json`);
