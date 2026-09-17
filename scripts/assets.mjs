import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";

const imageExtension = /\.(?:avif|gif|jpe?g|png|svg|webp)$/i;

export function collectLocalAssets(input, result = new Set()) {
  if (typeof input === "string") {
    if (imageExtension.test(input) && !/^(?:https?:)?\/\//i.test(input) && !input.startsWith("data:")) {
      result.add(normalizeAssetPath(input));
    }
    return result;
  }

  if (Array.isArray(input)) {
    for (const value of input) collectLocalAssets(value, result);
    return result;
  }

  if (input && typeof input === "object") {
    for (const value of Object.values(input)) collectLocalAssets(value, result);
  }

  return result;
}

export function normalizeAssetPath(value) {
  const normalized = value.replace(/^\/+/, "").replaceAll("\\", "/");
  if (!normalized.startsWith("assets/") || normalized.includes("../") || normalized === "assets") {
    throw new Error(`Локальный файл должен находиться внутри assets/: ${value}`);
  }
  return normalized;
}

export function resolveInside(root, relativePath) {
  const absoluteRoot = resolve(root);
  const absolutePath = resolve(absoluteRoot, relativePath);
  if (absolutePath !== absoluteRoot && !absolutePath.startsWith(`${absoluteRoot}${sep}`)) {
    throw new Error(`Недопустимый путь к файлу: ${relativePath}`);
  }
  return absolutePath;
}

export function findAssetSource(projectRoot, asset) {
  const roots = ["source-assets", "fixtures"];
  for (const root of roots) {
    const candidate = resolveInside(resolve(projectRoot, root), asset);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}
