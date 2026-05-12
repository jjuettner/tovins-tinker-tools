import { inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";

type SelectOption = { value: string; label: string };

/**
 * Search field styled like compendium spell filters.
 *
 * @param props.value Current query.
 * @param props.onChange Called with next value.
 * @param props.placeholder Input placeholder.
 * @param props.id Optional id for label association.
 */
export function CatalogSearchField(props: {
  value: string;
  onChange(value: string): void;
  placeholder?: string;
  id?: string;
}) {
  const id = props.id ?? "catalog-search";
  return (
    <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
      <span className={smallLabelClass()}>Search</span>
      <input
        id={id}
        className={inputClassFull()}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder ?? "Name or slug…"}
      />
    </label>
  );
}

/**
 * Labeled `<select>` matching compendium filter styling.
 *
 * @param props.label Visible label.
 * @param props.value Selected option value.
 * @param props.onChange Called with next value.
 * @param props.options Options list.
 * @param props.className Optional wrapper classes.
 */
export function CatalogLabeledSelect(props: {
  label: string;
  value: string;
  onChange(value: string): void;
  options: SelectOption[];
  className?: string;
}) {
  const wrap = props.className ?? "flex min-w-[9rem] flex-col gap-1";
  return (
    <label className={wrap}>
      <span className={smallLabelClass()}>{props.label}</span>
      <select className={inputClassFull()} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
