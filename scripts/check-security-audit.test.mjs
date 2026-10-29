import test from "node:test";
import assert from "node:assert/strict";
import { checkAudit } from "./check-security-audit.mjs";

function report(overrides = {}) {
  return {
    advisories: {
      synthetic: {
        module_name: "deepmerge",
        severity: "low",
        url: "https://github.com/advisories/GHSA-gcqx-w48m-w2h4",
        patched_versions: "<0.0.0",
        findings: [
          {
            version: "4.3.1",
            paths: [
              "frontend>vite-plugin-pwa>workbox-build>@rollup/plugin-node-resolve>deepmerge",
            ],
          },
        ],
        ...overrides,
      },
    },
    metadata: {
      vulnerabilities: { low: 1, moderate: 0, high: 0, critical: 0 },
    },
  };
}

test("a clean audit passes without warnings", () => {
  assert.deepEqual(
    checkAudit(
      { advisories: {}, metadata: { vulnerabilities: { low: 0 } } },
      0,
    ),
    [],
  );
});

test("the exact documented build advisory remains visible", () => {
  assert.match(checkAudit(report(), 1)[0], /LOW.*deepmerge.*#49/);
});

test("new low advisories and any higher severity fail", () => {
  for (const change of [
    { url: "https://github.com/advisories/new" },
    { module_name: "other" },
    { severity: "moderate" },
    { severity: "high" },
    { severity: "critical" },
  ]) {
    assert.throws(() => checkAudit(report(change), 1), /Unaccepted/);
  }
});

test("a changed version, runtime path, or available patch invalidates the exception", () => {
  for (const change of [
    { patched_versions: ">=4.3.2" },
    { findings: [{ version: "4.3.2", paths: ["frontend>deepmerge"] }] },
    { findings: [{ version: "4.3.1", paths: ["frontend>deepmerge"] }] },
  ])
    assert.throws(() => checkAudit(report(change), 1), /Unaccepted/);
});

test("network errors, malformed reports, and inconsistent exit codes fail closed", () => {
  const inconsistentSeverity = report();
  inconsistentSeverity.metadata.vulnerabilities = { low: 0, high: 1 };
  for (const [audit, status] of [
    [null, 1],
    [{ error: "network" }, 1],
    [report(), 2],
    [report(), 0],
    [{ ...report(), advisories: {} }, 1],
    [inconsistentSeverity, 1],
  ]) {
    assert.throws(() => checkAudit(audit, status));
  }
});
