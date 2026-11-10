import styles from "./loading.module.css";

export default function WorkspaceLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} />
      <span>Loading your workspace…</span>
    </div>
  );
}
