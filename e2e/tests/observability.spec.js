import { expect, test } from "../fixtures/test.js";
import { apiRequest } from "../support/app.js";

test.describe("observabilidad", () => {
  test("las respuestas API llevan request ID y la app sigue funcionando", async ({ ownerPage }) => {
    const response = await apiRequest(ownerPage, "GET", "/user");

    expect(response.status()).toBe(200);

    const requestId = response.headers()["x-request-id"];
    expect(requestId, "la respuesta expone X-Request-ID").toBeTruthy();
    expect(requestId.length).toBeLessThanOrEqual(100);

    await ownerPage.goto("/app/dashboard");
    await expect(ownerPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});
