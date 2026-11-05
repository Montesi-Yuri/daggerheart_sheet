import { ARMOR } from "./armor";
import { WEAPONS } from "./weapons";
import type { Armor, Weapon } from "./schema";

const ARMOR_BY_ID = new Map<string, Armor>(ARMOR.map((a) => [a.id, a]));
const WEAPON_BY_ID = new Map<string, Weapon>(WEAPONS.map((w) => [w.id, w]));

export function getArmor(id: string | null | undefined): Armor | undefined {
  return id ? ARMOR_BY_ID.get(id) : undefined;
}
export function getWeapon(id: string | null | undefined): Weapon | undefined {
  return id ? WEAPON_BY_ID.get(id) : undefined;
}
