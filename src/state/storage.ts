// localStorage layout: dh:index = { order, currentId }, dh:char:<id> = one Character each.
// A character that fails migration or validation is moved to dh:quarantine:<id>, never deleted.
import { migrateCharacter, type Character } from "./character";

const INDEX_KEY = "dh:index";
const charKey = (id: string) => `dh:char:${id}`;
const quarantineKey = (id: string) => `dh:quarantine:${id}`;

export interface StoredIndex {
  order: string[];
  currentId: string | null;
}
export interface Quarantined {
  id: string;
  raw: string;
  error: string;
}
export interface Loaded {
  characters: Character[];
  currentId: string | null;
  quarantined: Quarantined[];
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readIndex(storage: Storage): StoredIndex {
  try {
    const raw = JSON.parse(storage.getItem(INDEX_KEY) ?? "null") as Partial<StoredIndex> | null;
    if (raw && Array.isArray(raw.order)) {
      return { order: raw.order.filter((x): x is string => typeof x === "string"), currentId: raw.currentId ?? null };
    }
  } catch {
    /* fall through to a rebuilt index */
  }
  return { order: [], currentId: null };
}

export function loadAll(storage: Storage | null = getStorage()): Loaded {
  if (!storage) return { characters: [], currentId: null, quarantined: [] };
  const index = readIndex(storage);
  // Also pick up characters whose index entry was lost.
  const ids = new Set(index.order);
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith("dh:char:")) ids.add(key.slice("dh:char:".length));
  }
  const characters: Character[] = [];
  const quarantined: Quarantined[] = [];
  for (const id of ids) {
    const raw = storage.getItem(charKey(id));
    if (raw === null) continue;
    let error = "";
    try {
      const result = migrateCharacter(JSON.parse(raw));
      if (result.ok) {
        characters.push(result.character);
        continue;
      }
      error = result.error;
    } catch (e) {
      error = e instanceof Error ? e.message : "Unreadable JSON.";
    }
    storage.setItem(quarantineKey(id), raw);
    storage.removeItem(charKey(id));
    quarantined.push({ id, raw, error });
  }
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith("dh:quarantine:") && !quarantined.some((q) => quarantineKey(q.id) === key)) {
      quarantined.push({ id: key.slice("dh:quarantine:".length), raw: storage.getItem(key) ?? "", error: "Failed to load earlier." });
    }
  }
  const order = index.order.filter((id) => characters.some((c) => c.id === id));
  for (const c of characters) if (!order.includes(c.id)) order.push(c.id);
  characters.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const currentId = index.currentId && order.includes(index.currentId) ? index.currentId : (order[0] ?? null);
  return { characters, currentId, quarantined };
}

export function saveCharacter(c: Character, storage: Storage | null = getStorage()): void {
  try {
    storage?.setItem(charKey(c.id), JSON.stringify(c));
  } catch {
    /* quota or private mode: the in-memory state stays authoritative */
  }
}

export function removeCharacter(id: string, storage: Storage | null = getStorage()): void {
  storage?.removeItem(charKey(id));
}

export function dismissQuarantined(id: string, storage: Storage | null = getStorage()): void {
  storage?.removeItem(quarantineKey(id));
}

export function saveIndex(index: StoredIndex, storage: Storage | null = getStorage()): void {
  try {
    storage?.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    /* ignore */
  }
}
