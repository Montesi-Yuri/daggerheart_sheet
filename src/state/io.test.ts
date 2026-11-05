import { describe, expect, it } from "vitest";
import { createCharacter } from "./character";
import { exportCharacter, exportFileName, parseImport } from "./io";

describe("export and import", () => {
  const original = { ...createCharacter("guardian", "orig"), name: "Mira Vale", level: 4 };

  it("round-trips as a copy with a new id and an imported name", () => {
    const result = parseImport(exportCharacter(original));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.character.id).not.toBe("orig");
    expect(result.character.name).toBe("Mira Vale (imported)");
    expect(result.character.level).toBe(4);
    expect(result.character.traits).toEqual(original.traits);
    expect(result.warnings).toEqual([]);
  });
  it("accepts a bare character without the export envelope", () => {
    expect(parseImport(JSON.stringify(original)).ok).toBe(true);
  });
  it("gives friendly errors", () => {
    const bad = (text: string) => {
      const r = parseImport(text);
      expect(r.ok).toBe(false);
      return r.ok ? "" : r.error;
    };
    expect(bad("not json")).toMatch(/valid JSON/);
    expect(bad("42")).toMatch(/doesn’t contain a character/);
    expect(bad(JSON.stringify({ app: "other-tool", character: {} }))).toMatch(/other-tool/);
    expect(bad(JSON.stringify({ ...original, level: 99 }))).toMatch(/level/);
    expect(bad(JSON.stringify({ ...original, version: 999 }))).toMatch(/newer version/);
  });
  it("keeps a character of an unknown class and warns", () => {
    const stranger = { ...original, classId: "wizard-of-oz" };
    const file = JSON.parse(exportCharacter(stranger));
    file.classSnapshot = { name: "Wizard", domains: ["Codex", "Arcana"] };
    const r = parseImport(JSON.stringify(file));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.character.classNameSnapshot).toBe("Wizard");
    expect(r.warnings[0]).toMatch(/Wizard/);
  });
  it("makes a safe file name", () => {
    expect(exportFileName({ ...original, name: "Mira / Vale?" })).toBe("Mira_Vale.daggerheart.json");
    expect(exportFileName({ ...original, name: "" })).toBe("character.daggerheart.json");
  });
});
