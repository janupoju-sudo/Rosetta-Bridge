const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * Two independent bundles:
 *  1. The extension host code (Node runtime, `vscode` kept external).
 *  2. The webview UI script (browser runtime, deps bundled in).
 */
async function main() {
  const extensionCtx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [esbuildProblemMatcherPlugin("extension")],
  });

  const webviewCtx = await esbuild.context({
    entryPoints: ["src/webview/ui/main.ts"],
    bundle: true,
    format: "iife",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "browser",
    outfile: "dist/webview.js",
    logLevel: "silent",
    plugins: [esbuildProblemMatcherPlugin("webview")],
  });

  if (watch) {
    await Promise.all([extensionCtx.watch(), webviewCtx.watch()]);
  } else {
    await extensionCtx.rebuild();
    await webviewCtx.rebuild();
    await extensionCtx.dispose();
    await webviewCtx.dispose();
  }
}

/**
 * @param {string} label
 * @returns {import('esbuild').Plugin}
 */
function esbuildProblemMatcherPlugin(label) {
  return {
    name: "esbuild-problem-matcher",
    setup(build) {
      build.onStart(() => {
        console.log(`[${label}] build started`);
      });
      build.onEnd((result) => {
        result.errors.forEach(({ text, location }) => {
          console.error(`✘ [ERROR] ${text}`);
          if (location) {
            console.error(`    ${location.file}:${location.line}:${location.column}:`);
          }
        });
        console.log(`[${label}] build finished`);
      });
    },
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
