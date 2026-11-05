import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";

const frontend = createRequire(
  new URL("../frontend/package.json", import.meta.url),
);
const pwa = createRequire(frontend.resolve("vite-plugin-pwa"));
const workbox = createRequire(pwa.resolve("workbox-build"));
const resolver = createRequire(workbox.resolve("@rollup/plugin-node-resolve"));
const omt = createRequire(
  workbox.resolve("@trickfilm400/rollup-plugin-off-main-thread"),
);
const ejs = createRequire(omt.resolve("ejs"));
const jake = createRequire(ejs.resolve("jake"));
const filelist = createRequire(jake.resolve("filelist"));

test("Workbox includes expected assets and excludes AI bundles with its actual glob dependency", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "lf-build-deps-"));
  t.after(() => {
    assert.ok(
      resolve(directory).startsWith(resolve(tmpdir()) + "/") ||
        resolve(directory).startsWith(resolve(tmpdir()) + "\\"),
    );
    assert.ok(directory.includes("lf-build-deps-"));
    rmSync(directory, { recursive: true, force: true });
  });
  mkdirSync(join(directory, "assets"));
  for (const name of [
    "index.html",
    "assets/app.js",
    "assets/app.css",
    "assets/lib-ai.js",
    "assets/ignored.js",
  ]) {
    writeFileSync(join(directory, name), `synthetic ${name}`);
  }
  const { getManifest } = pwa("workbox-build");
  const result = await getManifest({
    globDirectory: directory,
    globPatterns: ["**/*.{html,js,css}"],
    globIgnores: ["**/lib-*.js", "**/ignored.js"],
  });
  assert.deepEqual(result.warnings, []);
  assert.deepEqual(result.manifestEntries.map((entry) => entry.url).sort(), [
    "assets/app.css",
    "assets/app.js",
    "index.html",
  ]);
  assert.ok(
    result.manifestEntries.every((entry) =>
      /^[a-f0-9]{32}$/.test(entry.revision),
    ),
  );
  let directoryReads = 0;
  await assert.rejects(
    workbox("glob").glob("**/*", {
      cwd: directory,
      signal: AbortSignal.abort(),
      fs: {
        ...fs,
        readdir(...args) {
          directoryReads++;
          return fs.readdir(...args);
        },
      },
    }),
    { name: "AbortError" },
  );
  await new Promise(setImmediate);
  assert.equal(
    directoryReads,
    0,
    "An aborted glob must not continue reading directories",
  );
});

test("FileList retains minimatch.match and EJS keeps a working Jake-backed CLI", () => {
  const { FileList } = jake("filelist");
  const list = new FileList();
  list.include("synthetic-one.js", "synthetic-two.css");
  list.exclude(/\.css$/);
  assert.deepEqual(list.toArray(), ["synthetic-one.js"]);
  assert.deepEqual(
    filelist("minimatch").match(["a.js", "b.css", ".hidden.js"], "*.js"),
    ["a.js"],
  );
  assert.equal(
    omt("ejs").render("<%= name %>", { name: "Synthetic" }),
    "Synthetic",
  );
  const cli = resolve(ejs.resolve("ejs/package.json"), "../bin/cli.js");
  const result = spawnSync(process.execPath, [cli, "--version"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /3\.1\.10/);
});

test("deepmerge does not poison results for null placeholders or own prototype keys", () => {
  for (const merge of [
    resolver("deepmerge"),
    resolver(
      resolve(resolver.resolve("deepmerge/package.json"), "../dist/umd.js"),
    ),
  ]) {
    const payload = JSON.parse(
      '{"nested":{"__proto__":{"syntheticCanary":true}}}',
    );
    const result = merge({ nested: null }, payload);
    assert.equal(Object.getPrototypeOf(result.nested), Object.prototype);
    assert.equal(result.nested.syntheticCanary, undefined);
    const own = JSON.parse('{"__proto__":{"syntheticCanary":true}}');
    for (const output of [merge(own, {}), merge(Object.create(null), own)]) {
      assert.equal(Object.getPrototypeOf(output), Object.prototype);
      assert.equal(output.syntheticCanary, undefined);
    }
    assert.equal({}.syntheticCanary, undefined);
    const symbol = Symbol("synthetic");
    assert.deepEqual(
      merge(
        { list: [1], nested: { a: 1 }, [symbol]: "kept" },
        { list: [2], nested: { b: 2 } },
      ),
      { list: [1, 2], nested: { a: 1, b: 2 }, [symbol]: "kept" },
    );
    assert.deepEqual(
      merge({}, { list: [1] }, { arrayMerge: (_target, source) => source }),
      { list: [1] },
    );
  }
});
