const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token") || null;
};

const withAuthHeaders = (headers: Record<string, string> = {}, token?: string | null) => {
  const authToken = token ?? getStoredToken();
  if (authToken) {
    return { ...headers, Authorization: `Bearer ${authToken}` };
  }
  return headers;
};

export class ApiClient {
  base: string;

  constructor(base: string) {
    this.base = base;
  }

  async fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getStoredToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${this.base}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed: ${res.status}`);
    }

    return res.json() as Promise<T>;
  }
}

export const api = new ApiClient(API_BASE);
export const getApiBase = () => API_BASE;
export default api;
