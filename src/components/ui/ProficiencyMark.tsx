import { useId } from "react";

/** Left-half-filled circle (clip to the left of center), proficiency indicator. */
export function ProficiencyMark(props: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const clipId = `prof-half-${uid}`;

  return (
    <svg
      className={props.className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-label="Proficient"
      role="img"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="6" height="12" />
        </clipPath>
      </defs>
      <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="5" fill="currentColor" clipPath={`url(#${clipId})`} />
    </svg>
  );
}
