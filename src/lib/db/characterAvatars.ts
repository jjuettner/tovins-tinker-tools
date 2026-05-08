import { requireSupabase } from "@/lib/supabase";

const BUCKET = "character-avatars";

function safeExtFromFilename(name: string): string | null {
  const i = name.lastIndexOf(".");
  if (i < 0) return null;
  const ext = name.slice(i + 1).trim().toLowerCase();
  if (!ext) return null;
  // Keep strict: avoid path tricks and weird extensions.
  if (!/^[a-z0-9]+$/.test(ext)) return null;
  return ext;
}

/**
 * Upload an avatar image and return its public URL.
 *
 * Constraints:
 * - Uses Supabase Storage bucket `character-avatars` (public read).
 * - Path is namespaced by character id.
 *
 * @param characterId Character id.
 * @param file Image file chosen by user.
 * @returns Public URL string.
 */
export async function uploadCharacterAvatar(characterId: string, file: File): Promise<string> {
  const sb = requireSupabase();
  const ext = safeExtFromFilename(file.name) ?? "png";
  const path = `${characterId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "image/png",
    cacheControl: "3600"
  });
  if (error) throw error;

  const pub = sb.storage.from(BUCKET).getPublicUrl(path);
  const url = pub.data.publicUrl;
  if (!url) throw new Error("Failed to build public avatar URL");
  return url;
}

