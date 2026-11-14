"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import {
  createNotebook as createNotebookApi,
  deleteNotebook as deleteNotebookApi,
  getNotebooks,
  type NotebookListData,
} from "@/features/notebooks";
import { formatTime } from "@/shared/lib/format-time";
import ui from "@/shared/ui/ui.module.css";
import styles from "./page.module.css";

export default function NotebooksView({
  initialNotebooks,
}: {
  initialNotebooks?: NotebookListData;
}) {
  const [filter, setFilter] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const query = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const notebooks = useQuery({
    queryKey: ["notebooks"],
    queryFn: () => getNotebooks(api),
    initialData: initialNotebooks,
    refetchInterval: (query) =>
      query.state.data?.notebooks.some(
        (book) => book.ragSyncStatus === "pending",
      )
        ? 3000
        : false,
  });
  useEffect(() => {
    if (query.get("new") === "1") setCreating(true);
  }, [query]);

  async function createNotebook(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const result = await createNotebookApi(api, title.trim());
      await client.invalidateQueries({ queryKey: ["notebooks"] });
      setCreating(false);
      setTitle("");
      router.push(`/notebooks/${result.notebook._id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create notebook",
      );
    }
  }

  async function deleteNotebook(notebookId: string, notebookTitle: string) {
    if (!window.confirm(`Delete "${notebookTitle}"? This cannot be undone.`))
      return;
    setDeletingId(notebookId);
    try {
      await deleteNotebookApi(api, notebookId);
      await client.invalidateQueries({ queryKey: ["notebooks"] });
      toast.success("Notebook deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete notebook",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filtered =
    notebooks.data?.notebooks.filter((book) =>
      book.title.toLowerCase().includes(filter.toLowerCase()),
    ) ?? [];
  return (
    <>
      <div className={ui.row}>
        <div>
          <h1 className={ui.pageTitle}>Notebooks</h1>
          <p className={ui.pageSubtitle}>
            {notebooks.data?.notebooks.length ?? 0} notebooks
          </p>
        </div>
        <button
          className={`${ui.button} ${ui.primary}`}
          onClick={() => setCreating(true)}
        >
          <Plus size={16} /> New notebook
        </button>
      </div>
      <div className={`${ui.card} ${styles.panel}`}>
        <input
          className={ui.input}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search notebooks"
          aria-label="Search notebooks"
        />
        {notebooks.isLoading ? (
          <p className={ui.loading}>Loading notebooks…</p>
        ) : notebooks.error ? (
          <p className={ui.error}>
            Could not load notebooks.{" "}
            <button onClick={() => notebooks.refetch()}>Try again</button>
          </p>
        ) : (
          <div className={ui.list}>
            {filtered.map((book) => (
              <div className={ui.listItem} key={book._id}>
                <Link
                  className={styles.notebookLink}
                  href={`/notebooks/${book._id}`}
                >
                  <span className={styles.bookTitle}>
                    <strong>{book.title}</strong>
                    <small>{book.extractionCount ?? 0} extractions</small>
                  </span>
                </Link>
                <span
                  className={`${ui.tag} ${book.ragSyncStatus === "synced" ? ui.indexed : ui.indexing}`}
                >
                  {book.ragSyncStatus === "synced"
                    ? "Indexed"
                    : book.ragSyncStatus === "failed"
                      ? "Index failed"
                      : "Indexing"}
                </span>
                <span className={styles.edited}>
                  {formatTime(book.updatedAt)}
                </span>
                <button
                  type="button"
                  className={styles.deleteButton}
                  aria-label={`Delete ${book.title}`}
                  disabled={deletingId !== null}
                  onClick={() => void deleteNotebook(book._id, book.title)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {!filtered.length && (
              <p className={ui.loading}>No notebooks found.</p>
            )}
          </div>
        )}
      </div>
      {creating && (
        <div
          className={ui.dialogOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCreating(false);
          }}
        >
          <form
            className={`${ui.dialog} ${ui.dialogContent}`}
            onSubmit={createNotebook}
          >
            <div className={ui.row}>
              <h2>Create a notebook</h2>
              <button
                type="button"
                className={ui.button}
                onClick={() => setCreating(false)}
              >
                Close
              </button>
            </div>
            <label className={ui.field}>
              Title
              <input
                autoFocus
                className={ui.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={150}
              />
            </label>
            <button
              className={`${ui.button} ${ui.primary} ${ui.wide} ${ui.mt2}`}
              disabled={!title.trim()}
            >
              Create notebook
            </button>
          </form>
        </div>
      )}
    </>
  );
}
