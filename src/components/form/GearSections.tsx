import { ARMOR } from "../../data/armor";
import { WEAPONS } from "../../data/weapons";
import { MAX_GOLD } from "../../data/common";
import type { Weapon } from "../../data/schema";
import { changeGold, selectInventoryWeapon, setInventoryChoice, toggleChest } from "../../state/actions";
import { classOf, getArmor, isTwoHanded, secondaryAvailable } from "../../state/derive";
import { useCharacter, useSheet } from "../../state/store";
import { equipFromInventory, selectArmor, selectWeapon, inventoryLinePath, type WeaponBlockPrefix } from "../../state/suggestions";
import { Note, OverrideInput, Row, SelectField } from "./fields";

function WeaponOptions({ list }: { list: Weapon[] }) {
  return (
    <>
      {[1, 2, 3, 4].map((tier) => (
        <optgroup key={tier} label={`Tier ${tier}`}>
          {list
            .filter((w) => w.tier === tier)
            .map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );
}

const PRIMARY = WEAPONS.filter((w) => w.slot === "primary");
const SECONDARY = WEAPONS.filter((w) => w.slot === "secondary");

function WeaponFields({ prefix }: { prefix: WeaponBlockPrefix }) {
  return (
    <>
      <OverrideInput label="Name" path={`${prefix}.name`} />
      <Row>
        <OverrideInput label="Trait & range" path={`${prefix}.traitRange`} />
        <OverrideInput label="Damage dice & type" path={`${prefix}.damage`} />
      </Row>
      <OverrideInput label="Feature" path={`${prefix}.feature`} multiline />
    </>
  );
}

export function ActiveWeaponsSection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const secondaryOk = secondaryAvailable(c);
  return (
    <>
      <h3>Primary</h3>
      <SelectField label="Primary weapon" value={c.weaponIds.primary ?? ""} onChange={(v) => update((ch) => selectWeapon(ch, "primary", v || null))}>
        <option value="">Custom / none</option>
        <WeaponOptions list={PRIMARY} />
      </SelectField>
      <WeaponFields prefix="weapon.primary" />
      <h3>Secondary</h3>
      <SelectField
        label="Secondary weapon"
        value={c.weaponIds.secondary ?? ""}
        disabled={!secondaryOk}
        onChange={(v) => update((ch) => selectWeapon(ch, "secondary", v || null))}
      >
        <option value="">Custom / none</option>
        <WeaponOptions list={SECONDARY} />
      </SelectField>
      {!secondaryOk && <Note>A Two-Handed primary weapon leaves no hand free, so the secondary is cleared.</Note>}
      {secondaryOk && <WeaponFields prefix="weapon.secondary" />}
    </>
  );
}

export function ActiveArmorSection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const armor = getArmor(c.armorId);
  return (
    <>
      <SelectField label="Armor" value={c.armorId ?? ""} onChange={(v) => update((ch) => selectArmor(ch, v || null))}>
        <option value="">No armor</option>
        {[1, 2, 3, 4].map((tier) => (
          <optgroup key={tier} label={`Tier ${tier}`}>
            {ARMOR.filter((a) => a.tier === tier).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </optgroup>
        ))}
      </SelectField>
      <OverrideInput label="Name" path="armor.name" />
      <Row>
        <OverrideInput label="Base minor threshold" path="armor.baseMinor" numeric />
        <OverrideInput label="Base major threshold" path="armor.baseMajor" numeric />
        <OverrideInput label="Base score" path="armor.score" numeric />
      </Row>
      <OverrideInput label="Feature" path="armor.feature" multiline />
      {armor && Object.keys(armor.modifiers).length > 0 && <Note>This armor’s modifiers are applied to your Evasion and traits automatically.</Note>}
    </>
  );
}

export function InventorySection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const cls = classOf(c);
  return (
    <>
      {cls && (
        <fieldset>
          <legend>Starting items</legend>
          <p className="note">Take: {cls.startingInventory.take.join(", ")}.</p>
          {cls.startingInventory.chooseOne.map((group, gi) => (
            <fieldset key={gi} className="choice">
              <legend>{gi === 0 ? "Then choose between" : "And either"}</legend>
              {group.map((opt) => (
                <label key={opt} className="check">
                  <input type="radio" name={`choice-${gi}`} checked={c.inventoryChoices[String(gi)] === opt} onChange={() => update((ch) => setInventoryChoice(ch, gi, opt))} />
                  {opt}
                </label>
              ))}
            </fieldset>
          ))}
        </fieldset>
      )}
      <h3>Inventory lines</h3>
      {[0, 1, 2, 3, 4].map((i) => (
        <OverrideInput key={i} label={`Line ${i + 1}`} path={inventoryLinePath(i)} />
      ))}
    </>
  );
}

export function InventoryWeaponsSection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  return (
    <>
      {([0, 1] as const).map((i) => {
        const prefix = `invWeapon.${i}` as WeaponBlockPrefix;
        const primaryOk = true;
        const secondaryOk = !isTwoHanded(c.weaponIds.primary) || c.equippedFrom.secondary === i;
        return (
          <div key={i} className="inv-weapon">
            <h3>Inventory weapon {i + 1}</h3>
            <SelectField label="Weapon" value={c.inventoryWeaponIds[i] ?? ""} onChange={(v) => update((ch) => selectInventoryWeapon(ch, i, v || null))}>
              <option value="">Custom / none</option>
              <WeaponOptions list={WEAPONS} />
            </SelectField>
            <WeaponFields prefix={prefix} />
            <div className="row">
              <label className="check">
                <input
                  type="checkbox"
                  checked={c.equippedFrom.primary === i}
                  disabled={!primaryOk}
                  onChange={(e) => update((ch) => equipFromInventory(ch, i, e.target.checked ? "primary" : null))}
                />
                Primary
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={c.equippedFrom.secondary === i}
                  disabled={!secondaryOk}
                  onChange={(e) => update((ch) => equipFromInventory(ch, i, e.target.checked ? "secondary" : null))}
                />
                Secondary
              </label>
            </div>
          </div>
        );
      })}
      <Note>Ticking Primary or Secondary copies this weapon into the Active Weapons block.</Note>
    </>
  );
}

export function GoldSection() {
  const c = useCharacter();
  const update = useSheet((s) => s.update);
  const unit = (label: string, kind: "handfuls" | "bags", max: number) => (
    <div className="field stepper" role="group" aria-label={label}>
      <span className="label">{label}</span>
      <div className="stepper-ctl">
        <button type="button" aria-label={`Remove one of ${label}`} onClick={() => update((ch) => changeGold(ch, kind, -1))}>
          −
        </button>
        <output>
          {c.gold[kind]} / {max}
        </output>
        <button type="button" aria-label={`Add one of ${label}`} onClick={() => update((ch) => changeGold(ch, kind, 1))}>
          +
        </button>
      </div>
    </div>
  );
  return (
    <>
      <Row>
        {unit("Handfuls", "handfuls", MAX_GOLD.handfuls)}
        {unit("Bags", "bags", MAX_GOLD.bags)}
        <label className="check">
          <input type="checkbox" checked={c.gold.chest === 1} onChange={() => update(toggleChest)} />
          Chest
        </label>
      </Row>
      <Note>10 handfuls make a bag and 10 bags make a chest; adding past the limit carries over.</Note>
    </>
  );
}
