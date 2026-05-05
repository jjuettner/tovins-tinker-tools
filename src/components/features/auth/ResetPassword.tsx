import { useState } from "react";
import { updatePassword, useSession } from "../../../lib/auth";
import { buttonClass, inputClass, smallLabelClass } from "../../ui/controlClasses";

export function ResetPassword() {
  const { session, loading } = useSession();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pw = password;
    if (!pw) return;
    setStatus("saving");
    setErrorMsg(null);
    try {
      await updatePassword(pw);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to update password");
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
        Loading…
      </section>
    );
  }

  if (!session) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
        Open the password reset link from your email on this device.
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Reset password</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Set a new password for your account.</p>

      <form className="mt-5 flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>New password</span>
          <input
            className={inputClass()}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
          />
        </label>

        <button type="submit" className={buttonClass("primary")} disabled={status === "saving" || status === "saved"}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Update password"}
        </button>

        {status === "saved" ? <p className="text-sm text-emerald-700 dark:text-emerald-300">Password updated.</p> : null}
        {status === "error" ? <p className="text-sm text-red-700 dark:text-red-300">{errorMsg ?? "Failed"}</p> : null}
      </form>
    </section>
  );
}

