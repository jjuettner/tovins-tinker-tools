import { useCallback, useEffect, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

/**
 * Typed `localStorage` state helper.
 *
 * @param key Storage key.
 * @param initialValue Default value when missing.
 * @returns Current value + setter + reset.
 */
export function useStoredState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readStorage<T>(key) ?? initialValue);

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return { value, setValue, reset } as const;
}
