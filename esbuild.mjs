import { build } from "esbuild";
import path from "node:path";

const distDir = "./dist";

await build({
  entryPoints: ["./src/index.ts"],
  outdir: `${distDir}/src`,
  platform: "node",
  format: "esm",
  bundle: true,
  minify: true,
  outExtension: { ".js": ".mjs" },
  banner: {
    js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
});

console.log(path.resolve(distDir));
