import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { rollup } from "rollup";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import esbuild from "rollup-plugin-esbuild";

const plugin = "revenge-backup";
const sourceRoot = `src/plugins/${plugin}`;
const outputRoot = `dist/${plugin}`;
const outputFile = `${outputRoot}/index.js`;

await mkdir(outputRoot, { recursive: true });

const manifest = JSON.parse(await readFile(`${sourceRoot}/manifest.json`, "utf8"));
const bundle = await rollup({
  input: `${sourceRoot}/${manifest.main}`,
  external: id => id === "react" || id === "react/jsx-runtime" || id.startsWith("@vendetta"),
  onwarn: () => {},
  plugins: [
    nodeResolve(),
    commonjs(),
    esbuild({
      jsx: "automatic",
      minify: true,
      target: "es2020",
      loaders: {
        ".ts": "ts",
        ".tsx": "tsx",
      },
    }),
  ],
});

await bundle.write({
  file: outputFile,
  format: "iife",
  compact: true,
  exports: "named",
  globals(id) {
    if (id === "react") return "window.React";
    if (id === "react/jsx-runtime") return "window.React";
    if (id.startsWith("@vendetta")) return id.substring(1).replace(/\//g, ".");
    return id;
  },
});
await bundle.close();

const compiledPlugin = await readFile(outputFile);
manifest.hash = createHash("sha256").update(compiledPlugin).digest("hex");
manifest.main = "index.js";
await writeFile(`${outputRoot}/manifest.json`, JSON.stringify(manifest));
