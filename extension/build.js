const esbuild = require("esbuild");

async function build() {
  await esbuild.build({
    entryPoints: ["src/background.js"],
    bundle: true,
    outfile: "background.js",
    format: "iife",
  });
  await esbuild.build({
    entryPoints: ["src/popup.js"],
    bundle: true,
    outfile: "dashboard/popup.js",
    format: "iife",
    minify: true,
    legalComments: "none",
  });
  await esbuild.build({
    entryPoints: ["src/stats.js"],
    bundle: true,
    outfile: "dashboard/stats.js",
    format: "iife",
    minify: true,
    legalComments: "none",
  });
  console.log("Build done: background.js, dashboard/popup.js, dashboard/stats.js");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
