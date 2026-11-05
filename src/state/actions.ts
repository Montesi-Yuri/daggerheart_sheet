// Pure Character -> Character mutators shared by the form and the interactive preview.
import type { DescriptionKey, Trait } from "../data/schema";
import { MAX_EXPERIENCES, MAX_HOPE, MAX_LEVEL, MIN_LEVEL, type LevelUpOptionId, type LevelUpTier } from "../data/common";
import { adjustGold, armorSlots, classOf, dieSides, hpSlots, isCrossedOut, stressSlots, toggleGoldCircle, toggleSlot, unlockedTiers, type Gold, type GoldKind } from "./derive";
import { newId, type Character, type TierKey, type TierPicks } from "./character";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const patch = (c: Character, p: Partial<Character>): Character => ({ ...c, ...p });

export function setLevel(c: Character, level: number): Character {
  const next = { ...c, level: clamp(Math.round(level) || MIN_LEVEL, MIN_LEVEL, MAX_LEVEL) };
  return { ...next, classDie: clampDie(next) };
}

function clampDie(c: Character): number {
  const tracker = classOf(c)?.classFeatures.find((f) => f.tracker)?.tracker;
  if (!tracker) return c.classDie;
  return Math.min(c.classDie, dieSides(tracker.sidesByLevel, c.level));
}

export function setAdjustment(c: Character, key: keyof Character["adjustments"], value: number): Character {
  return { ...c, adjustments: { ...c.adjustments, [key]: Math.round(value) || 0 } };
}

// --- Marks and pips -------------------------------------------------------------------------------

export type MarkKey = "hpMarked" | "stressMarked" | "armorMarked";

export function slotsFor(c: Character, key: MarkKey): number {
  return key === "hpMarked" ? hpSlots(c) : key === "stressMarked" ? stressSlots(c) : armorSlots(c);
}

/** Click slot n (1-based) to mark up to it; click the top marked slot to unmark it. */
export function toggleMark(c: Character, key: MarkKey, n: number): Character {
  const shown = Math.min(c[key], slotsFor(c, key));
  return { ...c, [key]: toggleSlot(shown, n) };
}

export function setMarked(c: Character, key: MarkKey, value: number): Character {
  return { ...c, [key]: clamp(value, 0, slotsFor(c, key)) };
}

export function toggleHope(c: Character, n: number): Character {
  return { ...c, hope: clamp(toggleSlot(c.hope, n), 0, MAX_HOPE) };
}

export function setHope(c: Character, n: number): Character {
  return { ...c, hope: clamp(n, 0, MAX_HOPE) };
}

/** Class die in the preview: off -> 1 -> 2 -> ... -> max -> off. */
export function cycleClassDie(c: Character): Character {
  const tracker = classOf(c)?.classFeatures.find((f) => f.tracker)?.tracker;
  if (!tracker) return c;
  const max = dieSides(tracker.sidesByLevel, c.level);
  return { ...c, classDie: c.classDie >= max ? 0 : c.classDie + 1 };
}

export function setTraitMarked(c: Character, trait: Trait, marked: boolean | undefined): Character {
  const traitMarkOverrides = { ...c.traitMarkOverrides };
  if (marked === undefined) delete traitMarkOverrides[trait];
  else traitMarkOverrides[trait] = marked;
  return { ...c, traitMarkOverrides };
}

// --- Gold -----------------------------------------------------------------------------------------

export function changeGold(c: Character, kind: GoldKind, delta: 1 | -1): Character {
  return { ...c, gold: adjustGold(c.gold as Gold, kind, delta) };
}
export function clickGoldCircle(c: Character, kind: "handfuls" | "bags", n: number): Character {
  return { ...c, gold: toggleGoldCircle(c.gold as Gold, kind, n) };
}
export function toggleChest(c: Character): Character {
  return { ...c, gold: { ...c.gold, chest: c.gold.chest ? 0 : 1 } };
}

// --- Experiences ----------------------------------------------------------------------------------

export function addExperience(c: Character): Character {
  if (c.experiences.length >= MAX_EXPERIENCES) return c;
  return { ...c, experiences: [...c.experiences, { id: newId(), name: "" }] };
}

export function renameExperience(c: Character, id: string, name: string): Character {
  return { ...c, experiences: c.experiences.map((e) => (e.id === id ? { ...e, name } : e)) };
}

/** Removing an Experience also drops it from any level-up pick that targeted it. */
export function removeExperience(c: Character, id: string): Character {
  const levelUps = { ...c.levelUps };
  for (const k of ["2", "3", "4"] as const) {
    levelUps[k] = { ...levelUps[k], experience: levelUps[k].experience.map((t) => t.filter((x) => x !== id)) };
  }
  return { ...c, experiences: c.experiences.filter((e) => e.id !== id), levelUps };
}

// --- Level-up boxes -------------------------------------------------------------------------------

const tk = (t: LevelUpTier): TierKey => String(t) as TierKey;

function withPicks(c: Character, tier: LevelUpTier, p: Partial<TierPicks>): Character {
  return { ...c, levelUps: { ...c.levelUps, [tk(tier)]: { ...c.levelUps[tk(tier)], ...p } } };
}

/** Whether a box can be changed right now: its tier is unlocked and it isn't crossed out. */
export function canEditBox(c: Character, id: LevelUpOptionId, tier: LevelUpTier): boolean {
  return unlockedTiers(c.level).includes(tier) && !isCrossedOut(c, id, tier);
}

/** Tick or untick box `index` (0-based) of an option. Ticked boxes to its left stay ticked. */
export function toggleLevelUpBox(c: Character, tier: LevelUpTier, id: LevelUpOptionId, index: number): Character {
  const picks = c.levelUps[tk(tier)];
  switch (id) {
    case "hp":
    case "stress": {
      const count = picks[id];
      return withPicks(c, tier, { [id]: count > index ? index : index + 1 });
    }
    case "traits": {
      if (picks.traits.length > index) return withPicks(c, tier, { traits: picks.traits.slice(0, index) });
      const added = Array.from({ length: index + 1 - picks.traits.length }, () => ({ traits: [] as Trait[], atLevel: c.level }));
      return withPicks(c, tier, { traits: [...picks.traits, ...added] });
    }
    case "experience":
      return withPicks(c, tier, { experience: picks.experience.length > index ? [] : [[]] });
    default:
      return withPicks(c, tier, { [id]: !picks[id] });
  }
}

export function setTraitPick(c: Character, tier: LevelUpTier, box: number, slot: 0 | 1, trait: Trait | null): Character {
  const picks = c.levelUps[tk(tier)];
  const current = picks.traits[box];
  if (!current) return c;
  const traits = [...current.traits];
  if (trait === null) traits.splice(slot, 1);
  else traits[slot] = trait;
  const next = picks.traits.map((b, i) => (i === box ? { ...b, traits: traits.filter(Boolean) as Trait[] } : b));
  return withPicks(c, tier, { traits: next });
}

export function setExperiencePick(c: Character, tier: LevelUpTier, slot: 0 | 1, experienceId: string | null): Character {
  const picks = c.levelUps[tk(tier)];
  const current = picks.experience[0];
  if (!current) return c;
  const targets = [...current];
  if (experienceId === null) targets.splice(slot, 1);
  else targets[slot] = experienceId;
  return withPicks(c, tier, { experience: [targets.filter(Boolean)] });
}

// --- Description, questions, inventory -----------------------------------------------------------

export function toggleDescriptionChip(c: Character, key: DescriptionKey, chip: string): Character {
  const line = c.description[key];
  const chips = line.chips.includes(chip) ? line.chips.filter((x) => x !== chip) : [...line.chips, chip];
  return { ...c, description: { ...c.description, [key]: { ...line, chips } } };
}

export function setDescriptionText(c: Character, key: DescriptionKey, text: string): Character {
  return { ...c, description: { ...c.description, [key]: { ...c.description[key], text } } };
}

export function setAnswer(c: Character, section: "background" | "connections", question: string, answer: string): Character {
  const key = section === "background" ? "backgroundAnswers" : "connectionAnswers";
  return { ...c, [key]: { ...c[key], [question]: answer } };
}

export function removeAnswer(c: Character, section: "background" | "connections", question: string): Character {
  const key = section === "background" ? "backgroundAnswers" : "connectionAnswers";
  const { [question]: _gone, ...rest } = c[key];
  return { ...c, [key]: rest };
}

export function setCustomQuestion(
  c: Character,
  section: "background" | "connections",
  slot: 0 | 1 | 2,
  value: { question: string; answer: string } | null,
): Character {
  const list = [...c.customQuestions[section]] as Character["customQuestions"]["background"];
  list[slot] = value;
  return { ...c, customQuestions: { ...c.customQuestions, [section]: list } };
}

export function setInventoryChoice(c: Character, group: number, option: string): Character {
  return { ...c, inventoryChoices: { ...c.inventoryChoices, [String(group)]: option } };
}

export function selectInventoryWeapon(c: Character, index: 0 | 1, weaponId: string | null): Character {
  const ids: Character["inventoryWeaponIds"] = [...c.inventoryWeaponIds];
  ids[index] = weaponId;
  return { ...c, inventoryWeaponIds: ids };
}

/** The set of questions currently shown on the sheet for a section: class question, unless a custom one replaces it. */
export function sheetQuestions(
  c: Character,
  section: "background" | "connections",
): { question: string; answer: string; custom: boolean }[] {
  const cls = classOf(c);
  const classQs = section === "background" ? (cls?.backgroundQuestions ?? []) : (cls?.connectionQuestions ?? []);
  const answers = section === "background" ? c.backgroundAnswers : c.connectionAnswers;
  return ([0, 1, 2] as const).map((i) => {
    const custom = c.customQuestions[section][i];
    if (custom) return { question: custom.question, answer: custom.answer, custom: true };
    const q = classQs[i] ?? "";
    return { question: q, answer: q ? (answers[q] ?? "") : "", custom: false };
  });
}

/** Answers whose question no longer belongs to the current class. */
export function orphanedAnswers(c: Character, section: "background" | "connections"): { question: string; answer: string }[] {
  const cls = classOf(c);
  const classQs = new Set(section === "background" ? (cls?.backgroundQuestions ?? []) : (cls?.connectionQuestions ?? []));
  const answers = section === "background" ? c.backgroundAnswers : c.connectionAnswers;
  return Object.entries(answers)
    .filter(([q, a]) => !classQs.has(q) && a.trim() !== "")
    .map(([question, answer]) => ({ question, answer }));
}
