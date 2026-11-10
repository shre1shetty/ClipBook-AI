"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import styles from "./ErrorFallback.module.css";

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught an error", error);
  }, [error]);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Something went wrong</p>
        <h1>We couldn’t load this page</h1>
        <p className={styles.description}>
          Your data is unchanged. Try again, or return to your dashboard.
        </p>
        {error.digest && <p className={styles.reference}>Error reference: {error.digest}</p>}
        <div className={styles.actions}>
          <button className={styles.primary} onClick={reset}>
            <RefreshCw size={16} /> Try again
          </button>
          <Link className={styles.secondary} href="/dashboard">Go to dashboard</Link>
        </div>
      </div>
    </main>
  );
}
