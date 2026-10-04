import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  captureException: vi.fn(() => "event-id-123"),
  setUser: vi.fn(),
}));

import * as Sentry from "@sentry/react";
import {
  buildRequestId,
  captureAppError,
  extractErrorReference,
  getSentryConfig,
  identifySentryUser,
  initSentry,
  isSentryEnabled,
  sanitizeSentryEvent,
} from "./sentry";

describe("sentry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("no hace nada sin DSN", () => {
    expect(isSentryEnabled()).toBe(false);
    expect(initSentry()).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(captureAppError(new Error("x"))).toBeNull();
  });

  it("redacta headers, urls con token, cuerpos y usuario", () => {
    const clean = sanitizeSentryEvent({
      request: {
        url: "https://api.example.com/api/public/contracts/secret",
        headers: { authorization: "Bearer x", cookie: "y", "content-type": "application/json" },
        data: { password: "x" },
      },
      breadcrumbs: {
        values: [{ data: { url: "https://app.example.com/contract/abc", input: "hola" } }],
      },
      user: { id: 7, email: "a@b.c" },
    });

    expect(clean.request.headers).toEqual({ "content-type": "application/json" });
    expect(clean.request.url).toContain("[REDACTED]");
    expect(clean.request.url).not.toContain("secret");
    expect(clean.request).not.toHaveProperty("data");
    expect(clean.breadcrumbs.values[0].data.url).toContain("[REDACTED]");
    expect(clean.breadcrumbs.values[0].data).not.toHaveProperty("input");
    expect(clean.user).toEqual({ id: 7 });
  });

  it("redacta cuerpos anidados sin romper lo inocuo", () => {
    const event = sanitizeSentryEvent({
      request: { url: "https://api.example.com/api/clients", data: undefined },
    });
    expect(event.request.url).toBe("https://api.example.com/api/clients");
  });

  it("genera request IDs unicos", () => {
    const first = buildRequestId();
    const second = buildRequestId();
    expect(first).toBeTruthy();
    expect(first).not.toBe(second);
  });

  it("extrae referencia solo en 5xx con header", () => {
    expect(
      extractErrorReference({ response: { status: 500, headers: { "x-request-id": "abc" } } }),
    ).toBe("abc");
    expect(
      extractErrorReference({ response: { status: 422, headers: { "x-request-id": "abc" } } }),
    ).toBeNull();
    expect(extractErrorReference(new Error("red"))).toBeNull();
  });

  it("identifica solo con ID interno", () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://x@sentry.io/1");
    identifySentryUser(42);
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: "42" });
    identifySentryUser(null);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  it("getSentryConfig resuelve entorno y release con fallbacks", () => {
    const config = getSentryConfig();
    expect(config.environment).toBeTruthy();
    expect(config.release).toBeTruthy();
  });
});
