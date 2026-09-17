import { spawnSync } from "node:child_process";

const [repository, domain] = process.argv.slice(2);
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const domainPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

if (!repositoryPattern.test(repository || "")) {
  console.error("Использование: node scripts/configure-pages.mjs OWNER/REPO [site.tanem.ru]");
  process.exit(1);
}

if (domain && !domainPattern.test(domain)) {
  console.error("Домен указывается без https:// и без пути");
  process.exit(1);
}

const endpoint = `repos/${repository}/pages`;
const headers = [
  "-H", "Accept: application/vnd.github+json",
  "-H", "X-GitHub-Api-Version: 2026-03-10",
];

function run(args, options = {}) {
  const result = spawnSync("gh", ["api", ...headers, ...args], {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  return result;
}

const current = run([endpoint], { capture: true });
if (current.status !== 0) {
  const details = `${current.stdout || ""}\n${current.stderr || ""}`;
  if (!details.includes("404")) {
    process.stderr.write(details);
    process.exit(current.status || 1);
  }
  const created = run(["--method", "POST", endpoint, "-f", "build_type=workflow"]);
  if (created.status !== 0) process.exit(created.status || 1);
} else {
  const updated = run(["--method", "PUT", endpoint, "-f", "build_type=workflow"]);
  if (updated.status !== 0) process.exit(updated.status || 1);
}

if (domain) {
  const configured = run(["--method", "PUT", endpoint, "-f", "build_type=workflow", "-f", `cname=${domain}`]);
  if (configured.status !== 0) process.exit(configured.status || 1);
}

console.log(`✓ GitHub Pages настроен${domain ? `: https://${domain}/` : ""}`);
