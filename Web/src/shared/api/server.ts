import { cookies } from "next/headers";
import type { ApiReader } from "./reader";

export class ServerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

const apiOrigin = (process.env.API_ORIGIN ?? "http://localhost:5000").replace(
  /\/+$/,
  "",
);

async function get<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const authCookieHeader = ["accessToken", "refreshToken"]
    .map((name) => {
      const value = cookieStore.get(name)?.value;
      return value ? `${name}=${value}` : null;
    })
    .filter((value): value is string => value !== null)
    .join("; ");

  const response = await fetch(`${apiOrigin}/api${path}`, {
    headers: authCookieHeader ? { Cookie: authCookieHeader } : undefined,
    cache: "no-store",
  });

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
    throw new ServerApiError(message, response.status);
  }

  if (
    response.status === 204 ||
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const serverApi: ApiReader = { get };

export async function getServerPageData<T>(
  request: Promise<T>,
): Promise<T | undefined> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      return undefined;
    }
    throw error;
  }
}
