import { MAX_EXPERIENCES, MAX_HOPE } from "../../data/common";
import {
  addExperience,
  removeExperience,
  renameExperience,
  setAdjustment,
  setHope,
  setMarked,
  slotsFor,
  type MarkKey,
} from "../../state/actions";
import {
  armorSlots,
  evasion,
  experienceBonus,
  experiencesEarned,
  hpSlots,
  markedCount,
  proficiency,
  stressSlots,
  thresholds,
} from "../../state/derive";
import type { Character } from "../../state/character";
import { useCharacter, useSheet } from "../../state/store";
import { Note, Row, Stepper, TextInput, Warn } from "./fields";

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function Adjust({ label, k }: { label: string; k: keyof Character["adjustments"] }) {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  return <Stepper label={`${label} adjustment`} value={c.adjustments[k]} format={signed} onChange={(v) => update((ch) => setAdjustment(ch, k, v))} />;
}

function Marks({ label, k, total }: { label: string; k: MarkKey; total: number }) {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  return (
    <Stepper
      label={`${label} marked (of ${total})`}
      value={markedCount(c[k], slotsFor(c, k))}
      min={0}
      max={total}
      onChange={(v) => update((ch) => setMarked(ch, k, v))}
    />
  );
}

export function DefenseSection() {
  const c = useCharacter();
  const t = thresholds(c);
  return (
    <>
      <p className="derived">
        Evasion <strong>{evasion(c)}</strong> · Armor slots <strong>{armorSlots(c)}</strong> · Thresholds <strong>{t.minor}</strong> /{" "}
        <strong>{t.major}</strong> · Proficiency <strong>{proficiency(c)}</strong>
      </p>
      <Marks label="Armor slots" k="armorMarked" total={armorSlots(c)} />
      <details>
        <summary>Manual adjustments (homebrew or magic items)</summary>
        <Row>
          <Adjust label="Evasion" k="evasion" />
          <Adjust label="Armor score" k="armorScore" />
        </Row>
        <Row>
          <Adjust label="Minor threshold" k="minor" />
          <Adjust label="Major threshold" k="major" />
        </Row>
        <Adjust label="Proficiency" k="proficiency" />
      </details>
    </>
  );
}

export function HealthSection() {
  const c = useCharacter();
  const t = thresholds(c);
  return (
    <>
      <p className="derived">
        Minor damage ≥ <strong>{t.minor}</strong> marks 1 HP · Major ≥ <strong>{t.major}</strong> marks 2 · Severe marks 3
      </p>
      <Marks label="HP" k="hpMarked" total={hpSlots(c)} />
      <Marks label="Stress" k="stressMarked" total={stressSlots(c)} />
      <details>
        <summary>Manual adjustments</summary>
        <Row>
          <Adjust label="HP slots" k="hp" />
          <Adjust label="Stress slots" k="stress" />
        </Row>
      </details>
    </>
  );
}

export function HopeExperienceSection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const earned = experiencesEarned(c.level);
  return (
    <>
      <Stepper label="Hope" value={c.hope} min={0} max={MAX_HOPE} onChange={(v) => update((ch) => setHope(ch, v))} />
      <h3>Experiences</h3>
      {c.experiences.map((e, i) => (
        <div key={e.id} className="exp-row">
          <TextInput label={`Experience ${i + 1}`} value={e.name} onChange={(v) => update((ch) => renameExperience(ch, e.id, v))} />
          <span className="bonus" aria-label="Bonus">
            {signed(experienceBonus(c, e.id))}
          </span>
          <button type="button" className="btn small" onClick={() => update((ch) => removeExperience(ch, e.id))} aria-label={`Remove experience ${i + 1}`}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="btn" disabled={c.experiences.length >= MAX_EXPERIENCES} onClick={() => update(addExperience)}>
        Add experience
      </button>
      {c.experiences.length > earned && (
        <Warn>
          At level {c.level} you have earned {earned} Experiences.
        </Warn>
      )}
      <Note>You start with two at +2 and gain another at levels 2, 5 and 8.</Note>
    </>
  );
}
