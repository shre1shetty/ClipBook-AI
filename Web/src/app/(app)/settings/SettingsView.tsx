"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { getCurrentUser } from "@/features/auth";
import ui from "@/shared/ui/ui.module.css";
import styles from "./page.module.css";

export default function SettingsView() {
  const account = useQuery({
    queryKey: ["session"],
    queryFn: () => getCurrentUser(api),
  });
  return <>
    <h1 className={ui.pageTitle}>Settings</h1>
    <p className={ui.pageSubtitle}>Manage your Clipbook account.</p>
    <section className={`${ui.card} ${styles.account}`}>
      <h2>Account</h2>
      {account.isLoading ? <p className={ui.muted}>Loading account…</p>
        : account.error ? <p className={ui.error}>Could not load account details. <button onClick={() => account.refetch()}>Try again</button></p>
          : <dl><div><dt>Name</dt><dd>{account.data?.user.name}</dd></div><div><dt>Email</dt><dd>{account.data?.user.email}</dd></div></dl>}
    </section>
  </>;
}
