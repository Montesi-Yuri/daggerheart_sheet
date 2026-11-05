import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLASS_LIST } from "./data/classes";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe("data-driven architecture", () => {
  it("keeps class names and class text out of components", () => {
    const sources = [...files("src/components"), "src/App.tsx"].filter((f) => /\.(tsx?|css)$/.test(f));
    const banned = CLASS_LIST.flatMap((c) => [
      c.name,
      c.id,
      c.hopeFeature.name,
      ...c.subclasses.map((s) => s.name),
      ...c.classFeatures.map((f) => f.name),
    ]);
    for (const file of sources) {
      const text = readFileSync(file, "utf8").toLowerCase();
      for (const word of banned) {
        expect(text.includes(word.toLowerCase()), `${file} mentions "${word}"`).toBe(false);
      }
    }
  });
});
