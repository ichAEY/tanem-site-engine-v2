import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const configPath = process.env.TANEM_SITE_CONFIG || "site.json";
const site = JSON.parse(await readFile(resolve(process.cwd(), configPath), "utf8"));
const repository = process.env.GITHUB_REPOSITORY || "";
const repositoryName = repository.split("/")[1];

if (!site.deployment?.customDomain && !repositoryName) {
  throw new Error("Нет customDomain и переменной GITHUB_REPOSITORY");
}

const base = site.deployment?.customDomain ? "/" : `/${repositoryName}/`;
process.stdout.write(`TANEM_BASE=${base}\n`);
