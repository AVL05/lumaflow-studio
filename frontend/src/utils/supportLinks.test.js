import { describe, expect, it } from "vitest";
import { getSupportLinks } from "./supportLinks";

const kofi = "https://ko-fi.com/lfsynthetic00000000000001";
const sponsors = "https://github.com/sponsors/lf-synthetic-00000000000001";

describe("support link configuration", () => {
  it("has no payment links without configuration", () => {
    expect(getSupportLinks({})).toEqual([]);
    expect(getSupportLinks({ VITE_KOFI_URL: "  ", VITE_GITHUB_SPONSORS_URL: "" })).toEqual([]);
  });

  it.each([
    [{ VITE_KOFI_URL: kofi }, ["kofi"]],
    [{ VITE_GITHUB_SPONSORS_URL: sponsors }, ["github"]],
    [{ VITE_KOFI_URL: kofi, VITE_GITHUB_SPONSORS_URL: sponsors }, ["kofi", "github"]],
  ])("returns only configured providers", (config, ids) => {
    expect(getSupportLinks(config).map((link) => link.id)).toEqual(ids);
  });

  it.each([
    "http://ko-fi.com/synthetic",
    "javascript:alert(1)",
    "data:text/html,synthetic",
    "https://ko-fi.com.evil.test/synthetic",
    "https://evil.test/ko-fi.com/synthetic",
    "https://www.ko-fi.com/synthetic",
    "https://ko-fi.com./synthetic",
    "https://user:pass@ko-fi.com/synthetic",
    "https://ko-fi.com:8443/synthetic",
    "https://ko-fi.com/synthetic?tracking=1",
    "https://ko-fi.com/synthetic#payment",
    "https://ko-fi.com/synthetic?",
    "https://ko-fi.com/synthetic#",
    "https://ko-fi.com/login",
    "https://ko-fi.com/checkout",
    "https://ko-fi.com/synthetic/shop",
    "https://ko-fi.com/other/../synthetic",
    "https://ko-fi.com/%73ynthetic",
    "https://ko-fi.com/other\\..\\synthetic",
    "https://ko-\nfi.com/synthetic",
    "https://github.com/sponsors/synthetic",
    null,
    42,
  ])("hides unsafe or non-profile Ko-fi destinations", (url) => {
    expect(getSupportLinks({ VITE_KOFI_URL: url })).toEqual([]);
  });

  it.each([
    "https://github.com/synthetic",
    "https://github.com/sponsors",
    "https://github.com/sponsors/explore",
    "https://github.com/sponsors/accounts",
    "https://github.com/sponsors/login",
    "https://github.com/sponsors/logout",
    "https://github.com/sponsors/checkout",
    "https://github.com/sponsors/synthetic/checkout",
    "https://github.com/sponsors/-synthetic",
    "https://github.com/sponsors/synthetic-",
    "https://github.com/sponsors/synthetic--name",
    `https://github.com/sponsors/${"a".repeat(40)}`,
    "https://sponsors.github.com/synthetic",
    "https://github.com.evil.test/sponsors/synthetic",
    "https://user@github.com/sponsors/synthetic",
    "https://github.com/sponsors/%73ynthetic",
    "https://github.com/sponsors/synthetic?tier_id=1",
    "https://ko-fi.com/synthetic",
  ])("hides unsafe or non-profile Sponsors destinations", (url) => {
    expect(getSupportLinks({ VITE_GITHUB_SPONSORS_URL: url })).toEqual([]);
  });

  it("preserves valid links while hiding another invalid provider", () => {
    expect(
      getSupportLinks({ VITE_KOFI_URL: kofi, VITE_GITHUB_SPONSORS_URL: "https://evil.test" }),
    ).toEqual([{ id: "kofi", name: "Ko-fi", url: kofi }]);
  });

  it("accepts canonical HTTPS profiles with surrounding whitespace and trailing slash", () => {
    expect(getSupportLinks({ VITE_KOFI_URL: `  ${kofi}/  ` })).toEqual([
      { id: "kofi", name: "Ko-fi", url: `${kofi}/` },
    ]);
  });
});
