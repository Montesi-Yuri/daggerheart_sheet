import { z } from "zod";
import { DESCRIPTION_KEYS, TRAITS, TraitSchema, type DescriptionKey, type Trait } from "../data/schema";
import { DEFAULT_CLASS_ID } from "../data/classes";
import { applyClass } from "./suggestions";

export const CHARACTER_VERSION = 1;

const FieldValueSchema = z.union([z.string(), z.number()]);
export type FieldValue = z.infer<typeof FieldValueSchema>;

const TraitMapSchema = z.object({
  agility: z.number().int(),
  strength: z.number().int(),
  finesse: z.number().int(),
  instinct: z.number().int(),
  presence: z.number().int(),
  knowledge: z.number().int(),
});

const TierPicksSchema = z.object({
  /** One entry per ticked box; each box raises two traits. `atLevel` decides when the marks get cleared. */
  traits: z.array(z.object({ traits: z.array(TraitSchema).max(2), atLevel: z.number().int() })).max(3),
  hp: z.number().int().min(0).max(2),
  stress: z.number().int().min(0).max(2),
  /** One entry per ticked box: the (up to two) experience ids that get +1. */
  experience: z.array(z.array(z.string()).max(2)).max(1),
  domain: z.boolean(),
  evasion: z.boolean(),
  subclass: z.boolean(),
  proficiency: z.boolean(),
  multiclass: z.boolean(),
});
export type TierPicks = z.infer<typeof TierPicksSchema>;

const DescriptionLineSchema = z.object({ chips: z.array(z.string()), text: z.string() });
const CustomQuestionSchema = z.object({ question: z.string(), answer: z.string() }).nullable();

const SlotSchema = z.object({ primary: z.string().nullable(), secondary: z.string().nullable() });

export const CharacterSchema = z.object({
  version: z.number().int(),
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),

  name: z.string(),
  pronouns: z.string(),
  classId: z.string(),
  /** Display name kept so a character of an unknown (not installed) class still renders. */
  classNameSnapshot: z.string().optional(),
  subclassId: z.string().nullable(),
  ancestryId: z.string().nullable(),
  ancestry2Id: z.string().nullable(),
  communityId: z.string().nullable(),
  level: z.number().int().min(1).max(10),

  /** Creation spread only; level-up picks and gear modifiers are added in derive.ts. */
  traits: TraitMapSchema,
  traitMarkOverrides: z.partialRecord(TraitSchema, z.boolean()),
  adjustments: z.object({
    evasion: z.number().int(),
    minor: z.number().int(),
    major: z.number().int(),
    armorScore: z.number().int(),
    hp: z.number().int(),
    stress: z.number().int(),
    proficiency: z.number().int(),
  }),

  hpMarked: z.number().int().min(0),
  stressMarked: z.number().int().min(0),
  armorMarked: z.number().int().min(0),
  hope: z.number().int().min(0).max(6),
  experiences: z.array(z.object({ id: z.string(), name: z.string() })).max(5),

  weaponIds: SlotSchema,
  /** Inventory weapon index each active slot was equipped from, if any. */
  equippedFrom: z.object({ primary: z.number().int().nullable(), secondary: z.number().int().nullable() }),
  armorId: z.string().nullable(),
  inventoryWeaponIds: z.tuple([z.string().nullable(), z.string().nullable()]),
  inventoryChoices: z.record(z.string(), z.string()),
  gold: z.object({ handfuls: z.number().int().min(0), bags: z.number().int().min(0), chest: z.number().int().min(0).max(1) }),
  classDie: z.number().int().min(0),

  description: z.object({
    clothes: DescriptionLineSchema,
    eyes: DescriptionLineSchema,
    body: DescriptionLineSchema,
    skin: DescriptionLineSchema,
    attitude: DescriptionLineSchema,
  }),
  /** Answers are keyed by question text so they survive a class change. */
  backgroundAnswers: z.record(z.string(), z.string()),
  connectionAnswers: z.record(z.string(), z.string()),
  customQuestions: z.object({
    background: z.tuple([CustomQuestionSchema, CustomQuestionSchema, CustomQuestionSchema]),
    connections: z.tuple([CustomQuestionSchema, CustomQuestionSchema, CustomQuestionSchema]),
  }),
  levelUps: z.object({ "2": TierPicksSchema, "3": TierPicksSchema, "4": TierPicksSchema }),

  /** Manual edits of suggested fields, keyed by field path (see suggestions.ts). */
  overrides: z.record(z.string(), FieldValueSchema),
  /** Selections the user changed by hand; class changes leave these alone. */
  touched: z.object({
    traits: z.boolean().optional(),
    weaponPrimary: z.boolean().optional(),
    weaponSecondary: z.boolean().optional(),
    armor: z.boolean().optional(),
  }),
});

export type Character = z.infer<typeof CharacterSchema>;
export type TierKey = "2" | "3" | "4";

export function emptyTierPicks(): TierPicks {
  return {
    traits: [],
    hp: 0,
    stress: 0,
    experience: [],
    domain: false,
    evasion: false,
    subclass: false,
    proficiency: false,
    multiclass: false,
  };
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createCharacter(classId: string = DEFAULT_CLASS_ID, id: string = newId()): Character {
  const now = Date.now();
  const blankTraits = Object.fromEntries(TRAITS.map((t) => [t, 0])) as Record<Trait, number>;
  const blank: Character = {
    version: CHARACTER_VERSION,
    id,
    createdAt: now,
    updatedAt: now,
    name: "",
    pronouns: "",
    classId,
    subclassId: null,
    ancestryId: null,
    ancestry2Id: null,
    communityId: null,
    level: 1,
    traits: blankTraits,
    traitMarkOverrides: {},
    adjustments: { evasion: 0, minor: 0, major: 0, armorScore: 0, hp: 0, stress: 0, proficiency: 0 },
    hpMarked: 0,
    stressMarked: 0,
    armorMarked: 0,
    hope: 2,
    experiences: [
      { id: newId(), name: "" },
      { id: newId(), name: "" },
    ],
    weaponIds: { primary: null, secondary: null },
    equippedFrom: { primary: null, secondary: null },
    armorId: null,
    inventoryWeaponIds: [null, null],
    inventoryChoices: {},
    gold: { handfuls: 1, bags: 0, chest: 0 },
    classDie: 0,
    description: Object.fromEntries(DESCRIPTION_KEYS.map((k) => [k, { chips: [] as string[], text: "" }])) as unknown as Record<
      DescriptionKey,
      { chips: string[]; text: string }
    >,
    backgroundAnswers: {},
    connectionAnswers: {},
    customQuestions: { background: [null, null, null], connections: [null, null, null] },
    levelUps: { "2": emptyTierPicks(), "3": emptyTierPicks(), "4": emptyTierPicks() },
    overrides: {},
    touched: {},
  };
  return applyClass(blank, classId);
}

// --- Migrations -------------------------------------------------------------------------------
// Each entry upgrades a saved character from version N to N+1. Add one whenever CharacterSchema
// changes shape, and bump CHARACTER_VERSION.
export const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {};

export function migrateCharacter(raw: unknown): { ok: true; character: Character } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, error: "Not a character object." };
  let data = { ...(raw as Record<string, unknown>) };
  let version = typeof data.version === "number" ? data.version : 1;
  if (version > CHARACTER_VERSION) {
    return {
      ok: false,
      error: `Saved with a newer version of the app (v${version}); this build understands up to v${CHARACTER_VERSION}.`,
    };
  }
  while (version < CHARACTER_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return { ok: false, error: `No migration from version ${version}.` };
    data = step(data);
    version += 1;
    data.version = version;
  }
  const parsed = CharacterSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };
  return { ok: true, character: parsed.data };
}

export function formatZodError(err: z.ZodError): string {
  return err.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}
