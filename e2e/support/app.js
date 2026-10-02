import { expect } from "@playwright/test";
import { apiUrl } from "./env.js";

/** Token de Sanctum que la SPA guarda en localStorage. */
export async function readAuthToken(page) {
  return page.evaluate(() => window.localStorage.getItem("lumaflow_token"));
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: "application/json" };
}

/** Peticion autenticada contra la API usando la sesion de una pagina abierta. */
export async function apiRequest(page, method, path, data) {
  const token = await readAuthToken(page);

  expect(token, "la pagina deberia tener una sesion iniciada").toBeTruthy();

  return page.request.fetch(`${apiUrl}${path}`, {
    method,
    headers: authHeaders(token),
    ...(data ? { data } : {}),
  });
}

/** Busca el id del primer recurso cuyo campo indicado coincide con `value`. */
export async function findResourceId(page, path, field, value) {
  const response = await apiRequest(page, "GET", path);

  expect(response.status(), `GET ${path} deberia responder 200`).toBe(200);

  const payload = await response.json();
  const items = payload.data ?? payload;
  const match = items.find((item) => String(item[field]) === String(value));

  expect(match, `no se encontro ${path} con ${field}=${value}`).toBeTruthy();

  return match.id;
}

/** Inicia sesion desde el formulario real de la SPA. */
export async function signIn(page, account) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/app/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}