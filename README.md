# Daggerheart Character Sheet

An editable form plus a live, clickable recreation of the official two-page Daggerheart character sheet. Guardian ships first; every other class is a data file away.

- Vite + React + TypeScript (strict), Zustand, Zod. No backend: characters live in `localStorage`.
- The sheet is drawn with HTML/CSS/SVG (no raster copy of the PDF) at US Letter proportions.
- English only.

## Run, test, build

```bash
npm install
npm run dev            # dev server. Add ?demo to the URL to load a filled-in sample character (dev only)
npm test               # Vitest unit tests
npm run build          # type-check + static site in dist/
npm run build:single   # one self-contained file: dist-single/index.html (fonts and code inlined)
```

Use **Print / Save PDF** in the toolbar for paper or PDF output. The print stylesheet hides all app chrome and prints the two pages one per US Letter page with exact colours. If your browser drops the grey fills, tick "Background graphics" in its print dialog.

Deep links: `?view=p1|p2|stacked` and `?zoom=fit|full` choose the preview mode.

## What it does

- **Form (left, ~40%)**: accordion sections in sheet order. **Preview (right, ~60%)**: both pages, scaled to fit. Below 900px the app shows Edit / Sheet tabs.
- **Click the sheet to play**: HP, Stress and Armor slots, Hope pips, gold (handfuls, bags, chest), trait marks, the class die and the level-up boxes all update the same store as the form.
- **Suggestions with overrides**: picking a class, subclass, weapon, armor, ancestry or community pre-fills everything that depends on it. Once you edit a field by hand it becomes an *override*: later selection changes leave it alone and a ↺ button restores the suggestion.
- **Derived, never stored twice**: thresholds, Proficiency, Evasion, armor/HP/Stress slots, Experience bonuses, trait marks and class-die size are computed in `src/state/derive.ts`. Manual `adjustments` cover homebrew and magic items.
- **Theme**: System, Light or Dark from the toolbar, remembered per device and never stored in a character. Dark mode covers the app and the on-screen sheet; print and PDF output always use the light sheet. All colours are tokens in `src/theme.css`, and a test rejects literal colours under `src/components/sheet`.
- **Characters**: several characters in `localStorage`, autosaved (debounced), export/import as JSON. Importing always creates a copy and never overwrites. A saved character that fails validation is quarantined (kept, downloadable) instead of deleted.

## Layout of the code

```
src/
  data/       game data + Zod schemas. classes/guardian.ts holds ALL Guardian content.
              armor.ts / weapons.ts / ancestries.ts / communities.ts are shared catalogues.
              common.ts: tiers, level-up options, tier achievements, shared limits.
  state/      character.ts (type, Zod schema, defaults, migrations)   derive.ts (pure derived values)
              suggestions.ts (suggested values, overrides)   actions.ts (pure mutators)
              store.ts + storage.ts (Zustand, localStorage, autosave)   io.ts (JSON export/import)
  components/ form/ (one component per section)   sheet/ (Page1, Page2, primitives/)   Toolbar, Preview
```

No component mentions a class: `src/architecture.test.ts` fails if a class name or class text appears under `src/components`.

## How to add a new class

1. Copy `src/data/classes/guardian.ts` to `src/data/classes/<yourclass>.ts` and fill in the data: name, domains, tagline, starting Evasion / HP / Stress, Hope feature, class feature (with an optional die tracker), subclasses, suggested traits and gear, starting inventory, description options, and the background and connection questions.
2. Register it in `src/data/classes/index.ts`: import it and add it to `CLASSES`.

That's all. The class appears in the dropdown, filters its subclasses, and the sheets, suggestions and questions all follow from the data. Notes:

- `suggested.primaryWeaponId`, `secondaryWeaponId` and `armorId` must be ids from `src/data/weapons.ts` / `src/data/armor.ts` (a test checks this).
- Class and subclass text uses light markup: `*italic*`, `**bold**`, blank-line paragraphs and `- ` bullets.
- Optional: domain emblems for the page header live in `DOMAIN_GLYPHS` in `src/components/sheet/primitives/Icons.tsx`. Unknown domains fall back to a diamond with their initial.

## Saved-data versions

Every character carries a `version`. To change the shape of `CharacterSchema`, bump `CHARACTER_VERSION` in `src/state/character.ts` and add a `MIGRATIONS[oldVersion]` function that upgrades old data to the next version.

## Known limits and notes

- Subclass features that grant numbers (for example Stalwart's +1/+2/+3 thresholds, Vengeance's extra Stress slot) are shown as text but not applied automatically. Use the manual adjustments in the Defense and Damage & Health sections.
- Entries marked `TODO(verify)` in `guardian.ts` were paraphrased from a web copy of the SRD. Check them against the book.
- Proficiency and Multiclass level-up boxes are double boxes on the sheet and cost two of a level's two picks. Per-level pick limits only warn; the box counts per tier are hard limits.
- Domain cards, companions and beastforms are not tracked.

## Attribution

Weapon, armor, ancestry and community data and the Guardian subclass text come from the Daggerheart System Reference Document 1.0. Daggerheart © Darrington Press 2025, used under the Darrington Press Community Gaming License. This project is not affiliated with or endorsed by Darrington Press.
