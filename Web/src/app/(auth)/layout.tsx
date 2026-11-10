import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <Link href="/login" className={styles.brand}>Clipbook <span>AI</span></Link>
        {children}
      </section>
    </main>
  );
}
