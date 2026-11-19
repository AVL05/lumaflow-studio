// Fails when an emitted JS chunk exceeds its size budget (raw kB, as reported by the build).
// `lib-*` is WebLLM: loaded on demand by the local-AI feature and excluded from the PWA precache.
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const assetsDir = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const KB = 1000;
const budgets = [
  { match: /^index-.*\.js$/, maxKb: 520, label: "entry chunk" },
  { match: /^AnalyticsPage-.*\.js$/, maxKb: 450, label: "analytics (Recharts, lazy route)" },
  { match: /^(?!lib-).*\.js$/, maxKb: 450, label: "any other chunk" },
];

const failures = [];
for (const name of readdirSync(assetsDir)) {
  if (!name.endsWith(".js") || name.startsWith("lib-")) continue;
  const sizeKb = statSync(join(assetsDir, name)).size / KB;
  const budget = budgets.find((entry) => entry.match.test(name));
  if (budget && sizeKb > budget.maxKb) {
    failures.push(`${name}: ${sizeKb.toFixed(1)} kB > ${budget.maxKb} kB (${budget.label})`);
  }
}

if (failures.length > 0) {
  console.error(`Bundle budget exceeded:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Bundle budget OK");
