import * as Sentry from "@sentry/react";

const SENSITIVE_URL_PATTERNS = [
  /\/public\/(contracts|deliveries|calendar|studios)\/[^/?#]+/i,
  /\/(deliver|contract)\/[^/?#]+/i,
];

function scrubUrl(url) {
  if (typeof url !== "string") return url;
  let scrubbed = url;
  for (const pattern of SENSITIVE_URL_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, (match) => match.replace(/[^/]+$/, "[REDACTED]"));
  }
  return scrubbed;
}

function scrubBreadcrumbs(breadcrumbs) {
  if (!Array.isArray(breadcrumbs)) return breadcrumbs;
  return breadcrumbs
    .map((crumb) => {
      if (!crumb || typeof crumb !== "object") return null;
      const data = crumb.data && typeof crumb.data === "object" ? { ...crumb.data } : undefined;
      if (data) {
        if (typeof data.url === "string") data.url = scrubUrl(data.url);
        delete data.message;
        delete data.input;
        delete data.prompt;
        delete data.response;
        delete data.content;
        crumb = { ...crumb, data };
      }
      return crumb;
    })
    .filter(Boolean);
}

export function sanitizeSentryEvent(event) {
  const clean = { ...event };
  if (clean.request) {
    clean.request = { ...clean.request };
    if (clean.request.headers) {
      const headers = { ...clean.request.headers };
      delete headers.authorization;
      delete headers.Authorization;
      delete headers.cookie;
      delete headers.Cookie;
      clean.request.headers = headers;
    }
    if (typeof clean.request.url === "string") clean.request.url = scrubUrl(clean.request.url);
    delete clean.request.data;
    delete clean.request.cookies;
  }
  if (clean.breadcrumbs) {
    clean.breadcrumbs = { ...clean.breadcrumbs, values: scrubBreadcrumbs(clean.breadcrumbs.values) };
  }
  if (clean.user) clean.user = { id: clean.user.id };
  if (clean.contexts?.trace) {
    clean.contexts = { ...clean.contexts };
  }
  return clean;
}

function resolveRelease() {
  if (import.meta.env.VITE_SENTRY_RELEASE) return import.meta.env.VITE_SENTRY_RELEASE;
  if (typeof __APP_RELEASE__ !== "undefined" && __APP_RELEASE__) return __APP_RELEASE__;
  return "unknown";
}

function resolveEnvironment() {
  if (import.meta.env.VITE_SENTRY_ENVIRONMENT) return import.meta.env.VITE_SENTRY_ENVIRONMENT;
  if (import.meta.env.MODE === "development") return "local";
  if (import.meta.env.MODE === "test") return "testing";
  return "production";
}

export function getSentryConfig() {
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    environment: resolveEnvironment(),
    release: resolveRelease(),
  };
}

export function isSentryEnabled() {
  return Boolean(getSentryConfig().dsn);
}

let initialized = false;

export function initSentry() {
  if (initialized || !isSentryEnabled()) return false;

  try {
    const { dsn, environment, release } = getSentryConfig();
    Sentry.init({
      dsn,
      environment,
      release,
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      sendDefaultPii: false,
      beforeSend: (event) => sanitizeSentryEvent(event),
    });
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

/** Solo ID interno pseudonimo, nunca email ni nombres. */
export function identifySentryUser(id) {
  if (!isSentryEnabled()) return;
  try {
    Sentry.setUser(id == null ? null : { id: String(id) });
  } catch {
    // Observabilidad nunca bloquea la app.
  }
}

export function captureAppError(error) {
  if (!isSentryEnabled()) return null;
  try {
    return Sentry.captureException(error);
  } catch {
    return null;
  }
}

export function buildRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/** Referencia del error (request ID) solo para fallos 5xx inesperados. */
export function extractErrorReference(error) {
  const status = error?.response?.status;
  if (typeof status !== "number" || status < 500) return null;
  const headers = error?.response?.headers ?? {};
  const reference =
    headers["x-request-id"] ?? headers["X-Request-ID"] ?? error?.reference ?? null;
  return typeof reference === "string" && reference ? reference : null;
}
