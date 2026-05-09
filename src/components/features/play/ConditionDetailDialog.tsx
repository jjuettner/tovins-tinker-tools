import { buttonClass } from "@/components/ui/controlClasses";
import { renderDbDescription } from "@/lib/renderDbDescription";

/**
 * Detail modal for an active condition: full description and remove control.
 *
 * @param slug Active condition slug; null closes.
 * @param name Display name from catalog or fallback slug.
 * @param description Rules text from catalog or empty string.
 */
export function ConditionDetailDialog(props: {
  slug: string | null;
  name: string;
  description: string;
  onClose(): void;
  onRemove(): void;
}) {
  if (!props.slug) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[min(90vh,32rem)] w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{props.name}</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {props.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {renderDbDescription(props.description)}
            </p>
          ) : (
            <p className="text-sm italic text-zinc-500 dark:text-zinc-400">No description in catalog.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <button type="button" className={buttonClass("ghost")} onClick={props.onClose}>
            Close
          </button>
          <button type="button" className={buttonClass("danger")} onClick={props.onRemove}>
            Remove condition
          </button>
        </div>
      </div>
    </div>
  );
}
