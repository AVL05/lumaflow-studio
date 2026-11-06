import { describe, expect, it, vi } from "vitest";
import { renderPublicPage } from "./prerender";
import { publicPages } from "./seo";

describe("commercial static rendering", () => {
  it("never reads a session or calls an API during static rendering", () => {
    const session = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const network = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Build must not fetch private data");
    });
    try {
      for (const page of publicPages) expect(renderPublicPage(page.path)).toMatch(/<h1[ >]/);
      expect(session).not.toHaveBeenCalledWith("lumaflow_token");
      expect(network).not.toHaveBeenCalled();
    } finally {
      session.mockRestore();
      network.mockRestore();
    }
  });
  it.each(publicPages.map((page) => [page.path]))(
    "renders %s with content and links without a browser or API",
    (path) => {
      const html = renderPublicPage(path);
      expect(html).toMatch(/<h1[ >]/);
      expect(html).toContain('href="/register"');
      expect(html).not.toMatch(/Preparando workspace|lumaflow_token|PRIVATE_CANARY/);
    },
  );

  it.each(["/app/clients", "/deliver/SECRET", "/contract/SECRET", "/book/SECRET", "/login"])(
    "refuses to prerender %s",
    (path) => {
      expect(() => renderPublicPage(path)).toThrow("Only commercial routes");
    },
  );
});
