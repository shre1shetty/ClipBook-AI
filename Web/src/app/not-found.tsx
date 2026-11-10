import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.container}>
      <section>
        <p>404</p>
        <h1>We couldn’t find that page</h1>
        <Link href="/dashboard">Back to dashboard</Link>
      </section>
    </main>
  );
}
