import type { ApiReader } from "@/shared/api/reader";
import type { Activity, Extraction, Notebook } from "@/shared/api/types";

export interface DashboardData {
  counts: {
    notebooks: number;
    extractions: number;
    urlExtractions: number;
    imageExtractions: number;
  };
  recentNotebooks: Notebook[];
  recentExtractions: Extraction[];
}

export interface ActivityData {
  activity: Activity[];
}

export function getDashboard(reader: ApiReader) {
  return reader.get<DashboardData>("/dashboard");
}

export function getActivity(reader: ApiReader, limit = 5) {
  return reader.get<ActivityData>(`/activity?limit=${limit}`);
}
