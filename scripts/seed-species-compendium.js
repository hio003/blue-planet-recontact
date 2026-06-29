/**
 * Species Compendium Seeder for Blue Planet Recontact
 * 
 * Run this script as a GM macro in Foundry VTT to populate
 * the species compendium with all official species from the manual.
 * 
 * Usage: Copy this code into a Script Macro and run it as GM.
 */

const SPECIES_DATA = [
  {
    name: "Human",
    type: "species",
    img: "icons/svg/statue.svg",
    system: {
      description: "<p>The baseline species of Blue Planet. Humans have no attribute modifiers but are the most numerous and politically influential species in the setting.</p>",
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
      special_abilities: ["Adaptable (one free skill at General level during character creation)"],
      size_category: "medium",
      cost: 0,
      availability: "common",
      legality: "legal"
    }
  },
  {
    name: "Aquaform (Diver)",
    type: "species",
    img: "icons/svg/water.svg",
    system: {
      description: "<p>Genetic modification of human stock for aquatic adaptation. Aquaforms have enhanced physique and can breathe underwater, making them ideally suited for life on Poseidon.</p><p><strong>Modifiers:</strong> +1 Physique. +2 bonus to all aquatic skill tests. Can breathe underwater (osmoforme systémique equivalent).</p>",
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
      special_abilities: ["Aquatic Breathing", "Aquatic Skill Bonus (+2)", "Pressure Adaptation"],
      size_category: "medium",
      cost: 0,
      availability: "common",
      legality: "legal"
    }
  },
  {
    name: "Hybrid Feline",
    type: "species",
    img: "icons/svg/pawprint.svg",
    system: {
      description: "<p>Human-feline genetic hybrid created for enhanced agility and reflexes. Feline hybrids are prized for security and athletics roles.</p><p><strong>Modifiers:</strong> +1 Psyche, +2 Coordination, -1 Physique. Low-light vision, enhanced balance.</p>",
      attributes: { cognition: 0, psyche: 1, coordination: 2, physique: -1 },
      special_abilities: ["Low-Light Vision", "Enhanced Reflexes (+1 initiative)", "Balance (+2 acrobatics)"],
      size_category: "medium",
      cost: 0,
      availability: "restricted",
      legality: "legal"
    }
  },
  {
    name: "Hybrid Silva",
    type: "species",
    img: "icons/svg/oak.svg",
    system: {
      description: "<p>Human-primate genetic hybrid engineered for strength and endurance. Silva hybrids are exceptional in physical labor and survival situations.</p><p><strong>Modifiers:</strong> -1 Psyche, +3 Physique. Enhanced constitution and resilience.</p>",
      attributes: { cognition: 0, psyche: -1, coordination: 0, physique: 3 },
      special_abilities: ["Enhanced Constitution", "Natural Endurance (+2 resistance tests)", "Climbing (+2)"],
      size_category: "medium",
      cost: 0,
      availability: "restricted",
      legality: "legal"
    }
  },
  {
    name: "Spacer",
    type: "species",
    img: "icons/svg/sun.svg",
    system: {
      description: "<p>Adapted for life in microgravity environments. Spacers have enhanced coordination in zero-G but reduced physique compared to planetside humans.</p><p><strong>Modifiers:</strong> -1 Physique, +2 Coordination (in zero-gravity). Enhanced vestibular system.</p>",
      attributes: { cognition: 0, psyche: 0, coordination: 2, physique: -1 },
      special_abilities: ["Zero-G Adaptation (+2 COO in microgravity)", "Spatial Awareness", "Radiation Tolerance (+1)"],
      size_category: "medium",
      cost: 0,
      availability: "common",
      legality: "legal"
    }
  },
  {
    name: "Transhuman",
    type: "species",
    img: "icons/svg/brain.svg",
    system: {
      description: "<p>Enhanced humans with broad genetic modifications. Transhumans receive +1 to two chosen attributes during character creation and have an affinity for neural interfaces.</p><p><strong>Modifiers:</strong> +1 to two chosen attributes (noted here as COG). +1 Mental Strain capacity. +2 to hot-interface tests.</p>",
      attributes: { cognition: 1, psyche: 0, coordination: 0, physique: 0 },
      special_abilities: ["Neural Interface Affinity (+2 hot-interface)", "Adaptive Cognition", "Enhanced Immune System"],
      size_category: "medium",
      cost: 0,
      availability: "restricted",
      legality: "legal"
    }
  },
  {
    name: "Composite (Mestizo)",
    type: "species",
    img: "icons/svg/dna.svg",
    system: {
      description: "<p>Mixed genetic heritage from multiple modification lines. Composites are physically powerful but struggle with cognitive and social integration.</p><p><strong>Modifiers:</strong> -1 Cognition, -2 Psyche, +2 Coordination, +2 Physique.</p>",
      attributes: { cognition: -1, psyche: -2, coordination: 2, physique: 2 },
      special_abilities: ["Hybrid Vigor (+1 physical endurance)", "Mixed Heritage (diverse cultural backgrounds)"],
      size_category: "medium",
      cost: 0,
      availability: "common",
      legality: "legal"
    }
  },
  {
    name: "PHE (Skink)",
    type: "species",
    img: "icons/svg/lizard.svg",
    system: {
      description: "<p>Post-Human Evolution: reptilian characteristics for extreme environment adaptation. PHEs have exceptional physical resilience and natural damage reduction.</p><p><strong>Modifiers:</strong> +1 Coordination, +2 Physique, +1 Physical Strain capacity. +2 Physique used specifically for damage reduction (soak).</p>",
      attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 2 },
      special_abilities: ["Damage Reduction (Physique +2 for damage soak only)", "Thermal Regulation", "Dermal Scales (+1 natural armor)"],
      size_category: "medium",
      cost: 0,
      availability: "restricted",
      legality: "restricted"
    }
  },
  {
    name: "Homo Superstes (Survivor)",
    type: "species",
    img: "icons/svg/shield.svg",
    system: {
      description: "<p>Genetically selected for survival traits in hostile environments. Survivors are exceptionally hardy and have enhanced trauma resistance.</p><p><strong>Modifiers:</strong> +1 Physique, +1 Physical Strain capacity. +1 to trauma tests.</p>",
      attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
      special_abilities: ["Trauma Resistance (+1 trauma tests)", "Enhanced Constitution", "Adaptive Metabolism"],
      size_category: "medium",
      cost: 0,
      availability: "common",
      legality: "legal"
    }
  },
  {
    name: "Cognitivo Sinergista (Brainchild)",
    type: "species",
    img: "icons/svg/lightning.svg",
    system: {
      description: "<p>Extreme cognitive enhancement at the cost of physical capability. Brainchildren are extraordinary thinkers but struggle with the social and physical demands of the world.</p><p><strong>Modifiers:</strong> +3 Cognition. Variable Psyche (-2 or +3 depending on subtype). +1 or +2 Mental Strain capacity. Neural Overclock ability.</p>",
      attributes: { cognition: 3, psyche: 2, coordination: 0, physique: 0 },
      special_abilities: ["Neural Overclock (+3 COG temporarily, costs 1 mental strain per use)", "Synergistic Processing", "Enhanced Memory"],
      size_category: "medium",
      cost: 0,
      availability: "restricted",
      legality: "restricted"
    }
  },
  {
    name: "Cetacean (Dolphin)",
    type: "species",
    img: "icons/svg/wave.svg",
    system: {
      description: "<p>Uplifted dolphins with full sapience. Dolphins are agile, social, and excellent communicators. They serve as scouts, pilots, and remote operators in Poseidon's oceans.</p><p><strong>Modifiers:</strong> +2 COG, +1 PSY, +2 COO, +2 PHY. +1 Physical Strain. Echolocation (100m/40m). +2 COG with sonar/radar. Remote constellation +4 COG.</p>",
      attributes: { cognition: 2, psyche: 1, coordination: 2, physique: 2 },
      special_abilities: [
        "Echolocation (100m underwater, 40m air)",
        "Remote Constellation (+4 COG vs +2 for humans)",
        "3D Maneuverability (+2 COO complex maneuvers)",
        "Social Cognition (+1 PSY social tests)",
        "Aquatic Speed (superior swimming)"
      ],
      size_category: "large",
      cost: 0,
      availability: "common",
      legality: "legal"
    }
  },
  {
    name: "Cetacean (Orca)",
    type: "species",
    img: "icons/svg/anchor.svg",
    system: {
      description: "<p>Uplifted orcas. The apex predators of Poseidon's seas. Orcas combine exceptional physical power with strategic intelligence, making them feared warriors and commanders.</p><p><strong>Modifiers:</strong> +1 COG, +1 COO, +6 PHY. +3 Physical Strain. Enhanced echolocation (200m). Intimidation +8 vs humans swimming.</p>",
      attributes: { cognition: 1, psyche: 0, coordination: 1, physique: 6 },
      special_abilities: [
        "Echolocation (200m underwater, 60m air)",
        "Remote Constellation (+4 COG)",
        "Apex Predator (Intimidation +8 vs humans swimming)",
        "3D Maneuverability (+2 COO)",
        "Pack Tactics"
      ],
      size_category: "huge",
      cost: 0,
      availability: "restricted",
      legality: "legal"
    }
  },
  {
    name: "Cetacean (Sperm Whale)",
    type: "species",
    img: "icons/svg/mountain.svg",
    system: {
      description: "<p>Uplifted sperm whales (cachalotes). The most powerful and cognitively gifted cetaceans. Their sonic abilities can stun or kill and their echolocation range is extraordinary.</p><p><strong>Modifiers:</strong> +2 COG, +1 PSY, +8 PHY. +1 Mental, +4 Physical Strain. Enhanced echolocation (400m). Sonic stun attack (DR 12). Intimidation +8.</p>",
      attributes: { cognition: 2, psyche: 1, coordination: 0, physique: 8 },
      special_abilities: [
        "Enhanced Echolocation (400m underwater, 80m air)",
        "Sonic Stun Attack (DR 12, 3d10 test)",
        "Remote Constellation (+4 COG)",
        "Intimidation +8 (all species)",
        "Deep Diving (extreme depths)",
        "3D Maneuverability (+2 COO)"
      ],
      size_category: "gargantuan",
      cost: 0,
      availability: "rare",
      legality: "legal"
    }
  },
  {
    name: "Cetacean (Beluga)",
    type: "species",
    img: "icons/svg/snowflake.svg",
    system: {
      description: "<p>Uplifted belugas. Known for their vocal mimicry and high social intelligence. Belugas are excellent diplomats and communication specialists.</p><p><strong>Modifiers:</strong> +2 COG, +2 PSY, +2 COO, +2 PHY. +1 Mental, +1 Physical Strain. Precision echolocation. Vocal mimicry.</p>",
      attributes: { cognition: 2, psyche: 2, coordination: 2, physique: 2 },
      special_abilities: [
        "Precision Echolocation (100m, enhanced resolution)",
        "Vocal Mimicry (can replicate sounds/voices)",
        "Social Intelligence (+2 PSY communication tests)",
        "Remote Constellation (+4 COG)",
        "3D Maneuverability (+2 COO)"
      ],
      size_category: "large",
      cost: 0,
      availability: "common",
      legality: "legal"
    }
  }
];

// Run the seeder
async function seedSpeciesCompendium() {
  const packName = "blue-planet-recontact.species";
  const pack = game.packs.get(packName);
  
  if (!pack) {
    ui.notifications.error(`Pack '${packName}' not found! Check system.json pack configuration.`);
    return;
  }
  
  if (!game.user.isGM) {
    ui.notifications.warn("Only GMs can seed compendiums.");
    return;
  }
  
  // Unlock pack for editing
  await pack.configure({ locked: false });
  
  // Check existing entries
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  
  let added = 0;
  let skipped = 0;
  
  for (const speciesData of SPECIES_DATA) {
    if (existingNames.has(speciesData.name)) {
      skipped++;
      continue;
    }
    
    try {
      await Item.create(speciesData, { pack: packName });
      added++;
      console.log(`BluePlanet Seed: Created species '${speciesData.name}'`);
    } catch (err) {
      console.error(`BluePlanet Seed: Error creating '${speciesData.name}':`, err);
    }
  }
  
  // Re-lock the pack
  await pack.configure({ locked: true });
  
  ui.notifications.info(`Species compendium seeded: ${added} added, ${skipped} already existed.`);
  console.log(`BluePlanet: Species seeding complete. Added: ${added}, Skipped: ${skipped}`);
}

// Execute
seedSpeciesCompendium();
