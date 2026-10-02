const configuredBase =
  process.env.NEXT_PUBLIC_E2E_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001/api";

function requestUrl(path: string): string {
  // Keep browser cookies first-party; Next proxies /api to the configured API host.
  return typeof window === "undefined" ? configuredBase + path : `/api${path}`;
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const r = await fetch(requestUrl(path), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!r.ok) {
    const data: unknown = await r.json().catch(() => null);
    let code =
      r.status === 401
        ? "UNAUTHORIZED"
        : r.status === 404
          ? "NOT_FOUND"
          : r.status === 409
            ? "CONFLICT"
          : "REQUEST_FAILED";
    if (data && typeof data === "object") {
      if (
        "error" in data &&
        data.error &&
        typeof data.error === "object" &&
        "code" in data.error &&
        typeof data.error.code === "string"
      )
        code = data.error.code;
      else if (
        "message" in data &&
        typeof data.message === "string" &&
        (/^[A-Z_]+$/.test(data.message) || data.message === "username already exists")
      )
        code = data.message;
    }
    if (
      r.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/register")
    ) {
      window.location.assign("/login");
    }
    throw new Error(code);
  }
  return r.status === 204 ? (undefined as T) : r.json();
}
