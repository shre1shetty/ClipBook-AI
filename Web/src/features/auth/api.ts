import type { ApiClient, ApiReader } from "@/shared/api/reader";
import type { User } from "@/shared/api/types";

export interface CurrentUserData {
  user: User;
}

export function getCurrentUser(reader: ApiReader) {
  return reader.get<CurrentUserData>("/auth/me");
}

export function login(client: ApiClient, input: { email: string; password: string }) {
  return client.post<CurrentUserData>("/auth/login", input);
}

export function register(
  client: ApiClient,
  input: { name: string; email: string; password: string },
) {
  return client.post<CurrentUserData>("/auth/register", input);
}

export function logout(client: ApiClient) {
  return client.post<void>("/auth/logout");
}
