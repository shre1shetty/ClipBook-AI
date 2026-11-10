"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { api } from "@/shared/api/client";
import { register as registerUser } from "@/features/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ui from "@/shared/ui/ui.module.css";
import styles from "../auth.module.css";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async (values) => {
    try {
      await registerUser(api, values);
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create your account");
    }
  });
  return <>
    <h1 className={styles.title}>Create your account</h1>
    <p className={styles.intro}>Save useful pages and bring your research together.</p>
    <form className={styles.form} onSubmit={submit}>
      <label className={ui.field}>Name<input className={ui.input} autoComplete="name" {...register("name")} />{errors.name && <span className={ui.error}>{errors.name.message}</span>}</label>
      <label className={ui.field}>Email<input className={ui.input} type="email" autoComplete="email" {...register("email")} />{errors.email && <span className={ui.error}>{errors.email.message}</span>}</label>
      <label className={ui.field}>Password<input className={ui.input} type="password" autoComplete="new-password" {...register("password")} />{errors.password && <span className={ui.error}>{errors.password.message}</span>}</label>
      <button className={`${ui.button} ${ui.primary} ${ui.wide}`} disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</button>
    </form>
    <p className={styles.footer}>Already have an account? <Link href="/login">Log in</Link></p>
  </>;
}
