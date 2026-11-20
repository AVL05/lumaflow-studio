import { describe, expect, it } from "vitest";
import { getAuthDestination } from "./getAuthDestination";

describe("getAuthDestination", () => {
  it("ordena onboarding, primeros pasos y dashboard", () => {
    expect(getAuthDestination({ onboarding_completed: false })).toBe(
      "/onboarding",
    );
    expect(
      getAuthDestination({
        onboarding_completed: true,
        getting_started_completed: false,
      }),
    ).toBe("/getting-started");
    expect(
      getAuthDestination({
        onboarding_completed: true,
        getting_started_completed: true,
      }),
    ).toBe("/app/dashboard");
  });
});
