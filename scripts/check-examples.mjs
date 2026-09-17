import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSite } from "../src/lib/site-schema.mjs";

const expectations = [
  { file: "examples/nonna.json", specialty: "nails", categories: 2, services: 20 },
  { file: "examples/tahmina.json", specialty: "nails", categories: 4, services: 31 },
  { file: "examples/julia.json", specialty: "hair", categories: 4, services: 23 },
];

for (const expected of expectations) {
  const raw = JSON.parse(readFileSync(resolve(process.cwd(), expected.file), "utf8"));
  const site = validateSite(raw);
  const serviceCount = site.services.categories.reduce((sum, category) => sum + category.services.length, 0);

  if (site.specialty !== expected.specialty) throw new Error(`${expected.file}: неверная специализация`);
  if (site.services.categories.length !== expected.categories) throw new Error(`${expected.file}: неверное число категорий`);
  if (serviceCount !== expected.services) throw new Error(`${expected.file}: неверное число услуг`);
  if ("showAllCategory" in raw.services) throw new Error(`${expected.file}: вкладка «Все» должна определяться специализацией автоматически`);

  if (site.specialty === "hair") {
    const categoryLabels = site.services.categories.map((category) => category.label);
    const forbidden = ["Маникюр", "Педикюр", "Подология"];
    if (forbidden.some((label) => categoryLabels.includes(label))) {
      throw new Error("Julia: в данных волос остались ногтевые категории");
    }
    const hasVariants = site.services.categories.some((category) =>
      category.services.some((service) => service.price.type === "variants"),
    );
    if (!hasVariants) throw new Error("Julia: потеряны цены по длине волос");
  }

  console.log(`✓ ${expected.file}`);
}
