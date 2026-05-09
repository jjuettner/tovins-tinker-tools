import { useState } from "react";
import { buttonClass } from "@/components/ui/controlClasses";
import { renderDbDescription } from "@/lib/renderDbDescription";

const MAX_COLLAPSED_LINES = 5;

/**
 * Renders ruleset feature copy with optional collapse when the source has many lines.
 *
 * @param props.text Raw description (newlines preserved); `**` pairs become bold via `renderDbDescription`.
 */
export default function RulesetFeatureDescription(props: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = props.text.split("\n");
  const overflow = lines.length > MAX_COLLAPSED_LINES;
  const displayText =
    !overflow || expanded ? props.text : lines.slice(0, MAX_COLLAPSED_LINES).join("\n");

  return (
    <div className="mt-1">
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
        {renderDbDescription(displayText)}
      </p>
      {overflow ? (
        <button
          type="button"
          className={buttonClass("ghost") + " mt-1 h-auto px-0 py-0 text-xs font-medium text-emerald-800 underline dark:text-emerald-400"}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
