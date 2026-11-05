import { readFileSync, appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const knownAdvisory = "https://github.com/advisories/GHSA-gcqx-w48m-w2h4";
const buildPath =
  "frontend>vite-plugin-pwa>workbox-build>@rollup/plugin-node-resolve>deepmerge";

function installedDeepmerge() {
  let resolver = createRequire(
    new URL("../frontend/package.json", import.meta.url),
  );
  for (const dependency of [
    "vite-plugin-pwa",
    "workbox-build",
    "@rollup/plugin-node-resolve",
  ]) {
    resolver = createRequire(resolver.resolve(dependency));
  }
  return resolver.resolve("deepmerge");
}

export function verifyDeepmergeMitigation({
  patch = readFileSync(
    new URL("../patches/deepmerge@4.3.1.patch", import.meta.url),
  ),
  installed = readFileSync(installedDeepmerge()),
} = {}) {
  const manifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  if (
    manifest.pnpm?.patchedDependencies?.["deepmerge@4.3.1"] !==
      "patches/deepmerge@4.3.1.patch" ||
    createHash("sha256").update(patch).digest("hex") !==
      "f53dc4ca4b2b78d6959faaac4776a084c416d7b5ff27b819a557022c2d373f8c" ||
    createHash("sha256").update(installed).digest("hex") !==
      "82760c8642c378627a229fe14370632c63d3b0aea3b65da4a6d63d2b7cacf837"
  )
    throw new Error(
      "The reviewed deepmerge mitigation is missing or modified.",
    );
}

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
    // shortcut: audit cannot recognize the local patch; remove when upstream ships a fixed release (#49).
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
    verifyDeepmergeMitigation();
    warnings.push(
      `Mitigated LOW build advisory: deepmerge 4.3.1 with verified local patch — ${knownAdvisory}. Native audit remains nonzero. See #49 and docs/plans/2026-11-02-sprint55-dependency-security.md.`,
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
