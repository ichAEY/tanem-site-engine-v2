import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

test("build contains current client data", () => {
  assert.match(html, /Нонна/);
  assert.match(html, /Комбо — маникюр \+ педикюр/);
  assert.match(html, /data-category-tab="manicure"/);
});

test("build contains no legacy runtime", () => {
  assert.doesNotMatch(html, /_next\/static/);
  assert.doesNotMatch(html, /claytone-enhancements/);
  assert.doesNotMatch(html, /patch-(?:tahmina|yulia)/);
});

test("build includes accessibility and responsive hooks", () => {
  assert.match(html, /aria-label="Категории услуг"/);
  assert.match(html, /data-gallery-dialog/);
  assert.match(html, /data-show-more/);
  assert.doesNotMatch(html, /data-show-all-services/);
  assert.match(html, /name="viewport"/);
});

test("configured Yandex Metrika counter is included", () => {
  assert.match(html, /mc\.yandex\.ru\/metrika\/tag\.js/);
  assert.match(html, /ym\(111558185,"init"/);
});

test("build contains assets only for the selected client", async () => {
  await access(new URL("../dist/assets/examples/nonna/nonna-portrait.webp", import.meta.url));
  await assert.rejects(access(new URL("../dist/assets/examples/julia/master.webp", import.meta.url)));
  await assert.rejects(access(new URL("../dist/assets/examples/tahmina/master.webp", import.meta.url)));
});
