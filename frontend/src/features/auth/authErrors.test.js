import { describe, expect, it } from "vitest";
import {
  AUTH_ERROR_TRANSIENT,
  AUTH_ERROR_UNAUTHORIZED,
  AUTH_ERROR_UNEXPECTED,
  classifyAuthError,
  isUnauthorized,
} from "./authErrors";

function response(status, headers = {}) {
  const error = new Error(`Request failed with status code ${status}`);
  error.response = { status, headers };
  return error;
}

describe("classifyAuthError", () => {
  it("marca 401 como sesion invalida", () => {
    expect(classifyAuthError(response(401))).toBe(AUTH_ERROR_UNAUTHORIZED);
    expect(isUnauthorized(response(401))).toBe(true);
  });

  it("trata 5xx, red y throttling como transitorios", () => {
    for (const status of [429, 500, 502, 503]) {
      expect(classifyAuthError(response(status))).toBe(AUTH_ERROR_TRANSIENT);
      expect(isUnauthorized(response(status))).toBe(false);
    }
    expect(classifyAuthError(new Error("Network Error"))).toBe(AUTH_ERROR_TRANSIENT);
    expect(classifyAuthError({ code: "ECONNABORTED" })).toBe(AUTH_ERROR_TRANSIENT);
  });

  it("trata 403, 419 y 422 como inesperados sin destruir sesion", () => {
    for (const status of [403, 404, 419, 422]) {
      expect(classifyAuthError(response(status))).toBe(AUTH_ERROR_UNEXPECTED);
      expect(isUnauthorized(response(status))).toBe(false);
    }
  });
});
