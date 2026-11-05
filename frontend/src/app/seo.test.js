import { describe, expect, it } from "vitest";
import { getRouteMeta, publicPages, siteUrl } from "./seo";

describe("public indexing policy", () => {
  it("gives each commercial route its own absolute canonical and social metadata", () => {
    expect(publicPages.map((page) => page.path)).toEqual([
      "/",
      "/features",
      "/pricing",
      "/privacy",
      "/about-project",
      "/support",
    ]);
    for (const page of publicPages) {
      const meta = getRouteMeta(page.path, "?utm_source=synthetic");
      expect(meta.canonical).toBe(siteUrl + (page.path === "/" ? "/" : page.path));
      expect(meta.robots).toBe("index, follow");
      expect(meta.title).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.image).toMatch(/^https:\/\//);
    }
    expect(new Set(publicPages.map((page) => page.title)).size).toBe(publicPages.length);
  });

  it.each([
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/app",
    "/app/clients/123",
    "/onboarding",
    "/getting-started",
    "/demo",
    "/unknown",
    "/deliver/SECRET",
    "/contract/SECRET",
    "/book/SECRET",
  ])("does not index %s or leak its path", (path) => {
    const meta = getRouteMeta(path);
    expect(meta.robots).toContain("noindex");
    expect(meta.canonical).toBeUndefined();
    expect(JSON.stringify(meta)).not.toContain("SECRET");
  });

  it("does not index sensitive query variants or copy query data into metadata", () => {
    for (const query of ["?token=SECRET", "?signature=SECRET", "?email=SECRET"]) {
      const meta = getRouteMeta("/", query);
      expect(meta.robots).toContain("noindex");
      expect(meta.canonical).toBeUndefined();
      expect(JSON.stringify(meta)).not.toContain("SECRET");
    }
  });
});
