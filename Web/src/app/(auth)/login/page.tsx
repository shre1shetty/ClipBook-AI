"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { api } from "@/shared/api/client";
import { login } from "@/features/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ui from "@/shared/ui/ui.module.css";
import styles from "../auth.module.css";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async (values) => {
    try {
      await login(api, values);
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log in");
    }
  });
  return <>
    <h1 className={styles.title}>Welcome back</h1>
    <p className={styles.intro}>Log in to continue to your knowledge workspace.</p>
    <form className={styles.form} onSubmit={submit}>
      <label className={ui.field}>Email<input className={ui.input} type="email" autoComplete="email" {...register("email")} />{errors.email && <span className={ui.error}>{errors.email.message}</span>}</label>
      <label className={ui.field}>Password<input className={ui.input} type="password" autoComplete="current-password" {...register("password")} />{errors.password && <span className={ui.error}>{errors.password.message}</span>}</label>
      <button className={`${ui.button} ${ui.primary} ${ui.wide}`} disabled={isSubmitting}>{isSubmitting ? "Logging in…" : "Log in"}</button>
    </form>
    <p className={styles.footer}>New to Clipbook? <Link href="/register">Create an account</Link></p>
  </>;
}
