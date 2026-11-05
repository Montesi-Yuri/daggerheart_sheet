import { TRAITS, type Trait } from "../../data/schema";
import { capitalize } from "../../data/common";
import { setTraitMarked } from "../../state/actions";
import { gearModifiers, traitLevelUpBonus, traitMarked, traitSpreadWarning, traitValue } from "../../state/derive";
import { useCharacter, useSheet } from "../../state/store";
import { applySuggestedTraits, setTrait } from "../../state/suggestions";
import { Note, Stepper, Warn } from "./fields";

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export function TraitsSection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const warning = traitSpreadWarning(c);
  const gear = gearModifiers(c);
  return (
    <>
      <button type="button" className="btn" onClick={() => update(applySuggestedTraits)}>
        Apply suggested traits
      </button>
      {warning && <Warn>{warning}</Warn>}
      <div className="traits">
        {TRAITS.map((t: Trait) => {
          const bonus = traitLevelUpBonus(c, t);
          const mod = gear[t] ?? 0;
          const overridden = c.traitMarkOverrides[t] !== undefined;
          return (
            <div key={t} className="trait-row">
              <Stepper label={capitalize(t)} value={c.traits[t]} min={-3} max={5} format={signed} onChange={(v) => update((ch) => setTrait(ch, t, v))} />
              <div className="trait-meta">
                <span>
                  Shown: <strong>{signed(traitValue(c, t))}</strong>
                  {bonus !== 0 && ` (level-up ${signed(bonus)})`}
                  {mod !== 0 && ` (gear ${signed(mod)})`}
                </span>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={traitMarked(c, t)}
                    onChange={(e) => update((ch) => setTraitMarked(ch, t, e.target.checked))}
                  />
                  Marked
                </label>
                {overridden && (
                  <button type="button" className="reset" aria-label={`Reset ${t} mark to automatic`} title="Reset to automatic" onClick={() => update((ch) => setTraitMarked(ch, t, undefined))}>
                    ↺
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Note>The stepper edits your starting trait. Level-up picks and armor or weapon modifiers are added on top.</Note>
    </>
  );
}
