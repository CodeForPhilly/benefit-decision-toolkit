/**
 * Runtime URL resolver for development environments.
 *
 * In dev mode, URLs are derived from `window.location.hostname` so the app
 * works correctly across local Devbox, Devcontainer, local-VS-Code-to-Codespace,
 * and browser-based Codespace environments without build-time patching.
 *
 * In production, env vars are used directly.
 */

interface Env {
  apiUrl: string;
  authDomain: string;
  screenerBaseUrl: string;
}

function resolveEnv(): Env {
  const fallback: Env = {
    apiUrl: import.meta.env.VITE_API_URL,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    screenerBaseUrl: import.meta.env.VITE_SCREENER_BASE_URL,
  };

  if (import.meta.env.MODE !== "development") {
    return fallback;
  }

  const hostname = window.location.hostname;

  // Local access (Devbox, Devcontainer, or local VS Code forwarding from Codespace)
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return {
      apiUrl: "http://localhost:8081/api",
      authDomain: "localhost:9099",
      screenerBaseUrl: "http://localhost:5174/",
    };
  }

  // Browser-based Codespace: hostname looks like "<name>-<port>.app.github.dev"
  const codespaceMatch = hostname.match(
    /^(.+)-\d+\.(app\.github\.dev)$/,
  );
  if (codespaceMatch) {
    const codespaceName = codespaceMatch[1];
    const domain = codespaceMatch[2];
    return {
      apiUrl: `/api`,
      authDomain: window.location.host,
      screenerBaseUrl: `https://${codespaceName}-5174.${domain}/`,
    };
  }

  return fallback;
}

export const env = resolveEnv();
