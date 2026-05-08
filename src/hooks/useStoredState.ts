import { useCallback, useEffect, useRef, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

const STORAGE_EVENT = "tovin:storage";

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Typed `localStorage` state helper.
 *
 * @param key Storage key.
 * @param initialValue Default value when missing.
 * @returns Current value + setter + reset.
 */
export function useStoredState<T>(key: string, initialValue: T) {
  const initialRaw = useRef<string | null>(null);
  if (initialRaw.current === null) initialRaw.current = localStorage.getItem(key);

  const [value, setValue] = useState<T>(() => {
    const from = readStorage<T>(key);
    return from ?? initialValue;
  });

  const lastRawRef = useRef<string>(initialRaw.current ?? JSON.stringify(value));

  useEffect(() => {
    const raw = JSON.stringify(value);
    if (raw === lastRawRef.current) return;
    lastRawRef.current = raw;
    writeStorage(key, value);
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key, raw } }));
  }, [key, value]);

  useEffect(() => {
    function onCustom(ev: Event) {
      const e = ev as CustomEvent<{ key: string; raw: string }>;
      if (!e.detail || e.detail.key !== key) return;
      if (e.detail.raw === lastRawRef.current) return;
      lastRawRef.current = e.detail.raw;
      const next = safeJsonParse<T>(e.detail.raw);
      setValue(next ?? initialValue);
    }

    function onStorage(ev: StorageEvent) {
      if (ev.storageArea !== localStorage) return;
      if (ev.key !== key) return;
      const raw = ev.newValue;
      if (raw === null) {
        lastRawRef.current = JSON.stringify(initialValue);
        setValue(initialValue);
        return;
      }
      if (raw === lastRawRef.current) return;
      lastRawRef.current = raw;
      const next = safeJsonParse<T>(raw);
      setValue(next ?? initialValue);
    }

    window.addEventListener(STORAGE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(STORAGE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [initialValue, key]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return { value, setValue, reset } as const;
}
