import { Crosshair, Droplet, Sword } from "lucide-react";
import { useMemo, useState } from "react";
import { buttonClass, inputClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import { resolvedWeaponMasteryIndex, unarmedDamageBonus, unarmedToHit, weaponDamageSummary, weaponToHitBonus } from "@/lib/combat";
import { formatSigned } from "@/lib/dnd";
import { dndEquipmentByIndex, isWeapon } from "@/lib/dndEquipment";
import { dndWeaponMasteryByIndex } from "@/lib/dndWeaponMastery";
import type { Character, EquippedItem } from "@/types/character";

const DAMAGE_TYPES = [
  "bludgeoning",
  "piercing",
  "slashing",
  "acid",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "poison",
  "psychic",
  "radiant",
  "thunder"
] as const;

type DamageRow = { type: string; amount: number };

function AttackRollModal(props: {
  c: Character;
  ctx: { kind: "weapon"; weapon: EquippedItem } | { kind: "unarmed" };
  featByIndex: Record<string, import("@/lib/dndData").DndFeat>;
  onClose(): void;
}) {
  const toHit = props.ctx.kind === "unarmed" ? unarmedToHit(props.c) : weaponToHitBonus(props.c, props.ctx.weapon);
  const [step, setStep] = useState<"roll" | "hit">("roll");

  const combatFeatHints = useMemo(() => {
    return (props.c.feats ?? [])
      .map((i) => props.featByIndex[i])
      .filter((f): f is NonNullable<typeof f> => Boolean(f))
      .filter((f) => {
        const t = `${f.name} ${f.description ?? ""}`.toLowerCase();
        return t.includes("weapon") || t.includes("attack") || t.includes("damage") || t.includes("critical");
      });
  }, [props.c.feats, props.featByIndex]);

  const dmg =
    props.ctx.kind === "unarmed"
      ? { dice: "1", bonus: unarmedDamageBonus(props.c), type: "bludgeoning" }
      : weaponDamageSummary(props.c, props.ctx.weapon);

  const masteryInfo = useMemo(() => {
    if (props.ctx.kind !== "weapon") return null;
    const eq = dndEquipmentByIndex[props.ctx.weapon.equipmentIndex];
    const mid = resolvedWeaponMasteryIndex(props.ctx.weapon, eq);
    if (!mid) return null;
    return dndWeaponMasteryByIndex[mid];
  }, [props.ctx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {step === "roll" ? (
          <>
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Attack roll</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <Crosshair className="h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />
              <span>
                d20 <span className="font-semibold tabular-nums">{formatSigned(toHit)}</span>
              </span>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className={buttonClass("primary") + " inline-flex items-center gap-2"}
                onClick={() => setStep("hit")}
              >
                <Crosshair className="h-4 w-4" aria-hidden="true" />
                Hit
              </button>
              <button type="button" className={buttonClass("ghost")} onClick={props.onClose}>
                Miss
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Damage</h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <Droplet className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />
              <span>
                {dmg.dice}
                {dmg.bonus !== 0 ? ` ${formatSigned(dmg.bonus)}` : ""} {dmg.type}
              </span>
            </p>
            {masteryInfo ? (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950/40">
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">Mastery: {masteryInfo.name}</div>
                {masteryInfo.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">{masteryInfo.description}</p>
                ) : null}
              </div>
            ) : null}
            {combatFeatHints.length > 0 ? (
              <ul className="mt-3 max-h-40 overflow-auto text-xs text-zinc-600 dark:text-zinc-300">
                {combatFeatHints.map((f) => (
                  <li key={f.index} className="mt-1 border-t border-zinc-100 pt-1 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{f.name}:</span> {f.description}
                  </li>
                ))}
              </ul>
            ) : null}
            <button type="button" className={buttonClass("primary") + " mt-4"} onClick={props.onClose}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CombatTab(props: {
  c: Character;
  weapons: EquippedItem[];
  featByIndex: Record<string, import("@/lib/dndData").DndFeat>;
  onPatch(next: Character): void;
}) {
  const [rows, setRows] = useState<DamageRow[]>([{ type: "bludgeoning", amount: 0 }]);
  const [attackCtx, setAttackCtx] = useState<{ kind: "weapon"; weapon: EquippedItem } | { kind: "unarmed" } | null>(null);

  function addRow() {
    setRows((r) => [...r, { type: "bludgeoning", amount: 0 }]);
  }

  function applyDamage() {
    let total = 0;
    for (const row of rows) total += Math.max(0, Math.floor(row.amount));
    if (total <= 0) return;
    let temp = props.c.tempHp;
    let cur = props.c.currentHp;
    const fromTemp = Math.min(temp, total);
    temp -= fromTemp;
    const rest = total - fromTemp;
    cur = Math.max(0, cur - rest);
    props.onPatch({ ...props.c, tempHp: temp, currentHp: cur });
    setRows([{ type: "bludgeoning", amount: 0 }]);
  }

  const uh = unarmedToHit(props.c);
  const ud = unarmedDamageBonus(props.c);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <Droplet className="h-4 w-4 text-red-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Take damage</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Temp HP is reduced first.</p>
        <div className="mt-3 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className={smallLabelClass()}>Type</span>
                <select
                  className={inputClassFull()}
                  value={row.type}
                  onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
                >
                  {DAMAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className={smallLabelClass()}>Amount</span>
                <input
                  type="number"
                  min={0}
                  className={inputClass() + " w-24"}
                  value={row.amount || ""}
                  onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))}
                />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={buttonClass("ghost")} onClick={addRow} aria-label="Add damage type">
            + row
          </button>
          <button type="button" className={buttonClass("primary")} onClick={applyDamage}>
            Apply damage
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Attacks</h2>
        <ul className="mt-3 space-y-2">
          <li className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-800 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">Unarmed strike</span>
            <div className="flex items-center gap-2 text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
              <span className="w-9 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Hit</span>
              <Crosshair className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
              {formatSigned(uh)}
            </div>
            <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <span className="w-9 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Dmg</span>
              <Droplet className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
              <span className="truncate">1 {formatSigned(ud)} bludgeoning</span>
            </div>
            <div className="flex justify-start sm:justify-end">
              <button type="button" className={buttonClass("ghost")} onClick={() => setAttackCtx({ kind: "unarmed" })} aria-label="Attack">
                <Sword className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </li>

          {props.weapons.map((w) => {
            const eq = dndEquipmentByIndex[w.equipmentIndex];
            if (!eq || !isWeapon(eq)) return null;
            const th = weaponToHitBonus(props.c, w);
            const dmg = weaponDamageSummary(props.c, w);
            return (
              <li
                key={w.id}
                className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-800 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3"
              >
                <span className="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{eq.name}</span>
                <div className="flex items-center gap-2 text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
                  <span className="w-9 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Hit</span>
                  <Crosshair className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                  {formatSigned(th)}
                </div>
                <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="w-9 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Dmg</span>
                  <Droplet className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                  <span className="truncate">
                    {dmg.dice}
                    {dmg.bonus !== 0 ? ` ${formatSigned(dmg.bonus)}` : ""} {dmg.type}
                  </span>
                </div>
                <div className="flex justify-start sm:justify-end">
                  <button type="button" className={buttonClass("ghost")} onClick={() => setAttackCtx({ kind: "weapon", weapon: w })} aria-label="Attack">
                    <Sword className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {attackCtx ? <AttackRollModal c={props.c} ctx={attackCtx} featByIndex={props.featByIndex} onClose={() => setAttackCtx(null)} /> : null}
    </div>
  );
}

