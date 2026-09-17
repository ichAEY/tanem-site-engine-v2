import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { siteSchema } from "../src/lib/site-schema.mjs";

const target = resolve(process.cwd(), "site.schema.json");
const generated = z.toJSONSchema(siteSchema, { target: "draft-7", io: "input" });
const output = `${JSON.stringify({
  $id: "https://raw.githubusercontent.com/ichAEY/tanem-site-engine-v2/v0.1.0/site.schema.json",
  title: "TANEM master site data v2",
  ...generated,
}, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    console.error("site.schema.json устарел — выполните npm run schema");
    process.exit(1);
  }
  console.log("✓ site.schema.json синхронизирован");
} else {
  await writeFile(target, output);
  console.log("✓ site.schema.json обновлён");
}
