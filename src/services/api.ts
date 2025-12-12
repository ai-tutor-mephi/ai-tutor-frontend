// src/services/api.ts
const BASE = "http://localhost:8080"; // бэкенд

// ============ TYPES (из swagger.json) ============

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type DialogResponse = {
  dialogId: number;
  title: string;
};

export type DialogInfo = {
  dialogId: number;
  title: string;
  createdAt: string;
};

export type FileResponse = {
  fileId: number;
  originalFileName: string;
  dialogId: number;
};

export type MessageResponse = {
  answer: string;
};

export type DialogMessagesDto = {
  message: string;
  role: "USER" | "BOT";
};

export type DialogMessagesResponse = {
  dialogId: number;
  dialogMessages: DialogMessagesDto[];
};

export type ErrorResponse = {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
};

export type ChangeUsernameResponse = {
  userId: number;
  userName: string;
};

// ============ TOKEN MANAGEMENT ============

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Получить access token из localStorage
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Получить refresh token из localStorage
function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// Сохранить токены в localStorage
export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

// Удалить токены из localStorage
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Проверить, авторизован ли пользователь
export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getRefreshToken();
}

// Получить имя пользователя из токена
export function getUserNameFromToken(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  
  try {
    // JWT токен состоит из трех частей, разделенных точками
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.userName || payload.username || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// ============ FETCH WITH AUTO TOKEN REFRESH ============

// Подписчики на обновление токена
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// Обновить access token используя refresh token
async function refreshAccessToken(): Promise<string> {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    clearTokens();
    throw new Error("No refresh token available");
  }

  try {
    const resp = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    if (!resp.ok) {
      // Refresh token истек или невалиден
      clearTokens();
      window.location.href = "/auth";
      throw new Error("Refresh token expired. Please login again.");
    }

    const data: AuthResponse = await resp.json();
    saveTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (error) {
    clearTokens();
    window.location.href = "/auth";
    throw error;
  }
}

// Fetch с автоматическим обновлением токена
async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  
  // Добавляем Authorization header если есть токен
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  let response = await fetch(url, options);

  // Если получили 401 - токен истек
  if (response.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Повторяем запрос с новым токеном
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(url, options);
      } catch (error) {
        isRefreshing = false;
        throw error;
      }
    } else {
      // Ждем, пока токен обновится
      const newToken = await new Promise<string>((resolve) => {
        subscribeTokenRefresh(resolve);
      });

      // Повторяем запрос с новым токеном
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      };
      response = await fetch(url, options);
    }
  }

  return response;
}

// Обработка ответа
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = response.statusText;
    
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData: ErrorResponse = await response.json();
        errorMessage = errorData.message || errorData.error;
      } else {
        errorMessage = await response.text();
      }
    } catch {
      // Используем statusText если не удалось распарсить
    }

    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  
  // Для text/plain или пустых ответов
  const text = await response.text();
  return (text || null) as T;
}

// ============ AUTH API ============

export async function register(
  userName: string,
  email: string,
  password: string
): Promise<string> {
  const resp = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, email, password }),
  });
  return handleResponse<string>(resp);
}

export async function login(
  userName: string,
  password: string
): Promise<AuthResponse> {
  const resp = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, password }),
  });
  const data = await handleResponse<AuthResponse>(resp);
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<string> {
  const resp = await fetchWithAuth(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  clearTokens();
  return handleResponse<string>(resp);
}

// ============ DIALOGS API ============

// Создать диалог с файлами
export async function createDialogWithFiles(
  files: File[]
): Promise<DialogResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const resp = await fetchWithAuth(`${BASE}/api/dialogs/with-files`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<DialogResponse>(resp);
}

// Загрузить файлы в существующий диалог
export async function uploadFilesToDialog(
  dialogId: number,
  files: File[]
): Promise<FileResponse[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const resp = await fetchWithAuth(
    `${BASE}/api/dialogs/${dialogId}/files`,
    {
      method: "POST",
      body: formData,
    }
  );
  return handleResponse<FileResponse[]>(resp);
}

// Получить список файлов в диалоге
export async function getDialogFiles(
  dialogId: number
): Promise<FileResponse[]> {
  const resp = await fetchWithAuth(`${BASE}/api/dialogs/${dialogId}/files`, {
    method: "GET",
  });
  return handleResponse<FileResponse[]>(resp);
}

// Отправить сообщение в диалог
export async function sendMessage(
  dialogId: number,
  question: string
): Promise<MessageResponse> {
  const resp = await fetchWithAuth(
    `${BASE}/api/dialogs/${dialogId}/send-question`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }
  );
  return handleResponse<MessageResponse>(resp);
}

// Получить сообщения из диалога
export async function getDialogMessages(
  dialogId: number
): Promise<DialogMessagesResponse> {
  const resp = await fetchWithAuth(
    `${BASE}/api/dialogs/${dialogId}/messages`,
    {
      method: "GET",
    }
  );
  return handleResponse<DialogMessagesResponse>(resp);
}

// Получить список всех диалогов пользователя
export async function getDialogs(): Promise<DialogInfo[]> {
  const resp = await fetchWithAuth(`${BASE}/api/dialogs`, {
    method: "GET",
  });
  return handleResponse<DialogInfo[]>(resp);
}

// Удалить диалог
export async function deleteDialog(dialogId: number): Promise<void> {
  const resp = await fetchWithAuth(`${BASE}/api/dialogs/${dialogId}`, {
    method: "DELETE",
  });
  
  if (resp.status === 204) {
    return;
  }
  
  return handleResponse<void>(resp);
}

// Изменить название диалога
export async function changeDialogTitle(
  dialogId: number,
  title: string
): Promise<DialogInfo> {
  const resp = await fetchWithAuth(
    `${BASE}/api/dialogs/${dialogId}/change-title`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }
  );
  return handleResponse<DialogInfo>(resp);
}

// ============ USER API ============

// Изменить имя пользователя
export async function changeUsername(
  userName: string
): Promise<ChangeUsernameResponse> {
  const resp = await fetchWithAuth(`${BASE}/api/user/change-username`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName }),
  });
  return handleResponse<ChangeUsernameResponse>(resp);
}


// ������������� ��������� ������ (�����, ����� ����� username ����� � JWT)
export async function refreshTokens(): Promise<void> {
  await refreshAccessToken();
}


