import { getFreshAccessToken } from './auth';

/** JSON request with the signed-in user's token (students and staff). Throws the server's error message, with `status` set. */
export async function authedJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getFreshAccessToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error((data as any)?.error || `Request failed (${res.status})`), { status: res.status });
  return data as T;
}

/** Admin: opens the support conversation of an account and returns the dashboard chat link. */
export async function adminChatLink(userId: string): Promise<string> {
  const { threadId } = await authedJson<{ threadId: string }>('/api/chat/threads/open-for', {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
  return `/dashboard/messages?thread=${threadId}`;
}
