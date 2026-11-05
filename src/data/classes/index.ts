import type { ClassDefinition } from "../schema";
import guardian from "./guardian";

// To add a class: create its data file next to guardian.ts and add it here.
export const CLASSES: Record<string, ClassDefinition> = { guardian };

export const CLASS_LIST: ClassDefinition[] = Object.values(CLASSES);
export const DEFAULT_CLASS_ID = "guardian";

export function getClass(id: string): ClassDefinition | undefined {
  return CLASSES[id];
}
