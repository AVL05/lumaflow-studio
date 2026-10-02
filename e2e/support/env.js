import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const e2eDir = path.resolve(here, "..");
export const repoRoot = path.resolve(e2eDir, "..");
export const backendDir = path.join(repoRoot, "backend");
export const frontendDir = path.join(repoRoot, "frontend");

// Todo el estado generado por la suite vive aqui y esta ignorado por git.
export const workDir = path.join(e2eDir, ".tmp");
export const databaseFile = path.join(workDir, "lumaflow-e2e.sqlite");
export const appKeyFile = path.join(workDir, "app-key");
export const backendLogFile = path.join(backendDir, "storage", "logs", "laravel.log");

/** Estado de sesion de una cuenta, generado una vez por ejecucion. */
export function sessionStateFile(account) {
  return path.join(workDir, `session-${account}.json`);
}

const backendPort = Number(process.env.E2E_BACKEND_PORT ?? 8001);
const frontendPort = Number(process.env.E2E_FRONTEND_PORT ?? 5273);

export const frontendUrl = `http://127.0.0.1:${frontendPort}`;
export const apiUrl = `http://127.0.0.1:${backendPort}/api`;

/**
 * Clave de aplicacion efimera para el entorno de test.
 *
 * Laravel necesita APP_KEY para cifrar tokens y firmar URLs, pero no es un
 * secreto real: solo protege una base de datos SQLite local que se recrea en
 * cada ejecucion. Se genera una vez y se reutiliza para que la ejecucion sea
 * reproducible.
 */
export function resolveAppKey() {
  mkdirSync(workDir, { recursive: true });

  try {
    const stored = readFileSync(appKeyFile, "utf8").trim();

    if (stored) return stored;
  } catch {
    // todavia no existe: se genera ahora.
  }

  const key = `base64:${randomBytes(32).toString("base64")}`;
  writeFileSync(appKeyFile, `${key}\n`);

  return key;
}

/**
 * Entorno del backend para E2E.
 *
 * Se inyecta de forma explicita en cada proceso PHP porque `php artisan serve`
 * solo reenvia `$_ENV` a su proceso hijo, y esa variable no esta poblada en
 * muchas instalaciones de PHP.
 */
export function backendEnv(extra = {}) {
  mkdirSync(workDir, { recursive: true });

  return {
    ...process.env,
    APP_NAME: "LumaFlow Studio",
    APP_ENV: "e2e",
    APP_DEBUG: "true",
    APP_KEY: resolveAppKey(),
    APP_URL: `http://127.0.0.1:${backendPort}`,
    FRONTEND_URL: frontendUrl,
    FRONTEND_URLS: frontendUrl,
    LOG_CHANNEL: "single",
    MAIL_MAILER: "log",
    MAIL_FROM_ADDRESS: "noreply@lumaflow.test",
    MAIL_FROM_NAME: "LumaFlow E2E",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: databaseFile,
    DB_FOREIGN_KEYS: "true",
    CACHE_STORE: "file",
    SESSION_DRIVER: "file",
    QUEUE_CONNECTION: "sync",
    BCRYPT_ROUNDS: "4",
    ...extra,
  };
}