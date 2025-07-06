import { watch } from "fs";
import { Miniflare } from "miniflare";
import { build } from "esbuild";
import { Log } from "miniflare";

const ENTRY_FILE = "src/index.ts";
const DIST_FILE = "dist/index.js";

// 初始构建
async function rebuild() {
  console.log("[build] Rebuilding...");
  await build({
    entryPoints: [ENTRY_FILE],
    outfile: DIST_FILE,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    sourcemap: true,
  });
}

let mf;

async function startMiniflare() {
  mf = new Miniflare({
    scriptPath: DIST_FILE,
    modules: true,
    port: 8787,
    log: new Log("debug"),
    kvNamespaces: ["MY_KV"],
    r2Buckets: ["MY_BUCKET"],
  });
  console.log("[miniflare] Listening at http://localhost:8787");
}

await rebuild();
await startMiniflare();

// 热更新：监听 src 下文件变化
watch("src", { recursive: true }, async (eventType, filename) => {
  console.log(eventType, filename);

  await rebuild();
  await mf.setOptions({ scriptPath: DIST_FILE });
  console.log("[miniflare] Reloaded worker.");
});
