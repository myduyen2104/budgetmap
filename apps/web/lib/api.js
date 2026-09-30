"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = api;
const base =
  process.env.NEXT_PUBLIC_E2E_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001/api";
async function api(path, init = {}) {
  const r = await fetch(`${base}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!r.ok)
    throw new Error(
      (await r.json().catch(() => null))?.error?.code ?? "REQUEST_FAILED",
    );
  return r.status === 204 ? undefined : r.json();
}
