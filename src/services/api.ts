// src/services/api.ts
const BASE = "http://localhost:8000"; // бэкенд

export type ApiUser = {
  id: number;
  email: string;
  is_active: boolean;
};

async function handleResp(resp: Response) {
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || resp.statusText);
  }
  return resp.json().catch(() => ({}));
}

export async function register(email: string, password: string) {
  const resp = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return handleResp(resp);
}

export async function login(email: string, password: string) {
  // возвращается cookie от сервера — мы не читаем токен на фронте (httpOnly)
  const resp = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // важно для cookie
    body: JSON.stringify({ email, password }),
  });
  return handleResp(resp);
}

export async function logout() {
  const resp = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  return handleResp(resp);
}

export async function me(): Promise<ApiUser> {
  const resp = await fetch(`${BASE}/users/me`, {
    method: "GET",
    credentials: "include",
  });
  return handleResp(resp);
}

export async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const resp = await fetch(`${BASE}/upload`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  return handleResp(resp);
}
