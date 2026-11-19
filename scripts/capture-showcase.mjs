// Regenera las capturas de producto de la landing y de docs/screenshots a partir
// del estudio de demostración, para que nunca muestren estados vacíos o de carga.
//
// Requiere el modo exhibición en marcha (`pnpm run start:showcase`) y Chromium de
// Playwright (`pnpm run test:e2e:install`). Uso:
//
//   pnpm run capture:showcase
//
// LUMAFLOW_WEB_PORT y LUMAFLOW_API_PORT apuntan a otros puertos, igual que en start.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(path.join(root, "e2e", "package.json"))("@playwright/test");

const web = `http://localhost:${process.env.LUMAFLOW_WEB_PORT || "5173"}`;
const api = `http://localhost:${process.env.LUMAFLOW_API_PORT || "8000"}/api`;
const productDir = path.join(root, "frontend", "public", "product");
const docsDir = path.join(root, "docs", "screenshots");

// Los nombres se conservan: landing, SEO y documentación ya los referencian.
// Son JPEG (como los originales) para mantener el peso de la landing contenido.
const shots = [
  // `focus` desplaza la vista hasta el contenido para no capturar solo la cabecera;
  // `margin` es el espacio sobre él dentro del área desplazable (bajo la barra superior).
  { name: "dashboard", route: "/app/dashboard", focus: "Agenda de hoy" },
  { name: "calendar", route: "/app/calendar", focus: "Lun", margin: 84 },
  { name: "analytics", route: "/app/analytics", focus: "Sesiones por mes" },
  { name: "ai-assistant", route: "/app/ai-assistant" },
  { name: "gallery", route: "/app/deliveries/1" },
  { name: "deliveries", route: "/app/deliveries", docsOnly: true },
  { name: "invoices", route: "/app/invoices" },
  { name: "quotes", route: "/app/quotes" },
  { name: "locations", route: "/app/locations" },
  { name: "presets", route: "/app/presets" },
];

async function login() {
  const response = await fetch(`${api}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      email: "demo@lumaflow.test",
      password: process.env.SHOWCASE_PASSWORD || "lumaflow-demo",
    }),
  });
  if (!response.ok) {
    throw new Error(
      `No se pudo entrar en el estudio demo (${response.status}). ¿Está en marcha pnpm run start:showcase?`,
    );
  }
  return (await response.json()).token;
}

const token = await login();
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 1.25,
  colorScheme: "dark",
  locale: "es-ES",
  timezoneId: "Europe/Madrid",
});
await context.addInitScript((value) => localStorage.setItem("lumaflow_token", value), token);
const page = await context.newPage();
mkdirSync(docsDir, { recursive: true });

try {
  for (const shot of shots) {
    await page.goto(web + shot.route, { waitUntil: "networkidle" });
    // Esqueletos, mapas y gráficas terminan de pintarse después de la red.
    await page.waitForFunction(() => !document.querySelector(".animate-pulse"), null, { timeout: 15000 });
    if (shot.focus) {
      await page
        .getByText(shot.focus, { exact: true })
        .first()
        .evaluate((element, margin) => {
          element.style.scrollMarginTop = `${margin}px`;
          element.scrollIntoView({ block: "start" });
        }, shot.margin ?? 48);
    }
    await page.waitForTimeout(1200);
    const target = path.join(shot.docsOnly ? docsDir : productDir, `${shot.name}.png`);
    await page.screenshot({ path: target, type: "jpeg", quality: 82 });
    if (!shot.docsOnly) copyFileSync(target, path.join(docsDir, `${shot.name}.png`));
    process.stdout.write(`[capture] ${shot.name} ← ${shot.route}\n`);
  }
} finally {
  await browser.close();
}
