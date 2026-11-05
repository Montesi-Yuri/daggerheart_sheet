// Export / import of characters as JSON files.
import { getClass } from "../data/classes";
import { CHARACTER_VERSION, migrateCharacter, newId, type Character } from "./character";

export const EXPORT_APP = "daggerheart-sheet";

export interface ExportFile {
  app: typeof EXPORT_APP;
  exportVersion: 1;
  exportedAt: string;
  /** Lets a build that lacks this class still show its name and domains. */
  classSnapshot: { name: string; domains: string[] } | null;
  character: Character;
}

export function exportCharacter(c: Character, now: Date = new Date()): string {
  const cls = getClass(c.classId);
  const file: ExportFile = {
    app: EXPORT_APP,
    exportVersion: 1,
    exportedAt: now.toISOString(),
    classSnapshot: cls ? { name: cls.name, domains: [...cls.domains] } : c.classNameSnapshot ? { name: c.classNameSnapshot, domains: [] } : null,
    character: c,
  };
  return JSON.stringify(file, null, 2);
}

export function exportFileName(c: Character): string {
  const base = (c.name || "character").trim().replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "") || "character";
  return `${base}.daggerheart.json`;
}

export type ImportResult = { ok: true; character: Character; warnings: string[] } | { ok: false; error: string };

/**
 * Validate a JSON file and turn it into a new character. The result always gets a fresh id and an
 * "(imported)" name, so importing never overwrites an existing character.
 */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn’t valid JSON. Pick a file exported from this app." };
  }
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "That file doesn’t contain a character." };
  const obj = raw as Record<string, unknown>;
  const enveloped = obj.app === EXPORT_APP && typeof obj.character === "object";
  if (!enveloped && "app" in obj && obj.app !== EXPORT_APP) {
    return { ok: false, error: `That file was made by “${String(obj.app)}”, not by this app.` };
  }
  const payload = enveloped ? obj.character : raw;
  const migrated = migrateCharacter(payload);
  if (!migrated.ok) return { ok: false, error: `This character file can’t be loaded: ${migrated.error}` };

  const warnings: string[] = [];
  let character = migrated.character;
  if (!getClass(character.classId)) {
    const snapshot = enveloped ? (obj.classSnapshot as ExportFile["classSnapshot"]) : null;
    const name = snapshot?.name ?? character.classNameSnapshot ?? character.classId;
    character = { ...character, classNameSnapshot: name };
    warnings.push(`This build doesn’t include the “${name}” class, so its features and questions can’t be shown. Your data is kept.`);
  }
  const now = Date.now();
  character = {
    ...character,
    id: newId(),
    version: CHARACTER_VERSION,
    name: `${character.name.trim() || "Unnamed"} (imported)`,
    createdAt: now,
    updatedAt: now,
  };
  return { ok: true, character, warnings };
}
