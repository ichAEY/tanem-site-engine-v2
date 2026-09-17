import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { collectLocalAssets, findAssetSource, resolveInside } from "./assets.mjs";

const dist = resolve(process.cwd(), "dist");
const configPath = process.env.TANEM_SITE_CONFIG || "site.json";
const site = JSON.parse(await readFile(resolve(process.cwd(), configPath), "utf8"));
const assets = [...collectLocalAssets(site)].sort();

for (const asset of assets) {
  const source = findAssetSource(process.cwd(), asset);
  if (!source) throw new Error(`Не найдено исходное изображение: ${asset}`);

  const target = resolveInside(dist, asset);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}

await writeFile(resolve(dist, ".nojekyll"), "");

async function collectFiles(directory, result = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await collectFiles(path, result);
    else result.push(path);
  }
  return result;
}

const files = await collectFiles(dist);
const codeFiles = files.filter((file) => /\.(?:css|html|js)$/.test(file));
const html = await readFile(resolve(dist, "index.html"), "utf8");
const fileSizes = await Promise.all(files.map(async (file) => ({ file, size: (await stat(file)).size })));
const codeFileSet = new Set(codeFiles);
const codeBytes = fileSizes
  .filter(({ file }) => codeFileSet.has(file))
  .reduce((sum, { size }) => sum + size, 0);
const totalBytes = fileSizes.reduce((sum, { size }) => sum + size, 0);
const oversizedImages = fileSizes.filter(({ file, size }) => /\.(?:avif|webp)$/i.test(file) && size > 450 * 1024);
const expectedAssets = new Set(assets.map((asset) => resolve(dist, asset)));
const builtAssets = new Set(fileSizes
  .filter(({ file }) => file.startsWith(`${resolve(dist, "assets")}/`))
  .map(({ file }) => file));
const missingAssets = [...expectedAssets].filter((file) => !builtAssets.has(file));
const extraAssets = [...builtAssets].filter((file) => !expectedAssets.has(file));
const totalServices = site.services.categories.reduce((sum, category) => sum + category.services.length, 0);
const usesAllCategory = site.specialty === "hair" && site.services.categories.length > 2;
const occurrenceCount = (value) => (html.match(new RegExp(value, "g")) || []).length;
const globalButtonCount = occurrenceCount("data-show-all-services");
const categoryButtonCount = occurrenceCount("data-show-more(?=[\\s>])");
const mobileExtraCount = occurrenceCount('data-extra-all-mobile="true"');
const desktopExtraCount = occurrenceCount('data-extra-all-desktop="true"');
const categoryExtraCount = occurrenceCount('data-extra-service="true"');

const maxCodeBytes = 260 * 1024;
if (codeBytes > maxCodeBytes) {
  throw new Error(`HTML/CSS/JS весят ${Math.round(codeBytes / 1024)} КБ — лимит ${Math.round(maxCodeBytes / 1024)} КБ`);
}

if (totalBytes > 4 * 1024 * 1024) {
  throw new Error(`Сайт весит ${Math.round(totalBytes / 1024 / 1024 * 10) / 10} МБ — лимит 4 МБ`);
}

if (oversizedImages.length) {
  throw new Error(`Изображение тяжелее 450 КБ: ${oversizedImages[0].file}`);
}

if (missingAssets.length) {
  throw new Error(`В сборке отсутствует изображение: ${missingAssets[0]}`);
}

if (extraAssets.length) {
  throw new Error(`В сборку попало чужое изображение: ${extraAssets[0]}`);
}

if (usesAllCategory) {
  const expectedGlobalButtons = totalServices > 6 ? 1 : 0;
  if (globalButtonCount !== expectedGlobalButtons || categoryButtonCount !== 0) {
    throw new Error("Неверный режим списка услуг для мастера по волосам");
  }
  if (mobileExtraCount !== Math.max(0, totalServices - 6) || desktopExtraCount !== Math.max(0, totalServices - 9)) {
    throw new Error("Неверные лимиты списка услуг для мастера по волосам");
  }
} else {
  const expectedCategoryButtons = site.services.categories.filter((category) => category.services.length > 5).length;
  const expectedCategoryExtras = site.services.categories.reduce(
    (sum, category) => sum + Math.max(0, category.services.length - 5),
    0,
  );
  if (globalButtonCount !== 0 || mobileExtraCount !== 0 || desktopExtraCount !== 0) {
    throw new Error("В обычном прайсе ошибочно включён общий список услуг");
  }
  if (categoryButtonCount !== expectedCategoryButtons || categoryExtraCount !== expectedCategoryExtras) {
    throw new Error("Неверное сворачивание услуг по категориям");
  }
}

console.log(`✓ Статическая сборка: ${Math.round(codeBytes / 1024)} КБ кода, ${Math.round(totalBytes / 1024)} КБ целиком`);
