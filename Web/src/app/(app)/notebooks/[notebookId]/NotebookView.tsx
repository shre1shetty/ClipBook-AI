"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bold, Heading1, Heading2, Italic, List, ListOrdered, MessageCircle, Save, Send, Trash2 } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import type { Extraction } from "@/shared/api/types";
import {
  askNotebook as askNotebookApi,
  getNotebook,
  getNotebookExtractions,
  updateNotebook,
  type NotebookData,
  type NotebookExtractionsData,
  type NotebookQuestionResult,
} from "@/features/notebooks";
import {
  deleteExtraction,
  getExtraction,
  getExtractionChat,
} from "@/features/extractions";
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
  const [deletingExtractionId, setDeletingExtractionId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [chatHistoryId, setChatHistoryId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [questionResult, setQuestionResult] = useState<NotebookQuestionResult | null>(null);
  const [asking, setAsking] = useState(false);
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
  const chatHistoryQuery = useQuery({
    queryKey: ["extraction-chat", chatHistoryId],
    queryFn: () => {
      if (!chatHistoryId) throw new Error("An extraction id is required");
      return getExtractionChat(api, chatHistoryId);
    },
    enabled: Boolean(chatHistoryId),
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
  const ask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = question.trim();
    if (!query || asking) return;
    setAsking(true);
    setAskedQuestion(query);
    setQuestionResult(null);
    try {
      const result = await askNotebookApi(api, notebookId, query);
      setQuestionResult(result.answer);
      setQuestion("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not answer this question");
    } finally {
      setAsking(false);
    }
  };
  const removeExtraction = async (extraction: Extraction) => {
    if (
      !window.confirm(
        `Delete "${extraction.title || "Untitled extraction"}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingExtractionId(extraction._id);
    try {
      await deleteExtraction(api, extraction._id);
      setInserted((items) => items.filter((id) => id !== extraction._id));
      setPreviewId((id) => (id === extraction._id ? null : id));
      setChatHistoryId((id) => (id === extraction._id ? null : id));
      toast.success("Extraction deleted");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["notebook-extractions", notebookId] }),
        client.invalidateQueries({ queryKey: ["notebooks"] }),
        client.invalidateQueries({ queryKey: ["extractions"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete extraction");
    } finally {
      setDeletingExtractionId(null);
    }
  };
  const insertAtCursor = async (
    extractionId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!editor) return;
    setInsertingId(extractionId);
    try {
      const selection = window.getSelection();
      const anchorNode = selection?.anchorNode;
      const focusNode = selection?.focusNode;
      const selectableContent =
        event.currentTarget
          .closest("article")
          ?.querySelectorAll("[data-insertable-content]") ?? [];
      const selectionIsInContent =
        anchorNode &&
        focusNode &&
        Array.from(selectableContent).some(
          (content) =>
            content.contains(anchorNode) && content.contains(focusNode),
        );
      const selectedText =
        selectionIsInContent && selection?.toString().trim()
          ? selection.toString()
          : "";
      let textToInsert = selectedText;
      if (!textToInsert) {
        const { extraction } =
          previewQuery.data?.extraction._id === extractionId
            ? previewQuery.data
            : await getExtraction(api, extractionId);
        textToInsert = extraction.extractedContent || extraction.title || "";
      }

      editor.chain().focus().insertContent(textToInsert).run();
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
        <section className={styles.askPanel} aria-labelledby="ask-notebook-title">
          <div className={ui.row}><h2 id="ask-notebook-title"><MessageCircle size={16} /> Ask this notebook</h2></div>
          <form onSubmit={ask} className={styles.askForm}>
            <label className={ui.field}>
              Question
              <textarea
                className={ui.textarea}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={2000}
                placeholder="Ask a question about this notebook"
              />
            </label>
            <button className={`${ui.button} ${ui.primary} ${ui.wide}`} type="submit" disabled={!question.trim() || asking}>
              <Send size={15} /> {asking ? "Thinking…" : "Ask"}
            </button>
          </form>
          {questionResult && <div className={styles.answer} aria-live="polite">
            <small className={ui.muted}>{askedQuestion}</small>
            <strong>Answer</strong>
            <p>{questionResult.answer}</p>
            <small className={ui.muted}>
              {questionResult.index.upToDate && !dirty
                ? "Based on the latest saved notebook version."
                : "This answer may not include your latest changes yet."}
            </small>
          </div>}
          {asking && <p className={ui.muted} aria-live="polite">Searching your notebook…</p>}
        </section>
        <div className={ui.row}><h2>Extractions</h2><span className={ui.muted}>{extractionsQuery.data?.items.length ?? 0}</span></div>
        <Link href={`/extractions?notebookId=${notebookId}`} className={`${ui.button} ${ui.primary} ${ui.wide}`}>Add extraction</Link>
        {extractionsQuery.data?.items.map((item) => <article className={styles.extraction} key={item._id}>
          <div className={ui.row}><span className={`${ui.tag} ${item.sourceType === "URL" ? ui.url : ui.image}`}>{item.sourceType}</span><small>{formatTime(item.createdAt)}</small></div>
          <strong>{item.title || "Untitled extraction"}</strong>
          <p>{item.sourceUrl || item.sourceImage}</p>
          <button
            className={ui.button}
            aria-label={`Delete ${item.title ?? "extraction"}`}
            disabled={deletingExtractionId !== null}
            onClick={() => void removeExtraction(item)}
          >
            <Trash2 size={15} /> Delete extraction
          </button>
          <button className={ui.button} onClick={() => setPreviewId((current) => current === item._id ? null : item._id)}>{previewId === item._id ? "Hide text" : "Preview text"}</button>
          <button
            className={ui.button}
            aria-expanded={chatHistoryId === item._id}
            onClick={() =>
              setChatHistoryId((current) =>
                current === item._id ? null : item._id,
              )
            }
          >
            {chatHistoryId === item._id ? "Hide chat history" : "View chat history"}
          </button>
          {chatHistoryId === item._id && (
            <div className={styles.chatHistory}>
              {chatHistoryQuery.isLoading && (
                <p className={ui.muted}>Loading chat history…</p>
              )}
              {chatHistoryQuery.error && (
                <p className={ui.error}>
                  Could not load chat history.{" "}
                  <button onClick={() => void chatHistoryQuery.refetch()}>
                    Try again
                  </button>
                </p>
              )}
              {chatHistoryQuery.data?.messages.map((message) => (
                <div className={styles.chatMessage} key={message.id}>
                  <strong>
                    {message.role === "user" ? "You" : "Assistant"}
                  </strong>
                  <p
                    data-insertable-content={
                      message.role === "assistant" ? "" : undefined
                    }
                  >
                    {message.content}
                  </p>
                </div>
              ))}
              {chatHistoryQuery.data?.messages.length === 0 && (
                <p className={ui.muted}>No chat history yet.</p>
              )}
            </div>
          )}
          {previewId === item._id && (previewQuery.isLoading
            ? <p className={ui.muted}>Loading text…</p>
            : previewQuery.data && <div className={styles.preview} data-insertable-content>{previewQuery.data.extraction.extractedContent}</div>)}
          <button className={`${ui.button} ${ui.wide}`} disabled={!hasCursor || insertingId === item._id} onClick={(event) => void insertAtCursor(item._id, event)}>{insertingId === item._id ? "Loading…" : "Insert at cursor"}</button>
        </article>)}
        {extractionsQuery.isLoading && <p className={ui.muted}>Loading extractions…</p>}
      </aside>
    </div>
  </>;
}
