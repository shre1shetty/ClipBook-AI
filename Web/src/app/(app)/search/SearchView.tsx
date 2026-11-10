"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { searchContent, type SearchResults } from "@/features/search";
import { formatTime } from "@/shared/lib/format-time";
import ui from "@/shared/ui/ui.module.css";
import styles from "./page.module.css";

export default function SearchView({
  initialResults,
}: {
  initialResults?: SearchResults;
}) {
  const search = useSearchParams();
  const term = search.get("q")?.trim() ?? "";
  const results = useQuery({
    queryKey: ["search", term],
    queryFn: () => searchContent(api, term),
    enabled: term.length >= 2,
    initialData: initialResults,
  });
  return <>
    <h1 className={ui.pageTitle}>Search</h1>
    <p className={ui.pageSubtitle}>Results for “{term}”</p>
    {term.length < 2 ? <p className={ui.loading}>Enter at least 2 characters to search.</p>
      : results.isLoading ? <p className={ui.loading}>Searching…</p>
        : results.error ? <p className={ui.error}>Search failed. <button onClick={() => results.refetch()}>Try again</button></p>
          : <div className={styles.results}>
            <section><h2>Notebooks</h2>{results.data?.notebooks.map((notebook) => <Link className={styles.result} href={`/notebooks/${notebook._id}`} key={notebook._id}><strong>{notebook.title}</strong><small>Edited {formatTime(notebook.updatedAt)}</small></Link>)}{!results.data?.notebooks.length && <p className={ui.muted}>No notebook matches.</p>}</section>
            <section><h2>Extractions</h2>{results.data?.extractions.map((item) => <Link className={styles.result} href={`/extractions?extraction=${item._id}`} key={item._id}><strong>{item.title || "Untitled extraction"}</strong><small>{item.sourceUrl || item.sourceImage} · {formatTime(item.createdAt)}</small></Link>)}{!results.data?.extractions.length && <p className={ui.muted}>No extraction matches.</p>}</section>
          </div>}
  </>;
}
