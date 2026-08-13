import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backend = path.join(root, "backend");
const frontend = path.join(root, "frontend");
const database = path.join(backend, "database", "database.sqlite");
const pnpmCli = process.env.npm_execpath;
const windows = process.platform === "win32";

function run(label, executable, args, cwd = root, env = process.env, shell = false) {
  process.stdout.write(`\n[local] ${label}\n`);
  const result = spawnSync(executable, args, { cwd, env, shell, stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} terminó con código ${result.status}`);
  }
}

function requireCommand(label, executable, args = ["--version"], shell = false) {
  const result = spawnSync(executable, args, { cwd: root, shell, stdio: "ignore" });

  if (result.error || result.status !== 0) {
    throw new Error(`Falta ${label}. Instálalo y vuelve a ejecutar pnpm run start.`);
  }
}

function pathExists(file) {
  try {
    lstatSync(file);
    return true;
  } catch {
    return false;
  }
}

function filesHash(files) {
  const hash = createHash("sha256");
  for (const file of files) hash.update(readFileSync(file));
  return hash.digest("hex");
}

if (!pnpmCli || !existsSync(pnpmCli)) {
  throw new Error("Ejecuta este archivo mediante pnpm run start.");
}

requireCommand("PHP 8.3+", "php");
requireCommand("Composer", "composer", ["--version"], windows);

const phpVersion = spawnSync("php", ["-r", "echo PHP_VERSION_ID;"], { cwd: root, encoding: "utf8" });
if (Number(phpVersion.stdout) < 80300) {
  throw new Error("LumaFlow requiere PHP 8.3 o posterior.");
}

mkdirSync(path.dirname(database), { recursive: true });
if (!existsSync(database)) {
  closeSync(openSync(database, "w"));
}

const localEnvironment = {
  ...process.env,
  APP_ENV: "local",
  APP_DEBUG: "true",
  APP_URL: "http://localhost:8000",
  FRONTEND_URL: "http://localhost:5173",
  FRONTEND_URLS: "http://localhost:5173,http://127.0.0.1:5173",
  DB_CONNECTION: "sqlite",
  DB_DATABASE: database,
  SESSION_DRIVER: "file",
  CACHE_STORE: "file",
  QUEUE_CONNECTION: "sync",
  FILESYSTEM_DISK: "public",
  MAIL_MAILER: "log",
  VITE_API_URL: "http://localhost:8000/api",
};

try {
  run("Instalando dependencias JavaScript", process.execPath, [pnpmCli, "install"]);

  const composerAutoload = path.join(backend, "vendor", "autoload.php");
  const composerFiles = [path.join(backend, "composer.json"), path.join(backend, "composer.lock")];
  const composerMarker = path.join(backend, "vendor", ".lumaflow-composer-lock");
  const composerHash = filesHash(composerFiles);
  const installedHash = existsSync(composerMarker) ? readFileSync(composerMarker, "utf8").trim() : "";
  if (!existsSync(composerAutoload) || installedHash !== composerHash) {
    run("Instalando dependencias PHP", "composer", ["install", "--no-interaction", "--prefer-dist"], backend, process.env, windows);
    writeFileSync(composerMarker, `${composerHash}\n`);
  }

  if (!existsSync(path.join(backend, ".env"))) {
    run("Creando configuración Laravel", "php", ["-r", "copy('.env.example', '.env');"], backend);
  }

  run("Preparando configuración Laravel", "php", ["artisan", "config:clear"], backend, localEnvironment);

  const backendEnv = readFileSync(path.join(backend, ".env"), "utf8");
  if (!/^APP_KEY=.+$/m.test(backendEnv)) {
    run("Generando clave local", "php", ["artisan", "key:generate", "--force"], backend, localEnvironment);
  }

  if (!pathExists(path.join(backend, "public", "storage"))) {
    run("Creando enlace de almacenamiento", "php", ["artisan", "storage:link"], backend, localEnvironment);
  }
  run("Actualizando base de datos SQLite", "php", ["artisan", "migrate", "--force"], backend, localEnvironment);
} catch (error) {
  process.stderr.write(`\n[local] ${error.message}\n`);
  process.exit(1);
}

process.stdout.write("\n[local] LumaFlow listo\n");
process.stdout.write("[local] Web: http://localhost:5173\n");
process.stdout.write("[local] API: http://localhost:8000/api/health\n");
process.stdout.write("[local] Emails de prueba: backend/storage/logs/laravel.log\n");
process.stdout.write("[local] Pulsa Ctrl+C para detener ambos procesos.\n\n");

const processes = [
  spawn("php", ["artisan", "serve", "--host=127.0.0.1", "--port=8000"], {
    cwd: backend,
    env: localEnvironment,
    stdio: "inherit",
  }),
  spawn(process.execPath, [pnpmCli, "--dir", frontend, "run", "dev", "--host", "localhost", "--port", "5173", "--strictPort"], {
    cwd: root,
    env: localEnvironment,
    stdio: "inherit",
  }),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of processes) {
    if (child.killed) continue;

    if (windows && child.pid) {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(exitCode), 250);
}

for (const child of processes) {
  child.on("error", (error) => {
    process.stderr.write(`[local] No se pudo iniciar un servicio: ${error.message}\n`);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping && signal !== "SIGTERM") {
      stop(code ?? 1);
    }
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
