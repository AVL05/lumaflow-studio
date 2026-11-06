import { test as base, expect } from "@playwright/test";
import { apiUrl, sessionStateFile } from "../support/env.js";

/**
 * Suite E2E de LumaFlow.
 *
 * Cada fixture abre un contexto con la sesion ya iniciada de una cuenta, de modo
 * que un mismo recorrido puede representar a dos estudios distintos (por ejemplo,
 * para comprobar aislamiento) sin depender del estado compartido.
 * Las sesiones se crean en el `globalSetup` para no agotar el limite de intentos
 * de login del backend.
 */

/** Abre una pagina en la SPA con la sesion guardada y comprueba que sigue viva. */
async function openStudioPage(browser, account) {
  const context = await browser.newContext({ storageState: sessionStateFile(account) });
  const page = await context.newPage();

  // Abrir el panel valida la sesion reutilizada y deja la pagina en el origen
  // de la SPA, donde el token vive en localStorage.
  await page.goto("/app/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  return { context, page };
}

export const test = base.extend({
  /** Estudio propietario de los recursos creados por los tests. */
  ownerPage: async ({ browser }, use) => {
    const { context, page } = await openStudioPage(browser, "owner");

    await use(page);
    await context.close();
  },
  /** Segundo estudio, usado para comprobar que no alcanza recursos ajenos. */
  outsiderPage: async ({ browser }, use) => {
    const { context, page } = await openStudioPage(browser, "outsider");

    await use(page);
    await context.close();
  },
  /** Cuenta invitada al estudio compartido (recorrido de memberships). */
  guestPage: async ({ browser }, use) => {
    const { context, page } = await openStudioPage(browser, "guest");

    await use(page);
    await context.close();
  },
  /** Cuenta nueva a mitad del embudo de onboarding. */
  newcomerPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: sessionStateFile("newcomer") });
    const page = await context.newPage();

    await page.goto("/app/dashboard");
    await expect(page.getByRole("heading", { name: "¿Cómo se llama tu estudio?" })).toBeVisible();

    await use(page);
    await context.close();
  },
  /** Ventana publica sin sesion, para los portales de entrega. */
  visitorPage: [
    async ({ browser }, use, testInfo) => {
      const context = await browser.newContext();
      try {
        // Each public journey needs its own budget; keep the real 30/min protection enabled.
        const probe = () =>
          context.request.get(
            `${apiUrl}/public/studios/synthetic-rate-budget-probe`,
          );
        let response = await probe();
        expect([404, 429]).toContain(response.status());
        const remaining = Number(response.headers()["x-ratelimit-remaining"]);
        expect(Number.isSafeInteger(remaining)).toBe(true);
        if (remaining < 20 || response.status() === 429) {
          testInfo.annotations.push({
            type: "rate-limit",
            description:
              "Wait for the public 30/min window; no counters are cleared and no actions retried.",
          });
          await new Promise((resolve) => setTimeout(resolve, 60_000));
          response = await probe();
          expect(response.status()).toBe(404);
          expect(
            Number(response.headers()["x-ratelimit-remaining"]),
          ).toBeGreaterThanOrEqual(20);
        }
        await use(await context.newPage());
      } finally {
        await context.close();
      }
    },
    { timeout: 90_000 },
  ],
});

export { expect };
