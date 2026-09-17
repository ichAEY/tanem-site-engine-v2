import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { collectLocalAssets, findAssetSource } from "./assets.mjs";

const projectRoot = process.cwd();
const configPath = process.env.TANEM_SITE_CONFIG || "site.json";
const absoluteConfigPath = resolve(projectRoot, configPath);
const publicAssets = resolve(projectRoot, "public", "assets");
const distAssets = resolve(projectRoot, "dist", "assets");

const site = JSON.parse(await readFile(absoluteConfigPath, "utf8"));
const assets = [...collectLocalAssets(site)].sort();
const missing = assets.filter((asset) => !findAssetSource(projectRoot, asset));

if (missing.length) {
  console.error(`Для ${configPath} отсутствуют исходные изображения:`);
  for (const asset of missing) console.error(`  - source-assets/${asset}`);
  process.exit(1);
}

await rm(publicAssets, { recursive: true, force: true });
await rm(distAssets, { recursive: true, force: true });

console.log(`✓ Проверено изображений: ${assets.length}`);
