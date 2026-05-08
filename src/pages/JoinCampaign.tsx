import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { buttonClass } from "@/components/ui/controlClasses";
import { joinCampaignWithInvite } from "@/lib/db/campaignInvites";

export function JoinCampaignPage() {
  const nav = useNavigate();
  const params = useParams();
  const [sp] = useSearchParams();

  const token = useMemo(() => {
    const t1 = params.token;
    if (typeof t1 === "string" && t1.trim()) return t1.trim();
    const t2 = sp.get("token");
    if (t2 && t2.trim()) return t2.trim();
    return null;
  }, [params.token, sp]);

  const [status, setStatus] = useState<"idle" | "joining" | "joined" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMsg("Missing invite token.");
      return;
    }
    let cancelled = false;
    setStatus("joining");
    setMsg(null);
    void (async () => {
      try {
        await joinCampaignWithInvite(token);
        if (cancelled) return;
        setStatus("joined");
        setMsg("Joined campaign.");
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMsg(e instanceof Error ? e.message : "Failed to join");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Join campaign</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Redeem an invite link.</p>
      </header>

      {msg ? <div className="text-sm text-zinc-700 dark:text-zinc-200">{msg}</div> : null}

      {status === "joined" ? (
        <button type="button" className={buttonClass("primary")} onClick={() => nav("/campaigns")}>
          Go to Campaigns
        </button>
      ) : (
        <button type="button" className={buttonClass("ghost")} onClick={() => nav("/campaigns")}>
          Back
        </button>
      )}
    </div>
  );
}

