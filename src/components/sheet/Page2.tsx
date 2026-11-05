import {
  DESCRIPTION_LABELS,
  LEVEL_UP_OPTIONS,
  LEVEL_UP_TIERS,
  TIER_INFO,
  TIER_INTRO,
  TIER_OUTRO,
  capitalize,
  type LevelUpTier,
} from "../../data/common";
import { DESCRIPTION_KEYS } from "../../data/schema";
import { getArmor, getWeapon } from "../../data/catalog";
import { sheetQuestions, toggleLevelUpBox } from "../../state/actions";
import { boxLimit, classOf, isCrossedOut, pickCount, unlockedTiers } from "../../state/derive";
import type { TierKey } from "../../state/character";
import { useCharacter, useSheet } from "../../state/store";
import { suggestedArmorFields, suggestedWeaponFields } from "../../state/suggestions";
import { Abs } from "./primitives/Abs";
import { BannerHeader } from "./primitives/BannerHeader";
import { FitText } from "./primitives/FitText";
import { Frame } from "./primitives/Frame";

const minus = (s: string) => s.replace(/-(?=\d)/g, "−");
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

function Header() {
  const c = useCharacter();
  const cls = classOf(c);
  return (
    <>
      <Abs x={0} y={0} w={952} h={92} className="p2-band" />
      <svg className="abs" style={{ left: 0, top: 0 }} width="340" height="92" viewBox="0 0 340 92" aria-hidden="true">
        <polygon points="0,0 326,0 282,92 0,92" fill="var(--sheet-header-shape)" />
      </svg>
      <Abs x={44} y={34} className="p2-title">
        {(cls?.name ?? c.classNameSnapshot ?? "").toUpperCase()}
      </Abs>
      <Abs x={44} y={63} className="p2-subtitle">
        CHARACTER GUIDE
      </Abs>
      <Abs x={400} y={34} w={450} className="p2-tagline">
        {cls?.tagline}
      </Abs>
    </>
  );
}

function Suggestions() {
  const c = useCharacter();
  const cls = classOf(c);
  if (!cls) return null;
  const { suggested } = cls;
  const traits = (["agility", "strength", "finesse", "instinct", "presence", "knowledge"] as const)
    .map((t) => `${signed(suggested.traits[t] ?? 0)} ${capitalize(t)}`)
    .join(", ");
  const weaponLine = (id: string | undefined) => {
    const w = getWeapon(id);
    if (!w) return "";
    const f = suggestedWeaponFields(w);
    return `${f.name} - ${f.traitRange} - ${f.damage} - ${w.burden}`;
  };
  const armor = getArmor(suggested.armorId);
  const a = suggestedArmorFields(armor);
  return (
    <>
      <Abs x={33} y={106} w={300} className="p2-block">
        <h3>SUGGESTED TRAITS</h3>
        <p>{traits}</p>
        <h3>SUGGESTED PRIMARY WEAPON</h3>
        <p>{weaponLine(suggested.primaryWeaponId)}</p>
        {suggested.secondaryWeaponId && (
          <>
            <h3>SUGGESTED SECONDARY WEAPON</h3>
            <p>{weaponLine(suggested.secondaryWeaponId)}</p>
          </>
        )}
        <h3>SUGGESTED ARMOR</h3>
        <p>
          {a.name} - Thresholds {a.baseMinor}/{a.baseMajor} - Score {a.score}
          {armor?.features.map((f) => (
            <span key={f.name} className="p2-feature">
              <br />
              <b>
                <i>{f.name}:</i>
              </b>{" "}
              {minus(f.text)}
            </span>
          ))}
        </p>
      </Abs>
      <Abs x={348} y={135} w={0} h={190} className="p2-vline" />
    </>
  );
}

function InventoryGuide() {
  const c = useCharacter();
  const cls = classOf(c);
  if (!cls) return null;
  const { take, chooseOne } = cls.startingInventory;
  return (
    <>
      <Abs x={360} y={106} w={275} className="p2-center">
        <h3 className="p2-head">INVENTORY</h3>
        <p>
          <b>TAKE:</b>
          <br />
          {take.join(", ")}
        </p>
        {chooseOne.map((group, gi) => (
          <p key={gi}>
            <b>{gi === 0 ? "THEN CHOOSE BETWEEN:" : "AND EITHER:"}</b>
            <br />
            {group.map((opt, oi) => (
              <span key={opt}>
                {oi > 0 && (
                  <>
                    {" "}
                    <b>OR</b>{" "}
                  </>
                )}
                <span className={c.inventoryChoices[String(gi)] === opt ? "chosen" : ""}>{opt}</span>
              </span>
            ))}
          </p>
        ))}
      </Abs>
      <Abs x={637} y={135} w={0} h={190} className="p2-vline" />
    </>
  );
}

function Description() {
  const c = useCharacter();
  const cls = classOf(c);
  if (!cls) return null;
  return (
    <Abs x={668} y={106} w={272} className="p2-desc">
      <h3 className="p2-head left">CHARACTER DESCRIPTION</h3>
      <p>
        <b>Choose one (or more) from each line, or write your own description.</b>
      </p>
      {DESCRIPTION_KEYS.map((k) => {
        const line = c.description[k];
        const options = cls.descriptionOptions[k];
        return (
          <p key={k}>
            <b>{DESCRIPTION_LABELS[k]}</b>{" "}
            {options.map((o, i) => (
              <span key={o}>
                {i > 0 && ", "}
                <span className={line.chips.includes(o) ? "chosen" : ""}>{o}</span>
              </span>
            ))}
            {line.text && <span className="ink"> {line.text}</span>}
          </p>
        );
      })}
    </Abs>
  );
}

function Questions({ section, x, title, intro, cx }: { section: "background" | "connections"; x: number; title: string; intro: string; cx: number }) {
  const c = useCharacter();
  const qs = sheetQuestions(c, section);
  const ys = [412, 494, 578];
  const left = section === "background";
  return (
    <>
      <Frame x={left ? -4 : 483} y={357} w={left ? 478 : 479} h={350} bleed={left ? "left" : "right"} />
      <BannerHeader title={title} cx={cx} y={345} w={270} />
      <Abs x={x} y={376} w={440} className="p2-intro">
        {intro}
      </Abs>
      <svg className="abs" style={{ left: left ? 2 : 454, top: 395 }} width="470" height="270" viewBox="0 0 470 270" aria-hidden="true" >
        <path d={`M${left ? 312 : 300} 26 H438 Q456 26 456 44 V232 Q456 250 438 250 H${left ? 300 : 288} M${left ? 312 : 300} 112 H456 M${left ? 312 : 300} 196 H456`} fill="none" stroke="var(--sheet-line-slot)" strokeWidth="1.5" />
      </svg>
      {qs.map((q, i) => (
        <div key={i}>
          <Abs x={x} y={ys[i]!} w={left ? 290 : 235} className="p2-question">
            {q.question}
          </Abs>
          <Abs x={x} y={ys[i]! + 30} w={left ? 410 : 380} h={42} className="p2-answer">
            <FitText text={q.answer} max={13} min={7} multiline />
          </Abs>
        </div>
      ))}
    </>
  );
}

function LevelUpTierBlock({ tier, x, w, cx, bleed }: { tier: LevelUpTier; x: number; w: number; cx: number; bleed?: "left" | "right" }) {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const info = TIER_INFO[tier];
  const unlocked = unlockedTiers(c.level).includes(tier);
  const picks = c.levelUps[String(tier) as TierKey];
  const current = unlockedTiers(c.level).at(-1) === tier;
  const nameOf = (id: string) => c.experiences.find((e) => e.id === id)?.name || "(unnamed)";
  return (
    <div className={`tier-block${unlocked ? "" : " tier-locked"}${current ? " tier-current" : ""}`}>
      <Frame x={x} y={722} w={w} h={520} tone="grey" bleed={bleed} />
      <BannerHeader title={`${info.title.toUpperCase()}: ${info.levels.replace("Levels ", "LEVELS ")}`} cx={cx} y={709} w={Math.min(270, w - 30)} />
      <Abs x={x + 18} y={742} w={Math.min(w - 36, 934 - (x + 18))} h={70} className="achievement">
        {info.achievement}
      </Abs>
      <Abs x={x + 14} y={820} w={Math.min(w - 28, 938 - (x + 14))} className="tier-intro">
        {TIER_INTRO[tier]}
      </Abs>
      {!unlocked && (
        <Abs x={x + 20} y={1218} w={w - 40} className="locked-note">
          Unlocks at level {info.firstLevel}
        </Abs>
      )}
      <Abs x={x + 12} y={858} w={Math.min(w - 22, 940 - (x + 12))} className="lu-list">
        {LEVEL_UP_OPTIONS.filter((o) => boxLimit(o.id, tier) > 0).map((o) => {
          const crossed = isCrossedOut(c, o.id, tier);
          const count = pickCount(picks, o.id);
          const editable = unlocked && !crossed;
          return (
            <div key={o.id} className={`lu-opt${crossed ? " crossed" : ""}`}>
              <span className="lu-boxes">
                {Array.from({ length: boxLimit(o.id, tier) }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`lu-box${o.cost > 1 ? " double" : ""}${i < count ? " is-on" : ""}`}
                    aria-pressed={i < count}
                    aria-label={`${info.title}: ${o.text(tier)}`}
                    disabled={!editable && !(i < count)}
                    onClick={() => update((ch) => toggleLevelUpBox(ch, tier, o.id, i))}
                  />
                ))}
              </span>
              <span className="lu-text">
                {o.text(tier)}
                {o.id === "traits" && picks.traits.length > 0 && (
                  <span className="ink">
                    {" "}
                    {picks.traits.map((b) => b.traits.map(capitalize).join(" + ")).filter(Boolean).join("; ")}
                  </span>
                )}
                {o.id === "experience" && picks.experience[0] && picks.experience[0].length > 0 && (
                  <span className="ink"> {picks.experience[0].map(nameOf).join(" + ")}</span>
                )}
              </span>
            </div>
          );
        })}
        <p className="tier-outro">{TIER_OUTRO}</p>
      </Abs>
    </div>
  );
}

export function Page2() {
  return (
    <div className="sheet-page page2" aria-label="Character sheet, page 2">
      <Header />
      <Suggestions />
      <InventoryGuide />
      <Description />
      <Questions
        section="background"
        x={22}
        cx={235}
        title="BACKGROUND QUESTIONS"
        intro="Answer any of the following background questions. You can also create your own questions."
      />
      <Questions
        section="connections"
        x={516}
        cx={722}
        title="CONNECTIONS"
        intro="Ask your fellow players one of the following questions for their character to answer, or create your own questions."
      />
      <Abs x={14} y={712 - 22} w={450} className="p2-note">
        Then work with the GM to generate two starting Experiences for your character.
      </Abs>
      {LEVEL_UP_TIERS.map((t, i) => {
        const cols = [
          { x: -4, w: 328, cx: 160, bleed: "left" },
          { x: 343, w: 288, cx: 487, bleed: undefined },
          { x: 651, w: 311, cx: 802, bleed: "right" },
        ] as const;
        const col = cols[i]!;
        return <LevelUpTierBlock key={t} tier={t} x={col.x} w={col.w} cx={col.cx} bleed={col.bleed} />;
      })}
      <Abs x={33} y={1196} className="footer">
        Daggerheart © Darrington Press 2025
      </Abs>
    </div>
  );
}
