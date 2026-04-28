export function readStorage<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

export function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}
