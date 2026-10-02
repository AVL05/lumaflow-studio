import { prepareAuthenticatedSessions } from "./sessions.js";
import { prepareTestEnvironment } from "./backend.js";

/**
 * Preparacion del entorno E2E antes de ejecutar la suite.
 *
 * 1. recrea la base SQLite de test con las cuentas de la suite;
 * 2. inicia sesion una vez por cuenta y guarda el `storageState` de la SPA.
 */
export default async function globalSetup() {
  prepareTestEnvironment();
  await prepareAuthenticatedSessions();
}
