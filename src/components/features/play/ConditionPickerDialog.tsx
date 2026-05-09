import { buttonClass } from "@/components/ui/controlClasses";

export function ConditionPickerDialog(props: {
  open: boolean;
  onClose(): void;
  items: { slug: string; name: string }[];
  existingSlugs: string[];
  onAdd(slug: string): void;
}) {
  if (!props.open) return null;

  const existing = new Set(props.existingSlugs.map((s) => s.toLowerCase()));
  const available = props.items.filter((i) => !existing.has(i.slug.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add condition</h2>
          <button type="button" className={buttonClass("ghost")} onClick={props.onClose}>
            Close
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {available.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-zinc-600 dark:text-zinc-300">All conditions are active.</li>
          ) : (
            available.map((it) => (
              <li key={it.slug} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
                  onClick={() => {
                    props.onAdd(it.slug);
                    props.onClose();
                  }}
                >
                  <span className="font-medium">{it.name}</span>
                  <span className="text-xs text-zinc-500">Add</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
