import { describe, expect, it } from "vitest";
import { CHARACTER_VERSION, createCharacter, migrateCharacter } from "./character";
import { loadAll, saveCharacter, saveIndex } from "./storage";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
}

describe("storage", () => {
  it("round-trips characters and the current selection", () => {
    const s = new MemoryStorage();
    const a = createCharacter("guardian", "a");
    const b = createCharacter("guardian", "b");
    saveCharacter(a, s);
    saveCharacter(b, s);
    saveIndex({ order: ["a", "b"], currentId: "b" }, s);
    const loaded = loadAll(s);
    expect(loaded.characters.map((c) => c.id)).toEqual(["a", "b"]);
    expect(loaded.currentId).toBe("b");
    expect(loaded.characters[0]).toEqual(a);
  });
  it("quarantines a character that fails validation instead of deleting it", () => {
    const s = new MemoryStorage();
    s.setItem("dh:char:bad", JSON.stringify({ id: "bad", version: 1, name: 5 }));
    s.setItem("dh:char:junk", "{not json");
    const loaded = loadAll(s);
    expect(loaded.characters).toEqual([]);
    expect(loaded.quarantined.map((q) => q.id).sort()).toEqual(["bad", "junk"]);
    expect(s.getItem("dh:quarantine:bad")).not.toBeNull();
    expect(s.getItem("dh:char:bad")).toBeNull();
  });
  it("recovers characters missing from the index", () => {
    const s = new MemoryStorage();
    saveCharacter(createCharacter("guardian", "lost"), s);
    expect(loadAll(s).characters.map((c) => c.id)).toEqual(["lost"]);
  });
});

describe("migrations", () => {
  it("accepts the current version", () => {
    const c = createCharacter("guardian", "x");
    expect(c.version).toBe(CHARACTER_VERSION);
    expect(migrateCharacter(JSON.parse(JSON.stringify(c)))).toEqual({ ok: true, character: c });
  });
  it("rejects a newer version with a friendly message", () => {
    const result = migrateCharacter({ ...createCharacter("guardian", "x"), version: CHARACTER_VERSION + 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/newer version/);
  });
  it("rejects non-objects and malformed characters", () => {
    expect(migrateCharacter("hi").ok).toBe(false);
    expect(migrateCharacter({ version: 1 }).ok).toBe(false);
  });
});
