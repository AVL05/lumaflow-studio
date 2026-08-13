import { describe, expect, it } from "vitest";
import { getAuthDestination } from "./getAuthDestination";

describe("getAuthDestination", () => {
  it("ordena verificación, onboarding y dashboard", () => {
    expect(getAuthDestination({ email_verified: false })).toBe("/verify-email");
    expect(getAuthDestination({ email_verified: true, onboarding_completed: false })).toBe(
      "/onboarding",
    );
    expect(
      getAuthDestination({
        email_verified: true,
        onboarding_completed: true,
        getting_started_completed: false,
      }),
    ).toBe("/getting-started");
    expect(
      getAuthDestination({
        email_verified: true,
        onboarding_completed: true,
        getting_started_completed: true,
      }),
    ).toBe("/app/dashboard");
  });
});
