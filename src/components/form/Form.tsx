import { Section } from "./fields";
import { IdentitySection } from "./IdentitySection";
import { TraitsSection } from "./TraitsSection";
import { DefenseSection, HealthSection, HopeExperienceSection } from "./StatsSections";
import { ActiveArmorSection, ActiveWeaponsSection, GoldSection, InventorySection, InventoryWeaponsSection } from "./GearSections";
import { ClassFeatureSection } from "./ClassFeatureSection";
import { BackgroundSection, ConnectionsSection, DescriptionSection, LevelUpSection } from "./Page2Sections";

/** Accordion sections in the order they appear on the sheet. */
export function Form() {
  return (
    <div className="form">
      <Section id="identity" title="Identity">
        <IdentitySection />
      </Section>
      <Section id="traits" title="Traits">
        <TraitsSection />
      </Section>
      <Section id="defense" title="Defense">
        <DefenseSection />
      </Section>
      <Section id="health" title="Damage & Health">
        <HealthSection />
      </Section>
      <Section id="hope" title="Hope & Experiences">
        <HopeExperienceSection />
      </Section>
      <Section id="weapons" title="Active Weapons">
        <ActiveWeaponsSection />
      </Section>
      <Section id="armor" title="Active Armor">
        <ActiveArmorSection />
      </Section>
      <Section id="inventory" title="Inventory">
        <InventorySection />
      </Section>
      <Section id="invweapons" title="Inventory Weapons">
        <InventoryWeaponsSection />
      </Section>
      <Section id="gold" title="Gold">
        <GoldSection />
      </Section>
      <Section id="classfeature" title="Class Feature">
        <ClassFeatureSection />
      </Section>
      <Section id="description" title="Page 2: Character Description">
        <DescriptionSection />
      </Section>
      <Section id="background" title="Page 2: Background Questions">
        <BackgroundSection />
      </Section>
      <Section id="connections" title="Page 2: Connections">
        <ConnectionsSection />
      </Section>
      <Section id="levelups" title="Page 2: Level-up Choices">
        <LevelUpSection />
      </Section>
    </div>
  );
}
