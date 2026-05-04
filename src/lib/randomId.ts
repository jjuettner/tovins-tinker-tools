export function newEquippedItemId(): string {
  return `eq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
