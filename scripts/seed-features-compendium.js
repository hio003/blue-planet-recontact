/**
 * BLUE PLANET RECONTACT — Features Compendium Seeder
 * Player's Guide features: backgrounds, contacts, training packages, special abilities.
 * Run as a GM Script Macro in Foundry VTT.
 */

const FEATURES_DATA = [
  // ── TRAINING PACKAGES ─────────────────────────────────────────────────
  { name: "Combat Training: Firearms", type: "feature", img: "icons/weapons/guns/rifle-brown.webp",
    system: { description: "<p>Formal military or law enforcement firearms training. Covers safe handling, maintenance, accurate fire under stress, and tactical movement with firearms.</p>",
      category: "training", feature_type: "training_package", subtype: "combat",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to all ranged combat skill rolls",
      game_rules: "Character gains +2 to ranged attack rolls with any firearm. Also covers maintenance and legal carry knowledge.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Combat Training: Melee", type: "feature", img: "icons/weapons/swords/sword-broad.webp",
    system: { description: "<p>Unarmed and melee weapon combat training. Covers strikes, blocks, throws, weapon retention, and fighting in confined spaces such as aboard vessels.</p>",
      category: "training", feature_type: "training_package", subtype: "combat",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to melee and unarmed combat skill rolls",
      game_rules: "Character gains +2 to melee attack rolls and unarmed combat. Includes fighting in zero-g and underwater basics.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Combat Training: Heavy Weapons", type: "feature", img: "icons/weapons/guns/gun-topbar-tan.webp",
    system: { description: "<p>Training on crew-served weapons, vehicle-mounted systems, and heavy portable weapons. Covers setup, loading, fire missions, and maintenance.</p>",
      category: "training", feature_type: "training_package", subtype: "combat",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to heavy weapons skill rolls; enables crew-served weapon use",
      game_rules: "Without this training, penalty of -3 applies to heavy/crew-served weapons. Training eliminates the penalty and adds +2.",
      cost: 0, availability: "restricted", legality: "restricted" }},

  { name: "Diving Certification (Basic)", type: "feature", img: "icons/magic/water/wave-surge-blue.webp",
    system: { description: "<p>Recreational and occupational diving certification. Covers open-circuit SCUBA to 40m, equipment checks, buddy procedures, emergency ascent, and decompression theory.</p>",
      category: "training", feature_type: "training_package", subtype: "aquatic",
      bonus_type: "skill", bonus_value: 1, effect: "+1 to diving and underwater navigation rolls; enables SCUBA use",
      game_rules: "Character can use basic SCUBA equipment and dive to 40m. +1 to underwater skill rolls.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Diving Certification (Advanced)", type: "feature", img: "icons/magic/water/wave-surge-blue.webp",
    system: { description: "<p>Professional saturation and mixed-gas diving certification. Covers closed-circuit rebreathers, saturation diving, deep work to 300m, decompression management, and emergency procedures.</p>",
      category: "training", feature_type: "training_package", subtype: "aquatic",
      bonus_type: "skill", bonus_value: 3, effect: "+3 to diving; enables professional-grade equipment and deep ops",
      game_rules: "Character can use professional rebreathers, dive to 300m, and manage complex decompression. +3 to underwater navigation and diving skill rolls.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Pilot: Aquatic Vehicles", type: "feature", img: "icons/vehicles/boats/boat-simple-blue.webp",
    system: { description: "<p>Certification to pilot surface vessels and submersibles. Covers boat handling, docking, navigation, emergency procedures, and maritime law. Required for legal operation.</p>",
      category: "training", feature_type: "training_package", subtype: "piloting",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to piloting aquatic vehicles; legal operation rights",
      game_rules: "Without certification, -2 penalty to piloting unfamiliar aquatic vehicles. Certification removes penalty and adds +2.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Pilot: Aerial Vehicles", type: "feature", img: "icons/vehicles/air/jet-fighter-lightning-blue.webp",
    system: { description: "<p>Jumpcraft and aerial vehicle certification. Covers VTOL operations, weather avoidance, instrument flying, and emergency procedures in Poseidon's storm-prone atmosphere.</p>",
      category: "training", feature_type: "training_package", subtype: "piloting",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to aerial piloting; legal operation of licensed aircraft",
      game_rules: "Enables licensed aerial vehicle operation. +2 to all aerial piloting rolls.",
      cost: 0, availability: "restricted", legality: "legal" }},

  { name: "Remote Operations Certification", type: "feature", img: "icons/magic/symbols/runes-etched-steel-blue.webp",
    system: { description: "<p>Formal certification in remote operation. Covers Cold and Warm interface protocols, remote maintenance, operator safety during jackout, and legal liability.</p>",
      category: "training", feature_type: "training_package", subtype: "technology",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to remote operation rolls; legal remote operation rights",
      game_rules: "Character is certified to operate licensed remotes. +2 to remote piloting and interface rolls.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "First Aid & Emergency Medicine", type: "feature", img: "icons/magic/life/cross-area-circle-red-white.webp",
    system: { description: "<p>Trauma first aid, field medicine, and emergency stabilization. Covers wound dressing, immobilization, field surgery prep, hypothermia, and diving injuries.</p>",
      category: "training", feature_type: "training_package", subtype: "medicine",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to Medicine rolls for first aid and emergency stabilization",
      game_rules: "Character can stabilize wounded individuals in the field. +2 to Medicine/Healing rolls for first aid.",
      cost: 0, availability: "common", legality: "legal" }},

  // ── BACKGROUND FEATURES ───────────────────────────────────────────────
  { name: "Colonial Born", type: "feature", img: "icons/environment/settlement/village.webp",
    system: { description: "<p>Character was born and raised in one of Poseidon's ocean colonies. Familiar with colonial life, ocean conditions, and the informal networks that sustain frontier settlements.</p>",
      category: "background", feature_type: "origin", subtype: "colonial",
      bonus_type: "multiple", bonus_value: 1, effect: "+1 AWR in ocean environments; starts with Colony contact",
      game_rules: "Character gains +1 AWR for environmental awareness in Poseidon ocean habitats. Starts play with one trusted colony contact.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Earth Native", type: "feature", img: "icons/environment/settlement/city.webp",
    system: { description: "<p>Character grew up on Earth before emigrating to Poseidon. Has connections back home and understanding of Earth politics, but finds colonial life challenging.</p>",
      category: "background", feature_type: "origin", subtype: "offworld",
      bonus_type: "contact", bonus_value: 1, effect: "Starts with one Earth-side contact; -1 to colonial survival rolls until acclimatized",
      game_rules: "Starts with one powerful Earth contact. First month of play: -1 to survival and navigation rolls in Poseidon environment.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Corporate Employee", type: "feature", img: "icons/skills/trades/merchant-scales-gold.webp",
    system: { description: "<p>Character is employed by or previously worked for one of the major corporations operating on Poseidon. Access to corporate resources, but entangled in corporate politics.</p>",
      category: "background", feature_type: "affiliation", subtype: "corporate",
      bonus_type: "resource", bonus_value: 2, effect: "Corporate gear access; +2 to corporate social interactions; corporate obligations",
      game_rules: "Access to restricted corporate equipment (GM discretion). +2 to social rolls with corporate employees. Must complete occasional corporate obligations.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Military Service", type: "feature", img: "icons/skills/social/diplomacy-peace-war.webp",
    system: { description: "<p>Character served in a colonial or Earth military force. Disciplined, trained in tactics and equipment, with military contacts — and the baggage that service brings.</p>",
      category: "background", feature_type: "affiliation", subtype: "military",
      bonus_type: "multiple", bonus_value: 1, effect: "+1 COO from discipline; military contacts; access to restricted gear through channels",
      game_rules: "Character has a military contact. +1 COO from physical conditioning and discipline. Occasional reserve duty obligations.",
      cost: 0, availability: "common", legality: "legal" }},

  { name: "Cetacean Handler", type: "feature", img: "icons/magic/water/wave-surge-blue.webp",
    system: { description: "<p>Character has extensive experience working alongside cetaceans. Understands cetacean culture, communication, and the unique dynamics of mixed human-cetacean teams.</p>",
      category: "training", feature_type: "cultural", subtype: "cetacean",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to social and coordination rolls with cetaceans; learns basic cetacean",
      game_rules: "Character can communicate basic concepts in cetacean. +2 to Persuasion, Leadership, and teamwork rolls involving cetaceans.",
      cost: 0, availability: "common", legality: "legal" }},

  // ── SPECIAL ABILITIES ─────────────────────────────────────────────────
  { name: "Ambidextrous", type: "feature", img: "icons/skills/movement/arrow-upward-blue.webp",
    system: { description: "<p>Character can use either hand equally well. No off-hand penalty when dual-wielding or when primary hand is injured. Natural trait, cannot be trained.</p>",
      category: "innate", feature_type: "physical", subtype: "trait",
      bonus_type: "none", bonus_value: 0, effect: "No off-hand penalty; no penalty for hand injuries",
      game_rules: "Character suffers no penalty for using either hand. When primary hand is injured, no additional penalty for using other hand.",
      cost: 0, availability: "innate", legality: "legal" }},

  { name: "Eidetic Memory", type: "feature", img: "icons/magic/symbols/runes-etched-gold.webp",
    system: { description: "<p>Perfect recall of visual and auditory information. Character can recite conversations verbatim, reproduce images from memory, and never forgets learned information.</p>",
      category: "innate", feature_type: "cognitive", subtype: "trait",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to recall, research, and knowledge-based skill rolls",
      game_rules: "+2 to all memory-based and research skill rolls. GM may allow recall of specific details without a roll.",
      cost: 0, availability: "innate", legality: "legal" }},

  { name: "Iron Stomach", type: "feature", img: "icons/consumables/food/plate-empty-tan.webp",
    system: { description: "<p>Character can eat almost anything edible on Poseidon without ill effects. Immune to mild food poisoning and can digest local Poseidon fauna that would sicken others.</p>",
      category: "innate", feature_type: "physical", subtype: "trait",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to resist food-based illness; can eat local Poseidon fauna safely",
      game_rules: "+2 to resistance rolls against food poisoning and waterborne illness. Can safely consume most Poseidon native food sources.",
      cost: 0, availability: "innate", legality: "legal" }},

  { name: "Deep Diver", type: "feature", img: "icons/magic/water/water-wave.webp",
    system: { description: "<p>Natural physiological adaptation making the character exceptionally suited for deep water work. Greater lung capacity, lower nitrogen absorption, reduced narcosis effects.</p>",
      category: "innate", feature_type: "physical", subtype: "trait",
      bonus_type: "multiple", bonus_value: 2, effect: "+2 to all underwater endurance; +50% breath hold; reduced narcosis",
      game_rules: "Breath hold duration increased by 50%. +2 to all endurance rolls for underwater operations. Narcosis effects begin 20m deeper than normal.",
      cost: 0, availability: "innate", legality: "legal" }},

  { name: "Ocean Sense", type: "feature", img: "icons/magic/water/wave-water-droplet-teal.webp",
    system: { description: "<p>Intuitive reading of ocean conditions. Character can sense weather changes, currents, and unusual water conditions before instruments confirm them. Invaluable for navigation.</p>",
      category: "innate", feature_type: "perceptual", subtype: "trait",
      bonus_type: "skill", bonus_value: 2, effect: "+2 to navigation and weather prediction at sea; sense danger from ocean conditions",
      game_rules: "+2 to navigation rolls in ocean environments. Character can make passive AWR rolls to sense incoming storms, unusual currents, or danger from Poseidon fauna.",
      cost: 0, availability: "innate", legality: "legal" }},

  { name: "Networked (Information Broker)", type: "feature", img: "icons/skills/social/diplomacy-peace-people.webp",
    system: { description: "<p>Character has an exceptional network of contacts and informants across the colony. Can obtain information, rumors, and restricted intel faster than anyone else on their platform.</p>",
      category: "social", feature_type: "social", subtype: "network",
      bonus_type: "skill", bonus_value: 3, effect: "+3 to information gathering; 3 additional contacts across colony networks",
      game_rules: "Character gains 3 additional named contacts (player chooses types with GM). +3 to any information-gathering roll using personal network.",
      cost: 0, availability: "common", legality: "legal" }},
];

async function seedFeaturesCompendium() {
  const packName = "blue-planet-recontact.features";
  const pack = game.packs.get(packName);
  if (!pack) { ui.notifications.error(`Pack '${packName}' not found!`); return; }
  if (!game.user.isGM) { ui.notifications.warn("Only GMs can seed compendiums."); return; }

  await pack.configure({ locked: false });
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  let added = 0, skipped = 0;

  for (const data of FEATURES_DATA) {
    if (existingNames.has(data.name)) { skipped++; continue; }
    try {
      await Item.create(data, { pack: packName });
      added++;
    } catch (err) { console.error(`Error creating '${data.name}':`, err); }
  }

  await pack.configure({ locked: true });
  ui.notifications.info(`Features compendium seeded: ${added} added, ${skipped} already existed.`);
}

seedFeaturesCompendium();
