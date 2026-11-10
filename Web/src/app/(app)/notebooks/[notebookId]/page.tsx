import { notFound } from "next/navigation";
import {
  getNotebook,
  getNotebookExtractions,
} from "@/features/notebooks";
import {
  getServerPageData,
  ServerApiError,
  serverApi,
} from "@/shared/api/server";
import NotebookView from "./NotebookView";

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ notebookId: string }>;
}) {
  const { notebookId } = await params;
  let initialNotebook;
  try {
    initialNotebook = await getServerPageData(
      getNotebook(serverApi, notebookId),
    );
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) notFound();
    throw error;
  }
  const initialExtractions = await getServerPageData(
    getNotebookExtractions(serverApi, notebookId),
  );
  return (
    <NotebookView
      initialNotebook={initialNotebook}
      initialExtractions={initialExtractions}
    />
  );
}
