import { readFileSync, appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const knownAdvisory = "https://github.com/advisories/GHSA-gcqx-w48m-w2h4";
const buildPath =
  "frontend>vite-plugin-pwa>workbox-build>@rollup/plugin-node-resolve>deepmerge";

export function checkAudit(audit, exitCode) {
  if (
    ![0, 1].includes(exitCode) ||
    !audit ||
    audit.error ||
    !audit.advisories ||
    typeof audit.advisories !== "object" ||
    Array.isArray(audit.advisories) ||
    !audit.metadata?.vulnerabilities
  ) {
    throw new Error("Security audit did not produce a valid report.");
  }
  const advisories = Object.values(audit.advisories);
  const total = Object.values(audit.metadata.vulnerabilities).reduce(
    (sum, count) => sum + count,
    0,
  );
  if (
    !Number.isSafeInteger(total) ||
    total !== advisories.length ||
    audit.metadata.vulnerabilities.low !== advisories.length ||
    exitCode !== (advisories.length ? 1 : 0)
  ) {
    throw new Error("Security audit status and findings disagree.");
  }
  const warnings = [];
  for (const advisory of advisories) {
    // shortcut: upstream has no patch; remove this exact build exception when fixed (#49).
    const permitted =
      advisory.module_name === "deepmerge" &&
      advisory.severity === "low" &&
      advisory.url === knownAdvisory &&
      advisory.patched_versions === "<0.0.0" &&
      advisory.findings?.length === 1 &&
      advisory.findings[0].version === "4.3.1" &&
      advisory.findings[0].paths?.length === 1 &&
      advisory.findings[0].paths[0] === buildPath;
    if (!permitted)
      throw new Error(
        `Unaccepted security advisory: ${advisory.url ?? "unknown"}`,
      );
    warnings.push(
      `Known unpatched LOW build advisory: deepmerge 4.3.1 — ${knownAdvisory}. See #49 and docs/plans/2026-10-29-sprint1-dependencies.md.`,
    );
  }
  return warnings;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const warnings = checkAudit(
      JSON.parse(readFileSync(process.argv[2], "utf8").replace(/^\uFEFF/, "")),
      Number(process.argv[3]),
    );
    for (const warning of warnings) console.warn(`::warning::${warning}`);
    const summary = warnings.length
      ? warnings.join("\n")
      : "Full dependency audit: no advisories.";
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  } catch (error) {
    console.error(`Security audit gate FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}
