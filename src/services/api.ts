// src/services/api.ts
const BASE = "http://localhost:8080"; // бэкенд

export type ApiUser = {
  id: number;
  email: string;
  is_active: boolean;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Получить access token из localStorage
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Получить refresh token из localStorage
function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// Сохранить токены в localStorage
function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

// Удалить токены из localStorage
function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Получить заголовки с авторизацией
function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResp(resp: Response) {
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || resp.statusText);
  }
  return resp.json().catch(() => ({}));
}

export async function register(userName: string, email: string, password: string) {
  const resp = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, email, password }),
  });
  return handleResp(resp);
}

export async function login(userName: string, password: string): Promise<AuthResponse> {
  const resp = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, password }),
  });
  const data: AuthResponse = await handleResp(resp);
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function refreshToken(): Promise<AuthResponse> {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    throw new Error("No refresh token available");
  }
  const resp = await fetch(`${BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
  const data: AuthResponse = await handleResp(resp);
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout() {
  const resp = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  clearTokens();
  return handleResp(resp);
}

export async function me(): Promise<ApiUser> {
  const resp = await fetch(`${BASE}/api/users/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResp(resp);
}

export async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const resp = await fetch(`${BASE}/api/files/upload`, {
    method: "POST",
    headers,
    body: fd,
  });
  return handleResp(resp);
}
