import { z } from "zod";

export const TRAITS = ["agility", "strength", "finesse", "instinct", "presence", "knowledge"] as const;
export const TraitSchema = z.enum(TRAITS);
export type Trait = z.infer<typeof TraitSchema>;

export const FeatureSchema = z.object({ name: z.string(), text: z.string() });
export type Feature = z.infer<typeof FeatureSchema>;

export const NamedOptionSchema = z.object({ id: z.string(), name: z.string() });
export type NamedOption = z.infer<typeof NamedOptionSchema>;

/** Numeric effects of a catalogue item (armor or weapon) on derived stats. */
export const ModifiersSchema = z.object({
  evasion: z.number().optional(),
  armorScore: z.number().optional(),
  agility: z.number().optional(),
  strength: z.number().optional(),
  finesse: z.number().optional(),
  instinct: z.number().optional(),
  presence: z.number().optional(),
  knowledge: z.number().optional(),
});
export type Modifiers = z.infer<typeof ModifiersSchema>;

export const WeaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.number().int().min(1).max(4),
  slot: z.enum(["primary", "secondary"]),
  trait: TraitSchema,
  range: z.string(),
  damage: z.string(),
  burden: z.enum(["One-Handed", "Two-Handed"]),
  features: z.array(FeatureSchema),
  modifiers: ModifiersSchema,
});
export type Weapon = z.infer<typeof WeaponSchema>;

export const ArmorSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.number().int().min(1).max(4),
  thresholds: z.tuple([z.number(), z.number()]),
  score: z.number().int(),
  features: z.array(FeatureSchema),
  modifiers: ModifiersSchema,
});
export type Armor = z.infer<typeof ArmorSchema>;

export const DieTrackerSchema = z.object({
  type: z.literal("die"),
  /** Keys are the level at which the die takes that size, e.g. { "1": 4, "5": 6 }. */
  sidesByLevel: z.record(z.string().regex(/^\d+$/), z.number().int().positive()),
});
export type DieTracker = z.infer<typeof DieTrackerSchema>;

export const ClassFeatureSchema = z.object({
  name: z.string(),
  /** Light markup: *italic*, **bold**, paragraphs split on blank lines, "- " bullet lines. */
  text: z.string(),
  tracker: DieTrackerSchema.optional(),
});
export type ClassFeature = z.infer<typeof ClassFeatureSchema>;

export const SubclassSchema = z.object({
  id: z.string(),
  name: z.string(),
  spellcastTrait: TraitSchema.nullable().optional(),
  foundation: z.array(FeatureSchema),
  specialization: z.array(FeatureSchema),
  mastery: z.array(FeatureSchema),
});
export type SubclassDefinition = z.infer<typeof SubclassSchema>;

export const DESCRIPTION_KEYS = ["clothes", "eyes", "body", "skin", "attitude"] as const;
export type DescriptionKey = (typeof DESCRIPTION_KEYS)[number];

export const ClassSchema = z.object({
  id: z.string(),
  name: z.string(),
  domains: z.tuple([z.string(), z.string()]),
  tagline: z.string(),
  startingEvasion: z.number().int(),
  startingHP: z.number().int(),
  startingStress: z.number().int(),
  /** Rendered as "<name>: Spend <cost> Hope to <text>" */
  hopeFeature: z.object({ name: z.string(), cost: z.number().int(), text: z.string() }),
  classFeatures: z.array(ClassFeatureSchema).min(1),
  subclasses: z.array(SubclassSchema).min(1),
  suggested: z.object({
    traits: z.record(TraitSchema, z.number().int()),
    primaryWeaponId: z.string(),
    secondaryWeaponId: z.string().optional(),
    armorId: z.string(),
  }),
  startingInventory: z.object({
    take: z.array(z.string()),
    /** Each inner array is one "choose between" group; the user picks one entry per group. */
    chooseOne: z.array(z.array(z.string())),
  }),
  descriptionOptions: z.object({
    clothes: z.array(z.string()),
    eyes: z.array(z.string()),
    body: z.array(z.string()),
    skin: z.array(z.string()),
    attitude: z.array(z.string()),
  }),
  backgroundQuestions: z.array(z.string()),
  connectionQuestions: z.array(z.string()),
});
export type ClassDefinition = z.infer<typeof ClassSchema>;
