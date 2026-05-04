/** Hollow circle for non-proficient saves/skills (pairs with half-filled proficient mark). */
export function ProficiencyEmptyMark(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
