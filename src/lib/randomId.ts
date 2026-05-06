/**
 * Create a stable-ish equipped item id.
 *
 * @returns Id string prefixed with `eq-`.
 */
export function newEquippedItemId(): string {
  return `eq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a short random id for client-side drafts.
 *
 * @returns Id string.
 */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
