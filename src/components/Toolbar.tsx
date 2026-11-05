import { useCharacter, useSheet } from "../state/store";

export function Toolbar() {
  const c = useCharacter();
  const newCharacter = useSheet((s) => s.newCharacter);
  return (
    <header className="toolbar">
      <strong className="brand">Daggerheart Sheet</strong>
      <button type="button" className="btn" onClick={() => newCharacter()}>
        New character
      </button>
      <span className="grow" />
      <span className="who">{c.name || "Unnamed character"}</span>
    </header>
  );
}
