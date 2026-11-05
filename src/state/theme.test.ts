import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readThemePref, resolveTheme, saveThemePref, THEME_KEY } from "./theme";

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  } as unknown as Storage;
}

describe("theme preference", () => {
  it("defaults to system when nothing valid is stored", () => {
    expect(readThemePref(fakeStorage())).toBe("system");
    expect(readThemePref(fakeStorage({ [THEME_KEY]: "sepia" }))).toBe("system");
    expect(readThemePref(null)).toBe("system");
  });

  it("round-trips a saved choice", () => {
    const storage = fakeStorage();
    saveThemePref("dark", storage);
    expect(readThemePref(storage)).toBe("dark");
  });

  it("follows the OS only for system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("uses the same storage key in the pre-paint script", () => {
    expect(readFileSync("index.html", "utf8")).toContain(`"${THEME_KEY}"`);
  });
});
