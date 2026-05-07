import { describe, expect, it } from "vitest";
import { advanceTurn, eligibleTurnOrder, normalizeEncounterQueue, orderWithDeadAtBottom, rotateTurnOrder } from "@/lib/encounterTurn";
import type { EncounterEntity } from "@/types/encounter";

function e(p: Partial<EncounterEntity> & Pick<EncounterEntity, "id" | "initiative">): EncounterEntity {
  return {
    kind: "monster",
    displayName: p.id,
    maxHp: 10,
    currentHp: 10,
    ...p
  };
}

describe("eligibleTurnOrder", () => {
  it("excludes initiative 0 and sorts by initiative desc", () => {
    const entities = [e({ id: "a", initiative: 0 }), e({ id: "b", initiative: 15 }), e({ id: "c", initiative: 18 })];
    const o = eligibleTurnOrder(entities);
    expect(o.map((x) => x.id)).toEqual(["c", "b"]);
  });

  it("excludes monsters at 0 HP", () => {
    const entities = [e({ id: "m1", initiative: 10, currentHp: 0 }), e({ id: "m2", initiative: 11, currentHp: 1 })];
    expect(eligibleTurnOrder(entities).map((x) => x.id)).toEqual(["m2"]);
  });

  it("keeps PCs at 0 HP", () => {
    const entities: EncounterEntity[] = [
      e({ id: "m1", initiative: 10, currentHp: 0 }),
      { ...e({ id: "pc1", initiative: 12, currentHp: 0 }), kind: "pc" }
    ];
    expect(eligibleTurnOrder(entities).map((x) => x.id)).toEqual(["pc1"]);
  });

  it("breaks ties by id", () => {
    const entities = [e({ id: "z", initiative: 10 }), e({ id: "m", initiative: 10 })];
    expect(eligibleTurnOrder(entities).map((x) => x.id)).toEqual(["m", "z"]);
  });
});

describe("advanceTurn", () => {
  it("picks first when active is null", () => {
    const entities = [e({ id: "b", initiative: 12 }), e({ id: "a", initiative: 14 })];
    const r = advanceTurn(entities, null, 1);
    expect(r.activeEntityId).toBe("a");
    expect(r.round).toBe(1);
  });

  it("increments round when wrapping to first", () => {
    const entities = [e({ id: "a", initiative: 10 }), e({ id: "b", initiative: 5 })];
    const r1 = advanceTurn(entities, "a", 1);
    expect(r1.activeEntityId).toBe("b");
    expect(r1.round).toBe(1);
    const r2 = advanceTurn(entities, "b", 1);
    expect(r2.activeEntityId).toBe("a");
    expect(r2.round).toBe(2);
  });
});

describe("orderWithDeadAtBottom", () => {
  it("pins dead to bottom but preserves other order", () => {
    const entities: EncounterEntity[] = [
      { ...e({ id: "a", initiative: 10 }), status: "dead" },
      e({ id: "b", initiative: 10 }),
      e({ id: "c", initiative: 10, currentHp: 0 })
    ];
    expect(orderWithDeadAtBottom(entities).map((x) => x.id)).toEqual(["b", "a", "c"]);
  });
});

describe("rotateTurnOrder", () => {
  it("moves top participant to just above dead block", () => {
    const entities: EncounterEntity[] = [
      e({ id: "a", initiative: 10 }),
      e({ id: "b", initiative: 5 }),
      { ...e({ id: "dead1", initiative: 10 }), status: "dead" }
    ];
    const r = rotateTurnOrder(entities);
    expect(r.entities.map((x) => x.id)).toEqual(["b", "a", "dead1"]);
    expect(r.activeEntityId).toBe("b");
  });

  it("skips initiative 0 and dead when rotating", () => {
    const entities: EncounterEntity[] = [
      e({ id: "standby", initiative: 0 }),
      { ...e({ id: "dead1", initiative: 10 }), status: "dead" },
      e({ id: "a", initiative: 10 })
    ];
    const r = rotateTurnOrder(entities);
    expect(r.activeEntityId).toBe("a");
    expect(r.entities.map((x) => x.id)).toEqual(["a", "standby", "dead1"]);
  });

  it("pins standby (init 0) below all participants", () => {
    const entities: EncounterEntity[] = [e({ id: "s1", initiative: 0 }), e({ id: "p1", initiative: 12 }), e({ id: "p2", initiative: 6 })];
    const r = rotateTurnOrder(entities);
    expect(r.entities.map((x) => x.id)).toEqual(["p2", "p1", "s1"]);
  });

  it("marks wrapped when next active is highest initiative", () => {
    const entities: EncounterEntity[] = [
      e({ id: "hi", initiative: 20 }),
      e({ id: "mid", initiative: 10 }),
      e({ id: "low", initiative: 5 })
    ];
    const r = rotateTurnOrder(entities);
    expect(r.entities.map((x) => x.id)).toEqual(["mid", "low", "hi"]);
    expect(r.activeEntityId).toBe("mid");
    expect(r.wrapped).toBe(false);

    const r2 = rotateTurnOrder(r.entities);
    expect(r2.entities.map((x) => x.id)).toEqual(["low", "hi", "mid"]);
    expect(r2.activeEntityId).toBe("low");
    expect(r2.wrapped).toBe(false);

    const r3 = rotateTurnOrder(r2.entities);
    expect(r3.entities.map((x) => x.id)).toEqual(["hi", "mid", "low"]);
    expect(r3.activeEntityId).toBe("hi");
    expect(r3.wrapped).toBe(true);
  });
});

describe("normalizeEncounterQueue", () => {
  it("keeps active on top and sorts rest by initiative, dead last", () => {
    const entities: EncounterEntity[] = [
      e({ id: "a", initiative: 10 }),
      e({ id: "b", initiative: 2 }),
      e({ id: "c", initiative: 8 }),
      { ...e({ id: "dead1", initiative: 99 }), status: "dead" }
    ];
    const n = normalizeEncounterQueue(entities, "a");
    expect(n.map((x) => x.id)).toEqual(["a", "c", "b", "dead1"]);
  });

  it("keeps initiative 0 (standby) above dead and below all participants", () => {
    const entities: EncounterEntity[] = [
      e({ id: "p1", initiative: 12 }),
      e({ id: "s1", initiative: 0 }),
      e({ id: "p2", initiative: 5 }),
      { ...e({ id: "dead1", initiative: 99 }), status: "dead" }
    ];
    const n = normalizeEncounterQueue(entities, "p1");
    expect(n.map((x) => x.id)).toEqual(["p1", "p2", "s1", "dead1"]);
  });

  it("preserves standby relative order", () => {
    const entities: EncounterEntity[] = [
      e({ id: "s2", initiative: 0 }),
      e({ id: "p2", initiative: 5 }),
      e({ id: "s1", initiative: 0 }),
      e({ id: "p1", initiative: 15 }),
      { ...e({ id: "dead1", initiative: 99 }), status: "dead" }
    ];
    const n = normalizeEncounterQueue(entities, "p1");
    expect(n.map((x) => x.id)).toEqual(["p1", "p2", "s2", "s1", "dead1"]);
  });

  it("does not move standby to top even if activeEntityId points to it", () => {
    const entities: EncounterEntity[] = [e({ id: "p1", initiative: 10 }), e({ id: "s1", initiative: 0 }), e({ id: "p2", initiative: 5 })];
    const n = normalizeEncounterQueue(entities, "s1");
    expect(n.map((x) => x.id)).toEqual(["p1", "p2", "s1"]);
  });
});
