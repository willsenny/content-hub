interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204 || (res.headers.get("content-length") ?? "") === "0") {
    return undefined as T;
  }

  const json: ApiResult<T> = await res.json().catch(() => ({
    success: false,
    error: "服务器响应异常",
  }));

  if (!res.ok || !json.success) {
    throw new Error(json.error || `请求失败 (${res.status})`);
  }

  return json.data as T;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
