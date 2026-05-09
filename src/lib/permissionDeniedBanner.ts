/**
 * Supabase PostgREST / Postgres signals that the user is not allowed to read or write data.
 *
 * @param status HTTP status from a failed REST response.
 * @param code Optional PostgREST / Postgres error code from JSON body.
 * @param message Optional error message from JSON body.
 * @returns True when the failure should be treated as a permission / RLS denial.
 */
export function isRestPermissionDenied(status: number, code: string, message: string): boolean {
  const lower = message.toLowerCase();
  if (code === "42501") return true;
  if (lower.includes("row-level security") || lower.includes("violates row-level security")) return true;
  if (lower.includes("permission denied for")) return true;
  if (status === 403) return true;
  if (status === 401 && lower.includes("permission")) return true;
  return false;
}

/**
 * Short user-facing explanation for a permission-denied REST failure.
 *
 * @param status HTTP status.
 * @param code Error code from body, if any.
 * @param message Error message from body, if any.
 * @returns Human-readable summary (includes hint when edit is blocked by ownership / RLS).
 */
export function restPermissionDeniedUserMessage(status: number, code: string, message: string): string {
  const trimmed = message.trim();
  const detail =
    trimmed.length > 0 && trimmed.length < 220
      ? trimmed
      : code
        ? `(${code})`
        : status
          ? `(HTTP ${status})`
          : "";
  return (
    "That action was blocked by database permissions (row-level security). " +
    "You may be signed in as the wrong user, or this record is owned by someone else. " +
    (detail ? `Details: ${detail}` : "")
  );
}

type BannerHandler = (message: string) => void;

let bannerHandler: BannerHandler | null = null;
let lastEmittedMessage = "";
let lastEmittedAt = 0;
const EMIT_DEDUPE_MS = 1500;

/**
 * Register the UI that shows permission-denied messages (e.g. app layout banner).
 *
 * @param handler Called with a user-facing string, or null to clear.
 */
export function setPermissionDeniedBannerHandler(handler: BannerHandler | null): void {
  bannerHandler = handler;
}

/**
 * Show the global permission-denied banner if a handler is registered.
 *
 * @param message Text to display (already user-safe).
 */
export function emitPermissionDeniedBanner(message: string): void {
  if (!bannerHandler) return;
  const now = Date.now();
  if (message === lastEmittedMessage && now - lastEmittedAt < EMIT_DEDUPE_MS) {
    return;
  }
  lastEmittedMessage = message;
  lastEmittedAt = now;
  bannerHandler(message);
}

/**
 * If `error` looks like a Supabase PostgREST permission failure, show the global banner.
 *
 * @param error Caught rejection from `.from()` / RPC helpers.
 */
export function reportPermissionDeniedIfApplicable(error: unknown): void {
  if (!error || typeof error !== "object") return;
  const e = error as { code?: unknown; message?: unknown; status?: unknown };
  const code = typeof e.code === "string" ? e.code : "";
  const message = typeof e.message === "string" ? e.message : "";
  const status = typeof e.status === "number" ? e.status : 0;
  if (!isRestPermissionDenied(status, code, message)) return;
  emitPermissionDeniedBanner(restPermissionDeniedUserMessage(status, code, message));
}

/**
 * Map a thrown DB / Supabase error to a short string for inline UI (e.g. hook `error` state).
 *
 * @param error Caught value.
 * @param fallback Message when shape is unknown.
 * @returns User-facing text.
 */
export function formatDataAccessErrorForUser(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const e = error as { code?: unknown; message?: unknown; status?: unknown };
    const code = typeof e.code === "string" ? e.code : "";
    const message = typeof e.message === "string" ? e.message : "";
    const status = typeof e.status === "number" ? e.status : 0;
    if (isRestPermissionDenied(status, code, message)) {
      return restPermissionDeniedUserMessage(status, code, message);
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
