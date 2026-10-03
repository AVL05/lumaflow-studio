import { chromium, expect } from "@playwright/test";
import { accounts } from "./accounts.js";
import { frontendUrl, sessionStateFile } from "./env.js";
import { signIn } from "./app.js";

/**
 * Cuentas cuya sesion se reutiliza: las que usan los fixtures de la suite.
 *
 * El test de acceso usa la cuenta `access` porque el backend mantiene una sesion
 * activa por usuario y cada login invalida los tokens anteriores.
 */
const reusableAccounts = {
  owner: accounts.owner,
  outsider: accounts.outsider,
  guest: accounts.guest,
};

/**
 * Sesiones autenticadas reutilizadas por los fixtures.
 *
 * Iniciar sesion en cada test consumiria el limite de `POST /api/login`
 * (10 por minuto, proteccion contra fuerza bruta) y crearia un token por test.
 * Se hace una sola vez por cuenta al preparar el entorno y se reutiliza el
 * `storageState` de la SPA.
 */
export async function prepareAuthenticatedSessions() {
  const browser = await chromium.launch();

  try {
    for (const [name, account] of Object.entries(reusableAccounts)) {
      // El `globalSetup` no hereda `use.baseURL`, asi que se indica aqui.
      const context = await browser.newContext({ baseURL: frontendUrl });
      const page = await context.newPage();

      await signIn(page, account);
      await context.storageState({ path: sessionStateFile(name) });
      await context.close();
    }

    // La cuenta recien llegada aun no completo el onboarding: su sesion se
    // guarda en el punto del embudo donde continuara el test dedicado.
    {
      const context = await browser.newContext({ baseURL: frontendUrl });
      const page = await context.newPage();

      await page.goto("/login");
      await page.getByLabel("Email").fill(accounts.newcomer.email);
      await page.getByLabel("Contraseña").fill(accounts.newcomer.password);
      await page.getByRole("button", { name: "Entrar" }).click();
      await page.waitForURL("**/onboarding");
      await expect(page.getByRole("heading", { name: "¿Cómo se llama tu estudio?" })).toBeVisible();
      await context.storageState({ path: sessionStateFile("newcomer") });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
