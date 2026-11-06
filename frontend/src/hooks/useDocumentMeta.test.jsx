import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDocumentMeta } from "./useDocumentMeta";

describe("route metadata", () => {
  it("updates canonical and social metadata, then removes public signals on private navigation", () => {
    document.head.innerHTML =
      '<title>Old</title><meta name="description" content="old"><link rel="canonical" href="https://lumaflow.aleviclop.dev/">';
    const { rerender } = renderHook(({ path }) => useDocumentMeta(path), {
      initialProps: { path: "/features" },
    });
    expect(document.querySelector('link[rel="canonical"]').href).toBe(
      "https://lumaflow.aleviclop.dev/features",
    );
    expect(document.querySelector('meta[property="og:url"]').content).toBe(
      "https://lumaflow.aleviclop.dev/features",
    );
    rerender({ path: "/pricing" });
    expect(document.title).toContain("gratis");
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    rerender({ path: "/deliver/SECRET" });
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.querySelector('meta[name="robots"]').content).toContain("noindex");
    expect(document.head.innerHTML).not.toContain("SECRET");
    rerender({ path: "/" });
    expect(document.querySelector('meta[name="robots"]').content).toBe("index, follow");
    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
    rerender({ path: "/login" });
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});
