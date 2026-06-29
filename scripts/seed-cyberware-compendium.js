/**
 * BLUE PLANET RECONTACT — Cyberware (Hardware) Compendium Seeder
 * Player's Guide hardware implants: neural interfaces, combat systems, utilities.
 * Run as a GM Script Macro in Foundry VTT.
 */

const CYBERWARE_DATA = [
  // ── NEURAL INTERFACES ──────────────────────────────────────────────────
  {
    name: "Neural Interface (Cold)", type: "cyberware", img: "icons/magic/symbols/runes-etched-steel-blue.webp",
    system: {
      description: "<p>Basic neural-machine interface. Allows Cold interface with vehicles, remotes, and equipment without physical controls. Standard civilian-grade NI.</p>",
      type: "implant", active: true,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["Cold interface with NI-compatible equipment"],
      installation_time: "4 hours", recovery_time: "1 week",
      dimensions: "Cortical implant 2cm", models: "NovaTech NI-Cold, Dynacorp BasicLink",
      power_requirements: "Biological (self-powered)", maintenance_interval: "Annual",
      special_rules: ["Enables Cold interface without physical controls"],
      cost: 8000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Neural Interface (Warm)", type: "cyberware", img: "icons/magic/symbols/runes-etched-steel-blue.webp",
    system: {
      description: "<p>Enhanced neural interface supporting Warm interface protocols. Faster response and more intuitive control than Cold NI. Military and professional grade.</p>",
      type: "implant", active: true,
      attributes: { cognition: 1, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["Warm interface", "+1 COG for interfaced operations"],
      installation_time: "6 hours", recovery_time: "2 weeks",
      dimensions: "Cortical implant 3cm", models: "NovaTech NI-Warm, BioMech WarmLink",
      power_requirements: "Biological (self-powered)", maintenance_interval: "Annual",
      special_rules: ["Enables Warm interface", "+1 COG when interfacing"],
      cost: 22000, availability: "restricted", legality: "legal"
    }
  },
  {
    name: "Neural Interface (Hot)", type: "cyberware", img: "icons/magic/symbols/runes-etched-blue.webp",
    system: {
      description: "<p>Full-immersion Hot interface system. Complete sensory integration with remote systems. Operator's perception fully inhabits the remote or vehicle. Extreme response time.</p>",
      type: "implant", active: true,
      attributes: { cognition: 2, psyche: 0, coordination: 1, physique: 0 },
      strain_modifiers: { mental: 1, physical: 0 },
      mechanics: { initiative_bonus: 1, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["Hot interface", "+2 COG and +1 COO when interfacing", "+1 Initiative in Hot mode"],
      installation_time: "12 hours", recovery_time: "4 weeks",
      dimensions: "Full cortical array 4cm + spine tap", models: "NovaTech GI System, BioMech HotDeck",
      power_requirements: "Biological (self-powered)", maintenance_interval: "6 months",
      special_rules: ["Enables Hot interface", "+2 COG, +1 COO when hotlinked", "Mental strain on jackout"],
      cost: 85000, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Combat Reflex Booster", type: "cyberware", img: "icons/skills/movement/arrow-upward-blue.webp",
    system: {
      description: "<p>Accelerated reflex package: enhanced motor cortex connections, pre-loaded combat subroutines, predictive threat modeling. Grants faster reactions in combat.</p>",
      type: "implant", active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 2, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["+2 Initiative", "+1 COO in combat"],
      installation_time: "8 hours", recovery_time: "3 weeks",
      dimensions: "Cortical and spine implants", models: "BioMech CombatR, Dynacorp ReflexX",
      power_requirements: "Biological (self-powered)", maintenance_interval: "Annual",
      special_rules: ["+2 to Initiative rolls", "+1 COO for combat actions only"],
      cost: 45000, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Targeting Computer", type: "cyberware", img: "icons/weapons/ammunition/arrow-head-war-flight.webp",
    system: {
      description: "<p>Integrated targeting system. Overlays ballistic solutions on visual field. Accounts for range, wind, target movement, and ammunition type. Improves first-shot accuracy.</p>",
      type: "implant", active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["+1 COO for aimed ranged shots", "Reduces range penalties by 1"],
      installation_time: "6 hours", recovery_time: "2 weeks",
      dimensions: "Optical and cortical implants", models: "Dynacorp TacSight, NovaTech BullsEye",
      power_requirements: "Low-power cell (1 week)", maintenance_interval: "6 months",
      special_rules: ["+1 COO for ranged attacks when aimed", "Range penalties reduced by 1"],
      cost: 35000, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Subdermal Armor Plating", type: "cyberware", img: "icons/equipment/chest/breastplate-steel-grey.webp",
    system: {
      description: "<p>Flexible titanium-ceramic armor plates implanted beneath skin. Provides constant protection without bulk. Slightly visible as subtle geometric ridges.</p>",
      type: "implant", active: true,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 1 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 2, unarmed_damage_bonus: 0 },
      effects: ["+2 natural armor", "Always active"],
      installation_time: "16 hours (multiple sessions)", recovery_time: "6 weeks",
      dimensions: "Distributed plates throughout torso/limbs", models: "BioMech PlateR",
      power_requirements: "None", maintenance_interval: "Every 3 years",
      special_rules: ["+2 natural armor at all times", "Cannot be removed without surgery"],
      cost: 60000, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Cyberarm (Standard)", type: "cyberware", img: "icons/equipment/hand/gauntlet-layered-leather-grey.webp",
    system: {
      description: "<p>Full prosthetic cybernetic arm. Matches human strength and dexterity. Can be equipped with tool modules. Withstands harsh environments without degradation.</p>",
      type: "prosthetic", active: true,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 1, unarmed_damage_bonus: 1 },
      effects: ["+1 PHY for arm-related tasks", "+1 unarmed damage", "+1 natural armor (arm)"],
      installation_time: "8 hours", recovery_time: "4 weeks",
      dimensions: "Full arm replacement", models: "BioMech CyberLimb Mk2, Dynacorp Prosth-Arm",
      power_requirements: "Low-power cell (1 month)", maintenance_interval: "6 months",
      special_rules: ["+1 PHY for arm strength", "+1 unarmed damage", "Tool-mount socket included"],
      cost: 40000, availability: "common", legality: "legal"
    }
  },
  {
    name: "Cyberarm (Combat)", type: "cyberware", img: "icons/equipment/hand/gauntlet-layered-steel.webp",
    system: {
      description: "<p>Military-grade combat prosthetic. Reinforced frame, hardened servos, optional integrated weapon mount. Significantly stronger than standard cyberarm.</p>",
      type: "prosthetic", active: true,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 2 },
      strain_modifiers: { mental: 0, physical: 1 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 2, unarmed_damage_bonus: 2 },
      effects: ["+2 PHY for arm tasks", "+2 unarmed damage", "+2 natural armor (arm)", "Weapon mount socket"],
      installation_time: "10 hours", recovery_time: "6 weeks",
      dimensions: "Full arm replacement (heavier)", models: "BioMech CombatLimb, Dynacorp WarArm",
      power_requirements: "Standard cell (1 week)", maintenance_interval: "3 months",
      special_rules: ["+2 PHY strength in arm", "+2 unarmed damage", "Can mount one weapon"],
      cost: 95000, availability: "military", legality: "restricted"
    }
  },
  {
    name: "Cybereye (Multispectrum)", type: "cyberware", img: "icons/magic/perception/eye-ringed-blue.webp",
    system: {
      description: "<p>Prosthetic eye with multispectrum optics: visible, low-light, infrared, and UV. Integrated telescopic zoom to 10x. Records 72hr of footage. Standard HUD overlay.</p>",
      type: "implant", active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["Low-light vision", "Infrared vision", "UV vision", "10x telescopic zoom", "HUD display", "72hr recording"],
      installation_time: "3 hours", recovery_time: "1 week",
      dimensions: "Eye socket replacement", models: "NovaTech Optic Pro, Dynacorp VisionX",
      power_requirements: "Low-power cell (3 months)", maintenance_interval: "Annual",
      special_rules: ["No penalties in low-light or darkness", "Infrared vision 50m", "+1 AWR for visual perception tasks"],
      cost: 28000, availability: "restricted", legality: "legal"
    }
  },
  {
    name: "Subvocal Communicator", type: "cyberware", img: "icons/skills/social/diplomacy-peace-people.webp",
    system: {
      description: "<p>Throat implant for subvocal communication. Detects minimal throat vibrations and transmits. Inaudible to anyone nearby. Paired with cochlear implant for receive.</p>",
      type: "implant", active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["Silent communication", "Range: standard comm (100m)", "Cannot be detected externally"],
      installation_time: "2 hours", recovery_time: "3 days",
      dimensions: "Throat implant 1cm", models: "NovaTech SubVox, SonoEdge Whisper",
      power_requirements: "Low-power cell (6 months)", maintenance_interval: "2 years",
      special_rules: ["Communicate without moving lips", "100m standard range (extendable with relay)"],
      cost: 4500, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Pain Editor", type: "cyberware", img: "icons/magic/symbols/chevrons-up-blue.webp",
    system: {
      description: "<p>Neural pain-gate implant. Allows user to selectively suppress pain signals. Enables continued function despite serious wounds. Potential for overexertion injury without feedback.</p>",
      type: "implant", active: false,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 1, mortal: 1 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["Reduces wound penalties: -1 to Major wound penalty, -1 to Mortal wound penalty"],
      installation_time: "4 hours", recovery_time: "2 weeks",
      dimensions: "Spinal implant", models: "BioMech PainGate, NovaTech StayOn",
      power_requirements: "Biological (self-powered)", maintenance_interval: "Annual",
      special_rules: ["Wound penalty from Major wounds reduced by 1", "Wound penalty from Mortal wounds reduced by 1"],
      cost: 55000, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Toxin Filter (Internal)", type: "cyberware", img: "icons/magic/water/water-splash-blue.webp",
    system: {
      description: "<p>Internal filtration system in liver and kidneys. Neutralizes most common toxins and pathogens. Slows intoxication. Essential for working in contaminated waters.</p>",
      type: "implant", active: true,
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
      strain_modifiers: { mental: 0, physical: 0 },
      mechanics: { initiative_bonus: 0, wound_penalty_reduction: { major: 0, mortal: 0 }, natural_armor: 0, unarmed_damage_bonus: 0 },
      effects: ["+1 PHY for resisting toxins/pathogens", "Slows alcohol/drug effects 50%", "Filters common contaminants"],
      installation_time: "6 hours", recovery_time: "3 weeks",
      dimensions: "Liver/kidney augmentation", models: "BioMech FilterR, NovaTech PureBody",
      power_requirements: "Biological (self-powered)", maintenance_interval: "Annual",
      special_rules: ["+1 PHY for toxin resistance tests", "Immune to mild contaminants"],
      cost: 18000, availability: "common", legality: "legal"
    }
  },
];

async function seedCyberwareCompendium() {
  const packName = "blue-planet-recontact.cyberware";
  const pack = game.packs.get(packName);
  if (!pack) { ui.notifications.error(`Pack '${packName}' not found!`); return; }
  if (!game.user.isGM) { ui.notifications.warn("Only GMs can seed compendiums."); return; }

  await pack.configure({ locked: false });
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  let added = 0, skipped = 0;

  for (const data of CYBERWARE_DATA) {
    if (existingNames.has(data.name)) { skipped++; continue; }
    try {
      await Item.create(data, { pack: packName });
      added++;
    } catch (err) { console.error(`Error creating '${data.name}':`, err); }
  }

  await pack.configure({ locked: true });
  ui.notifications.info(`Cyberware compendium seeded: ${added} added, ${skipped} already existed.`);
}

seedCyberwareCompendium();
