export type User = { id: string | number; name: string; email: string; phone: string };
export async function api<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('Service unavailable. Please try again.'); }
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data as T;
}
