import { conditionPillClassForSlug } from "@/lib/conditionPillStyle";

const FOCUS_RING =
  "rounded-full px-2.5 py-0.5 text-left text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 ";

const STATIC_BASE = "inline-block rounded-full px-2.5 py-0.5 text-left text-xs font-medium cursor-default ";

type Props = {
  slugs: readonly string[];
  labelBySlug: Map<string, string>;
  /** When set, renders each pill as a `<button>` (e.g. open detail modal). Omit for read-only `<span>` pills. */
  onPillClick?: (slug: string) => void;
  /** Extra classes on `<ul>`. */
  listClassName?: string;
};

/**
 * Colored condition chips (matches Play header styling).
 *
 * @param slugs Stored slugs from character or encounter entity.
 * @param labelBySlug Display names from the conditions catalog (fallback: slug snippet).
 */
export default function ConditionPills(props: Props) {
  if (props.slugs.length === 0) return null;
  return (
    <ul className={"flex flex-wrap gap-2 " + (props.listClassName ?? "")}>
      {props.slugs.map((slug) => {
        const label = props.labelBySlug.get(slug.toLowerCase()) ?? slug;
        const tone = conditionPillClassForSlug(slug);
        return (
          <li key={slug}>
            {props.onPillClick ? (
              <button
                type="button"
                className={FOCUS_RING + tone}
                aria-label={`View ${label}`}
                onClick={() => props.onPillClick?.(slug)}
              >
                {label}
              </button>
            ) : (
              <span className={STATIC_BASE + tone}>{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
