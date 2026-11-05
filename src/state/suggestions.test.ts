import { describe, expect, it } from "vitest";
import { createCharacter } from "./character";
import {
  applyClass,
  applySuggestedTraits,
  effectiveValue,
  equipFromInventory,
  isOverridden,
  resetField,
  selectArmor,
  selectWeapon,
  setField,
  setTrait,
  suggestedHeritage,
  suggestedInventoryLines,
} from "./suggestions";
import { thresholds } from "./derive";

const fresh = () => createCharacter("guardian", "t");

describe("a new Guardian", () => {
  it("is pre-filled from the class suggestions", () => {
    const c = fresh();
    expect(c.subclassId).toBe("stalwart");
    expect(c.traits).toEqual({ agility: 1, strength: 2, finesse: -1, instinct: 0, presence: 1, knowledge: 0 });
    expect(c.weaponIds).toEqual({ primary: "battleaxe", secondary: null });
    expect(c.armorId).toBe("chainmail-armor");
  });
  it("fills the weapon and armor blocks from the catalogues", () => {
    const c = fresh();
    expect(effectiveValue(c, "weapon.primary.name")).toBe("Battleaxe");
    expect(effectiveValue(c, "weapon.primary.traitRange")).toBe("Strength Melee");
    expect(effectiveValue(c, "weapon.primary.damage")).toBe("d10+3 phy");
    expect(effectiveValue(c, "weapon.primary.feature")).toBe("Two-Handed");
    expect(effectiveValue(c, "armor.name")).toBe("Chainmail Armor");
    expect(effectiveValue(c, "armor.baseMinor")).toBe(7);
    expect(effectiveValue(c, "armor.baseMajor")).toBe(15);
    expect(effectiveValue(c, "armor.score")).toBe(4);
    expect(effectiveValue(c, "armor.feature")).toBe("Heavy: -1 to Evasion");
  });
});

describe("overrides", () => {
  it("survive an armor change and can be reset", () => {
    let c = setField(fresh(), "armor.feature", "Heavy, but patched");
    expect(isOverridden(c, "armor.feature")).toBe(true);
    c = selectArmor(c, "leather-armor");
    expect(effectiveValue(c, "armor.feature")).toBe("Heavy, but patched");
    expect(effectiveValue(c, "armor.name")).toBe("Leather Armor");
    c = resetField(c, "armor.feature");
    expect(effectiveValue(c, "armor.feature")).toBe("");
  });
  it("drop themselves when set back to the suggested value", () => {
    const c = setField(setField(fresh(), "armor.name", "Mine"), "armor.name", "Chainmail Armor");
    expect(isOverridden(c, "armor.name")).toBe(false);
  });
  it("feed derived numbers", () => {
    const c = setField(fresh(), "armor.baseMinor", 10);
    expect(thresholds(c).minor).toBe(11);
  });
});

describe("changing class", () => {
  it("keeps selections the user changed by hand", () => {
    let c = selectArmor(fresh(), "full-plate-armor");
    c = selectWeapon(c, "primary", "dagger");
    c = setTrait(c, "strength", 1);
    const next = applyClass(c, "guardian");
    expect(next.armorId).toBe("full-plate-armor");
    expect(next.weaponIds.primary).toBe("dagger");
    expect(next.traits.strength).toBe(1);
  });
  it("refreshes untouched selections", () => {
    const c = { ...fresh(), armorId: "leather-armor" };
    expect(applyClass(c, "guardian").armorId).toBe("chainmail-armor");
  });
  it("keeps field overrides and typed answers", () => {
    let c = setField(fresh(), "weapon.primary.name", "Family axe");
    c = { ...c, backgroundAnswers: { "A question from some class": "my answer" } };
    const next = applyClass(c, "guardian");
    expect(effectiveValue(next, "weapon.primary.name")).toBe("Family axe");
    expect(next.backgroundAnswers["A question from some class"]).toBe("my answer");
  });
  it("resets the subclass to the new class's first", () => {
    expect(applyClass({ ...fresh(), subclassId: "vengeance" }, "guardian").subclassId).toBe("stalwart");
  });
});

describe("traits", () => {
  it("applies suggested traits and clears the touched flag", () => {
    const c = applySuggestedTraits(setTrait(fresh(), "strength", -1));
    expect(c.traits.strength).toBe(2);
    expect(c.touched.traits).toBeUndefined();
  });
});

describe("weapons", () => {
  it("a Two-Handed primary clears the secondary and its overrides", () => {
    let c = selectWeapon(fresh(), "primary", "mace");
    c = selectWeapon(c, "secondary", "round-shield");
    c = setField(c, "weapon.secondary.feature", "mine");
    c = selectWeapon(c, "primary", "battleaxe");
    expect(c.weaponIds.secondary).toBeNull();
    expect(isOverridden(c, "weapon.secondary.feature")).toBe(false);
  });
  it("refuses a secondary while the primary is Two-Handed", () => {
    expect(selectWeapon(fresh(), "secondary", "round-shield").weaponIds.secondary).toBeNull();
  });
  it("equips an inventory weapon into a slot, one slot at a time", () => {
    let c = { ...fresh(), inventoryWeaponIds: ["dagger", null] as [string | null, string | null] };
    c = equipFromInventory(c, 0, "primary");
    expect(c.weaponIds.primary).toBe("dagger");
    expect(c.equippedFrom.primary).toBe(0);
    c = equipFromInventory(c, 0, "secondary");
    expect(c.equippedFrom).toEqual({ primary: null, secondary: 0 });
    c = equipFromInventory(c, 0, null);
    expect(c.equippedFrom).toEqual({ primary: null, secondary: null });
  });
});

describe("heritage and inventory", () => {
  it("composes heritage from ancestry and community, with optional mixed ancestry", () => {
    const c = { ...fresh(), ancestryId: "human", communityId: "highborne" };
    expect(suggestedHeritage(c)).toBe("Human Highborne");
    expect(suggestedHeritage({ ...c, ancestry2Id: "elf" })).toBe("Human-Elf Highborne");
    expect(effectiveValue(c, "heritage")).toBe("Human Highborne");
  });
  it("lists the starting items and chosen options", () => {
    const c = { ...fresh(), inventoryChoices: { "0": "a Minor Health Potion" } };
    expect(suggestedInventoryLines(c)).toEqual([
      "a torch, 50 feet of rope, basic supplies, a handful of gold",
      "a Minor Health Potion",
      "",
    ]);
  });
});
