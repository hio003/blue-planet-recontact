/**
 * Biomods Compendium Seeder for Blue Planet Recontact
 * Populates the biomods compendium with official biomods from the manual.
 * Run as a GM Script Macro in Foundry VTT.
 */

const BIOMODS_DATA = [
  // --- ANATOMICAL BIOMODS ---
  {
    name: "Dexterity Enhancement",
    type: "biomod",
    img: "icons/svg/hand.svg",
    system: {
      description: "<p>Fine motor control enhancement. +1 Coordination for manual dexterity tasks.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+1 COO for fine motor control tasks only"],
      cost: 8000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Double Joints",
    type: "biomod",
    img: "icons/svg/person.svg",
    system: {
      description: "<p>Hypermobile joints. +1 Coordination for flexibility and contortion tasks. Useful for escaping restraints and acrobatics.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+1 COO for flexibility, escaping restraints, acrobatics"],
      cost: 5000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Subdermal Plates",
    type: "biomod",
    img: "icons/svg/shield.svg",
    system: {
      description: "<p>Hardened subdermal armor plating. +1 natural armor. +1 unarmed damage bonus. Visible as subtle ridges under skin.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 1, unarmed_damage_bonus: 1 },
      special_rules: ["Natural armor +1", "Unarmed damage bonus +1"],
      cost: 12000, availability: "restricted", legality: "legal"
    }
  },
  {
    name: "Rib Coverage (Cubriacostillas)",
    type: "biomod",
    img: "icons/svg/chest.svg",
    system: {
      description: "<p>Enhanced rib cage with interlocking reinforcement. +1 natural armor against torso hits. Provides protection without external bulk.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 1, unarmed_damage_bonus: 0 },
      special_rules: ["+1 natural armor (torso)"],
      cost: 9000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Swim Bladder",
    type: "biomod",
    img: "icons/svg/wave.svg",
    system: {
      description: "<p>Biological buoyancy control organ. +1 to swimming tests. Enables neutral buoyancy at any depth.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+1 to swimming tests", "Neutral buoyancy control"],
      cost: 6000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Webbed Fingers",
    type: "biomod",
    img: "icons/svg/water.svg",
    system: {
      description: "<p>Interdigital webbing for enhanced aquatic propulsion. Swimming speed ×2. Minor penalty to fine manipulation tasks.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["Swimming speed ×2", "-1 to fine manipulation on land"],
      cost: 4000, availability: "common", legality: "legal"
    }
  },
  // --- MEDICAL/METABOLIC BIOMODS ---
  {
    name: "Adrenal Bypass",
    type: "biomod",
    img: "icons/svg/lightning.svg",
    system: {
      description: "<p>Enhanced adrenal system. Removes surprise penalty. +2 COO and PHY in fight-or-flight situations (first round of combat).</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 2, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["No surprise penalty", "+2 COO/PHY first round of combat", "+2 initiative"],
      cost: 15000, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Antivenin",
    type: "biomod",
    img: "icons/svg/medicine.svg",
    system: {
      description: "<p>Enhanced immune response against toxins. +3 bonus to resistance tests against venom, poison, and biological toxins.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+3 to resistance tests vs venom/poison/toxins"],
      cost: 7000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Immunological Symbionts",
    type: "biomod",
    img: "icons/svg/heal.svg",
    system: {
      description: "<p>Symbiotic microorganisms that accelerate healing. Healing time ×2 faster. +1 Physique for recovery tests only.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 1, mortal: 1 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["Healing rate ×2", "+1 PHY for trauma/recovery tests"],
      cost: 18000, availability: "restricted", legality: "legal"
    }
  },
  {
    name: "Enhanced Coagulation",
    type: "biomod",
    img: "icons/svg/blood.svg",
    system: {
      description: "<p>Accelerated blood clotting. +1 to trauma tests. +2 to First Aid tests performed on this character.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+1 trauma tests", "+2 to First Aid tests applied to this character"],
      cost: 10000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Blood Oxygenation",
    type: "biomod",
    img: "icons/svg/lungs.svg",
    system: {
      description: "<p>Enhanced oxygen storage in blood. +2 PHY to endurance and stamina tests. Can hold breath for 10 minutes without penalty.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+2 PHY endurance/stamina tests", "10 min breath-holding without penalty"],
      cost: 11000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Pain Inhibitor",
    type: "biomod",
    img: "icons/svg/brain.svg",
    system: {
      description: "<p>Neural pain suppression. Reduces wound penalties: -1 to major wound penalty, -1 to mortal wound penalty.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 1, mortal: 1 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["Wound penalty -1 for major wounds", "Wound penalty -1 for mortal wounds"],
      cost: 20000, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Longevity Therapy",
    type: "biomod",
    img: "icons/svg/star.svg",
    system: {
      description: "<p>Telomere repair and cellular aging prevention. Character ages at a greatly reduced rate and maintains peak physical condition indefinitely.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["No aging penalties", "Maintains apparent age indefinitely"],
      cost: 47500, availability: "rare", legality: "legal"
    }
  },
  {
    name: "Respiratory Filter",
    type: "biomod",
    img: "icons/svg/wind.svg",
    system: {
      description: "<p>Enhanced lung filtration system. Immunity to airborne contaminants, pollutants, and mild toxic atmospheres.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["Immune to airborne toxins and contaminants", "Functions in mildly contaminated atmospheres"],
      cost: 9000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Multiglands",
    type: "biomod",
    img: "icons/svg/chemistry.svg",
    system: {
      description: "<p>Multiple synthetic endocrine glands that can produce various biochemical compounds on demand. +2 PSY for willpower tests, -1 to wound penalties.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 2, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 1, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+2 PSY for willpower tests", "-1 to wound penalty (all types)", "Various biochemical production"],
      cost: 25000, availability: "restricted", legality: "restricted"
    }
  },
  // --- SENSORY BIOMODS ---
  {
    name: "Amplified Hearing",
    type: "biomod",
    img: "icons/svg/ear.svg",
    system: {
      description: "<p>Enhanced auditory sensitivity. +4 to hearing-based perception tests.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+4 to hearing perception tests"],
      cost: 8000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Enhanced Olfaction",
    type: "biomod",
    img: "icons/svg/nose.svg",
    system: {
      description: "<p>Heightened sense of smell comparable to canines. +4 to olfaction-based tests. Can track a scent trail up to 30 hours old.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+4 to olfaction tests", "Track scent up to 30 hours old"],
      cost: 7000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Echolocation (Biomod)",
    type: "biomod",
    img: "icons/svg/soundwave.svg",
    system: {
      description: "<p>Biological sonar organ. Basic: 100m underwater, 40m in air. Compatible with (and required for) enhanced echolocation upgrade.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["Echolocation 100m underwater / 40m air", "+2 COG to perception tests when active"],
      cost: 22000, availability: "restricted", legality: "legal"
    }
  },
  {
    name: "Night Vision",
    type: "biomod",
    img: "icons/svg/eye.svg",
    system: {
      description: "<p>Enhanced low-light vision. No penalty to vision in darkness or low-light conditions.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["No darkness penalty to vision"],
      cost: 8000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Telescopic Vision",
    type: "biomod",
    img: "icons/svg/telescope.svg",
    system: {
      description: "<p>Magnifying ocular modification. +4 COG to vision tests at long distances. Can see detail at ranges up to 1km clearly.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+4 COG to long-distance vision tests"],
      cost: 9000, availability: "common", legality: "legal"
    }
  },
  // --- FULL BODY BIOMODS ---
  {
    name: "Accelerated Neurons",
    type: "biomod",
    img: "icons/svg/lightning.svg",
    system: {
      description: "<p>Enhanced neural transmission speed. +1 Coordination to reaction-based tests. +1 to initiative.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 1, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+1 COO reaction-based tests", "+1 initiative"],
      cost: 30000, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Body Sculpture",
    type: "biomod",
    img: "icons/svg/person.svg",
    system: {
      description: "<p>Comprehensive aesthetic remodeling with optional functional enhancements. +2 to social manipulation tests when appearance is relevant.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+2 social manipulation when appearance is relevant"],
      cost: 15000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Electromuscular Myoma (Defensive)",
    type: "biomod",
    img: "icons/svg/electricity.svg",
    system: {
      description: "<p>Synthetic muscle fibers that release an electrical discharge on contact. Unarmed attacks stun opponents (successful hit = 1d6 rounds stunned unless PHY test).</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 2 },
      special_rules: ["Stun on unarmed hit (PHY test or stunned 1d6 rounds)", "+2 unarmed damage"],
      cost: 35000, availability: "rare", legality: "restricted"
    }
  },
  {
    name: "GEO Supertrooper Suite",
    type: "biomod",
    img: "icons/svg/military.svg",
    system: {
      description: "<p>Military enhancement package: enhanced musculature, reflexes, and dermal armor. +2 COO, +2 PHY, -1 PSY, +1 natural armor.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: -1, coordination: 2, physique: 2 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 1, unarmed_damage_bonus: 1 },
      special_rules: ["+2 COO", "+2 PHY", "-1 PSY", "+1 natural armor", "+1 unarmed damage"],
      cost: 75000, availability: "military", legality: "military"
    }
  },
  {
    name: "Myoskeletal Improvements (Bruiser)",
    type: "biomod",
    img: "icons/svg/muscle.svg",
    system: {
      description: "<p>Enhanced musculoskeletal system. +1 Physique. +2 to damage reduction from Physique (stacking with natural PHY).</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 2 },
      special_rules: ["+1 PHY", "+2 damage reduction (stacking with Physique dual)"],
      cost: 40000, availability: "restricted", legality: "restricted"
    }
  },
  // --- CETACEAN-SPECIFIC BIOMODS ---
  {
    name: "Autonomous Lineage (Cetacean)",
    type: "biomod",
    img: "icons/svg/fish.svg",
    system: {
      description: "<p>Cetacean-specific modification. +1 COO and +1 PHY specifically for swimming maneuvers.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 1 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["+1 COO swimming maneuvers", "+1 PHY swimming performance"],
      cost: 20000, availability: "restricted", legality: "legal"
    }
  },
  {
    name: "Chromatophoric Pigmentation (Cetacean)",
    type: "biomod",
    img: "icons/svg/palette.svg",
    system: {
      description: "<p>Cetacean color-changing skin cells. Provides underwater camouflage: -4 to detection tests against the cetacean when motionless.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["-4 to detection vs this cetacean when motionless (underwater camouflage)"],
      cost: 18000, availability: "restricted", legality: "legal"
    }
  },
  {
    name: "Enhanced Echolocation (Cetacean)",
    type: "biomod",
    img: "icons/svg/wave.svg",
    system: {
      description: "<p>Upgraded cetacean sonar. Doubles echolocation range (400m underwater, 80m air). Enables sonic stun attack (DR 8). Requires basic echolocation.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["Echolocation range ×2 (400m/80m)", "Sonic stun attack (DR 8, 3d10)", "Requires cetacean echolocation"],
      cost: 35000, availability: "rare", legality: "restricted"
    }
  },
  {
    name: "Analogue Larynx (Cetacean)",
    type: "biomod",
    img: "icons/svg/speech.svg",
    system: {
      description: "<p>Allows cetaceans to produce human speech patterns. Enables verbal communication in air without equipment.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["Can produce human speech without technology", "Cetaceans only"],
      cost: 12000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Systemic Osmoform (Cetacean)",
    type: "biomod",
    img: "icons/svg/droplet.svg",
    system: {
      description: "<p>Enhanced gill system for cetaceans, allowing extended deep-water operation without surfacing. Doubles maximum dive duration.</p>",
      type: "genetic",
      active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      special_rules: ["Doubles maximum dive duration", "Enhanced deep-water operation"],
      cost: 25000, availability: "restricted", legality: "legal"
    }
  }
];

async function seedBiomodsCompendium() {
  const packName = "blue-planet-recontact.biomods";
  const pack = game.packs.get(packName);
  
  if (!pack) {
    ui.notifications.error(`Pack '${packName}' not found!`);
    return;
  }
  
  if (!game.user.isGM) {
    ui.notifications.warn("Only GMs can seed compendiums.");
    return;
  }
  
  await pack.configure({ locked: false });
  
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  
  let added = 0;
  let skipped = 0;
  
  for (const biomodData of BIOMODS_DATA) {
    if (existingNames.has(biomodData.name)) {
      skipped++;
      continue;
    }
    
    try {
      await Item.create(biomodData, { pack: packName });
      added++;
      console.log(`BluePlanet Seed: Created biomod '${biomodData.name}'`);
    } catch (err) {
      console.error(`BluePlanet Seed: Error creating '${biomodData.name}':`, err);
    }
  }
  
  await pack.configure({ locked: true });
  
  ui.notifications.info(`Biomods compendium seeded: ${added} added, ${skipped} already existed.`);
}

seedBiomodsCompendium();
