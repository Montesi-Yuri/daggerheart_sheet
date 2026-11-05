import { useEffect, useState } from "react";
import { readThemePref, resolveTheme, saveThemePref, THEME_PREFS, type ThemePref } from "../state/theme";

const LABELS: Record<ThemePref, string> = { system: "System", light: "Light", dark: "Dark" };

export function ThemeSelect() {
  const [pref, setPref] = useState<ThemePref>(() => readThemePref());

  useEffect(() => {
    const os = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(pref, os.matches);
    };
    apply();
    os.addEventListener("change", apply);
    return () => os.removeEventListener("change", apply);
  }, [pref]);

  return (
    <label className="theme-pick">
      Theme
      <select
        value={pref}
        onChange={(e) => {
          const next = e.target.value as ThemePref;
          setPref(next);
          saveThemePref(next);
        }}
      >
        {THEME_PREFS.map((p) => (
          <option key={p} value={p}>
            {LABELS[p]}
          </option>
        ))}
      </select>
    </label>
  );
}
