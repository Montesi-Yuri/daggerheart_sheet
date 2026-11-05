// Pure functions that compute every derived value on the sheet. Nothing here is persisted:
// the Character only stores choices, overrides and manual adjustments.
import { getClass } from "../data/classes";
import { getArmor, getWeapon } from "../data/catalog";
import {
  ACHIEVEMENT_LEVELS,
  CLEAR_MARK_LEVELS,
  LEVEL_UP_OPTIONS,
  LEVEL_UP_TIERS,
  MAX_PROFICIENCY,
  MAX_STAT_SLOTS,
  STANDARD_SPREAD,
  tierOf,
  type LevelUpOptionDef,
  type LevelUpOptionId,
  type LevelUpTier,
} from "../data/common";
import { TRAITS, type ClassDefinition, type Modifiers, type SubclassDefinition, type Trait, type Weapon } from "../data/schema";
export { getArmor, getWeapon };
import type { Character, TierKey, TierPicks } from "./character";
import { effectiveValue } from "./suggestions";

export type Slot = "primary" | "secondary";

export function classOf(c: Character): ClassDefinition | undefined {
  return getClass(c.classId);
}
export function subclassOf(c: Character): SubclassDefinition | undefined {
  return classOf(c)?.subclasses.find((s) => s.id === c.subclassId);
}

const num = (v: string | number | undefined): number => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : 0;
};
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// --- Tiers & level-up picks -----------------------------------------------------------------------

/** Tiers 2..4 whose level-up options are unlocked at the character's level. */
export function unlockedTiers(level: number): LevelUpTier[] {
  const t = tierOf(level);
  return LEVEL_UP_TIERS.filter((x) => x <= t);
}

function activePicks(c: Character): TierPicks[] {
  return unlockedTiers(c.level).map((t) => c.levelUps[String(t) as TierKey]);
}

export function optionDef(id: LevelUpOptionId): LevelUpOptionDef {
  const def = LEVEL_UP_OPTIONS.find((o) => o.id === id);
  if (!def) throw new Error(`Unknown level-up option ${id}`);
  return def;
}

export function boxLimit(id: LevelUpOptionId, tier: LevelUpTier): number {
  return optionDef(id).boxes[tier] ?? 0;
}

/** Number of ticked boxes for an option in a tier. */
export function pickCount(picks: TierPicks, id: LevelUpOptionId): number {
  switch (id) {
    case "traits":
      return picks.traits.length;
    case "hp":
      return picks.hp;
    case "stress":
      return picks.stress;
    case "experience":
      return picks.experience.length;
    default:
      return picks[id] ? 1 : 0;
  }
}

/** Picks spent so far (a ticked double box such as Proficiency spends two). */
export function picksUsed(c: Character): number {
  return sum(
    activePicks(c).flatMap((p) => LEVEL_UP_OPTIONS.map((o) => pickCount(p, o.id) * o.cost)),
  );
}

/** Each level-up (levels 2–10) grants two picks. */
export function picksAllowed(level: number): number {
  return 2 * Math.max(0, level - 1);
}

/**
 * Multiclass and upgraded-subclass cross each other out within a tier, and only one Multiclass
 * may be taken across the sheet.
 */
export function isCrossedOut(c: Character, id: LevelUpOptionId, tier: LevelUpTier): boolean {
  if (id !== "subclass" && id !== "multiclass") return false;
  const picksOf = (t: LevelUpTier) => c.levelUps[String(t) as TierKey];
  const here = picksOf(tier);
  if (id === "subclass") return here.multiclass;
  if (here.subclass) return true;
  return LEVEL_UP_TIERS.some((t) => t !== tier && picksOf(t).multiclass);
}

export function levelUpWarnings(c: Character): string[] {
  const out: string[] = [];
  const used = picksUsed(c);
  const allowed = picksAllowed(c.level);
  if (used > allowed) out.push(`${used} level-up picks are ticked but level ${c.level} allows ${allowed}.`);
  for (const t of unlockedTiers(c.level)) {
    const p = c.levelUps[String(t) as TierKey];
    for (const box of p.traits) {
      if (box.traits.length < 2) out.push("A trait pick needs two traits chosen.");
    }
    for (const targets of p.experience) {
      if (targets.length < 2) out.push("An Experience pick needs two Experiences chosen.");
    }
  }
  return out;
}

// --- Traits ---------------------------------------------------------------------------------------

/** Bonus a trait has gained from level-up picks in unlocked tiers. */
export function traitLevelUpBonus(c: Character, trait: Trait): number {
  return sum(activePicks(c).map((p) => p.traits.reduce((n, box) => n + box.traits.filter((t) => t === trait).length, 0)));
}

/** A trait pick's mark is cleared when the character has passed a clearing level since the pick. */
export function traitMarkedByPicks(c: Character, trait: Trait): boolean {
  return activePicks(c).some((p) =>
    p.traits.some(
      (box) =>
        box.traits.includes(trait) && !CLEAR_MARK_LEVELS.some((clear) => box.atLevel < clear && clear <= c.level),
    ),
  );
}

export function traitMarked(c: Character, trait: Trait): boolean {
  return c.traitMarkOverrides[trait] ?? traitMarkedByPicks(c, trait);
}

export function gearModifiers(c: Character): Modifiers {
  const total: Record<string, number> = {};
  const add = (m: Modifiers | undefined) => {
    for (const [k, v] of Object.entries(m ?? {})) total[k] = (total[k] ?? 0) + (v ?? 0);
  };
  add(getArmor(c.armorId)?.modifiers);
  for (const slot of ["primary", "secondary"] as const) add(activeWeapon(c, slot)?.modifiers);
  return total as Modifiers;
}

/** Trait as shown on the sheet: creation spread + level-up picks + gear modifiers. */
export function traitValue(c: Character, trait: Trait): number {
  return c.traits[trait] + traitLevelUpBonus(c, trait) + (gearModifiers(c)[trait] ?? 0);
}

/** Warning (never a block) when the creation spread isn't +2, +1, +1, 0, 0, −1. */
export function traitSpreadWarning(c: Character): string | null {
  const sorted = TRAITS.map((t) => c.traits[t]).sort((a, b) => b - a);
  if (STANDARD_SPREAD.every((v, i) => v === sorted[i])) return null;
  return "Starting traits should be +2, +1, +1, 0, 0, −1 in any order.";
}

// --- Weapons --------------------------------------------------------------------------------------

export function isTwoHanded(weaponId: string | null): boolean {
  return getWeapon(weaponId)?.burden === "Two-Handed";
}

export function secondaryAvailable(c: Character): boolean {
  return !isTwoHanded(c.weaponIds.primary);
}

/** The weapon actually wielded in a slot; a Two-Handed primary leaves no secondary. */
export function activeWeapon(c: Character, slot: Slot): Weapon | undefined {
  if (slot === "secondary" && !secondaryAvailable(c)) return undefined;
  return getWeapon(c.weaponIds[slot]);
}

// --- Numbers on the sheet -------------------------------------------------------------------------

export function hasArmor(c: Character): boolean {
  return c.armorId !== null || Object.keys(c.overrides).some((k) => k.startsWith("armor."));
}

export function armorBase(c: Character): { minor: number; major: number; score: number } {
  if (!hasArmor(c)) return { minor: 0, major: 0, score: 0 };
  return {
    minor: num(effectiveValue(c, "armor.baseMinor")),
    major: num(effectiveValue(c, "armor.baseMajor")),
    score: num(effectiveValue(c, "armor.score")),
  };
}

/** Minor / Major thresholds. Severe is "Major or higher", so it isn't a number. */
export function thresholds(c: Character): { minor: number; major: number } {
  const base = armorBase(c);
  if (!hasArmor(c)) {
    return { minor: c.level + c.adjustments.minor, major: 2 * c.level + c.adjustments.major };
  }
  return { minor: base.minor + c.level + c.adjustments.minor, major: base.major + c.level + c.adjustments.major };
}

export function proficiency(c: Character): number {
  const fromLevel = 1 + ACHIEVEMENT_LEVELS.filter((l) => c.level >= l).length;
  const picks = activePicks(c).filter((p) => p.proficiency).length;
  return clamp(fromLevel + picks + c.adjustments.proficiency, 1, MAX_PROFICIENCY);
}

export function evasion(c: Character): number {
  const base = classOf(c)?.startingEvasion ?? 10;
  const picks = activePicks(c).filter((p) => p.evasion).length;
  return base + (gearModifiers(c).evasion ?? 0) + picks + c.adjustments.evasion;
}

export function armorSlots(c: Character): number {
  return clamp(armorBase(c).score + (gearModifiers(c).armorScore ?? 0) + c.adjustments.armorScore, 0, MAX_STAT_SLOTS);
}

export function hpSlots(c: Character): number {
  const base = classOf(c)?.startingHP ?? 6;
  const picks = sum(activePicks(c).map((p) => p.hp));
  return clamp(base + picks + c.adjustments.hp, 1, MAX_STAT_SLOTS);
}

export function stressSlots(c: Character): number {
  const base = classOf(c)?.startingStress ?? 6;
  const picks = sum(activePicks(c).map((p) => p.stress));
  return clamp(base + picks + c.adjustments.stress, 1, MAX_STAT_SLOTS);
}

/** Marked counts are stored as entered and only clamped when displayed. */
export function markedCount(marked: number, slots: number): number {
  return clamp(marked, 0, slots);
}

// --- Experiences ----------------------------------------------------------------------------------

/** Two at creation, plus one more at each tier achievement. */
export function experiencesEarned(level: number): number {
  return 2 + ACHIEVEMENT_LEVELS.filter((l) => level >= l).length;
}

export function experienceBonus(c: Character, id: string): number {
  const picks = sum(activePicks(c).map((p) => p.experience.reduce((n, targets) => n + targets.filter((t) => t === id).length, 0)));
  return 2 + picks;
}

// --- Class feature die ----------------------------------------------------------------------------

/** Die size at a level: the entry with the highest key not above the level. */
export function dieSides(sidesByLevel: Record<string, number>, level: number): number {
  const keys = Object.keys(sidesByLevel)
    .map(Number)
    .filter((k) => k <= level)
    .sort((a, b) => b - a);
  const key = keys[0];
  if (key === undefined) {
    const first = Object.keys(sidesByLevel).map(Number).sort((a, b) => a - b)[0];
    return first === undefined ? 0 : (sidesByLevel[String(first)] ?? 0);
  }
  return sidesByLevel[String(key)] ?? 0;
}

// --- Gold -----------------------------------------------------------------------------------------

export interface Gold {
  handfuls: number;
  bags: number;
  chest: number;
}
export type GoldKind = keyof Gold;

/** Add or remove one unit, carrying 10 handfuls → 1 bag → 1 chest and borrowing when taking away. */
export function adjustGold(gold: Gold, kind: GoldKind, delta: 1 | -1): Gold {
  const g = { ...gold };
  if (delta === 1) {
    if (kind === "chest") {
      g.chest = 1;
    } else if (kind === "bags") {
      if (g.bags >= 9) {
        if (g.chest < 1) {
          g.bags = 0;
          g.chest = 1;
        }
      } else g.bags += 1;
    } else if (g.handfuls >= 9) {
      if (g.bags >= 9) {
        if (g.chest < 1) {
          g.handfuls = 0;
          g.bags = 0;
          g.chest = 1;
        }
      } else {
        g.handfuls = 0;
        g.bags += 1;
      }
    } else g.handfuls += 1;
    return g;
  }
  if (kind === "chest") {
    g.chest = 0;
  } else if (kind === "bags") {
    if (g.bags > 0) g.bags -= 1;
    else if (g.chest > 0) {
      g.chest = 0;
      g.bags = 9;
    }
  } else if (g.handfuls > 0) g.handfuls -= 1;
  else if (g.bags > 0) {
    g.bags -= 1;
    g.handfuls = 9;
  } else if (g.chest > 0) {
    g.chest = 0;
    g.bags = 9;
    g.handfuls = 9;
  }
  return g;
}

/** Clicking circle n in the preview fills up to n; clicking the top filled circle lowers it by one. */
export function toggleGoldCircle(gold: Gold, kind: "handfuls" | "bags", n: number): Gold {
  return { ...gold, [kind]: gold[kind] === n ? n - 1 : n };
}

/** Same behaviour for a row of slots: click slot n to mark up to n, click the top marked slot to unmark it. */
export function toggleSlot(marked: number, n: number): number {
  return marked === n ? n - 1 : n;
}
