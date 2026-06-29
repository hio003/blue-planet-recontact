/**
 * Species Mechanics for Blue Planet Recontact
 * Automatically applies species-based attribute modifiers and abilities
 * when a species item is assigned to a character.
 */

/**
 * Catalogue of species modifiers according to Blue Planet Recontact rules.
 * Keys correspond to species item names (case-insensitive).
 * Values define attribute mods and special abilities.
 */
export const SPECIES_CATALOGUE = {
  // Base human – no modifiers
  "human": {
    label: "Human",
    attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 0 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: [],
    notes: "Baseline species. No attribute modifiers."
  },

  // Aquaform (Diver)
  "aquaform": {
    label: "Aquaform (Diver)",
    attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: ["Aquatic Breathing", "Enhanced Swimming (+2 to aquatic skill tests)"],
    notes: "+1 Physique. +2 bonus to aquatic skill tests. Can breathe underwater."
  },

  // Feline Hybrid
  "hybrid feline": {
    label: "Hybrid Feline",
    attributes: { cognition: 0, psyche: 1, coordination: 2, physique: -1 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: ["Low-Light Vision", "Enhanced Reflexes"],
    notes: "+1 Psyche, +2 Coordination, -1 Physique."
  },
  "feline": {
    label: "Hybrid Feline",
    attributes: { cognition: 0, psyche: 1, coordination: 2, physique: -1 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: ["Low-Light Vision", "Enhanced Reflexes"],
    notes: "+1 Psyche, +2 Coordination, -1 Physique."
  },

  // Silva Hybrid
  "hybrid silva": {
    label: "Hybrid Silva",
    attributes: { cognition: 0, psyche: -1, coordination: 0, physique: 3 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: ["Endurance (+2 resistance tests)", "Natural Toughness"],
    notes: "-1 Psyche, +3 Physique."
  },
  "silva": {
    label: "Hybrid Silva",
    attributes: { cognition: 0, psyche: -1, coordination: 0, physique: 3 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: ["Endurance (+2 resistance tests)", "Natural Toughness"],
    notes: "-1 Psyche, +3 Physique."
  },

  // Spacer
  "spacer": {
    label: "Spacer",
    attributes: { cognition: 0, psyche: 0, coordination: 2, physique: -1 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: ["Zero-G Adaptation (+2 Coordination in microgravity)"],
    notes: "-1 Physique, +2 Coordination in zero-gravity environments."
  },

  // Transhuman
  "transhuman": {
    label: "Transhuman",
    attributes: { cognition: 1, psyche: 0, coordination: 0, physique: 0 },
    strain_modifiers: { mental: 1, physical: 0 },
    special_abilities: ["Enhanced Processing", "Neural Interface Affinity (+2 to hot-interface tests)"],
    notes: "+1 to two chosen attributes (defaults to +1 Cognition). +1 Mental Strain capacity."
  },

  // Composite (Mestizo)
  "composite": {
    label: "Composite (Mestizo)",
    attributes: { cognition: -1, psyche: -2, coordination: 2, physique: 2 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: ["Mixed Heritage", "Versatile Training"],
    notes: "-1 Cognition, -2 Psyche, +2 Coordination, +2 Physique."
  },
  "mestizo": {
    label: "Composite (Mestizo)",
    attributes: { cognition: -1, psyche: -2, coordination: 2, physique: 2 },
    strain_modifiers: { mental: 0, physical: 0 },
    special_abilities: ["Mixed Heritage", "Versatile Training"],
    notes: "-1 Cognition, -2 Psyche, +2 Coordination, +2 Physique."
  },

  // PHE (Skink)
  "phe": {
    label: "PHE (Skink)",
    attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 2 },
    strain_modifiers: { mental: 0, physical: 1 },
    special_abilities: ["Damage Reduction (+2 Physique for damage soak)", "Thermal Regulation"],
    notes: "+1 Coordination, +2 Physique. +1 Physical Strain capacity. +2 Physique for damage reduction (not other purposes)."
  },
  "skink": {
    label: "PHE (Skink)",
    attributes: { cognition: 0, psyche: 0, coordination: 1, physique: 2 },
    strain_modifiers: { mental: 0, physical: 1 },
    special_abilities: ["Damage Reduction (+2 Physique for damage soak)", "Thermal Regulation"],
    notes: "+1 Coordination, +2 Physique. +1 Physical Strain capacity."
  },

  // Homo Superstes (Survivor)
  "homo superstes": {
    label: "Homo Superstes (Survivor)",
    attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
    strain_modifiers: { mental: 0, physical: 1 },
    special_abilities: ["Enhanced Constitution", "Survivor's Resilience (+1 trauma tests)"],
    notes: "+1 Physique. +1 Physical Strain capacity."
  },
  "survivor": {
    label: "Homo Superstes (Survivor)",
    attributes: { cognition: 0, psyche: 0, coordination: 0, physique: 1 },
    strain_modifiers: { mental: 0, physical: 1 },
    special_abilities: ["Enhanced Constitution", "Survivor's Resilience (+1 trauma tests)"],
    notes: "+1 Physique. +1 Physical Strain capacity."
  },

  // Cognitivo Sinergista (Brainchild)
  "cognitivo sinergista": {
    label: "Cognitivo Sinergista (Brainchild)",
    attributes: { cognition: 3, psyche: 2, coordination: 0, physique: 0 },
    strain_modifiers: { mental: 2, physical: 0 },
    special_abilities: ["Enhanced Cognition", "Neural Overclock (+3 COG temporarily, +1 mental strain per use)", "Synergistic Processing"],
    notes: "+3 Cognition. -2 or +3 Psyche (variable). +1 or +2 Mental Strain capacity."
  },
  "brainchild": {
    label: "Cognitivo Sinergista (Brainchild)",
    attributes: { cognition: 3, psyche: 2, coordination: 0, physique: 0 },
    strain_modifiers: { mental: 2, physical: 0 },
    special_abilities: ["Enhanced Cognition", "Neural Overclock", "Synergistic Processing"],
    notes: "+3 Cognition. Variable Psyche. +1–2 Mental Strain capacity."
  },

  // Cetacean (generic)
  "cetacean": {
    label: "Cetacean",
    attributes: { cognition: 2, psyche: 0, coordination: 0, physique: 4 },
    strain_modifiers: { mental: 0, physical: 2 },
    special_abilities: [
      "Echolocation (passive 3D spatial awareness)",
      "Deep Diving",
      "Aquatic Maneuverability (+2 COO for 3D maneuvers)",
      "Remote Constellations (+4 COG with sonar/radar vs +2 for humans)"
    ],
    notes: "Cetacean species. +2 Cognition, +4 Physique. +2 Physical Strain. Echolocation, deep diving, and remote control bonuses."
  },

  // Dolphin
  "dolphin": {
    label: "Dolphin (Cetacean)",
    attributes: { cognition: 2, psyche: 1, coordination: 2, physique: 2 },
    strain_modifiers: { mental: 0, physical: 1 },
    special_abilities: ["Echolocation (100m underwater, 40m air)", "Aquatic Maneuverability", "Social Cognition (+1 PSY social tests)"],
    notes: "+2 COG, +1 PSY, +2 COO, +2 PHY. +1 Physical Strain."
  },

  // Orca
  "orca": {
    label: "Orca (Cetacean)",
    attributes: { cognition: 1, psyche: 0, coordination: 1, physique: 6 },
    strain_modifiers: { mental: 0, physical: 3 },
    special_abilities: ["Echolocation (enhanced, 200m)", "Apex Predator (intimidation +8 vs humans)", "Deep Diving", "Sonic Stun (stun attack vs unprotected targets)"],
    notes: "+1 COG, +1 COO, +6 PHY. +3 Physical Strain. Large body with powerful attacks."
  },

  // Sperm Whale (Cachalote)
  "sperm whale": {
    label: "Sperm Whale (Cetacean)",
    attributes: { cognition: 2, psyche: 1, coordination: 0, physique: 8 },
    strain_modifiers: { mental: 1, physical: 4 },
    special_abilities: ["Echolocation (enhanced, 400m)", "Sonic Stun (stun at range)", "Deep Diving (extreme depth)", "Intimidation (+8 all species)"],
    notes: "+2 COG, +1 PSY, +8 PHY. +1 Mental, +4 Physical Strain. Most powerful cetacean."
  },

  // Beluga
  "beluga": {
    label: "Beluga (Cetacean)",
    attributes: { cognition: 2, psyche: 2, coordination: 2, physique: 2 },
    strain_modifiers: { mental: 1, physical: 1 },
    special_abilities: ["Echolocation (precision)", "Vocal Mimicry", "Social Intelligence (+2 PSY communication tests)"],
    notes: "+2 COG, +2 PSY, +2 COO, +2 PHY. +1 Mental, +1 Physical Strain."
  }
};

/**
 * Get species data by name (case-insensitive, partial match supported)
 * @param {string} speciesName - Name of the species
 * @returns {Object|null} Species data or null if not found
 */
export function getSpeciesData(speciesName) {
  if (!speciesName) return null;
  const key = speciesName.toLowerCase().trim();
  
  // Exact match first
  if (SPECIES_CATALOGUE[key]) return SPECIES_CATALOGUE[key];
  
  // Partial match
  for (const [catalogKey, data] of Object.entries(SPECIES_CATALOGUE)) {
    if (key.includes(catalogKey) || catalogKey.includes(key)) {
      return data;
    }
  }
  
  return null;
}

/**
 * Apply species modifiers from a species item to an actor.
 * Called when a species item is dropped onto a character sheet.
 * @param {Actor} actor - The actor to update
 * @param {Item} speciesItem - The species item
 * @returns {Promise<void>}
 */
export async function applySpeciesToActor(actor, speciesItem) {
  if (!actor || !speciesItem || speciesItem.type !== 'species') return;

  const speciesData = speciesItem.system;
  const speciesName = speciesItem.name;
  
  // Get catalogue data for default modifiers
  const catalogueData = getSpeciesData(speciesName);
  
  // Merge catalogue data with item data (item data takes precedence)
  const attrMods = {
    cognition: Number(speciesData.attributes?.cognition || 0) || (catalogueData?.attributes?.cognition || 0),
    psyche: Number(speciesData.attributes?.psyche || 0) || (catalogueData?.attributes?.psyche || 0),
    coordination: Number(speciesData.attributes?.coordination || 0) || (catalogueData?.attributes?.coordination || 0),
    physique: Number(speciesData.attributes?.physique || 0) || (catalogueData?.attributes?.physique || 0)
  };
  
  const strainMods = catalogueData?.strain_modifiers || { mental: 0, physical: 0 };
  const specialAbilities = catalogueData?.special_abilities || speciesData.special_abilities || [];
  
  // Build update object
  const updateData = {
    'system.species': speciesName
  };
  
  // Store species modifiers so they can be shown in UI
  updateData['system.speciesModifiers'] = {
    name: speciesName,
    attributes: attrMods,
    strain_modifiers: strainMods,
    special_abilities: specialAbilities,
    notes: catalogueData?.notes || ''
  };
  
  await actor.update(updateData);
  
  // Build notification message
  const mods = [];
  if (attrMods.cognition !== 0) mods.push(`COG ${attrMods.cognition > 0 ? '+' : ''}${attrMods.cognition}`);
  if (attrMods.psyche !== 0) mods.push(`PSY ${attrMods.psyche > 0 ? '+' : ''}${attrMods.psyche}`);
  if (attrMods.coordination !== 0) mods.push(`COO ${attrMods.coordination > 0 ? '+' : ''}${attrMods.coordination}`);
  if (attrMods.physique !== 0) mods.push(`PHY ${attrMods.physique > 0 ? '+' : ''}${attrMods.physique}`);
  if (strainMods.mental !== 0) mods.push(`Mental Strain ${strainMods.mental > 0 ? '+' : ''}${strainMods.mental}`);
  if (strainMods.physical !== 0) mods.push(`Physical Strain ${strainMods.physical > 0 ? '+' : ''}${strainMods.physical}`);
  
  const modText = mods.length > 0 ? `: ${mods.join(', ')}` : ' (no attribute modifiers)';
  ui.notifications.info(`Species set to ${speciesName}${modText}. Apply attribute modifiers manually if needed.`);
  
  if (specialAbilities.length > 0) {
    ui.notifications.info(`${speciesName} special abilities: ${specialAbilities.join(', ')}`);
  }
  
  console.log(`BluePlanet Species: Applied ${speciesName} to ${actor.name}`, { attrMods, strainMods, specialAbilities });
}

/**
 * Get the effective attribute value for an actor, including species modifiers.
 * Species modifiers from the species item are stored in system.speciesModifiers
 * and should be applied on top of base attributes.
 * 
 * NOTE: This is informational – the actual attribute values must be set manually
 * by the player during character creation per Blue Planet rules.
 * Species modifiers are applied during character creation, not automatically
 * during play (to avoid double-counting).
 * 
 * @param {Actor} actor - The actor
 * @param {string} attributeName - Attribute name
 * @returns {Object} {base, speciesMod, total}
 */
export function getAttributeWithSpeciesMod(actor, attributeName) {
  const base = actor.system.attributes?.[attributeName]?.value || 0;
  const speciesMod = actor.system.speciesModifiers?.attributes?.[attributeName] || 0;
  return { base, speciesMod, total: base + speciesMod };
}

/**
 * Register Hooks for species mechanics
 */
export function registerSpeciesMechanicsHooks() {
  // When a species item is dropped on a character sheet, auto-apply modifiers
  Hooks.on('dropActorSheetData', async (actor, sheet, data) => {
    if (data.type !== 'Item') return;
    
    try {
      const item = await fromUuid(data.uuid);
      if (item && item.type === 'species') {
        // Small delay to let Foundry finish the drop
        setTimeout(async () => {
          await applySpeciesToActor(actor, item);
        }, 500);
      }
    } catch (err) {
      console.warn('BluePlanet Species: Error in drop hook:', err);
    }
  });
  
  console.log('BluePlanet Species: Hooks registered');
}
