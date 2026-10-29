import * as Sentry from "@sentry/react";

const SENSITIVE_URL_PATTERNS = [
  /\/public\/(contracts|deliveries|calendar|studios)\/[^/?#]+/i,
  /\/(deliver|contract)\/[^/?#]+/i,
];

function scrubUrl(url) {
  if (typeof url !== "string") return url;
  try {
    const parsed = new URL(url, "https://lumaflow.invalid");
    if (!["https:", "http:"].includes(parsed.protocol)) return "[REDACTED]";
    parsed.username = "";
    parsed.password = "";
    parsed.hash = "";
    for (const pattern of SENSITIVE_URL_PATTERNS) {
      parsed.pathname = parsed.pathname.replace(pattern, (match) =>
        match.replace(/[^/]+$/, "[REDACTED]"),
      );
    }
    parsed.pathname = parsed.pathname
      .replace(/^(\/(?:api\/)?email\/verify\/).*/, "$1[REDACTED]")
      .replace(/^(\/storage\/).*/, "$1[REDACTED]");
    if (
      parsed.search &&
      !/^\?(?:page|per_page)=\d+(?:&(?:page|per_page)=\d+)*$/.test(parsed.search)
    )
      parsed.search = "?[REDACTED]";
    return url.startsWith("/") ? `${parsed.pathname}${parsed.search}` : parsed.toString();
  } catch {
    return "[REDACTED]";
  }
}

function scrubBreadcrumbs(breadcrumbs) {
  if (!Array.isArray(breadcrumbs)) return breadcrumbs;
  return breadcrumbs
    .map((crumb) => {
      if (!crumb || typeof crumb !== "object") return null;
      const data = crumb.data && typeof crumb.data === "object" ? { ...crumb.data } : undefined;
      if (data) {
        if (typeof data.url === "string") data.url = scrubUrl(data.url);
        crumb = {
          ...crumb,
          data: Object.fromEntries(
            Object.entries(data).filter(([key]) =>
              ["url", "method", "status_code", "duration_ms"].includes(key),
            ),
          ),
        };
      }
      crumb = { ...crumb };
      delete crumb.message;
      return crumb;
    })
    .filter(Boolean);
}

export function sanitizeSentryEvent(event) {
  const clean = { ...event };
  delete clean.extra;
  delete clean.logentry;
  if (clean.message) clean.message = "[REDACTED]";
  if (clean.exception?.values) {
    clean.exception = {
      ...clean.exception,
      values: clean.exception.values.map((exception) => ({
        ...exception,
        value: "[REDACTED]",
        ...(exception.stacktrace
          ? {
              stacktrace: {
                ...exception.stacktrace,
                frames: exception.stacktrace.frames?.map((frame) => {
                  const { vars: _vars, ...safeFrame } = frame;
                  return safeFrame;
                }),
              },
            }
          : {}),
      })),
    };
  }
  if (clean.request) {
    clean.request = { ...clean.request };
    if (clean.request.headers) {
      const headers = { ...clean.request.headers };
      for (const key of Object.keys(headers)) {
        if (/authorization|cookie|token|secret|api.key/i.test(key)) delete headers[key];
      }
      clean.request.headers = headers;
    }
    if (typeof clean.request.url === "string") clean.request.url = scrubUrl(clean.request.url);
    delete clean.request.data;
    delete clean.request.cookies;
    delete clean.request.query_string;
    delete clean.request.env;
  }
  if (clean.breadcrumbs) {
    clean.breadcrumbs = Array.isArray(clean.breadcrumbs)
      ? scrubBreadcrumbs(clean.breadcrumbs)
      : {
          ...clean.breadcrumbs,
          values: scrubBreadcrumbs(clean.breadcrumbs.values),
        };
  }
  if (clean.user) clean.user = { id: clean.user.id };
  if (clean.contexts) {
    clean.contexts = clean.contexts.trace
      ? {
          trace: Object.fromEntries(
            Object.entries(clean.contexts.trace).filter(([key]) =>
              ["trace_id", "span_id", "parent_span_id", "op", "status"].includes(key),
            ),
          ),
        }
      : {};
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
  const reference = headers["x-request-id"] ?? headers["X-Request-ID"] ?? error?.reference ?? null;
  return typeof reference === "string" && reference ? reference : null;
}
