import { test as base, expect } from "@playwright/test";
import { sessionStateFile } from "../support/env.js";

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
  visitorPage: async ({ browser }, use) => {
    const context = await browser.newContext();

    await use(await context.newPage());
    await context.close();
  },
});

export { expect };
