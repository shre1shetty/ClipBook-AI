export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshRequest: Promise<Response> | undefined;

function refreshSession(): Promise<Response> {
  refreshRequest ??= fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }).finally(() => {
    refreshRequest = undefined;
  });
  return refreshRequest;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });

  if (response.status === 401 && retry && path !== "/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed.ok) return request<T>(path, init, false);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null && "message" in body) {
        const apiMessage = (body as { message?: unknown }).message;
        if (typeof apiMessage === "string") message = apiMessage;
      }
    } catch {
      if (response.statusText) message = response.statusText;
    }
    throw new ApiError(message, response.status);
  }

  if (
    response.status === 204 ||
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

function jsonBody(value: unknown): Pick<RequestInit, "body"> {
  return { body: JSON.stringify(value) };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, value?: unknown) =>
    request<T>(path, { method: "POST", ...jsonBody(value ?? {}) }),
  patch: <T>(path: string, value: unknown) =>
    request<T>(path, { method: "PATCH", ...jsonBody(value) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, file: File) => {
    const body = new FormData();
    body.append("image", file);
    return request<T>(path, { method: "POST", body });
  },
};
