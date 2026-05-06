/**
 * Read JSON-encoded value from `localStorage`.
 *
 * @param key Storage key.
 * @returns Parsed value, or null if missing.
 */
export function readStorage<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

/**
 * Write JSON-encoded value to `localStorage`.
 *
 * @param key Storage key.
 * @param value Value to serialize.
 * @returns Nothing.
 */
export function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
