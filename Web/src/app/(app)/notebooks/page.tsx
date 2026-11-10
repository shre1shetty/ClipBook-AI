import { getNotebooks } from "@/features/notebooks";
import { getServerPageData, serverApi } from "@/shared/api/server";
import NotebooksView from "./NotebooksView";

export default async function NotebooksPage() {
  const initialNotebooks = await getServerPageData(getNotebooks(serverApi));
  return <NotebooksView initialNotebooks={initialNotebooks} />;
}
