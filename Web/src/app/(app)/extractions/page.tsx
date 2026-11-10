import { getExtraction, getExtractions } from "@/features/extractions";
import { getNotebooks } from "@/features/notebooks";
import {
  getServerPageData,
  serverApi,
} from "@/shared/api/server";
import ExtractionsView from "./ExtractionsView";

type SearchParams = Promise<{
  extraction?: string;
  notebookId?: string;
}>;

export default async function ExtractionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialFilter = "all";
  const [initialExtractions, initialNotebooks, initialSelected] =
    await Promise.all([
      getServerPageData(
        getExtractions(serverApi, {
          filter: initialFilter,
          notebookId: params.notebookId,
        }),
      ),
      getServerPageData(getNotebooks(serverApi)),
      params.extraction
        ? getServerPageData(getExtraction(serverApi, params.extraction))
        : undefined,
    ]);

  return (
    <ExtractionsView
      initialFilter={initialFilter}
      initialExtractions={initialExtractions}
      initialNotebooks={initialNotebooks}
      initialSelected={initialSelected}
      initialNotebookId={params.notebookId ?? null}
    />
  );
}
