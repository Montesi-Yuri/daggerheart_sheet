import { patch } from "../../state/actions";
import { classOf, dieSides } from "../../state/derive";
import { useCharacter, useSheet } from "../../state/store";
import { RichText } from "../RichText";
import { Note, Stepper } from "./fields";

export function ClassFeatureSection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const cls = classOf(c);
  if (!cls) return <Note>This character’s class is not installed, so its features can’t be shown.</Note>;
  return (
    <>
      <p>
        <strong>
          <em>{cls.hopeFeature.name}:</em> Spend {cls.hopeFeature.cost} Hope
        </strong>{" "}
        to {cls.hopeFeature.text}
      </p>
      {cls.classFeatures.map((f) => (
        <div key={f.name} className="class-feature">
          <h3>{f.name}</h3>
          <RichText text={f.text} />
          {f.tracker && (
            <Stepper
              label={`${f.name} die (d${dieSides(f.tracker.sidesByLevel, c.level)})`}
              value={c.classDie}
              min={0}
              max={dieSides(f.tracker.sidesByLevel, c.level)}
              format={(v) => (v === 0 ? "off" : String(v))}
              onChange={(classDie) => update((ch) => patch(ch, { classDie }))}
            />
          )}
        </div>
      ))}
    </>
  );
}
