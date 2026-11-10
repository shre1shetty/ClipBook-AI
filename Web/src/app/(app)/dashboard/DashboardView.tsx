"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Image as ImageIcon, Link2, Plus } from "lucide-react";
import { api } from "@/shared/api/client";
import type { Activity } from "@/shared/api/types";
import { getActivity, getDashboard, type ActivityData, type DashboardData } from "@/features/dashboard";
import { formatTime } from "@/shared/lib/format-time";
import styles from "@/shared/ui/ui.module.css";
import page from "./page.module.css";

export default function DashboardView({
  initialDashboard,
  initialActivity,
}: {
  initialDashboard?: DashboardData;
  initialActivity?: ActivityData;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(api),
    initialData: initialDashboard,
  });
  const activity = useQuery({
    queryKey: ["activity", 5],
    queryFn: () => getActivity(api, 5),
    initialData: initialActivity,
  });

  return (
    <>
      <div className={styles.row}>
        <div><h1 className={styles.pageTitle}>Dashboard</h1><p className={styles.pageSubtitle}>Pick up where you left off</p></div>
        <Link href="/notebooks?new=1" className={`${styles.button} ${styles.primary}`}><Plus size={16} /> New notebook</Link>
      </div>
      {error && <p className={styles.error}>Could not load your dashboard. Please try again.</p>}
      {isLoading ? <p className={styles.loading}>Loading your workspace…</p> : data && <>
        <section className={page.stats}>
          <Stat label="Notebooks" count={data.counts.notebooks} Icon={Link2} />
          <Stat label="Extractions" count={data.counts.extractions} Icon={ArrowUpRight} />
          <Stat label="From URLs" count={data.counts.urlExtractions} Icon={Link2} accent="teal" />
          <Stat label="From images" count={data.counts.imageExtractions} Icon={ImageIcon} accent="orange" />
        </section>
        <div className={page.columns}>
          <section>
            <h2 className={page.sectionTitle}>Recently accessed</h2>
            <div className={page.notebooks}>
              {data.recentNotebooks.map((notebook) => (
                <Link href={`/notebooks/${notebook._id}`} className={`${styles.card} ${page.notebook}`} key={notebook._id}>
                  <strong>{notebook.title}</strong>
                  <p>{notebook.extractionCount ?? 0} extractions</p>
                  <small>Edited {formatTime(notebook.updatedAt)}</small>
                </Link>
              ))}
              {data.recentNotebooks.length === 0 && <p className={styles.muted}>Create a notebook to start organizing your research.</p>}
            </div>
            <section className={`${styles.card} ${page.recent}`}>
              <h2 className={page.sectionTitle}>Recent extractions</h2>
              {data.recentExtractions.map((item) => (
                <Link className={styles.listItem} href={`/extractions?extraction=${item._id}`} key={item._id}>
                  <span className={`${styles.tag} ${item.sourceType === "URL" ? styles.url : styles.image}`}>{item.sourceType === "URL" ? "URL" : "Image"}</span>
                  <span className={page.extractionTitle}><strong>{item.title || "Untitled extraction"}</strong><small>{formatTime(item.createdAt)}</small></span>
                  <ArrowUpRight size={16} className={styles.muted} />
                </Link>
              ))}
              {data.recentExtractions.length === 0 && <p className={styles.muted}>Your recent extractions will show here.</p>}
            </section>
          </section>
          <section className={`${styles.card} ${page.activity}`}>
            <h2 className={page.sectionTitle}>Recent activity</h2>
            {activity.data?.activity.map((event, index) => (
              <div className={page.activityItem} key={`${event.type}-${event.at}-${index}`}>
                <span className={page.dot} />
                <div>
                  {event.type === "extraction_created"
                    ? <>Extracted <strong>{event.extraction?.title || "a page"}</strong>{event.notebook && <> into <strong>{event.notebook.title}</strong></>}</>
                    : <><strong>{event.notebook?.title}</strong> {event.type === "notebook_created" ? "created" : "updated"}</>}
                  <small>{formatTime(event.at)}</small>
                </div>
              </div>
            ))}
            {activity.isLoading && <p className={styles.muted}>Loading activity…</p>}
          </section>
        </div>
      </>}
    </>
  );
}

function Stat({ label, count, Icon, accent = "blue" }: { label: string; count: number; Icon: typeof Link2; accent?: string }) {
  return <div className={`${styles.card} ${page.stat} ${page[accent]}`}><span><Icon size={15} /> {label}</span><strong>{count}</strong></div>;
}
