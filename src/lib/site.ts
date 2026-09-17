import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSite } from "./site-schema.mjs";

const configuredPath = process.env.TANEM_SITE_CONFIG || "site.json";
const absolutePath = resolve(process.cwd(), configuredPath);

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(absolutePath, "utf8"));
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  throw new Error(`Не удалось прочитать ${configuredPath}: ${detail}`);
}

export const site = validateSite(raw);

export const serviceCount = site.services.categories.reduce(
  (total, category) => total + category.services.length,
  0,
);

export function assetPath(path: string): string {
  if (/^(?:https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return path.replace(/^\/+/, "");
}

export function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const escapes: Record<string, string> = {
      "<": "\\u003c",
      ">": "\\u003e",
      "&": "\\u0026",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029",
    };
    return escapes[character];
  });
}

export function phoneContact() {
  return site.contacts.find((contact) => contact.type === "phone");
}

export function primaryContact() {
  return site.contacts.find((contact) => contact.primary) ||
    site.contacts.find((contact) => contact.type === "booking") ||
    site.contacts[0];
}

export function serviceWord(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "услуг";
  if (last === 1) return "услугу";
  if (last >= 2 && last <= 4) return "услуги";
  return "услуг";
}
