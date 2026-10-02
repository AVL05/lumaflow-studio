import { spawn } from "node:child_process";
import path from "node:path";
import { backendDir, backendEnv } from "../support/env.js";
import { phpBinary, phpServerRouter } from "../support/backend.js";

const port = Number(process.env.E2E_BACKEND_PORT ?? 8001);

const publicDir = path.join(backendDir, "public");

// `php -S` con el router de Laravel sirve /api/* igual que `artisan serve`.
// Se lanza aqui, y no con `artisan serve`, porque ese comando solo reenvia `$_ENV`
// a su proceso hijo y la variable suele venir vacia.
// El router resuelve el directorio publico con `getcwd()`, asi que el proceso
// se inicia en backend/public.
const server = spawn(
  phpBinary,
  ["-S", `127.0.0.1:${port}`, "-t", publicDir, phpServerRouter()],
  { cwd: publicDir, env: backendEnv(), stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code) => process.exit(code ?? 0));