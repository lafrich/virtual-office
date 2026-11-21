// Ready-to-drop CORS helper for vo-multiplayer. NOT deployed.
// Production allowlist only — do not add localhost (lesson 16).
export const ALLOWED_ORIGINS = Object.freeze(["https://lafrich.github.io"]);

export function allowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

export function corsHeaders(reqOrigin, extra) {
  const echo = allowedOrigin(reqOrigin);
  const headers = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    ...(extra || {}),
  };
  if (echo) headers["Access-Control-Allow-Origin"] = echo;
  return headers;
}

export function optionsResponse(reqOrigin) {
  const allowed = !!allowedOrigin(reqOrigin);
  return {
    status: allowed ? 204 : 403,
    headers: corsHeaders(reqOrigin),
  };
}
