import {
  DESCRIPTION_LABELS,
  LEVEL_UP_OPTIONS,
  LEVEL_UP_TIERS,
  TIER_INFO,
  capitalize,
  type LevelUpTier,
} from "../../data/common";
import { DESCRIPTION_KEYS, TRAITS, type Trait } from "../../data/schema";
import {
  canEditBox,
  orphanedAnswers,
  removeAnswer,
  setAnswer,
  setCustomQuestion,
  setDescriptionText,
  setExperiencePick,
  setTraitPick,
  sheetQuestions,
  toggleDescriptionChip,
  toggleLevelUpBox,
} from "../../state/actions";
import {
  boxLimit,
  classOf,
  isCrossedOut,
  levelUpWarnings,
  pickCount,
  picksAllowed,
  picksUsed,
  traitMarked,
  unlockedTiers,
} from "../../state/derive";
import type { Character, TierKey } from "../../state/character";
import { useCharacter, useSheet } from "../../state/store";
import { Note, TextInput, Warn } from "./fields";

export function DescriptionSection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const cls = classOf(c);
  return (
    <>
      {DESCRIPTION_KEYS.map((k) => (
        <fieldset key={k} className="chips">
          <legend>{DESCRIPTION_LABELS[k]}</legend>
          <div className="chip-list">
            {(cls?.descriptionOptions[k] ?? []).map((opt) => (
              <button
                key={opt}
                type="button"
                className="chip"
                aria-pressed={c.description[k].chips.includes(opt)}
                onClick={() => update((ch) => toggleDescriptionChip(ch, k, opt))}
              >
                {opt}
              </button>
            ))}
          </div>
          <TextInput label="Or write your own" value={c.description[k].text} onChange={(v) => update((ch) => setDescriptionText(ch, k, v))} />
        </fieldset>
      ))}
    </>
  );
}

function QuestionsBlock({ section }: { section: "background" | "connections" }) {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const qs = sheetQuestions(c, section);
  const orphans = orphanedAnswers(c, section);
  return (
    <>
      {qs.map((q, i) => (
        <div key={i} className="qa">
          {q.custom ? (
            <>
              <TextInput
                label={`Your own question (slot ${i + 1})`}
                value={q.question}
                onChange={(v) => update((ch) => setCustomQuestion(ch, section, i as 0 | 1 | 2, { question: v, answer: q.answer }))}
              />
              <TextInput
                label="Answer"
                multiline
                value={q.answer}
                onChange={(v) => update((ch) => setCustomQuestion(ch, section, i as 0 | 1 | 2, { question: q.question, answer: v }))}
              />
              <button type="button" className="btn small" onClick={() => update((ch) => setCustomQuestion(ch, section, i as 0 | 1 | 2, null))}>
                Use the class question instead
              </button>
            </>
          ) : (
            <>
              <TextInput label={q.question || `Question ${i + 1}`} multiline value={q.answer} onChange={(v) => update((ch) => setAnswer(ch, section, q.question, v))} />
              <button type="button" className="btn small" onClick={() => update((ch) => setCustomQuestion(ch, section, i as 0 | 1 | 2, { question: "", answer: "" }))}>
                Write my own question here
              </button>
            </>
          )}
        </div>
      ))}
      {orphans.length > 0 && (
        <details>
          <summary>Answers from other questions ({orphans.length})</summary>
          {orphans.map((o) => (
            <div key={o.question} className="orphan">
              <p>
                <strong>{o.question}</strong>
              </p>
              <p>{o.answer}</p>
              <button type="button" className="btn small" onClick={() => update((ch) => removeAnswer(ch, section, o.question))}>
                Delete
              </button>
            </div>
          ))}
        </details>
      )}
    </>
  );
}

export function BackgroundSection() {
  return (
    <>
      <Note>Answer any of the questions, or write your own. Then work with the GM to generate two starting Experiences.</Note>
      <QuestionsBlock section="background" />
    </>
  );
}

export function ConnectionsSection() {
  return (
    <>
      <Note>Ask your fellow players one of these questions for their character to answer, or create your own.</Note>
      <QuestionsBlock section="connections" />
    </>
  );
}

function TierBlock({ tier, c }: { tier: LevelUpTier; c: Character }) {
  const update = useSheet((s) => s.update);
  const unlocked = unlockedTiers(c.level).includes(tier);
  const picks = c.levelUps[String(tier) as TierKey];
  const info = TIER_INFO[tier];
  return (
    <fieldset className={unlocked ? "tier" : "tier locked"}>
      <legend>
        {info.title}: {info.levels} {unlocked ? "" : `(unlocks at level ${info.firstLevel})`}
      </legend>
      {LEVEL_UP_OPTIONS.filter((o) => boxLimit(o.id, tier) > 0).map((o) => {
        const crossed = isCrossedOut(c, o.id, tier);
        const editable = canEditBox(c, o.id, tier);
        const count = pickCount(picks, o.id);
        return (
          <div key={o.id} className={crossed ? "opt crossed" : "opt"}>
            <div className="opt-boxes" role="group" aria-label={o.text(tier)}>
              {Array.from({ length: boxLimit(o.id, tier) }, (_, i) => (
                <input
                  key={i}
                  type="checkbox"
                  aria-label={`${o.text(tier)} box ${i + 1}`}
                  checked={i < count}
                  disabled={!editable && !(i < count)}
                  onChange={() => update((ch) => toggleLevelUpBox(ch, tier, o.id, i))}
                />
              ))}
              <span className="opt-text">{o.text(tier)}</span>
              {o.cost > 1 && <span className="cost"> (uses {o.cost} picks)</span>}
            </div>
            {o.id === "traits" &&
              picks.traits.map((box, bi) => (
                <div key={bi} className="pick-row">
                  {([0, 1] as const).map((slot) => (
                    <select
                      key={slot}
                      aria-label={`Trait pick ${bi + 1}, trait ${slot + 1}`}
                      value={box.traits[slot] ?? ""}
                      onChange={(e) => update((ch) => setTraitPick(ch, tier, bi, slot, (e.target.value || null) as Trait | null))}
                    >
                      <option value="">Choose trait</option>
                      {TRAITS.map((t) => (
                        <option key={t} value={t} disabled={traitMarked(c, t) && !box.traits.includes(t)}>
                          {capitalize(t)}
                          {traitMarked(c, t) && !box.traits.includes(t) ? " (marked)" : ""}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              ))}
            {o.id === "experience" &&
              picks.experience[0] &&
              ([0, 1] as const).map((slot) => (
                <select
                  key={slot}
                  aria-label={`Experience pick ${slot + 1}`}
                  value={picks.experience[0]?.[slot] ?? ""}
                  onChange={(e) => update((ch) => setExperiencePick(ch, tier, slot, e.target.value || null))}
                >
                  <option value="">Choose Experience</option>
                  {c.experiences.map((x, xi) => (
                    <option key={x.id} value={x.id}>
                      {x.name || `Experience ${xi + 1}`}
                    </option>
                  ))}
                </select>
              ))}
          </div>
        );
      })}
    </fieldset>
  );
}

export function LevelUpSection() {
  const c = useCharacter();
  const warnings = levelUpWarnings(c);
  return (
    <>
      <p className="derived">
        Level-up picks used: <strong>{picksUsed(c)}</strong> of <strong>{picksAllowed(c.level)}</strong> (two per level-up)
      </p>
      {warnings.map((w) => (
        <Warn key={w}>{w}</Warn>
      ))}
      {LEVEL_UP_TIERS.map((t) => (
        <TierBlock key={t} tier={t} c={c} />
      ))}
      <Note>Higher tiers unlock as you level. You can also take any option from an earlier tier.</Note>
    </>
  );
}
