export interface ApiReader {
  get<T>(path: string): Promise<T>;
}

export interface ApiClient extends ApiReader {
  post<T>(path: string, value?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  upload<T>(path: string, file: File): Promise<T>;
}
