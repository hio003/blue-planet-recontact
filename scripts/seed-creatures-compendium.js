/**
 * BLUE PLANET RECONTACT — Creatures (Biosurvey) Compendium Seeder
 * Poseidon native fauna from the Field Guide / Biosurvey.
 * Run as a GM Script Macro in Foundry VTT.
 */

const CREATURES_DATA = [
  // ── PELAGIC MEGAFAUNA ─────────────────────────────────────────────────
  {
    name: "Razorback Shark", type: "creature", img: "icons/creatures/fish/fish-eel-electric-blue.webp",
    system: {
      attributes: { awareness: { value: 5 }, coordination: { value: 4, dual: 0 }, physique: { value: 6, dual: 0 } },
      biology: {
        description: "<p>Large pelagic predator resembling a terrestrial shark with prominent dorsal fin ridges. Ambush predator, highly territorial. Common in warm equatorial waters above 200m.</p>",
        behavior: "Aggressive when hungry or disturbed. Will investigate divers but rarely attacks without provocation. Attracted to blood and electrical fields. Pack behavior in juveniles.",
        distribution: "Warm equatorial zones, 0-200m depth. Common near seamounts and reef structures.",
        size: { length: 4.5, mass: 320 },
        encounter_rate: "common", resource_value: "medium", threat_level: "medium"
      },
      attack: { type: "bite", damage: 8, venom: { effect: "", onset: "", damage: 0 } },
      wounds: { minor: 3, major: 2, mortal: 1 },
      status: { condition: "" }
    }
  },
  {
    name: "Abyssal Leviathan", type: "creature", img: "icons/creatures/fish/fish-serpent-coiled-blue.webp",
    system: {
      attributes: { awareness: { value: 4 }, coordination: { value: 3, dual: 0 }, physique: { value: 14, dual: 0 } },
      biology: {
        description: "<p>Enormous deep-water cephalopod-analogue with elongated body reaching 40 meters. Bioluminescent markings. Thought to be semi-intelligent. Rarely encountered above 800m except when ascending to feed at night.</p>",
        behavior: "Solitary and territorial. Hunts by ambush using bioluminescent lures. Surprisingly curious about vessels and remotes. Documented use of tools (rocks) to crack shells.",
        distribution: "Abyssal zones 800-4000m. Occasional night ascents to 200m feeding grounds.",
        size: { length: 40, mass: 18000 },
        encounter_rate: "rare", resource_value: "extreme", threat_level: "extreme"
      },
      attack: { type: "tentacle/crush", damage: 16, venom: { effect: "", onset: "", damage: 0 } },
      wounds: { minor: 8, major: 5, mortal: 3 },
      status: { condition: "" }
    }
  },
  {
    name: "Saltwater Basilisk", type: "creature", img: "icons/creatures/reptiles/lizard-iguana-yellow.webp",
    system: {
      attributes: { awareness: { value: 6 }, coordination: { value: 5, dual: 0 }, physique: { value: 5, dual: 0 } },
      biology: {
        description: "<p>Semi-aquatic ambush predator found in coastal shallows and mangrove-analogue zones. Fast strike, neurotoxic bite. Superficially resembles a large iguana with webbed feet and a flattened tail. 2.5m long.</p>",
        behavior: "Lurks in vegetation near the water surface. Ambushes prey from concealment. Territorial around nest sites during breeding. Venom causes paralysis in 10-30 minutes.",
        distribution: "Tropical coastal shallows, 0-5m. Estuaries, mangrove-analogues, reef margins.",
        size: { length: 2.5, mass: 45 },
        encounter_rate: "common", resource_value: "low", threat_level: "medium"
      },
      attack: { type: "bite", damage: 5, venom: { effect: "Neurotoxic paralysis", onset: "10-30 minutes", damage: 3 } },
      wounds: { minor: 2, major: 1, mortal: 1 },
      status: { condition: "" }
    }
  },
  {
    name: "Storm Manta", type: "creature", img: "icons/creatures/fish/fish-mantaray-blue.webp",
    system: {
      attributes: { awareness: { value: 5 }, coordination: { value: 6, dual: 0 }, physique: { value: 7, dual: 0 } },
      biology: {
        description: "<p>Enormous filter-feeding ray-analogue with 12m wingspan. Peaceful and curious. Generates powerful bioelectric fields used in communication and predator deterrence. Migrates with storm systems.</p>",
        behavior: "Non-aggressive filter feeder. Curious toward divers and vehicles. The bioelectric discharge (4-6m range) is defensive only — triggered by direct contact or sudden alarm. Often travels in pods of 5-20.",
        distribution: "Open ocean, 0-100m. Follows plankton blooms. Circum-equatorial migration.",
        size: { length: 12, mass: 1800 },
        encounter_rate: "uncommon", resource_value: "low", threat_level: "low"
      },
      attack: { type: "bioelectric discharge (defensive)", damage: 6, venom: { effect: "Stun", onset: "immediate", damage: 0 } },
      wounds: { minor: 4, major: 3, mortal: 2 },
      status: { condition: "" }
    }
  },
  {
    name: "Bloodfin Barracuda Pack", type: "creature", img: "icons/creatures/fish/fish-shark-teeth-grey.webp",
    system: {
      attributes: { awareness: { value: 6 }, coordination: { value: 7, dual: 0 }, physique: { value: 3, dual: 0 } },
      biology: {
        description: "<p>Slender, fast schooling predator 1.2m long. Hunts in coordinated packs of 20-100 individuals that attack simultaneously. Single individuals pose little threat; coordinated swarms are lethal.</p>",
        behavior: "Schooling hunter. Single scouts probe prey before calling the pack. Highly attracted to blood, electrical noise, and thrashing motion. Once a feeding frenzy begins, nearly impossible to stop.",
        distribution: "Coastal reefs and open water to 150m. Equatorial and temperate zones.",
        size: { length: 1.2, mass: 3 },
        encounter_rate: "common", resource_value: "medium", threat_level: "high"
      },
      attack: { type: "swarm bite", damage: 10, venom: { effect: "", onset: "", damage: 0 } },
      wounds: { minor: 2, major: 1, mortal: 1 },
      status: { condition: "" }
    }
  },

  // ── BENTHIC & DEEP FAUNA ──────────────────────────────────────────────
  {
    name: "Stoneback Crab", type: "creature", img: "icons/creatures/invertebrates/bug-arachnid-tick.webp",
    system: {
      attributes: { awareness: { value: 3 }, coordination: { value: 3, dual: 0 }, physique: { value: 4, dual: 0 } },
      biology: {
        description: "<p>Large benthic crustacean analogue with heavily armored carapace that mimics rock and coral. Ambush predator of the seafloor. Edible meat of high nutritional value — a colonial food source.</p>",
        behavior: "Sedentary ambush predator. Near-motionless for hours. Strikes with powerful crushing claws when prey passes within 1m. Retreats under shell if threatened by large predators.",
        distribution: "Rocky benthic zones 10-400m. Commonly found near hydrothermal vents.",
        size: { length: 0.8, mass: 18 },
        encounter_rate: "common", resource_value: "high", threat_level: "low"
      },
      attack: { type: "claw crush", damage: 6, venom: { effect: "", onset: "", damage: 0 } },
      wounds: { minor: 2, major: 1, mortal: 1 },
      status: { condition: "" }
    }
  },
  {
    name: "Bioluminescent Jellyfish (Colonial)", type: "creature", img: "icons/creatures/invertebrates/jellyfish-blue.webp",
    system: {
      attributes: { awareness: { value: 1 }, coordination: { value: 1, dual: 0 }, physique: { value: 2, dual: 0 } },
      biology: {
        description: "<p>Colonial organism made of thousands of individual polyps coordinated by chemical signaling. Individual organisms 5-30cm, colonies reaching 50m across. Bioluminescent display used in mating and alarm signaling. Potent contact venom.</p>",
        behavior: "Passive drifter, no directed aggression. Contact with tentacles triggers automatic venom injection. Avoid at all times in the water. Responds to light stimulation with intensified bioluminescence.",
        distribution: "Open water all depths. Especially dense in thermocline zones. Nocturnal bloom events.",
        size: { length: 0.3, mass: 0.05 },
        encounter_rate: "common", resource_value: "low", threat_level: "medium"
      },
      attack: { type: "contact sting", damage: 2, venom: { effect: "Paralytic neurotoxin", onset: "immediate", damage: 4 } },
      wounds: { minor: 1, major: 1, mortal: 1 },
      status: { condition: "" }
    }
  },
  {
    name: "Hydrothermal Vent Worm Cluster", type: "creature", img: "icons/creatures/invertebrates/worm-snake-green.webp",
    system: {
      attributes: { awareness: { value: 2 }, coordination: { value: 2, dual: 0 }, physique: { value: 3, dual: 0 } },
      biology: {
        description: "<p>Tube-worm analogues clustered around hydrothermal vents. Individual worms up to 2m long. Primarily sessile filter feeders. Defensive secretion of superheated water can scald divers at close range. High resource value for pharmaceutical compounds.</p>",
        behavior: "Sessile unless disturbed. Defensive hot water jet reflex when approached within 1m. Chemical secretions have known antimicrobial properties — of extreme pharmaceutical interest.",
        distribution: "Hydrothermal vent fields, 1500-4000m.",
        size: { length: 2, mass: 2 },
        encounter_rate: "uncommon", resource_value: "extreme", threat_level: "low"
      },
      attack: { type: "hot water jet", damage: 4, venom: { effect: "Thermal burn", onset: "immediate", damage: 2 } },
      wounds: { minor: 1, major: 1, mortal: 1 },
      status: { condition: "" }
    }
  },

  // ── COASTAL & ESTUARINE ────────────────────────────────────────────────
  {
    name: "Colonial Seabird Analogue (Flock)", type: "creature", img: "icons/creatures/birds/bird-swallow-blue.webp",
    system: {
      attributes: { awareness: { value: 7 }, coordination: { value: 6, dual: 0 }, physique: { value: 2, dual: 0 } },
      biology: {
        description: "<p>Aerial hunter analogous to terrestrial seabirds. Wing span 1.2m. Hunts surface fish in coordinated diving attacks from height. Colonial nesting in cliff faces — defensive when nested.</p>",
        behavior: "Curious but flighty. Attacks en masse if nesting sites are approached. Useful as natural indicator of fish schools below. Will mob and harass larger predators near nests.",
        distribution: "Coastal zones, island cliff faces. Follows fish schools across open ocean.",
        size: { length: 0.6, mass: 1.2 },
        encounter_rate: "common", resource_value: "low", threat_level: "low"
      },
      attack: { type: "dive/peck swarm", damage: 3, venom: { effect: "", onset: "", damage: 0 } },
      wounds: { minor: 1, major: 1, mortal: 1 },
      status: { condition: "" }
    }
  },
  {
    name: "Tidal Zone Predator Croc-Analogue", type: "creature", img: "icons/creatures/reptiles/lizard-crocodile.webp",
    system: {
      attributes: { awareness: { value: 5 }, coordination: { value: 5, dual: 0 }, physique: { value: 8, dual: 0 } },
      biology: {
        description: "<p>Large semi-aquatic ambush predator of tidal and estuarine zones. 5m body length, powerful armored hide. Death-roll attack drowns prey. Among the most dangerous surface animals a colonial diver can encounter.</p>",
        behavior: "Highly territorial. Ambushes from concealment at the water's edge. Death-roll when prey is seized — nearly impossible to break without weapons. Nocturnal hunter. Attracted to lights at night.",
        distribution: "Tidal zones, estuary systems, mangrove-analogue coastal areas.",
        size: { length: 5, mass: 550 },
        encounter_rate: "uncommon", resource_value: "medium", threat_level: "high"
      },
      attack: { type: "bite + death roll", damage: 12, venom: { effect: "", onset: "", damage: 0 } },
      wounds: { minor: 4, major: 3, mortal: 2 },
      status: { condition: "" }
    }
  },

  // ── OPEN OCEAN MEGAFAUNA ──────────────────────────────────────────────
  {
    name: "Pack Hunter Pod (Medium)", type: "creature", img: "icons/creatures/fish/fish-shark-teeth-grey.webp",
    system: {
      attributes: { awareness: { value: 6 }, coordination: { value: 5, dual: 0 }, physique: { value: 5, dual: 0 } },
      biology: {
        description: "<p>Pod of 4-8 medium-sized open-ocean pack predators (each 3m). Highly coordinated hunting with clear role specialization: distractors, flankers, and primary strikers. Communication through bioelectric pulses.</p>",
        behavior: "Cooperative and strategic hunters. Will test prey with feints before committing. Pod members sacrifice themselves to draw predators away from vulnerable members. Have been observed herding fish schools like terrestrial wolves herd prey.",
        distribution: "Open pelagic zones 0-300m. Follow migratory fish schools.",
        size: { length: 3, mass: 180 },
        encounter_rate: "uncommon", resource_value: "low", threat_level: "high"
      },
      attack: { type: "coordinated bite", damage: 7, venom: { effect: "", onset: "", damage: 0 } },
      wounds: { minor: 3, major: 2, mortal: 1 },
      status: { condition: "" }
    }
  },
  {
    name: "Spore Cloud Organism", type: "creature", img: "icons/magic/nature/leaf-wind-green.webp",
    system: {
      attributes: { awareness: { value: 2 }, coordination: { value: 1, dual: 0 }, physique: { value: 6, dual: 0 } },
      biology: {
        description: "<p>Semi-motile colonial organism that resembles a massive underwater cloud of particles. Engulfs prey in digestive secretions. Individual organism can reach 100m diameter. Moves with current and thermal gradients.</p>",
        behavior: "Passive drift predator. No directed hunting. Contact with the mass begins enzymatic digestion of organic material. Bright light causes retraction reflex. Detected by unusual water opacity and smell.",
        distribution: "Deep thermocline zones 150-600m. Occasional storm-driven surface concentrations.",
        size: { length: 100, mass: 50000 },
        encounter_rate: "rare", resource_value: "low", threat_level: "extreme"
      },
      attack: { type: "engulf/enzymatic digest", damage: 6, venom: { effect: "Continuous acid digestion", onset: "immediate", damage: 3 } },
      wounds: { minor: 10, major: 6, mortal: 4 },
      status: { condition: "" }
    }
  },
];

async function seedCreaturesCompendium() {
  const packName = "blue-planet-recontact.creatures";
  const pack = game.packs.get(packName);
  if (!pack) { ui.notifications.error(`Pack '${packName}' not found!`); return; }
  if (!game.user.isGM) { ui.notifications.warn("Only GMs can seed compendiums."); return; }

  await pack.configure({ locked: false });
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  let added = 0, skipped = 0;

  for (const data of CREATURES_DATA) {
    if (existingNames.has(data.name)) { skipped++; continue; }
    try {
      await Actor.create(data, { pack: packName });
      added++;
    } catch (err) { console.error(`Error creating '${data.name}':`, err); }
  }

  await pack.configure({ locked: true });
  ui.notifications.info(`Creatures compendium seeded: ${added} added, ${skipped} already existed.`);
}

seedCreaturesCompendium();
