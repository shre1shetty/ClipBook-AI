import { searchContent } from "@/features/search";
import { getServerPageData, serverApi } from "@/shared/api/server";
import SearchView from "./SearchView";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const initialResults =
    term.length >= 2
      ? await getServerPageData(searchContent(serverApi, term))
      : undefined;
  return <SearchView initialResults={initialResults} />;
}
