// The theme is a per-device preference, stored apart from characters so it never reaches exports or migrations.
// The inline script in index.html repeats resolveTheme so the right theme is set before first paint.
import { getStorage } from "./storage";

export const THEME_KEY = "dh:ui:theme";
export const THEME_PREFS = ["system", "light", "dark"] as const;
export type ThemePref = (typeof THEME_PREFS)[number];

export function readThemePref(storage: Storage | null = getStorage()): ThemePref {
  try {
    const raw = storage?.getItem(THEME_KEY);
    return THEME_PREFS.find((p) => p === raw) ?? "system";
  } catch {
    return "system";
  }
}

export function saveThemePref(pref: ThemePref, storage: Storage | null = getStorage()) {
  try {
    storage?.setItem(THEME_KEY, pref);
  } catch {
    /* ignore */
  }
}

export function resolveTheme(pref: ThemePref, systemDark: boolean): "light" | "dark" {
  if (pref === "system") return systemDark ? "dark" : "light";
  return pref;
}
