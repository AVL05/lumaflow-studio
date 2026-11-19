import { describe, expect, it } from "vitest";
import { productImage } from "./productImage";

describe("productImage", () => {
  it("points at /product and carries the build content hash as version", () => {
    expect(productImage("dashboard.png")).toMatch(/^\/product\/dashboard\.png\?v=[0-9a-f]{8}$/);
  });

  it("uses the same version for every screenshot", () => {
    const [a, b] = ["a.png", "b.png"].map((n) => productImage(n).split("?v=")[1]);
    expect(a).toBe(b);
  });
});
