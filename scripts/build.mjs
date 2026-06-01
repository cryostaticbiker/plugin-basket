import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

async function importBuildDependencies() {
  try {
    const [{ rollup }, { default: commonjs }, { default: nodeResolve }, { default: esbuild }] = await Promise.all([
      import("rollup"),
      import("@rollup/plugin-commonjs"),
      import("@rollup/plugin-node-resolve"),
      import("rollup-plugin-esbuild"),
    ]);

    return { rollup, commonjs, nodeResolve, esbuild };
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;

    console.error(`\nMissing build dependency: ${error.message}\n\nRun this once before building:\n\n  npm install\n\nThen run:\n\n  npm run build\n`);
    process.exit(1);
  }
}

const { rollup, commonjs, nodeResolve, esbuild } = await importBuildDependencies();

const plugin = "revenge-backup";
const sourceRoot = `src/plugins/${plugin}`;
const outputRoot = `dist/${plugin}`;
const outputFile = `${outputRoot}/index.js`;

await mkdir(outputRoot, { recursive: true });

const manifest = JSON.parse(await readFile(`${sourceRoot}/manifest.json`, "utf8"));
const bundle = await rollup({
  input: `${sourceRoot}/${manifest.main}`,
  external: id => id === "react" || id.startsWith("@vendetta"),
  onwarn: () => {},
  plugins: [
    nodeResolve(),
    commonjs(),
    esbuild({
      jsx: "transform",
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
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
    if (id.startsWith("@vendetta")) return id.substring(1).replace(/\//g, ".");
    return id;
  },
});
await bundle.close();

const compiledPlugin = await readFile(outputFile);
manifest.hash = createHash("sha256").update(compiledPlugin).digest("hex");
manifest.main = "index.js";
await writeFile(`${outputRoot}/manifest.json`, JSON.stringify(manifest));
