import { build } from "esbuild";

await build({
  entryPoints: ["./src/index.ts"],
  platform: "node",
  format: "esm",
  bundle: true,
  minify: true,
  outdir: "dist/code",
  outExtension: { ".js": ".mjs" },
  banner: {
    js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
});
