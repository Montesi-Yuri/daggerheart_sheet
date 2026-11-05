import { describe, expect, it } from "vitest";
import { ARMOR } from "./armor";
import { WEAPONS } from "./weapons";
import { CLASS_LIST } from "./classes";
import { ClassSchema } from "./schema";
import { getArmor, getWeapon } from "./catalog";

describe("game data", () => {
  it("has unique catalogue ids", () => {
    expect(new Set(ARMOR.map((a) => a.id)).size).toBe(ARMOR.length);
    expect(new Set(WEAPONS.map((w) => w.id)).size).toBe(WEAPONS.length);
  });
  it.each(CLASS_LIST.map((c) => [c.id, c] as const))("class %s is valid and references real gear", (_id, cls) => {
    expect(() => ClassSchema.parse(cls)).not.toThrow();
    expect(getArmor(cls.suggested.armorId)).toBeDefined();
    expect(getWeapon(cls.suggested.primaryWeaponId)).toBeDefined();
    if (cls.suggested.secondaryWeaponId) expect(getWeapon(cls.suggested.secondaryWeaponId)).toBeDefined();
  });
});
