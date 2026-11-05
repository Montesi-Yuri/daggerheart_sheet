import { create } from "zustand";
import { createCharacter, type Character } from "./character";
import {
  dismissQuarantined,
  loadAll,
  removeCharacter,
  saveCharacter,
  saveIndex,
  type Quarantined,
} from "./storage";

const SAVE_DELAY_MS = 300;

interface SheetState {
  characters: Record<string, Character>;
  order: string[];
  currentId: string;
  quarantined: Quarantined[];

  /** Apply a pure Character -> Character function (from suggestions.ts / derive.ts helpers) to the current character. */
  update: (fn: (c: Character) => Character) => void;
  newCharacter: (classId?: string) => void;
  switchTo: (id: string) => void;
  deleteCharacter: (id: string) => void;
  addCharacter: (c: Character) => void;
  dismissQuarantine: (id: string) => void;
}

function initial(): Pick<SheetState, "characters" | "order" | "currentId" | "quarantined"> {
  const loaded = loadAll();
  if (loaded.characters.length === 0) {
    const c = createCharacter();
    return { characters: { [c.id]: c }, order: [c.id], currentId: c.id, quarantined: loaded.quarantined };
  }
  return {
    characters: Object.fromEntries(loaded.characters.map((c) => [c.id, c])),
    order: loaded.characters.map((c) => c.id),
    currentId: loaded.currentId ?? loaded.characters[0]!.id,
    quarantined: loaded.quarantined,
  };
}

export const useSheet = create<SheetState>((set, get) => ({
  ...initial(),
  update: (fn) =>
    set((s) => {
      const current = s.characters[s.currentId];
      if (!current) return s;
      const next = { ...fn(current), updatedAt: Date.now() };
      return { characters: { ...s.characters, [s.currentId]: next } };
    }),
  newCharacter: (classId) => {
    const c = createCharacter(classId);
    set((s) => ({ characters: { ...s.characters, [c.id]: c }, order: [...s.order, c.id], currentId: c.id }));
  },
  switchTo: (id) => {
    if (get().characters[id]) set({ currentId: id });
  },
  deleteCharacter: (id) => {
    removeCharacter(id);
    set((s) => {
      const { [id]: _gone, ...rest } = s.characters;
      const order = s.order.filter((x) => x !== id);
      if (order.length === 0) {
        const c = createCharacter();
        return { characters: { [c.id]: c }, order: [c.id], currentId: c.id };
      }
      return { characters: rest, order, currentId: s.currentId === id ? order[0]! : s.currentId };
    });
  },
  addCharacter: (c) =>
    set((s) => ({ characters: { ...s.characters, [c.id]: c }, order: [...s.order.filter((x) => x !== c.id), c.id], currentId: c.id })),
  dismissQuarantine: (id) => {
    dismissQuarantined(id);
    set((s) => ({ quarantined: s.quarantined.filter((q) => q.id !== id) }));
  },
}));

export const selectCurrent = (s: SheetState): Character => s.characters[s.currentId]!;
export const useCharacter = (): Character => useSheet(selectCurrent);

// --- Autosave: debounced per character, flushed when the page is hidden or closed ---------------

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const lastSaved = new Map<string, Character>();

function persist(id: string) {
  timers.delete(id);
  const s = useSheet.getState();
  const c = s.characters[id];
  if (c && lastSaved.get(id) !== c) {
    saveCharacter(c);
    lastSaved.set(id, c);
  }
  saveIndex({ order: s.order, currentId: s.currentId });
}

function flush() {
  for (const [id, t] of timers) {
    clearTimeout(t);
    persist(id);
  }
}

export function startAutosave(): void {
  for (const [id, c] of Object.entries(useSheet.getState().characters)) lastSaved.set(id, c);
  useSheet.subscribe((s, prev) => {
    for (const [id, c] of Object.entries(s.characters)) {
      if (prev.characters[id] !== c) {
        const t = timers.get(id);
        if (t) clearTimeout(t);
        timers.set(id, setTimeout(() => persist(id), SAVE_DELAY_MS));
      }
    }
    if (s.order !== prev.order || s.currentId !== prev.currentId) {
      saveIndex({ order: s.order, currentId: s.currentId });
    }
  });
  window.addEventListener("beforeunload", flush);
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
