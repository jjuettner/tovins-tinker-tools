import { useEffect, useMemo, useRef, useState } from "react";

function clampInt(n: number, min: number | undefined, max: number | undefined): number {
  const clampedMin = typeof min === "number" ? min : n;
  const clampedMax = typeof max === "number" ? max : n;
  return Math.min(clampedMax, Math.max(clampedMin, n));
}

function parseIntOrNull(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function formatTwoDigitUnder40(n: number): string {
  if (n >= 0 && n < 40) return String(n).padStart(2, "0");
  return String(n);
}

export function NumberInput(props: {
  value: number | null;
  onChange(next: number | null): void;
  className?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /**
   * When true, format values \(0..39\) as 2 digits (e.g. 7 → "07") on blur.
   */
  twoDigitUnder40?: boolean;
}) {
  const formatted = useMemo(() => {
    if (props.value === null) return "";
    const n = clampInt(props.value, props.min, props.max);
    if (props.twoDigitUnder40) return formatTwoDigitUnder40(n);
    return String(n);
  }, [props.max, props.min, props.twoDigitUnder40, props.value]);

  const [draft, setDraft] = useState(formatted);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(formatted);
  }, [formatted]);

  function commit(raw: string) {
    const parsed = parseIntOrNull(raw);
    if (parsed === null) {
      props.onChange(null);
      return;
    }
    props.onChange(clampInt(parsed, props.min, props.max));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="-?[0-9]*"
      className={props.className}
      value={draft}
      placeholder={props.placeholder}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onChange={(e) => {
        const nextRaw = e.target.value;
        setDraft(nextRaw);
        commit(nextRaw);
      }}
      onBlur={() => {
        focusedRef.current = false;
        commit(draft);
        setDraft(formatted);
      }}
    />
  );
}

