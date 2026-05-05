import { useState } from "react";
import { requestPasswordReset, sendMagicLink, signInWithPassword, signUpWithPassword } from "../../../lib/auth";
import { buttonClass, inputClass, smallLabelClass } from "../../ui/controlClasses";

export function SignIn() {
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentMsg, setSentMsg] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!v) return;
    setStatus("sending");
    setErrorMsg(null);
    setSentMsg(null);
    try {
      if (mode === "magic") {
        await sendMagicLink(v);
        setStatus("sent");
        setSentMsg("Check your inbox. Open the magic link on this device.");
      } else {
        if (resetMode) {
          await requestPasswordReset(v);
          setStatus("sent");
          setSentMsg("Check your inbox. Open the reset link on this device.");
          return;
        }
        const pw = password;
        if (!pw) return;
        if (isSignUp) {
          await signUpWithPassword(v, pw);
          setStatus("sent");
          setSentMsg("Account created. Check your email to confirm, then come back and sign in.");
        } else {
          await signInWithPassword(v, pw);
          setStatus("idle");
        }
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Choose magic link or password.</p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={buttonClass(mode === "magic" ? "primary" : "secondary")}
          onClick={() => {
            setMode("magic");
            setStatus("idle");
            setErrorMsg(null);
            setSentMsg(null);
          }}
        >
          Magic link
        </button>
        <button
          type="button"
          className={buttonClass(mode === "password" ? "primary" : "secondary")}
          onClick={() => {
            setMode("password");
            setStatus("idle");
            setErrorMsg(null);
            setSentMsg(null);
          }}
        >
          Password
        </button>
      </div>

      <form className="mt-5 flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Email</span>
          <input
            className={inputClass()}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>

        {mode === "password" && !resetMode ? (
          <label className="flex flex-col gap-1">
            <span className={smallLabelClass()}>Password</span>
            <input
              className={inputClass()}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              placeholder="••••••••"
            />
          </label>
        ) : null}

        {mode === "password" && !resetMode ? (
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input type="checkbox" checked={isSignUp} onChange={(e) => setIsSignUp(e.target.checked)} />
            Create account
          </label>
        ) : null}

        {mode === "password" ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
              onClick={() => {
                setResetMode((v) => !v);
                setStatus("idle");
                setErrorMsg(null);
                setSentMsg(null);
              }}
            >
              {resetMode ? "Back to sign in" : "Forgot password?"}
            </button>
          </div>
        ) : null}

        <button type="submit" className={buttonClass("primary")} disabled={status === "sending" || status === "sent"}>
          {status === "sending"
            ? "Working…"
            : mode === "magic"
              ? status === "sent"
                ? "Sent"
                : "Send magic link"
              : resetMode
                ? "Send reset email"
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
        </button>

        {status === "sent" ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{sentMsg ?? "Check your inbox."}</p> : null}
        {status === "error" ? (
          <p className="text-sm text-red-700 dark:text-red-300">{errorMsg ?? "Failed"}</p>
        ) : null}
      </form>
    </section>
  );
}

