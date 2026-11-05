import { ANCESTRIES } from "../../data/ancestries";
import { COMMUNITIES } from "../../data/communities";
import { CLASS_LIST } from "../../data/classes";
import { MAX_LEVEL } from "../../data/common";
import { patch, setLevel } from "../../state/actions";
import { classOf, subclassOf } from "../../state/derive";
import { useCharacter, useSheet } from "../../state/store";
import { applyClass, selectSubclass } from "../../state/suggestions";
import { capitalize } from "../../data/common";
import { Note, OverrideInput, Row, SelectField, TextInput } from "./fields";

export function IdentitySection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const cls = classOf(c);
  const sub = subclassOf(c);
  const orNull = (v: string) => (v === "" ? null : v);
  return (
    <>
      <Row>
        <TextInput label="Name" value={c.name} onChange={(name) => update((ch) => patch(ch, { name }))} />
        <TextInput label="Pronouns" value={c.pronouns} onChange={(pronouns) => update((ch) => patch(ch, { pronouns }))} />
      </Row>
      <Row>
        <SelectField label="Class" value={c.classId} onChange={(id) => update((ch) => applyClass(ch, id))}>
          {!cls && <option value={c.classId}>{c.classNameSnapshot ?? c.classId} (not installed)</option>}
          {CLASS_LIST.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Subclass"
          value={c.subclassId ?? ""}
          onChange={(id) => update((ch) => selectSubclass(ch, orNull(id)))}
          disabled={!cls}
        >
          {(cls?.subclasses ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
      </Row>
      {sub && (
        <details className="subclass-info">
          <summary>
            {sub.name} features
            {sub.spellcastTrait ? ` · Spellcast: ${capitalize(sub.spellcastTrait)}` : ""}
          </summary>
          {(["foundation", "specialization", "mastery"] as const).map((k) => (
            <div key={k}>
              <h4>{capitalize(k)}</h4>
              {sub[k].map((f) => (
                <p key={f.name}>
                  <strong>{f.name}:</strong> {f.text}
                </p>
              ))}
            </div>
          ))}
        </details>
      )}
      <Row>
        <SelectField label="Ancestry" value={c.ancestryId ?? ""} onChange={(v) => update((ch) => patch(ch, { ancestryId: orNull(v) }))}>
          <option value="">—</option>
          {ANCESTRIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Second ancestry (mixed)"
          value={c.ancestry2Id ?? ""}
          onChange={(v) => update((ch) => patch(ch, { ancestry2Id: orNull(v) }))}
        >
          <option value="">None</option>
          {ANCESTRIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Community" value={c.communityId ?? ""} onChange={(v) => update((ch) => patch(ch, { communityId: orNull(v) }))}>
          <option value="">—</option>
          {COMMUNITIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </SelectField>
      </Row>
      <OverrideInput label="Heritage (as written on the sheet)" path="heritage" />
      <SelectField label="Level" value={String(c.level)} onChange={(v) => update((ch) => setLevel(ch, Number(v)))}>
        {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </SelectField>
      <Note>Level sets your damage thresholds, Proficiency, class die size and which level-up tiers are unlocked.</Note>
    </>
  );
}
