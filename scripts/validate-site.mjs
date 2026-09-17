import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { validateSite } from "../src/lib/site-schema.mjs";
import { collectLocalAssets, findAssetSource } from "./assets.mjs";

const configPath = process.env.TANEM_SITE_CONFIG || "site.json";
const absoluteConfigPath = resolve(process.cwd(), configPath);

try {
  const raw = JSON.parse(readFileSync(absoluteConfigPath, "utf8"));
  const site = validateSite(raw);
  const assets = collectLocalAssets(site);
  const missingAssets = [...assets].filter((asset) => !findAssetSource(process.cwd(), asset));

  if (missingAssets.length) {
    console.error(`В ${configPath} отсутствуют файлы:`);
    for (const asset of missingAssets) console.error(`  - source-assets/${asset}`);
    process.exit(1);
  }

  const serviceCount = site.services.categories.reduce((sum, category) => sum + category.services.length, 0);
  console.log(`✓ ${site.master.name}: ${site.services.categories.length} категорий, ${serviceCount} услуг, ${assets.size} изображений`);
} catch (error) {
  if (error instanceof ZodError) {
    console.error(`Ошибки в ${configPath}:`);
    for (const issue of error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exit(1);
}
