import { MAX_GOLD, TRAIT_SKILLS, capitalize } from "../../data/common";
import { TRAITS } from "../../data/schema";
import {
  clickGoldCircle,
  cycleClassDie,
  setTraitMarked,
  toggleChest,
  toggleHope,
  toggleMark,
} from "../../state/actions";
import {
  armorSlots,
  classOf,
  dieSides,
  evasion,
  experienceBonus,
  hpSlots,
  markedCount,
  proficiency,
  stressSlots,
  subclassOf,
  thresholds,
  traitMarked,
  traitValue,
} from "../../state/derive";
import { useCharacter, useSheet } from "../../state/store";
import { effectiveValue, equipFromInventory, inventoryLinePath, type WeaponBlockPrefix } from "../../state/suggestions";
import { RichText } from "../RichText";
import { Abs } from "./primitives/Abs";
import { BannerHeader } from "./primitives/BannerHeader";
import { DotTrack } from "./primitives/DotTrack";
import { FitText } from "./primitives/FitText";
import { Frame } from "./primitives/Frame";
import { BagIcon, ChestIcon, CoinIcon, DomainIcon, HandsIcon } from "./primitives/Icons";
import { LineField } from "./primitives/LineField";
import { PipRow } from "./primitives/PipRow";
import { ShieldBox } from "./primitives/ShieldBox";
import { SlotBox, SlotRow } from "./primitives/SlotRow";

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
const text = (c: Parameters<typeof effectiveValue>[0], path: string) => String(effectiveValue(c, path));

function HeaderField({ x, y, w, label, value }: { x: number; y: number; w: number; label: string; value: string }) {
  return (
    <Abs x={x} y={y} w={w} h={30} className="hfield">
      <span className="hlabel">{label}</span>
      <div className="hvalue">
        <FitText text={value} max={14} />
      </div>
    </Abs>
  );
}

function Header() {
  const c = useCharacter();
  const cls = classOf(c);
  const sub = subclassOf(c);
  const title = (cls?.name ?? c.classNameSnapshot ?? "").toUpperCase();
  return (
    <>
      <Abs x={0} y={0} w={952} h={75} className="header-band" />
      <svg className="abs header-dark" width="340" height="88" viewBox="0 0 340 88" aria-hidden="true">
        <polygon points="0,0 326,0 282,88 0,88" fill="var(--sheet-header-shape)" />
      </svg>
      <Abs x={22} y={19} className="title">
        {title}
      </Abs>
      <Abs x={22} y={53} className="subtitle">
        {cls ? cls.domains.join(" & ").toUpperCase() : ""}
      </Abs>
      {cls && (
        <>
          <Abs x={213} y={20} w={32} h={32}>
            <DomainIcon domain={cls.domains[0]} />
          </Abs>
          <Abs x={251} y={20} w={32} h={32}>
            <DomainIcon domain={cls.domains[1]} />
          </Abs>
        </>
      )}
      <HeaderField x={305} y={8} w={312} label="NAME" value={c.name} />
      <HeaderField x={625} y={8} w={206} label="PRONOUNS" value={c.pronouns} />
      <HeaderField x={305} y={41} w={266} label="HERITAGE" value={text(c, "heritage")} />
      <HeaderField x={577} y={41} w={254} label="SUBCLASS" value={sub?.name ?? ""} />
      <ShieldBox x={852} y={4} w={80} h={76}>
        <span className="big">{c.level}</span>
      </ShieldBox>
      <Abs x={857} y={70} w={70} h={17} className="tag">
        LEVEL
      </Abs>
    </>
  );
}

function Defense() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const cls = classOf(c);
  const slots = armorSlots(c);
  const marked = markedCount(c.armorMarked, slots);
  return (
    <>
      <ShieldBox x={28} y={116} w={78} h={72} variant="crest">
        <span className="big">{evasion(c)}</span>
      </ShieldBox>
      <Abs x={30} y={183} w={74} h={16} className="tag">
        EVASION
      </Abs>
      <Abs x={26} y={206} w={82} className="start-at">
        {cls ? `Start at ${cls.startingEvasion}` : ""}
      </Abs>
      <ShieldBox x={126} y={116} w={80} h={72} variant="crest">
        <span className="big">{slots}</span>
      </ShieldBox>
      <Abs x={128} y={183} w={76} h={16} className="tag">
        ARMOR
      </Abs>
      <Abs x={212} y={119} className="armor-grid" style={{ width: 70 }}>
        {Array.from({ length: 12 }, (_, i) =>
          i < slots ? (
            <SlotBox key={i} index={i + 1} marked={i < marked} label="Armor slot" shape="shield" onToggle={(n) => update((ch) => toggleMark(ch, "armorMarked", n))} />
          ) : (
            <span key={i} className="slot slot-shield slot-off" aria-hidden="true" />
          ),
        )}
      </Abs>
      <Abs x={291} y={108} w={0} h={118} className="vdivider" />
    </>
  );
}

function Traits() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  return (
    <>
      {TRAITS.map((t, i) => {
        const x = 308 + i * 104.4;
        const on = traitMarked(c, t);
        return (
          <div key={t}>
            <Abs x={x} y={105} w={96} h={18} className="trait-tab">
              {t.toUpperCase()}
            </Abs>
            <button
              type="button"
              className={`mark-circle${on ? " is-marked" : ""}`}
              style={{ left: x + 80, top: 104 }}
              aria-pressed={on}
              aria-label={`${capitalize(t)} ${on ? "marked" : "unmarked"}`}
              onClick={() => update((ch) => setTraitMarked(ch, t, !traitMarked(ch, t)))}
            />
            <ShieldBox x={x + 2} y={125} w={92} h={64}>
              <span className="big trait-value">{signed(traitValue(c, t))}</span>
            </ShieldBox>
            <Abs x={x} y={192} w={96} className="skills">
              {TRAIT_SKILLS[t].map((s) => (
                <div key={s}>{s}</div>
              ))}
            </Abs>
            {i > 0 && <Abs x={x - 5} y={128} w={0} h={92} className="vdotted" />}
          </div>
        );
      })}
    </>
  );
}

function Health() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const t = thresholds(c);
  const hp = hpSlots(c);
  const stress = stressSlots(c);
  return (
    <>
      <Frame x={-4} y={254} w={424} h={172} bleed="left" />
      <BannerHeader title="DAMAGE & HEALTH" cx={210} y={242} />
      <Abs x={0} y={273} w={420} className="hint">
        Add your current level to your damage thresholds.
      </Abs>
      <Abs x={24} y={289} w={104} h={38} className="thr thr-first">
        MINOR
        <br />
        DAMAGE
      </Abs>
      <Abs x={164} y={289} w={98} h={38} className="thr">
        MAJOR
        <br />
        DAMAGE
      </Abs>
      <Abs x={300} y={289} w={104} h={38} className="thr thr-last">
        SEVERE
        <br />
        DAMAGE
      </Abs>
      <Abs x={130} y={293} w={32} h={30} className="thr-val">
        {t.minor}
      </Abs>
      <Abs x={266} y={293} w={32} h={30} className="thr-val">
        {t.major}
      </Abs>
      <Abs x={24} y={331} w={104} className="mark-hp">
        Mark 1 HP
      </Abs>
      <Abs x={164} y={331} w={98} className="mark-hp">
        Mark 2 HP
      </Abs>
      <Abs x={300} y={331} w={104} className="mark-hp">
        Mark 3 HP
      </Abs>
      <Abs x={24} y={352} className="stat-label">
        HP
      </Abs>
      <Abs x={57} y={354} style={{ ["--w" as string]: "24px", ["--gap" as string]: "5.4px" }}>
        <SlotRow label="HP" available={hp} marked={markedCount(c.hpMarked, hp)} onToggle={(n) => update((ch) => toggleMark(ch, "hpMarked", n))} />
      </Abs>
      <Abs x={24} y={391} className="stat-label">
        STRESS
      </Abs>
      <Abs x={98} y={394} style={{ ["--w" as string]: "21px", ["--gap" as string]: "4.6px" }}>
        <SlotRow
          label="Stress"
          available={stress}
          marked={markedCount(c.stressMarked, stress)}
          onToggle={(n) => update((ch) => toggleMark(ch, "stressMarked", n))}
        />
      </Abs>
    </>
  );
}

function Hope() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const cls = classOf(c);
  return (
    <>
      <Frame x={-4} y={436} w={424} h={134} bleed="left" />
      <BannerHeader title="HOPE" cx={210} y={424} />
      <Abs x={0} y={451} w={420} className="hint">
        Spend a Hope to use an experience or help an ally.
      </Abs>
      <Abs x={42} y={474} w={340} h={30}>
        <PipRow value={c.hope} onToggle={(n) => update((ch) => toggleHope(ch, n))} />
      </Abs>
      {cls && (
        <Abs x={14} y={525} w={392} className="hope-feature">
          <strong>
            <em>{cls.hopeFeature.name}:</em> Spend {cls.hopeFeature.cost} Hope
          </strong>{" "}
          to {cls.hopeFeature.text}
        </Abs>
      )}
    </>
  );
}

function Experience() {
  const c = useCharacter();
  return (
    <>
      <Frame x={-4} y={578} w={424} h={178} bleed="left" />
      <BannerHeader title="EXPERIENCE" cx={210} y={566} />
      {Array.from({ length: 5 }, (_, i) => {
        const e = c.experiences[i];
        const y = 622 + i * 31;
        return (
          <div key={i}>
            <LineField x={22} y={y} w={312} value={e?.name ?? ""} />
            <Abs x={335} y={y - 15} w={67} h={15} className="exp-tab" />
            {e && (
              <Abs x={350} y={y - 18} w={50} h={18} className="exp-bonus">
                {signed(experienceBonus(c, e.id))}
              </Abs>
            )}
          </div>
        );
      })}
    </>
  );
}

function Gold() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  return (
    <>
      <Frame x={-4} y={766} w={424} h={66} bleed="left" />
      <Abs x={0} y={771} w={420} className="gold-title">
        GOLD
      </Abs>
      {Array.from({ length: MAX_GOLD.handfuls }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`gold-btn${i < c.gold.handfuls ? " is-on" : ""}`}
          style={{ left: 24 + i * 19.2, top: 796, width: 17, height: 17 }}
          aria-pressed={i < c.gold.handfuls}
          aria-label={`Handful ${i + 1}`}
          onClick={() => update((ch) => clickGoldCircle(ch, "handfuls", i + 1))}
        >
          <CoinIcon />
        </button>
      ))}
      <Abs x={203} y={793} w={0} h={36} className="vdotted" />
      {Array.from({ length: MAX_GOLD.bags }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`gold-btn${i < c.gold.bags ? " is-on" : ""}`}
          style={{ left: 208 + i * 17.8, top: 792, width: 18, height: 22 }}
          aria-pressed={i < c.gold.bags}
          aria-label={`Bag ${i + 1}`}
          onClick={() => update((ch) => clickGoldCircle(ch, "bags", i + 1))}
        >
          <BagIcon />
        </button>
      ))}
      <Abs x={367} y={793} w={0} h={36} className="vdotted" />
      <button
        type="button"
        className={`gold-btn${c.gold.chest ? " is-on" : ""}`}
        style={{ left: 374, top: 790, width: 26, height: 26 }}
        aria-pressed={c.gold.chest === 1}
        aria-label="Chest"
        onClick={() => update(toggleChest)}
      >
        <ChestIcon />
      </button>
      <Abs x={24} y={819} className="gold-label">
        HANDFULS
      </Abs>
      <Abs x={209} y={819} className="gold-label">
        BAGS
      </Abs>
      <Abs x={374} y={819} className="gold-label">
        CHEST
      </Abs>
    </>
  );
}

function ClassFeature() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const cls = classOf(c);
  const feature = cls?.classFeatures[0];
  return (
    <>
      <Frame x={-4} y={862} w={424} h={328} bleed="left" />
      <BannerHeader title="CLASS FEATURE" cx={210} y={850} />
      {feature && (
        <Abs x={24} y={886} w={364} h={296} className="feature-text">
          <h3>{feature.name.toUpperCase()}</h3>
          <div className="die-gap" />
          <RichText text={feature.text} />
        </Abs>
      )}
      {feature?.tracker && (
        <button
          type="button"
          className={`die${c.classDie > 0 ? " is-on" : ""}`}
          style={{ left: 335, top: 943 }}
          aria-label={`${feature.name} die, currently ${c.classDie === 0 ? "off" : c.classDie}. Click to advance`}
          onClick={() => update(cycleClassDie)}
        >
          {c.classDie > 0 ? c.classDie : ""}
          <span className="die-size">d{dieSides(feature.tracker.sidesByLevel, c.level)}</span>
        </button>
      )}
    </>
  );
}

/** Name / trait & range / damage, then two feature rules, as printed for every weapon block. */
function WeaponBlock({ y, prefix }: { y: number; prefix: WeaponBlockPrefix }) {
  const c = useCharacter();
  return (
    <>
      <LineField x={452} y={y} w={194} value={text(c, `${prefix}.name`)} label="NAME" />
      <LineField x={652} y={y} w={146} value={text(c, `${prefix}.traitRange`)} label="TRAIT & RANGE" labelAlign="center" />
      <LineField x={802} y={y} w={124} value={text(c, `${prefix}.damage`)} label="DAMAGE DICE & TYPE" labelAlign="center" />
      <Abs x={647} y={y - 17} w={0} h={17} className="vdotted" />
      <Abs x={798} y={y - 17} w={0} h={17} className="vdotted" />
      <Abs x={452} y={y + 6} w={474} h={71} className="feature-lines">
        <FitText text={text(c, `${prefix}.feature`)} max={13} multiline />
      </Abs>
      <Abs x={452} y={y + 44} w={474} className="rule" />
      <Abs x={510} y={y + 77} w={416} className="rule" />
      <Abs x={462} y={y + 48} className="caption">
        FEATURE
      </Abs>
    </>
  );
}

function ActiveWeapons() {
  const c = useCharacter();
  return (
    <>
      <Frame x={432} y={255} w={530} h={322} bleed="right" />
      <BannerHeader title="ACTIVE WEAPONS" cx={690} y={242} w={300} />
      <Abs x={846} y={238} w={52} h={30}>
        <HandsIcon />
      </Abs>
      <Abs x={566} y={269} w={240} h={22} className="prof-plate">
        <span>PROFICIENCY</span>
        <DotTrack value={proficiency(c)} />
      </Abs>
      <Abs x={452} y={289} className="block-title">
        PRIMARY
      </Abs>
      <WeaponBlock y={328} prefix="weapon.primary" />
      <Abs x={452} y={432} className="block-title">
        SECONDARY
      </Abs>
      <WeaponBlock y={472} prefix="weapon.secondary" />
    </>
  );
}

function ActiveArmor() {
  const c = useCharacter();
  return (
    <>
      <Frame x={432} y={592} w={530} h={136} bleed="right" />
      <BannerHeader title="ACTIVE ARMOR" cx={690} y={580} w={260} />
      <LineField x={452} y={634} w={250} value={text(c, "armor.name")} label="NAME" />
      <LineField
        x={708}
        y={634}
        w={120}
        value={text(c, "armor.baseMinor") === "" ? "" : `${text(c, "armor.baseMinor")} / ${text(c, "armor.baseMajor")}`}
        label="BASE THRESHOLDS"
        labelAlign="center"
        numeric
      />
      <LineField x={834} y={634} w={92} value={text(c, "armor.score")} label="BASE SCORE" labelAlign="center" numeric />
      <Abs x={703} y={617} w={0} h={17} className="vdotted" />
      <Abs x={829} y={617} w={0} h={17} className="vdotted" />
      <Abs x={452} y={643} w={474} h={69} className="feature-lines tight">
        <FitText text={text(c, "armor.feature")} max={13} multiline />
      </Abs>
      <Abs x={452} y={680} w={474} className="rule" />
      <Abs x={510} y={712} w={416} className="rule" />
      <Abs x={462} y={684} className="caption">
        FEATURE
      </Abs>
    </>
  );
}

function Inventory() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const tick = (index: 0 | 1, slot: "primary" | "secondary", x: number, y: number) => {
    const on = c.equippedFrom[slot] === index;
    return (
      <>
        <button
          type="button"
          className={`tickbox${on ? " is-on" : ""}`}
          style={{ left: x, top: y }}
          aria-pressed={on}
          aria-label={`Inventory weapon ${index + 1} is my ${slot} weapon`}
          onClick={() => update((ch) => equipFromInventory(ch, index, on ? null : slot))}
        />
        <Abs x={x + 18} y={y + 1} className="tick-label">
          {slot.toUpperCase()}
        </Abs>
      </>
    );
  };
  return (
    <>
      <Frame x={432} y={742} w={530} h={474} bleed="right" />
      <Abs x={432} y={749} w={530 - 0} className="inv-title">
        INVENTORY
      </Abs>
      {[0, 1, 2, 3, 4].map((i) => (
        <LineField key={i} x={452} y={788 + i * 32} w={474} value={text(c, inventoryLinePath(i))} />
      ))}
      {([0, 1] as const).map((i) => {
        const top = 942 + i * 140;
        return (
          <div key={i}>
            <Abs x={452} y={top} className="block-title">
              INVENTORY WEAPON
            </Abs>
            <Abs x={734} y={top - 3} w={40} h={26}>
              <HandsIcon />
            </Abs>
            {tick(i, "primary", 782, top + 2)}
            {tick(i, "secondary", 862, top + 2)}
            <WeaponBlock y={top + 40} prefix={`invWeapon.${i}` as WeaponBlockPrefix} />
          </div>
        );
      })}
    </>
  );
}

export function Page1() {
  return (
    <div className="sheet-page page1" aria-label="Character sheet, page 1">
      <Header />
      <Defense />
      <Traits />
      <Health />
      <Hope />
      <Experience />
      <Gold />
      <ClassFeature />
      <Abs x={15} y={1207} className="footer">
        Daggerheart © Darrington Press 2025
      </Abs>
      <ActiveWeapons />
      <ActiveArmor />
      <Inventory />
    </div>
  );
}
