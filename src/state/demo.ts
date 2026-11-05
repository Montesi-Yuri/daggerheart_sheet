// Dev-only fixture (loaded with ?demo in `npm run dev`) so layout work can be checked with a filled-in sheet.
import { createCharacter, type Character } from "./character";
import { applyClass, equipFromInventory, selectWeapon, setField } from "./suggestions";

export function demoCharacter(): Character {
  let c = createCharacter("guardian", "demo");
  c = {
    ...c,
    name: "Thorin Ironvow",
    pronouns: "he/him",
    ancestryId: "human",
    communityId: "highborne",
    level: 6,
    hope: 3,
    hpMarked: 3,
    stressMarked: 2,
    armorMarked: 1,
    classDie: 2,
    gold: { handfuls: 4, bags: 2, chest: 0 },
    inventoryChoices: { "0": "a Minor Health Potion", "1": "a secret key" },
    inventoryWeaponIds: ["dagger", "shortbow"],
    description: {
      clothes: { chips: ["weathered", "padded"], text: "" },
      eyes: { chips: ["fire"], text: "" },
      body: { chips: ["broad", "tall"], text: "scarred left arm" },
      skin: { chips: [], text: "sun-browned" },
      attitude: { chips: ["a captain"], text: "" },
    },
    backgroundAnswers: {
      "Who from your community did you fail to protect, and why do you still think of them?":
        "My little brother. I looked away at the harbour for one breath and the tide took him.",
    },
    connectionAnswers: { "How did I save your life the first time we met?": "Pulled you from the burning mill." },
  };
  c = { ...c, experiences: [...c.experiences.slice(0, 2), { id: "e3", name: "Sworn shield" }, { id: "e4", name: "Harbour kid" }] };
  c.experiences[0] = { ...c.experiences[0]!, name: "Former city watch" };
  c.experiences[1] = { ...c.experiences[1]!, name: "Never leaves an ally behind" };
  c = {
    ...c,
    levelUps: {
      ...c.levelUps,
      "2": { ...c.levelUps["2"], hp: 1, evasion: true, traits: [{ traits: ["strength", "presence"], atLevel: 2 }] },
      "3": { ...c.levelUps["3"], stress: 1, experience: [["e3", "e4"]] },
    },
  };
  c = applyClass(c, "guardian");
  c = selectWeapon(c, "primary", "mace");
  c = selectWeapon(c, "secondary", "round-shield");
  c = setField(c, "weapon.primary.feature", "Blessed by the old temple smith, it rings when oathbreakers stand near.");
  c = equipFromInventory(c, 0, null);
  return c;
}
