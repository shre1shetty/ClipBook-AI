"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Grid2X2, Menu, Search, ScanLine, Settings, UserRound } from "lucide-react";
import { ApiError, api } from "@/shared/api/client";
import {
  getCurrentUser,
  logout as logoutUser,
  type CurrentUserData,
} from "@/features/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import styles from "./AppShell.module.css";
import ui from "@/shared/ui/ui.module.css";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: Grid2X2 },
  { href: "/notebooks", label: "Notebooks", Icon: BookOpen },
  { href: "/extractions", label: "Extractions", Icon: ScanLine },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function AppShell({
  children,
  initialSession,
}: Readonly<{
  children: React.ReactNode;
  initialSession?: CurrentUserData;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    try {
      await logoutUser(api);
      queryClient.clear();
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log out");
    }
  }

  return (
    <div className={styles.shell}>
      <aside className={clsx(styles.sidebar, menuOpen && styles.open)}>
        <div className={styles.brand}>Clipbook <span>AI</span></div>
        <nav className={styles.nav}>
          {links.map(({ href, label, Icon }) => (
            <Link
              className={clsx(pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)) ? styles.active : "")}
              href={href}
              key={href}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <button className={clsx(ui.button, styles.mobileMenu)} aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}><Menu size={18} /></button>
          <label className={styles.search}>
            <Search size={16} />
            <input aria-label="Search notebooks and extractions" placeholder="Search notebooks and extractions" onKeyDown={(event) => {
              if (event.key === "Enter" && event.currentTarget.value.trim()) router.push(`/search?q=${encodeURIComponent(event.currentTarget.value.trim())}`);
            }} />
          </label>
          <div className={styles.actions}>
            <Link href="/extractions" className={`${ui.button} ${ui.primary}`}><ScanLine size={15} /> Extract</Link>
            <button className={styles.iconButton} aria-label="Log out" title="Log out" onClick={logout}><UserRound size={17} /></button>
          </div>
        </header>
        <AuthGuard initialSession={initialSession}>{children}</AuthGuard>
      </main>
    </div>
  );
}

function AuthGuard({
  children,
  initialSession,
}: Readonly<{
  children: React.ReactNode;
  initialSession?: CurrentUserData;
}>) {
  const router = useRouter();
  const { isLoading, error, refetch } = useQuery({
    queryKey: ["session"],
    queryFn: () => getCurrentUser(api),
    retry: false,
    enabled: !initialSession,
    initialData: initialSession,
  });

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) router.replace("/login");
  }, [error, router]);

  if (isLoading || (error instanceof ApiError && error.status === 401)) {
    return <p className={ui.loading}>Loading your workspace…</p>;
  }
  if (error) {
    return <p className={ui.error}>Could not verify your session. <button onClick={() => refetch()}>Try again</button></p>;
  }
  return <>{children}</>;
}
