import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { backendDir, backendEnv, backendLogFile, databaseFile, workDir } from "./env.js";
import { seederEnv } from "./accounts.js";

const phpBinary = process.env.PHP_BINARY ?? "php";

/** Ejecuta un comando artisan en el backend con el entorno E2E. */
export function artisan(args) {
  const result = spawnSync(phpBinary, ["artisan", ...args], {
    cwd: backendDir,
    env: backendEnv(seederEnv),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(
      [`php artisan ${args.join(" ")} fallo con codigo ${result.status}`, result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result.stdout ?? "";
}

/**
 * Prepara la base de datos de test.
 *
 * La base es un archivo SQLite local que se recrea en cada ejecucion, asi que la
 * suite nunca toca datos de desarrollo ni de produccion.
 */
export function prepareTestEnvironment() {
  mkdirSync(workDir, { recursive: true });

  if (!existsSync(databaseFile)) {
    writeFileSync(databaseFile, "");
  }

  // El log se reinicia para que la busqueda de correos solo encuentre mensajes
  // generados por esta ejecucion.
  rmSync(backendLogFile, { force: true });

  // Una config cacheada en desarrollo pisaria el entorno de test.
  artisan(["optimize:clear"]);
  artisan([
    "migrate:fresh",
    "--force",
    "--seed",
    "--seeder=Database\\Seeders\\E2ESeeder",
  ]);
}

/** Ruta del router que usa `php artisan serve` para reescribir las rutas de la API. */
export function phpServerRouter() {
  const router = `${backendDir}/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php`;

  if (!existsSync(router)) {
    throw new Error("No se encuentra el servidor de Laravel. Ejecuta `composer install` en backend/.");
  }

  return router;
}

export { phpBinary };