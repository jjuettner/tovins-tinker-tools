import type { EncounterEntity } from "@/types/encounter";

function isDead(e: EncounterEntity): boolean {
  return e.status === "dead" || (e.kind === "monster" && e.currentHp === 0);
}

function isTurnParticipant(e: EncounterEntity): boolean {
  if (e.initiative === 0) return false;
  if (isDead(e)) return false;
  // Downed PCs still participate (death saves).
  return true;
}

/**
 * Build turn order: exclude initiative `0` (standby), highest initiative first; ties broken by entity `id`.
 *
 * @param entities All combatants in the encounter.
 * @returns Entities that participate in the turn cycle, sorted for `advanceTurn`.
 */
export function eligibleTurnOrder(entities: EncounterEntity[]): EncounterEntity[] {
  return [...entities]
    .filter(isTurnParticipant)
    .sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id));
}

/**
 * Move to the next combatant in initiative order. When the last participant wraps to the first, `round` increases by 1.
 *
 * @param entities All combatants (including standby at initiative 0).
 * @param activeEntityId Creature whose turn just ended, or `null` to start at the top of order.
 * @param round Current round number (typically starts at 1 after combat starts).
 * @returns Next active entity id (or `null` if no eligible combatants) and updated round.
 */
export function advanceTurn(
  entities: EncounterEntity[],
  activeEntityId: string | null,
  round: number
): { activeEntityId: string | null; round: number } {
  const order = eligibleTurnOrder(entities);
  if (order.length === 0) {
    return { activeEntityId, round };
  }

  const currentIdx =
    activeEntityId === null || activeEntityId === "" ? -1 : order.findIndex((e) => e.id === activeEntityId);

  const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % order.length;

  let nextRound = round;
  if (currentIdx >= 0 && nextIdx === 0) {
    nextRound = round + 1;
  }

  const nextEntity = order[nextIdx];
  return { activeEntityId: nextEntity?.id ?? null, round: nextRound };
}

/**
 * Sort entities for display with \"dead\" pinned at the bottom.
 *
 * Within the non-dead block, preserves the current list order.
 *
 * @param entities Encounter entities in their current order.
 * @returns Display list with dead last.
 */
export function orderWithDeadAtBottom(entities: EncounterEntity[]): EncounterEntity[] {
  const alive: EncounterEntity[] = [];
  const dead: EncounterEntity[] = [];
  for (const e of entities) {
    (isDead(e) ? dead : alive).push(e);
  }
  return [...alive, ...dead];
}

/**
 * Normalize the encounter queue after out-of-band edits (initiative, HP/status changes).
 *
 * Rules:
 * - Dead are pinned at bottom.
 * - If `activeEntityId` is present and not dead, it is placed at top of the non-dead block.
 * - Remaining non-dead are sorted by initiative desc (ties by id).
 *
 * This keeps the list stable and prevents \"init 2 before 8\" surprises after edits,
 * while still allowing `rotateTurnOrder` to implement the explicit \"pop top to bottom\" behavior.
 *
 * @param entities Current entities list.
 * @param activeEntityId Active entity id (may be null).
 * @returns Normalized queue.
 */
export function normalizeEncounterQueue(entities: EncounterEntity[], activeEntityId: string | null): EncounterEntity[] {
  const display = orderWithDeadAtBottom(entities);
  const deadStart = display.findIndex(isDead);
  const alive = deadStart < 0 ? display : display.slice(0, deadStart);
  const dead = deadStart < 0 ? [] : display.slice(deadStart);

  const byId = new Map(alive.map((e) => [e.id, e] as const));
  const active = activeEntityId ? byId.get(activeEntityId) ?? null : null;

  const restAlive = alive.filter((e) => e.id !== active?.id);
  const participants = restAlive.filter(isTurnParticipant);
  const standby = restAlive.filter((e) => !isTurnParticipant(e));

  participants.sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id));

  const activeIsParticipant = Boolean(active && isTurnParticipant(active));
  const activeIsStandby = Boolean(active && !isDead(active) && !isTurnParticipant(active));

  return [
    ...(activeIsParticipant && active ? [active] : []),
    ...participants,
    ...(activeIsStandby && active ? [active] : []),
    ...standby,
    ...dead
  ];
}

/**
 * Advance the list by moving the first turn participant to the bottom,
 * inserted right above the dead block. Dead are always last.\n
 *
 * Downed PCs (0 HP) stay in the cycle; dead and initiative 0 do not.
 *
 * @param entities Current list order (may include dead/standby).\n
 * @returns Next list order + next active entity id + whether we wrapped to a new round.
 */
export function rotateTurnOrder(entities: EncounterEntity[]): {
  entities: EncounterEntity[];
  activeEntityId: string | null;
  wrapped: boolean;
} {
  const display = orderWithDeadAtBottom(entities);
  const firstIdx = display.findIndex(isTurnParticipant);
  if (firstIdx < 0) return { entities: display, activeEntityId: null, wrapped: false };

  const participantsByInit = eligibleTurnOrder(display);
  const highest = participantsByInit[0] ?? null;

  const [first] = display.splice(firstIdx, 1);

  const deadStart = display.findIndex(isDead);
  const insertAt = deadStart < 0 ? display.length : deadStart;
  display.splice(insertAt, 0, first);

  // Enforce invariant: participants first, then standby (init 0), then dead.
  const pinned = [
    ...display.filter(isTurnParticipant),
    ...display.filter((e) => !isDead(e) && !isTurnParticipant(e)),
    ...display.filter(isDead)
  ];

  const nextActive = pinned.find(isTurnParticipant) ?? null;
  const wrapped = Boolean(highest && nextActive && nextActive.id === highest.id);
  return { entities: pinned, activeEntityId: nextActive?.id ?? null, wrapped };
}
