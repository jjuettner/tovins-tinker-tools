import type { ReactNode } from "react";

/**
 * Removes `**` markers for plain-text-only surfaces (native `title`, `aria-label`, plain search).
 *
 * @param text Source string.
 * @returns Text without `**`.
 */
export function stripMarkdownBoldMarkers(text: string): string {
  return (typeof text === "string" ? text : "").replaceAll("**", "");
}

/**
 * Turns paired `**` markers into `<strong>` segments (common OGL-style emphasis in plaintext DB columns).
 *
 * Preserve newlines with a parent that uses `whitespace-pre-wrap`. Odd `**` counts leave the trailing run as plain text.
 *
 * @param text Raw copy from bundled JSON or Supabase.
 * @returns React fragments; empty string yields `null`.
 */
export function renderDbDescription(text: string): ReactNode {
  const t = typeof text === "string" ? text : "";
  if (!t) return null;
  const parts = t.split("**");
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      if (!part) return null;
      return (
        <strong key={i} className="font-bold">
          {part}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
