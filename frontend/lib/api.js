const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token") || null;
};

const withAuthHeaders = (headers = {}) => {
  const token = getStoredToken();
  if (token) {
    return { ...headers, Authorization: `Bearer ${token}` };
  }
  return headers;
};

class ApiClient {
  constructor(base) {
    this.base = base;
  }

  async fetchJson(path, options = {}) {
    const headers = new Headers(withAuthHeaders(options.headers || {}));
    const res = await fetch(`${this.base}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const detail = err.detail;
      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
            : err.detail || `Request failed: ${res.status}`;
      throw new Error(message);
    }
    return res.json();
  }

  async uploadFile(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${this.base}/upload`, {
      method: "POST",
      headers: withAuthHeaders(),
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Upload failed: ${res.status}`);
    }
    return res.json();
  }

  async parseChatFile(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${this.base}/chat/parse-file`, {
      method: "POST",
      headers: withAuthHeaders(),
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Parse failed: ${res.status}`);
    }
    return res.json();
  }

  async indexGitHub(repoUrl, branch) {
    return this.fetchJson("/github-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl, branch }),
    });
  }

  async chatNonStreaming(question, filterDocType) {
    return this.fetchJson("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, stream: false, filter_doc_type: filterDocType }),
    });
  }

  async getSources() {
    return this.fetchJson("/sources");
  }

  async getStats() {
    return this.fetchJson("/stats");
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.base}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  getStreamUrl() {
    return `${this.base}/chat`;
  }

  getBase() {
    return this.base;
  }
}

export const api = new ApiClient(API_BASE);
export const getApiBase = () => API_BASE;
export default api;
