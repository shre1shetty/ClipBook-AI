"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bold, Heading1, Heading2, Italic, List, ListOrdered, Save } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import type { Extraction } from "@/shared/api/types";
import {
  getNotebook,
  getNotebookExtractions,
  updateNotebook,
  type NotebookData,
  type NotebookExtractionsData,
} from "@/features/notebooks";
import { getExtraction } from "@/features/extractions";
import { formatTime } from "@/shared/lib/format-time";
import ui from "@/shared/ui/ui.module.css";
import styles from "./page.module.css";

export default function NotebookView({
  initialNotebook,
  initialExtractions,
}: {
  initialNotebook?: NotebookData;
  initialExtractions?: NotebookExtractionsData;
}) {
  const { notebookId } = useParams<{ notebookId: string }>();
  const client = useQueryClient();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [inserted, setInserted] = useState<string[]>([]);
  const [hasCursor, setHasCursor] = useState(false);
  const [insertingId, setInsertingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const notebookQuery = useQuery({
    queryKey: ["notebook", notebookId],
    queryFn: () => getNotebook(api, notebookId),
    initialData: initialNotebook,
    refetchInterval: (query) =>
      query.state.data?.notebook.ragSyncStatus === "pending" ? 3000 : false,
  });
  const extractionsQuery = useQuery({
    queryKey: ["notebook-extractions", notebookId],
    queryFn: () => getNotebookExtractions(api, notebookId),
    initialData: initialExtractions,
  });
  const previewQuery = useQuery({
    queryKey: ["extraction-preview", previewId],
    queryFn: () => {
      if (!previewId) throw new Error("An extraction id is required");
      return getExtraction(api, previewId);
    },
    enabled: Boolean(previewId),
  });
  const notebook = notebookQuery.data?.notebook;
  const editor = useEditor({
    extensions: [StarterKit, Markdown, Placeholder.configure({ placeholder: "Start writing your notes…" })],
    content: "",
    immediatelyRender: false,
    onUpdate: () => setDirty(true),
    onFocus: () => setHasCursor(true),
    onSelectionUpdate: () => setHasCursor(true),
  });
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (notebook) {
      setTitle(notebook.title);
    }
  }, [notebook]);
  useEffect(() => {
    if (editor && notebook && editor.getMarkdown() !== notebook.content) {
      editor.commands.setContent(notebook.content ?? "", { contentType: "markdown" });
      setDirty(false);
    }
  }, [editor, notebook]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    if (!editor || !notebook) return;
    try {
      await updateNotebook(api, notebookId, {
        title: title.trim(),
        content: editor.getMarkdown(),
        extractionIds: [...new Set(inserted)],
      });
      setDirty(false);
      setInserted([]);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["notebook", notebookId] }),
        client.invalidateQueries({ queryKey: ["notebooks"] }),
      ]);
      toast.success("Notebook saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save notebook");
    }
  };
  const insertAtCursor = async (
    extractionId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!editor) return;
    setInsertingId(extractionId);
    try {
      const { extraction } =
        previewQuery.data?.extraction._id === extractionId
          ? previewQuery.data
          : await getExtraction(api, extractionId);
      const selection = window.getSelection();
      const preview = event.currentTarget.closest("article")?.querySelector("[data-extraction-preview]");
      const selectedText =
        selection?.anchorNode &&
        preview?.contains(selection.anchorNode) &&
        selection.toString().trim()
          ? selection.toString()
          : "";
      editor.chain().focus().insertContent(selectedText || extraction.extractedContent || extraction.title || "").run();
      setInserted((items) => [...new Set([...items, extractionId])]);
      setDirty(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load extraction text");
    } finally {
      setInsertingId(null);
    }
  };

  const onNavigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) event.preventDefault();
  };
  const status = notebook?.ragSyncStatus;
  if (notebookQuery.isLoading) return <p className={ui.loading}>Loading notebook…</p>;
  if (notebookQuery.error || !notebook) return <p className={ui.error}>Could not load this notebook. <button onClick={() => notebookQuery.refetch()}>Try again</button></p>;
  return <>
    <header className={styles.header}>
      <Link href="/notebooks" onClick={onNavigate} className={styles.back}><ArrowLeft size={16} /> Notebooks</Link>
      <input className={styles.titleInput} aria-label="Notebook title" value={title} onChange={(event) => { setTitle(event.target.value); setDirty(true); }} />
      <span className={`${ui.tag} ${status === "synced" ? ui.indexed : ui.indexing}`}>{status === "synced" ? "Indexed" : status === "failed" ? "Index failed" : "Indexing"}</span>
      <span className={styles.saved}>{dirty ? "Unsaved changes" : `Saved ${formatTime(notebook.updatedAt)}`}</span>
      <button className={`${ui.button} ${ui.primary}`} onClick={save} disabled={!dirty}><Save size={15} /> Save</button>
    </header>
    <div className={styles.workspace}>
      <section className={styles.editorColumn}>
        <div className={styles.toolbar}>
          <button aria-label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={16} /></button>
          <button aria-label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={16} /></button>
          <button aria-label="Heading 1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={17} /></button>
          <button aria-label="Heading 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></button>
          <button aria-label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16} /></button>
          <button aria-label="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></button>
        </div>
        <EditorContent editor={editor} className={styles.editor} />
      </section>
      <aside className={styles.extractions}>
        <div className={ui.row}><h2>Extractions</h2><span className={ui.muted}>{extractionsQuery.data?.items.length ?? 0}</span></div>
        <Link href={`/extractions?notebookId=${notebookId}`} className={`${ui.button} ${ui.primary} ${ui.wide}`}>Add extraction</Link>
        {extractionsQuery.data?.items.map((item) => <article className={styles.extraction} key={item._id}>
          <div className={ui.row}><span className={`${ui.tag} ${item.sourceType === "URL" ? ui.url : ui.image}`}>{item.sourceType}</span><small>{formatTime(item.createdAt)}</small></div>
          <strong>{item.title || "Untitled extraction"}</strong>
          <p>{item.sourceUrl || item.sourceImage}</p>
          <button className={ui.button} onClick={() => setPreviewId((current) => current === item._id ? null : item._id)}>{previewId === item._id ? "Hide text" : "Preview text"}</button>
          {previewId === item._id && (previewQuery.isLoading
            ? <p className={ui.muted}>Loading text…</p>
            : previewQuery.data && <div className={styles.preview} data-extraction-preview>{previewQuery.data.extraction.extractedContent}</div>)}
          <button className={`${ui.button} ${ui.wide}`} disabled={!hasCursor || insertingId === item._id} onClick={(event) => void insertAtCursor(item._id, event)}>{insertingId === item._id ? "Loading…" : "Insert at cursor"}</button>
        </article>)}
        {extractionsQuery.isLoading && <p className={ui.muted}>Loading extractions…</p>}
      </aside>
    </div>
  </>;
}
