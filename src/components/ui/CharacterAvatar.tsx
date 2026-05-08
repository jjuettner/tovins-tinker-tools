import { classIconUrl } from "@/lib/classIcons";

function initialsForName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashToHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

function avatarStyleForKey(key: string): { backgroundColor: string; color: string } {
  const hue = hashToHue(key);
  return { backgroundColor: `hsl(${hue} 70% 40%)`, color: "white" };
}

export default function CharacterAvatar(props: {
  characterId: string;
  name: string;
  classIndex: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  /** When true, the top half-circle can poke upward (negative top). Default: false. */
  poke?: boolean;
  onPickFile?(file: File): void;
  disabled?: boolean;
}) {
  const size = props.size ?? "md";
  const outerDims = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const poke = props.poke ?? false;
  const frameDims = poke
    ? size === "sm"
      ? "h-[46px] w-10 top-[-8px]"
      : size === "lg"
        ? "h-[64px] w-14 top-[-14px]"
        : "h-[56px] w-12 top-[-12px]"
    : "h-full w-full top-0";
  const icon = classIconUrl(props.classIndex);
  const hasPicker = Boolean(props.onPickFile);

  const core = (
    <div className={"relative shrink-0 " + outerDims}>
      <div
        className={
          "pointer-events-none absolute left-0 overflow-hidden border-2 shadow-sm rounded-t-full rounded-b-none " +
          frameDims +
          " border-amber-300 bg-white dark:border-amber-500 dark:bg-zinc-950/20"
        }
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/15 to-transparent dark:from-white/10" />
        <div className="absolute inset-0">
          {props.avatarUrl ? (
            <img src={props.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : icon ? (
            <div className="h-full w-full" style={avatarStyleForKey(props.characterId)}>
              <img src={icon} alt="" className="h-full w-full object-contain p-1.5 opacity-95 dark:invert" />
            </div>
          ) : (
            <div className="grid h-full w-full place-items-center text-sm font-semibold" style={avatarStyleForKey(props.characterId)}>
              {initialsForName(props.name)}
            </div>
          )}
        </div>

      {hasPicker ? (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition hover:opacity-100">
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-white">Change</div>
        </div>
      ) : null}
      </div>
    </div>
  );

  if (!props.onPickFile) return core;

  return (
    <label className={props.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}>
      {core}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={props.disabled}
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (!file) return;
          props.onPickFile?.(file);
        }}
      />
    </label>
  );
}

