import { mkdir, readFile, writeFile } from "node:fs/promises";
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

const manifest = JSON.parse(await readFile(`${sourceRoot}/manifest.json`, "utf8"));
manifest.main = "index.js";
await writeFile(`${outputRoot}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
