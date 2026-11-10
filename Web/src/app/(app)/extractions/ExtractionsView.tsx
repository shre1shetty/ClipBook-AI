"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Link2, MessageCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import type { Extraction } from "@/shared/api/types";
import {
  chatWithExtraction,
  extractImage,
  extractUrl,
  getExtraction,
  getExtractions,
} from "@/features/extractions";
import type {
  ExtractionData,
  ExtractionListData,
} from "@/features/extractions/api";
import { getNotebooks, updateNotebook } from "@/features/notebooks";
import type { NotebookListData } from "@/features/notebooks/api";
import { formatTime } from "@/shared/lib/format-time";
import ui from "@/shared/ui/ui.module.css";
import styles from "./page.module.css";

type Filter = "all" | "unassigned" | "URL" | "IMAGE";
type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ExtractionsView({
  initialFilter = "all",
  initialExtractions,
  initialNotebooks,
  initialSelected,
  initialNotebookId,
}: {
  initialFilter?: Filter;
  initialExtractions?: ExtractionListData;
  initialNotebooks?: NotebookListData;
  initialSelected?: ExtractionData;
  initialNotebookId?: string | null;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const query = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const selectedId = query.get("extraction");
  const targetNotebookId = query.get("notebookId");
  const hasMatchingInitialQuery =
    filter === initialFilter &&
    targetNotebookId === (initialNotebookId ?? null);
  const extractions = useQuery({
    queryKey: ["extractions", filter, targetNotebookId],
    queryFn: () =>
      getExtractions(api, {
        filter,
        notebookId:
          filter === "unassigned" ? undefined : (targetNotebookId ?? undefined),
      }),
    initialData: hasMatchingInitialQuery ? initialExtractions : undefined,
  });
  const notebooks = useQuery({
    queryKey: ["notebooks"],
    queryFn: () => getNotebooks(api),
    initialData: initialNotebooks,
  });
  const selected = useQuery({
    queryKey: ["extraction", selectedId],
    queryFn: () => {
      if (!selectedId) throw new Error("An extraction id is required");
      return getExtraction(api, selectedId);
    },
    enabled: Boolean(selectedId),
    initialData: initialSelected,
  });
  const items = extractions.data?.items ?? [];
  const count = extractions.data?.pagination?.total ?? items.length;

  const runExtraction = async () => {
    setBusy(true);
    try {
      if (file) await extractImage(api, file);
      else if (url.trim()) await extractUrl(api, url.trim());
      else return;
      setUrl("");
      setFile(null);
      toast.success("Extraction complete");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["extractions"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Extraction failed");
    } finally {
      setBusy(false);
    }
  };

  const addToNotebook = async (itemId: string, notebookId: string) => {
    try {
      const current = notebooks.data?.notebooks.find(
        (notebook) => notebook._id === notebookId,
      );
      if (!current) return;
      await updateNotebook(api, notebookId, {
        extractionIds: [itemId],
      });
      toast.success(`Added to ${current.title}`);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["extractions"] }),
        client.invalidateQueries({ queryKey: ["notebooks"] }),
        client.invalidateQueries({ queryKey: ["notebook-extractions"] }),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add extraction",
      );
    }
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const extraction = selected.data?.extraction;
    if (!selectedId || !extraction || !message.trim()) return;
    const currentMessage = message.trim();
    const history = messages;
    setMessage("");
    setMessages((items) => [
      ...items,
      { role: "user", content: currentMessage },
    ]);
    setChatBusy(true);
    try {
      const result = await chatWithExtraction(api, selectedId, {
        message: currentMessage,
        history,
      });
      setMessages((items) => [
        ...items,
        { role: "assistant", content: result.answer },
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not get an answer",
      );
    } finally {
      setChatBusy(false);
    }
  };

  const changeFilter = (value: Filter) => setFilter(value);
  return (
    <>
      <div className={ui.row}>
        <div>
          <h1 className={ui.pageTitle}>Extractions</h1>
          <p className={ui.pageSubtitle}>{count} total</p>
        </div>
      </div>
      <section className={`${ui.card} ${styles.quick}`}>
        <h2>Quick extract</h2>
        <label className={ui.field}>
          <span>
            <Link2 size={15} /> URL
          </span>
          <input
            className={ui.input}
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setFile(null);
            }}
            placeholder="Paste a link to extract from"
          />
        </label>
        <label className={styles.upload}>
          <Upload size={17} />{" "}
          {file ? file.name : "Choose a screenshot (JPEG, PNG, WebP)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setUrl("");
            }}
          />
        </label>
        {file && (
          <button className={styles.clearFile} onClick={() => setFile(null)}>
            <X size={14} /> Remove image
          </button>
        )}
        <button
          className={`${ui.button} ${ui.primary} ${ui.wide}`}
          onClick={runExtraction}
          disabled={busy || (!url.trim() && !file)}
        >
          {busy ? "Extracting…" : "Extract text"}
        </button>
      </section>
      <div className={ui.tabs}>
        {(["all", "unassigned", "URL", "IMAGE"] as const).map((value) => (
          <button
            key={value}
            className={`${ui.tab} ${filter === value ? ui.tabSelected : ""}`}
            onClick={() => changeFilter(value)}
          >
            {value === "all"
              ? "All"
              : value === "unassigned"
                ? "Not in a notebook"
                : value === "URL"
                  ? "URL"
                  : "Image"}
          </button>
        ))}
      </div>
      <section className={`${ui.card} ${styles.list}`}>
        {extractions.isLoading ? (
          <p className={ui.loading}>Loading extractions…</p>
        ) : extractions.error ? (
          <p className={ui.error}>
            Could not load extractions.{" "}
            <button onClick={() => extractions.refetch()}>Try again</button>
          </p>
        ) : (
          items.map((item) => (
            <article className={styles.item} key={item._id}>
              <span
                className={`${ui.tag} ${item.sourceType === "URL" ? ui.url : ui.image}`}
              >
                {item.sourceType === "URL" ? "URL" : "Image"}
              </span>
              <button
                className={styles.title}
                onClick={() => {
                  setMessages([]);
                  router.push(`/extractions?extraction=${item._id}`);
                }}
              >
                <strong>{item.title || "Untitled extraction"}</strong>
                <small>
                  {item.sourceUrl || item.sourceImage} ·{" "}
                  {formatTime(item.createdAt)}
                </small>
              </button>
              {targetNotebookId && item.notebookId !== targetNotebookId ? (
                <button
                  className={`${ui.button} ${ui.primary}`}
                  onClick={() => void addToNotebook(item._id, targetNotebookId)}
                >
                  Add to notebook
                </button>
              ) : (
                <select
                  className={ui.select}
                  aria-label={`Add ${item.title ?? "extraction"} to notebook`}
                  value={
                    typeof item.notebookId === "object"
                      ? (item.notebookId?._id ?? "")
                      : (item.notebookId ?? "")
                  }
                  onChange={(event) => {
                    if (event.target.value)
                      void addToNotebook(item._id, event.target.value);
                  }}
                >
                  <option value="" disabled>
                    Add to notebook…
                  </option>
                  {notebooks.data?.notebooks.map((book) => (
                    <option value={book._id} key={book._id}>
                      {book.title}
                    </option>
                  ))}
                </select>
              )}
              <button
                className={ui.button}
                aria-label={`Chat about ${item.title ?? "extraction"}`}
                onClick={() => {
                  setMessages([]);
                  router.push(`/extractions?extraction=${item._id}`);
                }}
              >
                <MessageCircle size={16} /> Chat
              </button>
            </article>
          ))
        )}
        {!extractions.isLoading && !extractions.error && !items.length && (
          <p className={ui.loading}>No extractions found.</p>
        )}
      </section>
      <Dialog.Root
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) router.push("/extractions");
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={ui.dialogOverlay} />
          {selectedId && (
            <Dialog.Content
              className={`${ui.dialog} ${ui.dialogContent} ${styles.chatDialog}`}
            >
              <header className={ui.row}>
                <div>
                  <Dialog.Title className={styles.dialogTitle}>
                    {selected.data?.extraction.title || "Extraction chat"}
                  </Dialog.Title>
                  <Dialog.Description
                    className={`${ui.muted} ${styles.dialogDescription}`}
                  >
                    Ask questions about this extracted text
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button className={styles.close} aria-label="Close">
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </header>
              <div className={styles.conversation}>
                {selected.isLoading && (
                  <p className={ui.muted}>Loading extraction…</p>
                )}
                {selected.error && (
                  <p className={ui.error}>
                    Could not load this extraction.{" "}
                    <button onClick={() => selected.refetch()}>
                      Try again
                    </button>
                  </p>
                )}
                {selected.data?.extraction.extractedContent && (
                  <details>
                    <summary>View extracted text</summary>
                    <p>
                      {selected.data.extraction.extractedContent.slice(0, 4000)}
                    </p>
                  </details>
                )}
                {messages.map((entry, index) => (
                  <p
                    className={
                      entry.role === "user"
                        ? styles.userMessage
                        : styles.assistantMessage
                    }
                    key={`${entry.role}-${index}`}
                  >
                    {entry.content}
                  </p>
                ))}
                {chatBusy && <p className={ui.muted}>Thinking…</p>}
              </div>
              <form className={styles.chatForm} onSubmit={sendMessage}>
                <input
                  className={ui.input}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask a question…"
                  maxLength={4000}
                />
                <button
                  className={`${ui.button} ${ui.primary}`}
                  disabled={chatBusy || !message.trim()}
                >
                  Send
                </button>
              </form>
            </Dialog.Content>
          )}
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
