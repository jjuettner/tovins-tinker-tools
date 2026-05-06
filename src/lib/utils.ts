/**
 * Toggle a string-literal value in a list.
 *
 * @param list Current list.
 * @param value Item to add/remove.
 * @returns New list with `value` added or removed.
 */
export function toggleInList<T extends string>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

