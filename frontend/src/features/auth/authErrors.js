/**
 * Clasificador central de errores de autenticacion (Issue #26).
 *
 * Solo un 401 demuestra sesion invalida. Todo lo demas (5xx, red,
 * throttling o respuestas inesperadas) conserva la credencial local:
 * un fallo transitorio no prueba que el token sea invalido.
 */

export const AUTH_ERROR_UNAUTHORIZED = "unauthorized";
export const AUTH_ERROR_TRANSIENT = "transient";
export const AUTH_ERROR_UNEXPECTED = "unexpected";

export function classifyAuthError(error) {
  const status = error?.response?.status;

  if (status === 401) return AUTH_ERROR_UNAUTHORIZED;
  if (typeof status !== "number") return AUTH_ERROR_TRANSIENT;
  if (status === 429 || status >= 500) return AUTH_ERROR_TRANSIENT;

  return AUTH_ERROR_UNEXPECTED;
}

export function isUnauthorized(error) {
  return classifyAuthError(error) === AUTH_ERROR_UNAUTHORIZED;
}
