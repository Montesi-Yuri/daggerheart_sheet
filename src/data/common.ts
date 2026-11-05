// Shared rules that apply to every class: tiers, level-up options, tier achievements.
import type { Trait } from "./schema";

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;
export const MAX_PROFICIENCY = 6;
export const MAX_STAT_SLOTS = 12;
export const MAX_EXPERIENCES = 5;
export const MAX_HOPE = 6;
export const MAX_GOLD = { handfuls: 9, bags: 9, chest: 1 } as const;

/** Standard trait spread at creation, highest first. */
export const STANDARD_SPREAD = [2, 1, 1, 0, 0, -1] as const;

/** Levels at which a tier achievement grants +1 Proficiency and one more +2 Experience. */
export const ACHIEVEMENT_LEVELS = [2, 5, 8] as const;
/** Levels at which all trait marks are cleared. */
export const CLEAR_MARK_LEVELS = [5, 8] as const;

export type Tier = 1 | 2 | 3 | 4;
export type LevelUpTier = 2 | 3 | 4;
export const LEVEL_UP_TIERS: readonly LevelUpTier[] = [2, 3, 4];

export const TIER_INFO: Record<LevelUpTier, { title: string; levels: string; firstLevel: number; achievement: string }> = {
  2: {
    title: "Tier 2",
    levels: "Levels 2–4",
    firstLevel: 2,
    achievement: "At level 2, gain an additional Experience at +2 and gain a +1 bonus to your Proficiency.",
  },
  3: {
    title: "Tier 3",
    levels: "Levels 5–7",
    firstLevel: 5,
    achievement:
      "At level 5, gain an additional Experience at +2 and clear all marks on character traits. Then gain a +1 bonus to your Proficiency.",
  },
  4: {
    title: "Tier 4",
    levels: "Levels 8–10",
    firstLevel: 8,
    achievement:
      "At level 8, gain an additional Experience at +2 and clear all marks on character traits. Then gain a +1 bonus to your Proficiency.",
  },
};

export const TIER_INTRO: Record<LevelUpTier, string> = {
  2: "Choose two options from the list below and mark them.",
  3: "Choose two options from the list below or any from the previous tier and mark them.",
  4: "Choose two options from the list below or any from the previous tier and mark them.",
};

export const TIER_OUTRO =
  "Update your level and adjust your damage thresholds accordingly. Take an additional domain card of your level or lower from a domain you have access to.";

export const LEVEL_UP_OPTION_IDS = [
  "traits",
  "hp",
  "stress",
  "experience",
  "domain",
  "evasion",
  "subclass",
  "proficiency",
  "multiclass",
] as const;
export type LevelUpOptionId = (typeof LEVEL_UP_OPTION_IDS)[number];

export interface LevelUpOptionDef {
  id: LevelUpOptionId;
  /** Number of boxes on the sheet, per tier. 0 or missing = the option isn't offered in that tier. */
  boxes: Partial<Record<LevelUpTier, number>>;
  /** How many of the level's two picks one ticked box uses. */
  cost: number;
  text: (tier: LevelUpTier) => string;
}

export const LEVEL_UP_OPTIONS: readonly LevelUpOptionDef[] = [
  {
    id: "traits",
    boxes: { 2: 3, 3: 3, 4: 3 },
    cost: 1,
    text: () => "Gain a +1 bonus to two unmarked character traits and mark them.",
  },
  { id: "hp", boxes: { 2: 2, 3: 2, 4: 2 }, cost: 1, text: () => "Permanently gain one Hit Point slot." },
  { id: "stress", boxes: { 2: 2, 3: 2, 4: 2 }, cost: 1, text: () => "Permanently gain one Stress slot." },
  {
    id: "experience",
    boxes: { 2: 1, 3: 1, 4: 1 },
    cost: 1,
    text: () => "Permanently gain a +1 bonus to two Experiences.",
  },
  {
    id: "domain",
    boxes: { 2: 1, 3: 1, 4: 1 },
    cost: 1,
    text: (tier) =>
      "Choose an additional domain card of your level or lower from a domain you have access to" +
      (tier === 2 ? " (up to level 4)." : tier === 3 ? " (up to level 7)." : "."),
  },
  { id: "evasion", boxes: { 2: 1, 3: 1, 4: 1 }, cost: 1, text: () => "Permanently gain a +1 bonus to your Evasion." },
  {
    id: "subclass",
    boxes: { 3: 1, 4: 1 },
    cost: 1,
    text: () => "Take an upgraded subclass card. Then cross out the multiclass option for this tier.",
  },
  { id: "proficiency", boxes: { 3: 1, 4: 1 }, cost: 2, text: () => "Increase your Proficiency by +1." },
  {
    id: "multiclass",
    boxes: { 3: 1, 4: 1 },
    cost: 2,
    text: () =>
      "Multiclass: Choose an additional class for your character, then cross out an unused “Take an upgraded subclass card” and the other multiclass option on this sheet.",
  },
];

export const TRAIT_SKILLS: Record<Trait, readonly [string, string, string]> = {
  agility: ["Sprint", "Leap", "Maneuver"],
  strength: ["Lift", "Smash", "Grapple"],
  finesse: ["Control", "Hide", "Tinker"],
  instinct: ["Perceive", "Sense", "Navigate"],
  presence: ["Charm", "Perform", "Deceive"],
  knowledge: ["Recall", "Analyze", "Comprehend"],
};

export const DESCRIPTION_LABELS = {
  clothes: "Clothes that are:",
  eyes: "Eyes like:",
  body: "Body that’s:",
  skin: "Skin the color of:",
  attitude: "Attitude like:",
} as const;

export function tierOf(level: number): Tier {
  if (level >= 8) return 4;
  if (level >= 5) return 3;
  if (level >= 2) return 2;
  return 1;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
