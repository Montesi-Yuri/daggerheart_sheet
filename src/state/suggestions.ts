// Pure functions that compute suggested defaults from selections and resolve them against
// user overrides. A field is "overridden" when the user edited it by hand; selection changes then
// leave it alone and the UI offers "reset to suggested" instead.
import { ANCESTRIES } from "../data/ancestries";
import { COMMUNITIES } from "../data/communities";
import { getArmor, getWeapon } from "../data/catalog";
import { getClass } from "../data/classes";
import { capitalize } from "../data/common";
import { TRAITS, type Armor, type Weapon } from "../data/schema";
import type { Character, FieldValue } from "./character";

export type WeaponBlockKey = "name" | "traitRange" | "damage" | "feature";
export type WeaponBlockPrefix = "weapon.primary" | "weapon.secondary" | "invWeapon.0" | "invWeapon.1";

export const weaponPath = (prefix: WeaponBlockPrefix, key: WeaponBlockKey) => `${prefix}.${key}`;
export const inventoryLinePath = (i: number) => `inventory.line.${i}`;
export const HERITAGE_PATH = "heritage";

const join = (xs: (string | undefined)[], sep: string) => xs.filter((x): x is string => !!x).join(sep);

export function suggestedWeaponFields(w: Weapon | undefined): Record<WeaponBlockKey, string> {
  if (!w) return { name: "", traitRange: "", damage: "", feature: "" };
  const features = w.features.map((f) => `${f.name}: ${f.text}`);
  return {
    name: w.name,
    traitRange: `${capitalize(w.trait)} ${w.range}`,
    damage: w.damage,
    feature: join([w.burden === "Two-Handed" ? "Two-Handed" : undefined, ...features], ". "),
  };
}

export function suggestedArmorFields(a: Armor | undefined) {
  if (!a) return { name: "", baseMinor: "", baseMajor: "", score: "", feature: "" };
  return {
    name: a.name,
    baseMinor: a.thresholds[0],
    baseMajor: a.thresholds[1],
    score: a.score,
    feature: a.features.map((f) => `${f.name}: ${f.text}`).join(" "),
  };
}

export function suggestedHeritage(c: Character): string {
  const nameOf = (list: { id: string; name: string }[], id: string | null) => list.find((x) => x.id === id)?.name;
  const ancestry = join([nameOf(ANCESTRIES, c.ancestryId), nameOf(ANCESTRIES, c.ancestry2Id)], "-");
  return join([ancestry, nameOf(COMMUNITIES, c.communityId)], " ");
}

/** Starting-inventory text for the sheet's lines: the class's "take" list, then each chosen option. */
export function suggestedInventoryLines(c: Character): string[] {
  const cls = getClass(c.classId);
  if (!cls) return [];
  const lines = [join(cls.startingInventory.take, ", ")];
  cls.startingInventory.chooseOne.forEach((_, i) => lines.push(c.inventoryChoices[String(i)] ?? ""));
  return lines;
}

/** What a field would hold with no override, or undefined for a path that has no suggestion. */
export function suggestedValue(c: Character, path: string): FieldValue | undefined {
  if (path === HERITAGE_PATH) return suggestedHeritage(c);
  const parts = path.split(".");
  if (parts[0] === "weapon" || parts[0] === "invWeapon") {
    const key = parts[2] as WeaponBlockKey;
    const id = parts[0] === "weapon" ? c.weaponIds[parts[1] as "primary" | "secondary"] : c.inventoryWeaponIds[Number(parts[1])];
    return suggestedWeaponFields(getWeapon(id))[key];
  }
  if (parts[0] === "armor") {
    return suggestedArmorFields(getArmor(c.armorId))[parts[1] as "name"];
  }
  if (parts[0] === "inventory" && parts[1] === "line") {
    return suggestedInventoryLines(c)[Number(parts[2])] ?? "";
  }
  return undefined;
}

export function isOverridden(c: Character, path: string): boolean {
  return path in c.overrides;
}

/** Override if present, otherwise the suggestion, otherwise empty. */
export function effectiveValue(c: Character, path: string): FieldValue {
  return c.overrides[path] ?? suggestedValue(c, path) ?? "";
}

/** Manual edit. Typing back the suggested value removes the override. */
export function setField(c: Character, path: string, value: FieldValue): Character {
  const overrides = { ...c.overrides };
  if (String(value) === String(suggestedValue(c, path) ?? "")) delete overrides[path];
  else overrides[path] = value;
  return { ...c, overrides };
}

export function resetField(c: Character, path: string): Character {
  const overrides = { ...c.overrides };
  delete overrides[path];
  return { ...c, overrides };
}

function clearOverridesWithPrefix(overrides: Character["overrides"], prefix: string) {
  return Object.fromEntries(Object.entries(overrides).filter(([k]) => !k.startsWith(prefix)));
}

// --- Selections -----------------------------------------------------------------------------------

function withPrimary(c: Character, id: string | null): Character {
  let next: Character = { ...c, weaponIds: { ...c.weaponIds, primary: id }, equippedFrom: { ...c.equippedFrom, primary: null } };
  if (getWeapon(id)?.burden === "Two-Handed") {
    next = {
      ...next,
      weaponIds: { ...next.weaponIds, secondary: null },
      equippedFrom: { ...next.equippedFrom, secondary: null },
      overrides: clearOverridesWithPrefix(next.overrides, "weapon.secondary."),
    };
  }
  return next;
}

function withSecondary(c: Character, id: string | null): Character {
  if (id && getWeapon(c.weaponIds.primary)?.burden === "Two-Handed") return c;
  return { ...c, weaponIds: { ...c.weaponIds, secondary: id }, equippedFrom: { ...c.equippedFrom, secondary: null } };
}

/** User picks a weapon from the dropdown. A Two-Handed primary clears the secondary. */
export function selectWeapon(c: Character, slot: "primary" | "secondary", id: string | null): Character {
  const touched = { ...c.touched, [slot === "primary" ? "weaponPrimary" : "weaponSecondary"]: true };
  const next = slot === "primary" ? withPrimary(c, id) : withSecondary(c, id);
  return { ...next, touched };
}

export function selectArmor(c: Character, id: string | null): Character {
  return { ...c, armorId: id, touched: { ...c.touched, armor: true } };
}

export function setTrait(c: Character, trait: (typeof TRAITS)[number], value: number): Character {
  return { ...c, traits: { ...c.traits, [trait]: value }, touched: { ...c.touched, traits: true } };
}

export function applySuggestedTraits(c: Character): Character {
  const cls = getClass(c.classId);
  if (!cls) return c;
  const traits = { ...c.traits };
  for (const t of TRAITS) traits[t] = cls.suggested.traits[t] ?? 0;
  const touched = { ...c.touched };
  delete touched.traits;
  return { ...c, traits, touched };
}

/**
 * Switch class. Class-owned content (name, features, questions) follows automatically; selections
 * the user already changed by hand (traits, weapons, armor) are kept. The subclass resets to the
 * new class's first one. Answers are keyed by question text, so nothing the user wrote is lost.
 */
export function applyClass(c: Character, classId: string): Character {
  const cls = getClass(classId);
  let next: Character = { ...c, classId, classDie: 0 };
  if (!cls) return { ...next, subclassId: null };
  next = { ...next, subclassId: cls.subclasses[0]?.id ?? null };
  if (!c.touched.traits) next = applySuggestedTraits(next);
  if (!c.touched.weaponPrimary) next = withPrimary(next, cls.suggested.primaryWeaponId);
  if (!c.touched.weaponSecondary) next = withSecondary(next, cls.suggested.secondaryWeaponId ?? null);
  if (!c.touched.armor) next = { ...next, armorId: cls.suggested.armorId };
  return { ...next, inventoryChoices: {} };
}

export function selectSubclass(c: Character, subclassId: string | null): Character {
  return { ...c, subclassId };
}

/** Put an inventory weapon into an active slot (copies its fields); passing null unequips. */
export function equipFromInventory(c: Character, index: 0 | 1, slot: "primary" | "secondary" | null): Character {
  let next = c;
  // A weapon sits in at most one slot, and a slot holds at most one inventory weapon.
  for (const s of ["primary", "secondary"] as const) {
    if (next.equippedFrom[s] === index && s !== slot) {
      next = { ...next, equippedFrom: { ...next.equippedFrom, [s]: null } };
    }
  }
  if (slot === null) return next;
  const weaponId = next.inventoryWeaponIds[index];
  if (slot === "secondary" && isTwoHandedId(next.weaponIds.primary)) return next;
  const prefix = `weapon.${slot}.`;
  const overrides = clearOverridesWithPrefix(next.overrides, prefix);
  for (const key of ["name", "traitRange", "damage", "feature"] as const) {
    const o = next.overrides[`invWeapon.${index}.${key}`];
    if (o !== undefined) overrides[`${prefix}${key}`] = o;
  }
  next = { ...next, overrides };
  next = slot === "primary" ? withPrimary(next, weaponId) : withSecondary(next, weaponId);
  return {
    ...next,
    equippedFrom: { ...next.equippedFrom, [slot]: index },
    touched: { ...next.touched, [slot === "primary" ? "weaponPrimary" : "weaponSecondary"]: true },
  };
}

function isTwoHandedId(id: string | null): boolean {
  return getWeapon(id)?.burden === "Two-Handed";
}
