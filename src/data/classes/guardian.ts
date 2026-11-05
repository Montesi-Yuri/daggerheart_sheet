import { ClassSchema, type ClassDefinition } from "../schema";

// Class content from the Guardian character sheet; subclass features from the Daggerheart SRD 1.0
// (Darrington Press, DPCGL). Entries marked TODO(verify) were paraphrased from a web copy of the SRD
// and should be checked against the book before being treated as exact rules text.
const guardian: ClassDefinition = {
  id: "guardian",
  name: "Guardian",
  domains: ["Valor", "Blade"],
  tagline:
    "As a guardian, you run into danger to protect your party, keeping watch over those who might not survive without you there.",
  startingEvasion: 9,
  startingHP: 7,
  startingStress: 6,
  hopeFeature: { name: "Frontline Tank", cost: 3, text: "clear 2 Armor Slots." },
  classFeatures: [
    {
      name: "Unstoppable",
      text: [
        "Once per long rest, you can become *Unstoppable*. You gain an Unstoppable Die. At level 1, your Unstoppable Die is a **d4**. Place it on this sheet in the space provided, starting with the 1 value facing up. After you make a damage roll that deals 1 or more Hit Points to a target, increase the Unstoppable Die value by one. When the die’s value would exceed its maximum value or when the scene ends, remove the die and drop out of *Unstoppable*. At level 5, your Unstoppable Die increases to a **d6**.",
        "While *Unstoppable*, you gain the following benefits:",
        "- You reduce the severity of physical damage by one threshold (Severe to Major, Major to Minor, Minor to None).\n- You add the current value of the Unstoppable Die to your damage roll.\n- You can’t be *Restrained* or *Vulnerable*.",
      ].join("\n\n"),
      tracker: { type: "die", sidesByLevel: { "1": 4, "5": 6 } },
    },
  ],
  subclasses: [
    {
      id: "stalwart",
      name: "Stalwart",
      spellcastTrait: null,
      foundation: [
        { name: "Unwavering", text: "Gain a permanent +1 bonus to your damage thresholds." },
        // TODO(verify): exact wording of Iron Will.
        {
          name: "Iron Will",
          text: "When you take physical damage, you can mark an additional Armor Slot to reduce the severity.",
        },
      ],
      specialization: [
        { name: "Unrelenting", text: "Gain a permanent +2 bonus to your damage thresholds." },
        {
          name: "Partners-in-Arms",
          text: "When an ally within Very Close range takes damage, you can mark an Armor Slot to reduce the severity by one threshold.",
        },
      ],
      mastery: [
        { name: "Undaunted", text: "Gain a permanent +3 bonus to your damage thresholds." },
        // TODO(verify): exact wording of Loyal Protector.
        {
          name: "Loyal Protector",
          text: "When an ally within Close range has 2 or fewer Hit Points and would take damage, you can mark a Stress to sprint to their side and take the damage instead.",
        },
      ],
    },
    {
      id: "vengeance",
      name: "Vengeance",
      spellcastTrait: null,
      foundation: [
        { name: "At Ease", text: "Gain an additional Stress slot." },
        {
          name: "Revenge",
          text: "When an adversary within Melee range succeeds on an attack against you, you can mark 2 Stress to force the attacker to mark a Hit Point.",
        },
      ],
      specialization: [
        {
          name: "Act of Reprisal",
          text: "When an adversary damages an ally within Melee range, you gain a +1 bonus to your Proficiency for the next successful attack you make against that adversary.",
        },
        // TODO: the SRD lists a single Specialization feature for Vengeance; add a second only if the book has one.
      ],
      mastery: [
        // TODO(verify): exact wording of Nemesis.
        {
          name: "Nemesis",
          text: "Spend 2 Hope to Prioritize an adversary until your next rest. When you make an attack against your Prioritized adversary, you can swap the results of your Hope and Fear Dice. You can only Prioritize one adversary at a time.",
        },
      ],
    },
  ],
  suggested: {
    traits: { agility: 1, strength: 2, finesse: -1, instinct: 0, presence: 1, knowledge: 0 },
    primaryWeaponId: "battleaxe",
    armorId: "chainmail-armor",
  },
  startingInventory: {
    take: ["a torch", "50 feet of rope", "basic supplies", "a handful of gold"],
    chooseOne: [
      ["a Minor Health Potion", "a Minor Stamina Potion"],
      ["a totem from your mentor", "a secret key"],
    ],
  },
  descriptionOptions: {
    clothes: ["casual", "intricate", "loose", "padded", "royal", "tactical", "weathered"],
    eyes: ["carnations", "earth", "endless ocean", "fire", "ivy", "lilacs", "night", "seafoam", "winter"],
    body: ["broad", "carved", "curvy", "lanky", "rotund", "short", "stocky", "tall", "thin", "tiny", "toned"],
    skin: ["ashes", "clover", "falling snow", "fine sand", "obsidian", "rose", "sapphire", "wisteria"],
    attitude: ["a captain", "a caretaker", "an elephant", "a general", "a wrestler"],
  },
  backgroundQuestions: [
    "Who from your community did you fail to protect, and why do you still think of them?",
    "You’ve been tasked with protecting something important and delivering it somewhere dangerous. What is it, and where does it need to go?",
    "You consider an aspect of yourself to be a weakness. What is it, and how has it affected you?",
  ],
  connectionQuestions: [
    "How did I save your life the first time we met?",
    "What small gift did you give me that you notice I always carry with me?",
    "What lie have you told me about yourself that I absolutely believe?",
  ],
};

export default ClassSchema.parse(guardian);
