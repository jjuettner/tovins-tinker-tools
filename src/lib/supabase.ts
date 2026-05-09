import { createClient } from "@supabase/supabase-js";
import {
  emitPermissionDeniedBanner,
  isRestPermissionDenied,
  restPermissionDeniedUserMessage
} from "@/lib/permissionDeniedBanner";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Wrap fetch so failed PostgREST / storage calls surface a global permission banner.
 *
 * @param baseUrl Supabase project URL (origin).
 * @param inner Native fetch.
 * @returns Wrapped fetch.
 */
function wrapFetchForPermissionBanner(baseUrl: string, inner: typeof fetch): typeof fetch {
  const origin = (() => {
    try {
      return new URL(baseUrl).origin;
    } catch {
      return baseUrl.replace(/\/$/, "");
    }
  })();

  return async (input, init) => {
    const res = await inner(input, init);
    const reqUrl =
      typeof input === "string" ? input : input instanceof Request ? input.url : "";
    if (!reqUrl.startsWith(origin)) {
      return res;
    }
    if (res.ok) {
      return res;
    }
    const isDataApi =
      reqUrl.includes("/rest/v1/") || reqUrl.includes("/storage/v1/") || reqUrl.includes("/graphql/v1");
    if (!isDataApi) {
      return res;
    }

    let code = "";
    let message = "";
    try {
      const body: unknown = await res.clone().json();
      if (body && typeof body === "object") {
        const o = body as { code?: unknown; message?: unknown };
        if (typeof o.code === "string") code = o.code;
        if (typeof o.message === "string") message = o.message;
      }
    } catch {
      /* non-JSON body */
    }

    if (isRestPermissionDenied(res.status, code, message)) {
      emitPermissionDeniedBanner(restPermissionDeniedUserMessage(res.status, code, message));
    }
    return res;
  };
}

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          fetch: wrapFetchForPermissionBanner(url, (...args) => fetch(...args))
        }
      })
    : null;

/**
 * Get configured Supabase client or throw.
 *
 * @returns Supabase client.
 * @throws If env vars are missing.
 */
export function requireSupabase() {
  if (!supabase) throw new Error("Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  return supabase;
}

