import { describe, expect, it } from "vitest";
import { createCharacter, emptyTierPicks, type Character } from "./character";
import {
  adjustGold,
  armorSlots,
  dieSides,
  evasion,
  experienceBonus,
  experiencesEarned,
  hpSlots,
  isCrossedOut,
  levelUpWarnings,
  picksAllowed,
  picksUsed,
  proficiency,
  stressSlots,
  thresholds,
  toggleGoldCircle,
  toggleSlot,
  traitMarked,
  traitSpreadWarning,
  traitValue,
} from "./derive";
import { selectArmor, selectWeapon } from "./suggestions";
import CLASS from "../data/classes/guardian";

const guardian = (level = 1): Character => ({ ...createCharacter("guardian", "t"), level });
const withTier = (c: Character, tier: "2" | "3" | "4", patch: Partial<ReturnType<typeof emptyTierPicks>>): Character => ({
  ...c,
  levelUps: { ...c.levelUps, [tier]: { ...c.levelUps[tier], ...patch } },
});

describe("Guardian data", () => {
  it("pins the values read from the sheet", () => {
    expect(CLASS.startingEvasion).toBe(9);
    expect(CLASS.startingHP).toBe(7);
    expect(CLASS.startingStress).toBe(6);
  });
});

describe("thresholds", () => {
  it("adds level to the Chainmail base (7/15) at every level", () => {
    for (let level = 1; level <= 10; level++) {
      expect(thresholds(guardian(level))).toEqual({ minor: 7 + level, major: 15 + level });
    }
    expect(thresholds(guardian(1))).toEqual({ minor: 8, major: 16 });
  });
  it("is level / 2×level with no armor", () => {
    const c = selectArmor(guardian(3), null);
    expect(thresholds(c)).toEqual({ minor: 3, major: 6 });
  });
  it("applies manual adjustments", () => {
    const c = { ...guardian(1), adjustments: { ...guardian().adjustments, minor: 1, major: 2 } };
    expect(thresholds(c)).toEqual({ minor: 9, major: 18 });
  });
});

describe("proficiency", () => {
  it("is 1 at level 1 and +1 at levels 2, 5 and 8", () => {
    const expected: Record<number, number> = { 1: 1, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 4, 9: 4, 10: 4 };
    for (const [level, p] of Object.entries(expected)) expect(proficiency(guardian(Number(level)))).toBe(p);
  });
  it("adds level-up picks and caps at 6", () => {
    let c = withTier(guardian(8), "3", { proficiency: true });
    expect(proficiency(c)).toBe(5);
    c = withTier(c, "4", { proficiency: true });
    expect(proficiency(c)).toBe(6);
    c = { ...c, adjustments: { ...c.adjustments, proficiency: 3 } };
    expect(proficiency(c)).toBe(6);
  });
  it("ignores picks from tiers not yet unlocked", () => {
    expect(proficiency(withTier(guardian(4), "3", { proficiency: true }))).toBe(2);
  });
});

describe("evasion and armor", () => {
  it("applies the Chainmail Heavy modifier (-1) to the class's starting 9", () => {
    expect(evasion(guardian())).toBe(8);
  });
  it("follows the armor selection", () => {
    expect(evasion(selectArmor(guardian(), "gambeson-armor"))).toBe(10);
    expect(evasion(selectArmor(guardian(), "full-plate-armor"))).toBe(7);
    expect(evasion(selectArmor(guardian(), null))).toBe(9);
  });
  it("counts weapon modifiers for the weapons actually wielded", () => {
    expect(evasion(selectWeapon(guardian(), "primary", "warhammer"))).toBe(7);
  });
  it("adds Evasion level-up picks", () => {
    expect(evasion(withTier(guardian(2), "2", { evasion: true }))).toBe(9);
  });
  it("shows as many armor slots as the armor score", () => {
    expect(armorSlots(guardian())).toBe(4);
    expect(armorSlots(selectArmor(guardian(), "leather-armor"))).toBe(3);
    expect(armorSlots(selectArmor(guardian(), null))).toBe(0);
  });
  it("adds a shield's armor score only while the secondary is usable", () => {
    let c = selectWeapon(guardian(), "primary", "mace");
    c = selectWeapon(c, "secondary", "round-shield");
    expect(armorSlots(c)).toBeGreaterThan(4);
    c = selectWeapon(c, "primary", "battleaxe");
    expect(armorSlots(c)).toBe(4);
  });
});

describe("HP and Stress", () => {
  it("starts at the class values and grows with picks", () => {
    expect(hpSlots(guardian())).toBe(7);
    expect(stressSlots(guardian())).toBe(6);
    const c = withTier(guardian(2), "2", { hp: 2, stress: 1 });
    expect(hpSlots(c)).toBe(9);
    expect(stressSlots(c)).toBe(7);
  });
  it("caps at 12", () => {
    const c = { ...guardian(), adjustments: { ...guardian().adjustments, hp: 20, stress: 20 } };
    expect(hpSlots(c)).toBe(12);
    expect(stressSlots(c)).toBe(12);
  });
});

describe("experiences", () => {
  it("earns two at creation and one more at levels 2, 5 and 8", () => {
    expect([1, 2, 4, 5, 7, 8, 10].map(experiencesEarned)).toEqual([2, 3, 3, 4, 4, 5, 5]);
  });
  it("adds +1 per targeted level-up pick", () => {
    const c = guardian(2);
    const id = c.experiences[0]!.id;
    const other = c.experiences[1]!.id;
    const picked = withTier(c, "2", { experience: [[id, other]] });
    expect(experienceBonus(picked, id)).toBe(3);
    expect(experienceBonus(picked, other)).toBe(3);
    expect(experienceBonus(c, id)).toBe(2);
  });
});

describe("trait marks", () => {
  const picked = (level: number, atLevel: number) =>
    withTier(guardian(level), "2", { traits: [{ traits: ["strength", "agility"], atLevel }] });
  it("marks a picked trait and raises its value", () => {
    const c = picked(2, 2);
    expect(traitMarked(c, "strength")).toBe(true);
    expect(traitMarked(c, "finesse")).toBe(false);
    expect(traitValue(c, "strength")).toBe(3);
  });
  it("clears marks at level 5 and 8 but keeps the bonus", () => {
    const c = picked(5, 3);
    expect(traitMarked(c, "strength")).toBe(false);
    expect(traitValue(c, "strength")).toBe(3);
  });
  it("keeps a mark for a pick made at the clearing level itself", () => {
    expect(traitMarked(picked(5, 5), "strength")).toBe(true);
    expect(traitMarked(picked(8, 5), "strength")).toBe(false);
  });
  it("lets a manual override win", () => {
    const c = { ...picked(2, 2), traitMarkOverrides: { strength: false } };
    expect(traitMarked(c, "strength")).toBe(false);
  });
  it("applies armor trait modifiers", () => {
    expect(traitValue(selectArmor(guardian(), "full-plate-armor"), "agility")).toBe(0);
  });
  it("warns, never blocks, on a non-standard spread", () => {
    expect(traitSpreadWarning(guardian())).toBeNull();
    expect(traitSpreadWarning({ ...guardian(), traits: { ...guardian().traits, strength: 3 } })).not.toBeNull();
  });
});

describe("class die", () => {
  it("is a d4 until level 5, then a d6", () => {
    const s = CLASS.classFeatures[0]!.tracker!.sidesByLevel;
    expect([1, 4, 5, 10].map((l) => dieSides(s, l))).toEqual([4, 4, 6, 6]);
  });
});

describe("gold", () => {
  it("carries 10 handfuls into a bag and 10 bags into a chest", () => {
    expect(adjustGold({ handfuls: 9, bags: 0, chest: 0 }, "handfuls", 1)).toEqual({ handfuls: 0, bags: 1, chest: 0 });
    expect(adjustGold({ handfuls: 9, bags: 9, chest: 0 }, "handfuls", 1)).toEqual({ handfuls: 0, bags: 0, chest: 1 });
    expect(adjustGold({ handfuls: 0, bags: 9, chest: 0 }, "bags", 1)).toEqual({ handfuls: 0, bags: 0, chest: 1 });
  });
  it("does not exceed one chest", () => {
    const full = { handfuls: 9, bags: 9, chest: 1 };
    expect(adjustGold(full, "handfuls", 1)).toEqual(full);
  });
  it("borrows when taking away from nothing", () => {
    expect(adjustGold({ handfuls: 0, bags: 1, chest: 0 }, "handfuls", -1)).toEqual({ handfuls: 9, bags: 0, chest: 0 });
    expect(adjustGold({ handfuls: 0, bags: 0, chest: 1 }, "handfuls", -1)).toEqual({ handfuls: 9, bags: 9, chest: 0 });
    expect(adjustGold({ handfuls: 0, bags: 0, chest: 0 }, "handfuls", -1)).toEqual({ handfuls: 0, bags: 0, chest: 0 });
  });
  it("toggles circles like slots", () => {
    expect(toggleGoldCircle({ handfuls: 2, bags: 0, chest: 0 }, "handfuls", 5).handfuls).toBe(5);
    expect(toggleGoldCircle({ handfuls: 5, bags: 0, chest: 0 }, "handfuls", 5).handfuls).toBe(4);
    expect(toggleSlot(3, 3)).toBe(2);
    expect(toggleSlot(3, 5)).toBe(5);
  });
});

describe("level-up picks", () => {
  it("allows two picks per level-up", () => {
    expect([1, 2, 5, 10].map(picksAllowed)).toEqual([0, 2, 8, 18]);
  });
  it("counts double boxes as two picks and warns when over the allowance", () => {
    const c = withTier(guardian(5), "3", { proficiency: true, hp: 2 });
    expect(picksUsed(c)).toBe(4);
    expect(levelUpWarnings(c)).toEqual([]);
    const over = withTier(guardian(2), "2", { hp: 2, stress: 2 });
    expect(levelUpWarnings(over)[0]).toMatch(/allows 2/);
  });
  it("crosses out subclass when multiclass is taken in the same tier, and vice versa", () => {
    const m = withTier(guardian(8), "3", { multiclass: true });
    expect(isCrossedOut(m, "subclass", 3)).toBe(true);
    expect(isCrossedOut(m, "subclass", 4)).toBe(false);
    expect(isCrossedOut(m, "multiclass", 4)).toBe(true);
    const s = withTier(guardian(8), "3", { subclass: true });
    expect(isCrossedOut(s, "multiclass", 3)).toBe(true);
    expect(isCrossedOut(s, "multiclass", 4)).toBe(false);
  });
  it("warns about incomplete trait picks", () => {
    const c = withTier(guardian(2), "2", { traits: [{ traits: ["agility"], atLevel: 2 }] });
    expect(levelUpWarnings(c).some((w) => /two traits/.test(w))).toBe(true);
  });
});
