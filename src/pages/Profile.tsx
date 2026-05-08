import { useEffect, useState } from "react";
import { buttonClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import { useProfile } from "@/lib/auth";
import { updateMyDisplayName } from "@/lib/db/profileSettings";

export function ProfilePage() {
  const { profile, loading } = useProfile();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setValue(profile?.display_name ?? "");
  }, [profile?.display_name]);

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (!profile) return <p className="text-sm text-red-600">Sign in required.</p>;

  async function onSave() {
    const next = value.trim();
    setSaving(true);
    setMsg(null);
    try {
      await updateMyDisplayName(next || null);
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Profile</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Set how your account is shown to others.</p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Display name</span>
          <input className={inputClassFull()} value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" className={buttonClass("primary")} onClick={() => void onSave()} disabled={saving}>
            Save
          </button>
          {msg ? <div className="text-xs text-zinc-600 dark:text-zinc-300">{msg}</div> : null}
        </div>
      </section>
    </div>
  );
}

