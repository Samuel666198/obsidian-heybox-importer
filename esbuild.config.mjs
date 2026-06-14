import esbuild from "esbuild";
import process from "process";

const prod = process.argv[2] === "production";

await esbuild.build({
  entryPoints: ["main.ts"],
  bundle: true,
  external: [
    "obsidian", "electron", "@codemirror/*", "@lezer/*",
  ],
  format: "cjs",
  target: "es2018",
  platform: "node",
  outfile: "main.js",
  minify: prod,
  sourcemap: prod ? false : "inline",
});
console.log("Build complete");