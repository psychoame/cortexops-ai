/** Same-origin proxy via next.config rewrites — avoids CORS / localhost vs 127.0.0.1 issues */
export const API_BASE = '/backend';

export async function apiFetch(path: string, init?: RequestInit) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res;
}
