import { Check, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buttonClass, inputClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import CharacterAvatar from "@/components/ui/CharacterAvatar";
import { NumberInput } from "@/components/ui/NumberInput";
import { useRulesetCatalog } from "@/hooks/useRulesetCatalog";
import { computeArmorClass } from "@/lib/character/armorClass";
import { newEquippedItemId, normalizeDraft } from "@/lib/character/normalize";
import { emptyWeapon, rebuildEquipped, splitEquipped } from "@/lib/equippedLayout";
import { uploadCharacterAvatar } from "@/lib/db/characterAvatars";
import { DND2024_RULESET_ID, listRulesets } from "@/lib/db/rulesets";
import { listCampaignRulesets, listCampaigns } from "@/lib/db/campaigns";
import { armorAcRulesText, dndArmorPieces, dndEquipmentByIndex, dndWeapons, isBodyArmor } from "@/lib/dndEquipment";
import { dndRaces } from "@/lib/dndRaces";
import { abilities, abilityMod, formatSigned, proficiencyBonus, skillAbility, skills } from "@/lib/dnd";
import type { Ability, Skill } from "@/lib/dnd";
import {
  dndClassByIndex,
  dndClasses,
  dndFeats,
  dndFeatByIndex,
  dndSpellByIndex,
  spellsOnClassList,
  type DndSpell
} from "@/lib/dndData";
import { stripMarkdownBoldMarkers } from "@/lib/renderDbDescription";
import { toggleInList } from "@/lib/utils";
import type { CharacterDraft, EquippedItem } from "@/types/character";

export function CharacterEditor(props: {
  draft: CharacterDraft;
  onChange(next: CharacterDraft): void;
  onCancel(): void;
  onSave(): void;
  title: string;
}) {
  const prof = proficiencyBonus(props.draft.level);
  const baseCanSave =
    props.draft.name.trim().length > 0 &&
    props.draft.classIndex.trim().length > 0 &&
    props.draft.raceIndex.trim().length > 0;

  const campaignId = props.draft.campaignId ?? null;

  const [allRulesets, setAllRulesets] = useState<{ id: string; name: string }[]>([]);
  const [campaignRuleIds, setCampaignRuleIds] = useState<string[] | null>(null);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([DND2024_RULESET_ID]);
  const [rulesetPopupOpen, setRulesetPopupOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const rs = await listRulesets();
        if (cancelled) return;
        setAllRulesets(rs.map((r) => ({ id: r.id, name: r.name })));
      } catch {
        if (cancelled) return;
        setAllRulesets([{ id: DND2024_RULESET_ID, name: "D&D 2024" }]);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const cs = await listCampaigns();
        if (cancelled) return;
        setCampaigns(cs.map((c) => ({ id: c.id, name: c.name })));
      } catch {
        if (cancelled) return;
        setCampaigns([]);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!campaignId) {
      setCampaignRuleIds(null);
      return;
    }
    let cancelled = false;
    async function run() {
      try {
        const cid = campaignId;
        if (!cid) {
          setCampaignRuleIds(null);
          return;
        }
        const ids = await listCampaignRulesets(cid);
        if (cancelled) return;
        setCampaignRuleIds(ids);
      } catch {
        if (cancelled) return;
        setCampaignRuleIds(null);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const activeRuleIds = useMemo(() => {
    if (campaignId) return campaignRuleIds && campaignRuleIds.length ? campaignRuleIds : [DND2024_RULESET_ID];
    return selectedRuleIds.length ? selectedRuleIds : [DND2024_RULESET_ID];
  }, [campaignId, campaignRuleIds, selectedRuleIds]);

  // Default: show all content (only when no campaign picked).
  useEffect(() => {
    if (campaignId) return;
    if (!allRulesets.length) return;
    setSelectedRuleIds(allRulesets.map((r) => r.id));
  }, [campaignId, allRulesets]);

  const catalog = useRulesetCatalog(activeRuleIds);

  const classAllowedByCampaign = useMemo(() => {
    if (!campaignId) return true;
    if (catalog.loading) return true;
    const idx = props.draft.classIndex.trim();
    if (!idx) return true;
    return Boolean(catalog.classesByIndex[idx]);
  }, [campaignId, catalog.classesByIndex, catalog.loading, props.draft.classIndex]);

  const canSave = baseCanSave && classAllowedByCampaign;

  const racesForSelect = catalog.loading ? dndRaces : catalog.races;
  const classesForSelect = catalog.loading ? dndClasses : catalog.classes;
  const classesByIndexForEditor = catalog.loading ? dndClassByIndex : catalog.classesByIndex;
  const featsForSelect = catalog.loading ? dndFeats : catalog.feats;
  const spellsForPool = catalog.loading ? null : catalog.spells;
  const spellByIndex = catalog.loading ? dndSpellByIndex : catalog.spellsByIndex;
  const featByIndex = catalog.loading ? dndFeatByIndex : catalog.featsByIndex;

  const [spellQuery, setSpellQuery] = useState("");
  const [featQuery, setFeatQuery] = useState("");

  const selectedClassDef = useMemo(() => {
    const idx = props.draft.classIndex.trim();
    if (!idx) return undefined;
    return classesByIndexForEditor[idx];
  }, [classesByIndexForEditor, props.draft.classIndex]);

  const subclassOptions = selectedClassDef?.subclasses ?? [];
  const classSpellPool = useMemo(() => {
    if (!spellsForPool) return spellsOnClassList(props.draft.classIndex);
    const idx = props.draft.classIndex.trim();
    if (!idx) return spellsForPool;
    const onList = spellsForPool.filter((s) => s.classes?.some((c) => c.index === idx));
    return onList.length > 0 ? onList : spellsForPool;
  }, [props.draft.classIndex, spellsForPool]);

  const filteredSpells = useMemo(() => {
    const q = spellQuery.trim().toLowerCase();
    if (!q) return classSpellPool;
    return classSpellPool.filter((s) => s.name.toLowerCase().includes(q));
  }, [spellQuery, classSpellPool]);
  const spellsGroupedInFilter = useMemo(() => {
    const map = new Map<number, DndSpell[]>();
    for (const s of filteredSpells) {
      if (!map.has(s.level)) map.set(s.level, []);
      map.get(s.level)!.push(s);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filteredSpells]);
  const filteredFeats = useMemo(() => {
    const q = featQuery.trim().toLowerCase();
    if (!q) return featsForSelect;
    return featsForSelect.filter((f) => f.name.toLowerCase().includes(q));
  }, [featQuery, featsForSelect]);
  const selectedSpellChips = useMemo(
    () =>
      [...props.draft.spells]
        .map((idx) => ({ idx, s: spellByIndex[idx] }))
        .filter((x): x is { idx: string; s: DndSpell } => Boolean(x.s))
        .sort(
          (a, b) => (a.s.level !== b.s.level ? a.s.level - b.s.level : a.s.name.localeCompare(b.s.name))
        ),
    [props.draft.spells, spellByIndex]
  );
  const selectedFeats = useMemo(
    () => props.draft.feats.map((idx) => featByIndex[idx]?.name ?? idx),
    [props.draft.feats, featByIndex]
  );

  const dexMod = abilityMod(props.draft.stats.DEX);
  const liveAc = useMemo(
    () =>
      computeArmorClass(props.draft.equipped, dexMod, {
        classIndex: props.draft.classIndex,
        conMod: abilityMod(props.draft.stats.CON)
      }),
    [props.draft.classIndex, props.draft.equipped, props.draft.stats.CON, dexMod]
  );

  const bodyArmorOptions = useMemo(() => dndArmorPieces.filter((e) => isBodyArmor(e)), []);
  const { weapons, bodyArmor, shield } = useMemo(() => splitEquipped(props.draft.equipped), [props.draft.equipped]);

  function commitEquipped(nextWeapons: EquippedItem[], nextBody: EquippedItem | null, nextShield: EquippedItem | null) {
    props.onChange(
      normalizeDraft({
        ...props.draft,
        equipped: rebuildEquipped(nextWeapons, nextBody, nextShield)
      })
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {props.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Proficiency bonus from level: <span className="font-semibold">{formatSigned(prof)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={buttonClass("ghost")} onClick={props.onCancel}>
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
          <button
            type="button"
            className={buttonClass("primary")}
            onClick={props.onSave}
            disabled={!canSave}
            title={
              !canSave
                ? !baseCanSave
                  ? "Need name, race, and class"
                  : !classAllowedByCampaign
                    ? "Campaign rulesets do not include this class"
                    : "Cannot save"
                : undefined
            }
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Rulesets</h3>
          {campaignId ? (
            <span className="text-xs text-zinc-600 dark:text-zinc-400">From campaign (read-only)</span>
          ) : (
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Default: all</span>
          )}
        </div>
        <div className="relative">
          <button type="button" className={buttonClass("ghost")} onClick={() => setRulesetPopupOpen((v) => !v)}>
            Filters
          </button>
          {rulesetPopupOpen ? (
            <div className="absolute right-0 top-11 z-20 w-[min(520px,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ruleset filters</div>
                <button type="button" className={buttonClass("ghost")} onClick={() => setRulesetPopupOpen(false)}>
                  Close
                </button>
              </div>

              {campaignId ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeRuleIds.map((rid) => {
                    const name = allRulesets.find((r) => r.id === rid)?.name ?? rid;
                    return (
                      <span
                        key={rid}
                        className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200"
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allRulesets.map((r) => {
                      const active = selectedRuleIds.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() =>
                            setSelectedRuleIds((prev) =>
                              prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id]
                            )
                          }
                          className={
                            "inline-flex items-center rounded-full border px-3 py-1 text-xs transition " +
                            (active
                              ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-50"
                              : "border-zinc-200 bg-white/60 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200 dark:hover:bg-zinc-900/40")
                          }
                          aria-pressed={active}
                        >
                          {r.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className={buttonClass("ghost")}
                      onClick={() => setSelectedRuleIds(allRulesets.map((r) => r.id))}
                    >
                      Select all
                    </button>
                    <button type="button" className={buttonClass("ghost")} onClick={() => setSelectedRuleIds([DND2024_RULESET_ID])}>
                      Only PHB24
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Name</span>
          <input
            value={props.draft.name}
            onChange={(e) => props.onChange({ ...props.draft, name: e.target.value })}
            className={inputClassFull()}
            placeholder="Eldrin"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Avatar</span>
          <div className="flex items-center gap-2">
            <CharacterAvatar
              characterId={props.draft.id}
              name={props.draft.name || "Unnamed"}
              classIndex={props.draft.classIndex}
              avatarUrl={props.draft.avatarUrl}
              disabled={avatarBusy}
              onPickFile={(file) => {
                setAvatarError(null);
                setAvatarBusy(true);
                void uploadCharacterAvatar(props.draft.id, file)
                  .then((url) => {
                    props.onChange({ ...props.draft, avatarUrl: url });
                  })
                  .catch((err: unknown) => {
                    setAvatarError(err instanceof Error ? err.message : "Failed to upload avatar");
                  })
                  .finally(() => {
                    setAvatarBusy(false);
                  });
              }}
            />
            {props.draft.avatarUrl ? (
              <button
                type="button"
                className={buttonClass("ghost")}
                disabled={avatarBusy}
                onClick={() => props.onChange({ ...props.draft, avatarUrl: null })}
              >
                Remove
              </button>
            ) : null}
          </div>
          {avatarError ? <div className="text-xs text-red-700 dark:text-red-300">{avatarError}</div> : null}
        </div>

        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Campaign</span>
          <select
            value={props.draft.campaignId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              props.onChange({ ...props.draft, campaignId: v ? v : null });
            }}
            className={inputClassFull()}
          >
            <option value="">— None —</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Race</span>
          <select
            value={props.draft.raceIndex}
            onChange={(e) => props.onChange({ ...props.draft, raceIndex: e.target.value })}
            className={inputClassFull()}
          >
            <option value="">— Race —</option>
            {props.draft.raceIndex && !racesForSelect.some((r) => r.index === props.draft.raceIndex) ? (
              <option value={props.draft.raceIndex}>
                Unknown / filtered out: {props.draft.raceIndex}
              </option>
            ) : null}
            {racesForSelect.map((r) => (
              <option key={r.index} value={r.index}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Class</span>
          <select
            value={props.draft.classIndex}
            onChange={(e) => {
              const nextClass = e.target.value;
              const cls = (catalog.loading ? dndClassByIndex : catalog.classesByIndex)[nextClass];
              const subs = cls?.subclasses ?? [];
              const cur = props.draft.subclassIndex?.trim() ?? "";
              const keep =
                cur.length > 0 && subs.some((s) => s.index === cur) ? props.draft.subclassIndex : null;
              props.onChange({ ...props.draft, classIndex: nextClass, subclassIndex: keep });
            }}
            className={inputClassFull()}
          >
            <option value="" disabled>
              Choose…
            </option>
            {props.draft.classIndex && !classesForSelect.some((c) => c.index === props.draft.classIndex) ? (
              <option value={props.draft.classIndex}>
                Unknown / filtered out: {props.draft.classIndex}
              </option>
            ) : null}
            {classesForSelect.map((c) => (
              <option key={c.index} value={c.index}>
                {c.name}
              </option>
            ))}
          </select>
          {props.draft.classIndex && !classesForSelect.some((c) => c.index === props.draft.classIndex) ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Selected class not available under current ruleset filters. Re-enable its ruleset or choose another.
            </p>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Subclass</span>
          <select
            value={props.draft.subclassIndex ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim();
              props.onChange({ ...props.draft, subclassIndex: v.length > 0 ? v : null });
            }}
            disabled={!props.draft.classIndex.trim() || subclassOptions.length === 0}
            className={inputClassFull()}
          >
            <option value="">— None —</option>
            {(() => {
              const subId = props.draft.subclassIndex?.trim() ?? "";
              if (!subId || subclassOptions.some((s) => s.index === subId)) return null;
              return (
                <option value={subId}>
                  Unknown / not listed: {subId}
                </option>
              );
            })()}
            {subclassOptions.map((s) => (
              <option key={s.index} value={s.index}>
                {s.name}
              </option>
            ))}
          </select>
          {props.draft.classIndex.trim() && subclassOptions.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">No subclasses in catalog for this class.</p>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Level</span>
          <input
            type="number"
            min={1}
            max={20}
            value={props.draft.level}
            onChange={(e) => props.onChange({ ...props.draft, level: Number(e.target.value) })}
            className={inputClassFull()}
          />
        </label>
      </div>

      {!canSave ? (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">Need name, race, and class to save.</p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {abilities.map((ab) => (
          <label key={ab} className="flex flex-col gap-1">
            <span className={smallLabelClass()}>
              {ab}{" "}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                ({formatSigned(abilityMod(props.draft.stats[ab]))})
              </span>
            </span>
            <NumberInput
              className={inputClassFull()}
              min={1}
              max={30}
              twoDigitUnder40={true}
              value={props.draft.stats[ab]}
              onChange={(next) =>
                props.onChange({
                  ...props.draft,
                  stats: { ...props.draft.stats, [ab]: next ?? props.draft.stats[ab] }
                })
              }
              ariaLabel={`${ab} score`}
            />
          </label>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Max HP</span>
          <input
            type="number"
            min={1}
            value={props.draft.maxHp}
            onChange={(e) =>
              props.onChange(
                normalizeDraft({
                  ...props.draft,
                  maxHp: Number(e.target.value),
                  currentHp: Math.min(props.draft.currentHp, Number(e.target.value))
                })
              )
            }
            className={inputClassFull()}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Current HP</span>
          <input
            type="number"
            min={0}
            value={props.draft.currentHp}
            onChange={(e) =>
              props.onChange(
                normalizeDraft({
                  ...props.draft,
                  currentHp: Number(e.target.value)
                })
              )
            }
            className={inputClassFull()}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Temp HP</span>
          <input
            type="number"
            min={0}
            value={props.draft.tempHp}
            onChange={(e) =>
              props.onChange(
                normalizeDraft({
                  ...props.draft,
                  tempHp: Number(e.target.value)
                })
              )
            }
            className={inputClassFull()}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
        Armor class (from armor + DEX + shield): <span className="font-semibold text-zinc-900 dark:text-zinc-100">{liveAc}</span>
      </p>

      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Weapons & armor</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
          Equipped weapons (for Play combat). One body armor and optional shield. Magic bonus applies to hit, damage, and armor as appropriate.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className={smallLabelClass()}>Weapons</span>
              <button
                type="button"
                className={buttonClass("ghost")}
                onClick={() => commitEquipped([...weapons, emptyWeapon()], bodyArmor, shield)}
              >
                Add weapon
              </button>
            </div>
            <div className="mt-2 space-y-3">
              {weapons.length === 0 ? (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">No weapons yet.</p>
              ) : null}
              {weapons.map((w) => (
                <WeaponEquipRow
                  key={w.id}
                  item={w}
                  onChange={(next) =>
                    commitEquipped(
                      weapons.map((x) => (x.id === w.id ? next : x)),
                      bodyArmor,
                      shield
                    )
                  }
                  onRemove={() => commitEquipped(
                    weapons.filter((x) => x.id !== w.id),
                    bodyArmor,
                    shield
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Body armor</span>
              <select
                className={inputClassFull()}
                value={bodyArmor?.equipmentIndex ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  const nextBody: EquippedItem | null = v
                    ? {
                        id: bodyArmor?.id ?? newEquippedItemId(),
                        equipmentIndex: v,
                        modifier: bodyArmor?.modifier ?? 0
                      }
                    : null;
                  commitEquipped(weapons, nextBody, shield);
                }}
              >
                <option value="">None (10 + DEX)</option>
                {bodyArmorOptions.map((a) => {
                  const acBit = armorAcRulesText(a);
                  return (
                    <option key={a.index} value={a.index}>
                      {acBit ? `${a.name} (${acBit})` : a.name}
                    </option>
                  );
                })}
              </select>
            </label>
            {bodyArmor ? (
              <label className="flex flex-col gap-1">
                <span className={smallLabelClass()}>Armor magic bonus</span>
                <input
                  type="number"
                  className={inputClassFull()}
                  value={bodyArmor.modifier}
                  onChange={(e) =>
                    commitEquipped(weapons, { ...bodyArmor, modifier: Number(e.target.value) }, shield)
                  }
                />
              </label>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={Boolean(shield)}
              onChange={(e) => {
                if (e.target.checked) {
                  commitEquipped(weapons, bodyArmor, {
                    id: shield?.id ?? newEquippedItemId(),
                    equipmentIndex: "shield",
                    modifier: shield?.modifier ?? 0
                  });
                } else {
                  commitEquipped(weapons, bodyArmor, null);
                }
              }}
            />
            Shield equipped (+2, plus magic bonus below)
          </label>
          {shield ? (
            <label className="flex max-w-xs flex-col gap-1">
              <span className={smallLabelClass()}>Shield magic bonus</span>
              <input
                type="number"
                className={inputClassFull()}
                value={shield.modifier}
                onChange={(e) =>
                  commitEquipped(weapons, bodyArmor, { ...shield, modifier: Number(e.target.value) })
                }
              />
            </label>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Saving throw proficiency</h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">toggle</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {abilities.map((ab) => {
              const active = props.draft.proficientSaves.includes(ab);
              return (
                <button
                  key={ab}
                  type="button"
                  className={
                    "inline-flex items-center justify-between rounded-md border px-3 py-2 text-sm transition " +
                    (active
                      ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
                  }
                  onClick={() =>
                    props.onChange({
                      ...props.draft,
                      proficientSaves: toggleInList(props.draft.proficientSaves, ab as Ability)
                    })
                  }
                >
                  <span className="font-medium">{ab}</span>
                  {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ability check proficiency</h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">toggle</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {skills.map((sk) => {
              const active = props.draft.proficientSkills.includes(sk);
              return (
                <button
                  key={sk}
                  type="button"
                  className={
                    "inline-flex items-center justify-between rounded-md border px-3 py-2 text-sm transition " +
                    (active
                      ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
                  }
                  onClick={() =>
                    props.onChange({
                      ...props.draft,
                      proficientSkills: toggleInList(props.draft.proficientSkills, sk as Skill)
                    })
                  }
                >
                  <span className="truncate">{sk}</span>
                  <span className="ml-3 inline-flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{skillAbility[sk]}</span>
                    {active ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Spells</h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">{props.draft.spells.length} selected</span>
          </div>

          <input
            className={inputClass() + " mt-3"}
            placeholder="Search spells…"
            value={spellQuery}
            onChange={(e) => setSpellQuery(e.target.value)}
          />

          {props.draft.spells.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSpellChips.map(({ idx, s }) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200"
                >
                  {s.name}{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    ({s.level === 0 ? "C" : `${s.level}`})
                  </span>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-zinc-200 bg-white/50 p-2 dark:border-zinc-800 dark:bg-zinc-950/20">
            <div className="space-y-4">
              {spellsGroupedInFilter.map(([level, spells]) => (
                <div key={level}>
                  <div className="border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    {level === 0 ? "Cantrips" : `Spell level ${level}`}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {spells.map((s) => {
                      const active = props.draft.spells.includes(s.index);
                      return (
                        <button
                          key={s.index}
                          type="button"
                          className={
                            "inline-flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition " +
                            (active
                              ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                              : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
                          }
                          onClick={() =>
                            props.onChange({
                              ...props.draft,
                              spells: toggleInList(props.draft.spells, s.index)
                            })
                          }
                        >
                          <span className="truncate">{s.name}</span>
                          {active ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Feats</h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">{props.draft.feats.length} selected</span>
          </div>

          <input
            className={inputClass() + " mt-3"}
            placeholder="Search feats…"
            value={featQuery}
            onChange={(e) => setFeatQuery(e.target.value)}
          />

          {props.draft.feats.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedFeats.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-zinc-200 bg-white/50 p-2 dark:border-zinc-800 dark:bg-zinc-950/20">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredFeats.map((f) => {
                const active = props.draft.feats.includes(f.index);
                return (
                  <button
                    key={f.index}
                    type="button"
                    className={
                      "inline-flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition " +
                      (active
                        ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                        : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
                    }
                    onClick={() =>
                      props.onChange({
                        ...props.draft,
                        feats: toggleInList(props.draft.feats, f.index)
                      })
                    }
                    title={f.description ? stripMarkdownBoldMarkers(f.description) || undefined : undefined}
                  >
                    <span className="truncate">{f.name}</span>
                    {active ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WeaponEquipRow(props: {
  item: EquippedItem;
  onChange(next: EquippedItem): void;
  onRemove(): void;
}) {
  const [query, setQuery] = useState("");
  const picked = dndEquipmentByIndex[props.item.equipmentIndex];
  const picking = !props.item.equipmentIndex;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q ? dndWeapons : dndWeapons.filter((w) => w.name.toLowerCase().includes(q));
    return list.slice(0, 50);
  }, [query]);

  if (picking) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">New weapon — search and pick</div>
        <input
          className={inputClass() + " mt-2"}
          placeholder="Search weapons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-2 max-h-36 overflow-auto rounded border border-zinc-200 bg-white/40 p-1 dark:border-zinc-800 dark:bg-zinc-950/20">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {filtered.map((w) => (
              <button
                key={w.index}
                type="button"
                className="rounded-md border border-transparent px-2 py-1 text-left text-xs text-zinc-700 transition hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-900/60"
                onClick={() =>
                  props.onChange({
                    ...props.item,
                    equipmentIndex: w.index,
                    masteryIndex: undefined,
                    masteryProficient: false
                  })
                }
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-end">
          <button type="button" className={buttonClass("danger")} onClick={props.onRemove} aria-label="Cancel weapon row">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{picked?.name ?? props.item.equipmentIndex}</span>
            <button
              type="button"
              className="text-xs font-medium text-emerald-700 underline dark:text-emerald-400"
              onClick={() => props.onChange({ ...props.item, equipmentIndex: "", masteryIndex: undefined })}
            >
              Change weapon
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={Boolean(props.item.masteryProficient)}
                onChange={(e) =>
                  props.onChange({
                    ...props.item,
                    masteryProficient: e.target.checked
                  })
                }
              />
              Weapon mastery proficient
            </label>
            {props.item.masteryProficient && picked?.mastery?.name ? (
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                Uses default mastery: <span className="font-medium">{picked.mastery.name}</span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className={smallLabelClass()}>Bonus</span>
            <input
              type="number"
              className={inputClass() + " w-20"}
              value={props.item.modifier}
              onChange={(e) => props.onChange({ ...props.item, modifier: Number(e.target.value) })}
            />
          </label>
          <button type="button" className={buttonClass("danger")} onClick={props.onRemove} aria-label="Remove weapon">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

