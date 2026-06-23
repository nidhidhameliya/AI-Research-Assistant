// Typed API client for the AI Research Assistant backend

import { clearAuthSession, getAuthToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface UploadResponse {
  filename: string;
  chunks_created: number;
  doc_type: string;
  message: string;
}

export interface GitHubIndexResponse {
  repo_url: string;
  files_indexed: number;
  chunks_created: number;
  message: string;
}

export interface Source {
  filename: string;
  doc_type: string;
  confidence: number;
  content_preview: string;
}

export interface KnowledgeCard {
  title: string;
  content: string;
  type: "service" | "flow" | "concept" | "alert";
}

export interface ChatResponse {
  chat_id: string;
  answer: string;
  sources: Source[];
  knowledge_cards: KnowledgeCard[];
  response_time_ms: number;
}

export interface ChatSummary {
  id: string;
  title: string;
  updated_at: string;
}

export interface ChatMessageItem {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessageItem[];
}

export interface NewChatResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    created_at: string;
  };
}

export interface SourceItem {
  source: string;
  filename: string;
  doc_type: string;
  indexed_at: string;
}

export interface SourcesResponse {
  sources: SourceItem[];
  total_chunks: number;
}

export interface StatsResponse {
  documents_indexed: number;
  repositories_indexed: number;
  chunks_stored: number;
  total_queries: number;
  avg_response_time_ms: number;
}

export interface MetricsResponse {
  total_queries: number;
  average_response_time_ms: number;
  average_retrieval_count: number;
  average_retrieval_latency_ms: number;
  average_llm_latency_ms: number;
  average_token_usage: number;
  citation_count: number;
  error_count: number;
  top_documents: { name: string; count: number }[];
  top_questions: { question: string; count: number }[];
  recent_metrics: Record<string, unknown>[];
}

export interface EvaluationResponse {
  total_queries: number;
  average_response_time_ms: number;
  average_retrieval_count: number;
  citation_count: number;
  top_documents: { name: string; count: number }[];
  top_questions: { question: string; count: number }[];
}

export interface CompareResponse {
  comparison: Record<string, string>;
}

class ApiClient {
  private base: string;

  constructor(base: string) {
    this.base = base;
  }

  private buildHeaders(contentType = true): HeadersInit {
    const headers: Record<string, string> = {};
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (contentType) headers["Content-Type"] = "application/json";
    return headers;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const res = await fetch(`${this.base}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.body instanceof FormData ? {} : this.buildHeaders(init.body !== undefined)),
      },
    });

    if (res.status === 401) {
      clearAuthSession();
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  async uploadFile(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);

    return this.request<UploadResponse>("/upload", {
      method: "POST",
      body: form,
    });
  }

  async indexGitHub(repoUrl: string, branch?: string): Promise<GitHubIndexResponse> {
    return this.request<GitHubIndexResponse>("/github-index", {
      method: "POST",
      body: JSON.stringify({ repo_url: repoUrl, branch }),
    });
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    await this.request("/auth/logout", { method: "POST", body: JSON.stringify({}) });
  }

  async me(): Promise<AuthResponse["user"]> {
    return this.request<AuthResponse["user"]>("/auth/me");
  }

  async createChat(title?: string, firstQuestion?: string): Promise<NewChatResponse> {
    return this.request<NewChatResponse>("/chat/new", {
      method: "POST",
      body: JSON.stringify({ title, first_question: firstQuestion }),
    });
  }

  async getChats(): Promise<ChatSummary[]> {
    return this.request<ChatSummary[]>("/chats");
  }

  async getChat(chatId: string): Promise<ChatDetail> {
    return this.request<ChatDetail>(`/chat/${chatId}`);
  }

  async deleteChat(chatId: string): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/chat/${chatId}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  }

  async chatNonStreaming(question: string, filterDocType?: string, chatId?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ question, stream: false, filter_doc_type: filterDocType, chat_id: chatId }),
    });
  }

  async getSources(): Promise<SourcesResponse> {
    return this.request<SourcesResponse>("/sources");
  }

  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>("/stats");
  }

  async getMetrics(): Promise<MetricsResponse> {
    return this.request<MetricsResponse>("/metrics");
  }

  async getEvaluation(): Promise<EvaluationResponse> {
    return this.request<EvaluationResponse>("/evaluation");
  }

  async compareDocuments(documents: string[], question: string): Promise<CompareResponse> {
    return this.request<CompareResponse>("/compare", {
      method: "POST",
      body: JSON.stringify({ documents, question }),
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.base}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  getBase(): string {
    return this.base;
  }
}

export const api = new ApiClient(API_BASE);
