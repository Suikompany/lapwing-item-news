import { build } from "esbuild";
import path from "node:path";

const outDir = "./dist/src";

await build({
  entryPoints: ["./src/index.ts"],
  platform: "node",
  format: "esm",
  bundle: true,
  minify: true,
  outdir: outDir,
  outExtension: { ".js": ".mjs" },
  banner: {
    js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
});

console.log(path.resolve(outDir));
