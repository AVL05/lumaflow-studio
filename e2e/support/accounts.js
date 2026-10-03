/**
 * Cuentas de la suite E2E.
 *
 * Datos ficticios en el dominio reservado `.test`: nunca son usuarios reales.
 * Estas credenciales son la unica fuente de verdad y se inyectan por entorno al
 * seeder `Database\Seeders\E2ESeeder`, que las usa para crear los dos estudios
 * aislados entre los que se comprueba el aislamiento de recursos.
 */
/**
 * `access` existe porque el backend emite una sesion unica por usuario: cada
 * login invalida los tokens anteriores. El test de acceso usa esta cuenta para
 * que su login no invalide las sesiones reutilizadas de `owner` y `outsider`.
 */
export const accounts = {
  owner: { email: "e2e.estudio@lumaflow.test", password: "lumaflow-e2e" },
  outsider: { email: "e2e.ajeno@lumaflow.test", password: "lumaflow-e2e" },
  access: { email: "e2e.acceso@lumaflow.test", password: "lumaflow-e2e" },
  guest: { email: "e2e.invitado@lumaflow.test", password: "lumaflow-e2e" },
};

/** Credenciales de los seeders, en el formato que espera el backend. */
export const seederEnv = {
  E2E_OWNER_EMAIL: accounts.owner.email,
  E2E_OUTSIDER_EMAIL: accounts.outsider.email,
  E2E_ACCESS_EMAIL: accounts.access.email,
  E2E_GUEST_EMAIL: accounts.guest.email,
  E2E_PASSWORD: accounts.owner.password,
};