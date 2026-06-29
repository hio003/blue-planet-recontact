/**
 * BLUE PLANET RECONTACT — Weapons Compendium Seeder
 * Player's Guide weapons: melee, pistols, rifles, shotguns, support, heavy, underwater.
 * Run as a GM Script Macro in Foundry VTT.
 */

const WEAPONS_DATA = [
  // ── MELEE ────────────────────────────────────────────────────────────────
  {
    name: "Combat Knife", type: "weapon", img: "icons/weapons/daggers/dagger-curved-black.webp",
    system: {
      description: "<p>Standard military combat knife. Reliable in any environment including underwater.</p>",
      weapon_type: "melee", damage: 4, effective_range: 1, durability: 8,
      dimensions: "25cm / 0.3kg", models: "Various", features: ["underwater", "concealable"],
      recoil_penalty: 0, magazine_capacity: 0, current_ammo: 0,
      range_modifiers: { short: 0, medium: -2, long: -4, extreme: -6 },
      cost: 80, availability: "common", legality: "legal"
    }
  },
  {
    name: "Vibroblade", type: "weapon", img: "icons/weapons/daggers/dagger-serrated-blue.webp",
    system: {
      description: "<p>Mono-molecular edge with ultrasonic vibration. Exceptional armor penetration. Can cut through most materials.</p>",
      weapon_type: "melee", damage: 6, effective_range: 1, durability: 6,
      dimensions: "30cm / 0.4kg", models: "SonoEdge Mk3, Dynacorp VibroBlade",
      features: ["armor_piercing", "underwater"],
      recoil_penalty: 0, magazine_capacity: 0, current_ammo: 0,
      range_modifiers: { short: 0, medium: -2, long: -4, extreme: -6 },
      cost: 1200, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Mono-Filament Whip", type: "weapon", img: "icons/weapons/thrown/whip.webp",
    system: {
      description: "<p>Monomolecular filament on a weighted handle. Extreme cutting power, difficult to see. Dangerous to the user without training.</p>",
      weapon_type: "melee", damage: 8, effective_range: 3, durability: 4,
      dimensions: "50cm handle / 0.6kg", models: "SonoEdge MonoLash",
      features: ["armor_piercing", "reach", "difficult"],
      recoil_penalty: 0, magazine_capacity: 0, current_ammo: 0,
      range_modifiers: { short: 0, medium: -2, long: -6, extreme: -10 },
      cost: 2800, availability: "restricted", legality: "illegal"
    }
  },
  {
    name: "Stun Baton", type: "weapon", img: "icons/weapons/clubs/club-simple.webp",
    system: {
      description: "<p>Electroshock baton. Delivers 50,000V on contact. Non-lethal option for law enforcement and security.</p>",
      weapon_type: "melee", damage: 3, effective_range: 1, durability: 7,
      dimensions: "50cm / 0.8kg", models: "Dynacorp ShockStaff, Poseidon Security PS-5",
      features: ["non_lethal", "stun", "powered"],
      recoil_penalty: 0, magazine_capacity: 0, current_ammo: 0,
      range_modifiers: { short: 0, medium: -2, long: -4, extreme: -6 },
      cost: 350, availability: "common", legality: "legal"
    }
  },
  {
    name: "Underwater Spear", type: "weapon", img: "icons/weapons/polearms/spear-ornate.webp",
    system: {
      description: "<p>Pneumatic-assisted spear optimized for aquatic combat. Effective at range underwater. Reloadable by hand.</p>",
      weapon_type: "melee", damage: 5, effective_range: 8, durability: 7,
      dimensions: "1.5m / 1.2kg", models: "Poseidon Aquatics SpearGun Pro",
      features: ["underwater", "ranged_melee"],
      recoil_penalty: 0, magazine_capacity: 1, current_ammo: 1,
      range_modifiers: { short: 0, medium: 0, long: -2, extreme: -4 },
      cost: 420, availability: "common", legality: "legal"
    }
  },

  // ── PISTOLS ───────────────────────────────────────────────────────────────
  {
    name: "10mm Autopistol", type: "weapon", img: "icons/weapons/guns/gun-pistol-brown-yellow.webp",
    system: {
      description: "<p>Standard sidearm chambered in 10mm. High reliability, good stopping power for a pistol. The workhorse of law enforcement and military personnel on Poseidon.</p>",
      weapon_type: "pistol", damage: 7, effective_range: 30, durability: 9,
      dimensions: "20cm / 0.9kg", models: "Dynacorp P10, Poseidon Arms PA-10",
      features: ["semi_auto", "concealable"],
      recoil_penalty: 0, magazine_capacity: 15, current_ammo: 15,
      compatible_ammo: ["10mm Standard", "10mm AP", "10mm HP", "10mm Frangible"],
      range_modifiers: { short: 0, medium: -1, long: -3, extreme: -5 },
      cost: 800, availability: "common", legality: "legal"
    }
  },
  {
    name: "5mm Holdout Pistol", type: "weapon", img: "icons/weapons/guns/gun-pistol-flintlock-black.webp",
    system: {
      description: "<p>Ultra-compact concealed carry pistol chambered in 5mm. Limited stopping power but easily hidden. Favored by couriers and diplomats.</p>",
      weapon_type: "pistol", damage: 5, effective_range: 15, durability: 7,
      dimensions: "12cm / 0.4kg", models: "SonoEdge Whisper, NovaTech Pocket",
      features: ["concealable", "semi_auto"],
      recoil_penalty: 0, magazine_capacity: 8, current_ammo: 8,
      compatible_ammo: ["5mm Standard", "5mm HP"],
      range_modifiers: { short: 0, medium: -2, long: -4, extreme: -6 },
      cost: 500, availability: "common", legality: "legal"
    }
  },
  {
    name: "15mm Heavy Pistol", type: "weapon", img: "icons/weapons/guns/gun-pistol-red-yellow.webp",
    system: {
      description: "<p>Large-frame pistol firing 15mm rounds. Substantial stopping power and armor penetration. Heavy recoil requires training.</p>",
      weapon_type: "pistol", damage: 10, effective_range: 40, durability: 9,
      dimensions: "28cm / 1.4kg", models: "Dynacorp Hammer, BioMech Arms BM-15",
      features: ["semi_auto", "high_recoil"],
      recoil_penalty: -1, magazine_capacity: 10, current_ammo: 10,
      compatible_ammo: ["15mm Standard", "15mm AP", "15mm HP"],
      range_modifiers: { short: 0, medium: -1, long: -3, extreme: -5 },
      cost: 1400, availability: "restricted", legality: "legal"
    }
  },
  {
    name: "Needler Pistol", type: "weapon", img: "icons/weapons/guns/gun-pistol-yellow.webp",
    system: {
      description: "<p>Compressed-air pistol firing ceramic flechettes. Near-silent, leaves no bullet, effective underwater. Commonly used by assassins and covert operatives.</p>",
      weapon_type: "pistol", damage: 5, effective_range: 20, durability: 6,
      dimensions: "18cm / 0.5kg", models: "SonoEdge Needle, NovaTech Whisper",
      features: ["silent", "underwater", "concealable", "flechette"],
      recoil_penalty: 0, magazine_capacity: 20, current_ammo: 20,
      compatible_ammo: ["Flechette Standard", "Flechette Toxin", "Flechette AP"],
      range_modifiers: { short: 0, medium: -1, long: -3, extreme: -5 },
      cost: 1800, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Gel Pistol", type: "weapon", img: "icons/weapons/guns/gun-pistol-flintlock.webp",
    system: {
      description: "<p>Non-lethal pistol firing high-viscosity gel rounds. Stuns without penetrating. Standard issue for many security forces requiring non-lethal takedowns.</p>",
      weapon_type: "pistol", damage: 4, effective_range: 20, durability: 8,
      dimensions: "22cm / 0.7kg", models: "Poseidon Security PS-Gel, Dynacorp PacifyR",
      features: ["non_lethal", "semi_auto"],
      recoil_penalty: 0, magazine_capacity: 12, current_ammo: 12,
      compatible_ammo: ["Gel Round Standard", "Gel Round Neurostun"],
      range_modifiers: { short: 0, medium: -1, long: -3, extreme: -5 },
      cost: 600, availability: "common", legality: "legal"
    }
  },

  // ── RIFLES & CARBINES ─────────────────────────────────────────────────────
  {
    name: "10mm Assault Rifle", type: "weapon", img: "icons/weapons/guns/rifle-brown.webp",
    system: {
      description: "<p>Standard military assault rifle in 10mm. Select-fire with burst and full-auto modes. Reliable in marine environments with salt-water resistant finish.</p>",
      weapon_type: "rifle", damage: 8, effective_range: 150, durability: 9,
      dimensions: "80cm / 3.2kg", models: "Dynacorp AR-10, BioMech Arms Typhoon",
      features: ["semi_auto", "burst_fire", "full_auto", "marine_resistant"],
      recoil_penalty: -1, magazine_capacity: 30, current_ammo: 30,
      compatible_ammo: ["10mm Standard", "10mm AP", "10mm HP", "10mm Tracer"],
      range_modifiers: { short: 0, medium: 0, long: -1, extreme: -3 },
      cost: 2200, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "5mm PDW", type: "weapon", img: "icons/weapons/guns/gun-pistol-flintlock-black.webp",
    system: {
      description: "<p>Personal Defense Weapon in compact 5mm carbine format. High rate of fire in a small package. Popular among vehicle crews and support personnel.</p>",
      weapon_type: "rifle", damage: 6, effective_range: 80, durability: 8,
      dimensions: "55cm / 2.1kg", models: "NovaTech PDW-5, Dynacorp Compact",
      features: ["semi_auto", "full_auto", "concealable"],
      recoil_penalty: 0, magazine_capacity: 50, current_ammo: 50,
      compatible_ammo: ["5mm Standard", "5mm AP", "5mm HP"],
      range_modifiers: { short: 0, medium: 0, long: -2, extreme: -4 },
      cost: 1600, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "7mm Sniper Rifle", type: "weapon", img: "icons/weapons/guns/rifle-antique.webp",
    system: {
      description: "<p>Precision long-range rifle in 7mm. Bolt-action with optical sight. Used by military snipers and wildlife surveyors needing to tag creatures from distance.</p>",
      weapon_type: "rifle", damage: 11, effective_range: 600, durability: 9,
      dimensions: "120cm / 4.8kg", models: "Poseidon Arms Longreach, Dynacorp Scout",
      features: ["bolt_action", "precision", "scope_included"],
      recoil_penalty: -2, magazine_capacity: 5, current_ammo: 5,
      compatible_ammo: ["7mm Standard", "7mm AP", "7mm Match", "7mm Subsonic"],
      range_modifiers: { short: -2, medium: 0, long: 0, extreme: -1 },
      cost: 4800, availability: "restricted", legality: "restricted"
    }
  },
  {
    name: "Underwater Rifle (UWR)", type: "weapon", img: "icons/weapons/guns/rifle-brown.webp",
    system: {
      description: "<p>Purpose-built assault rifle for underwater combat. Fires supercavitating flechettes effective to 30m submerged. Also usable on surface with reduced range.</p>",
      weapon_type: "rifle", damage: 7, effective_range: 30, durability: 8,
      dimensions: "75cm / 3.0kg", models: "BioMech Arms AquaStrike, Poseidon UWR-3",
      features: ["underwater", "semi_auto", "burst_fire", "supercavitating"],
      recoil_penalty: 0, magazine_capacity: 20, current_ammo: 20,
      compatible_ammo: ["UWR Flechette Standard", "UWR Flechette AP"],
      range_modifiers: { short: 0, medium: 0, long: -2, extreme: -4 },
      cost: 3400, availability: "restricted", legality: "restricted"
    }
  },

  // ── SHOTGUNS ──────────────────────────────────────────────────────────────
  {
    name: "12g Combat Shotgun", type: "weapon", img: "icons/weapons/guns/rifle-bayonet.webp",
    system: {
      description: "<p>12-gauge pump-action shotgun. Devastating at close range. Standard aboard colonial vessels for breach-and-clear operations.</p>",
      weapon_type: "shotgun", damage: 12, effective_range: 30, durability: 9,
      dimensions: "90cm / 3.5kg", models: "Dynacorp Breach, Poseidon Arms PA-12",
      features: ["pump_action", "spread_fire"],
      recoil_penalty: -2, magazine_capacity: 8, current_ammo: 8,
      compatible_ammo: ["12g Buckshot", "12g Slug", "12g Flechette", "12g Less-Lethal"],
      range_modifiers: { short: 0, medium: -2, long: -5, extreme: -8 },
      cost: 900, availability: "common", legality: "legal"
    }
  },
  {
    name: "12g Auto-Shotgun", type: "weapon", img: "icons/weapons/guns/rifle-bayonet.webp",
    system: {
      description: "<p>Semi-automatic shotgun with box magazine. High capacity for sustained fire. Heavy but formidable in close quarters.</p>",
      weapon_type: "shotgun", damage: 12, effective_range: 30, durability: 8,
      dimensions: "95cm / 4.2kg", models: "Dynacorp AutoBreach",
      features: ["semi_auto", "spread_fire", "high_capacity"],
      recoil_penalty: -2, magazine_capacity: 12, current_ammo: 12,
      compatible_ammo: ["12g Buckshot", "12g Slug", "12g Flechette", "12g Less-Lethal"],
      range_modifiers: { short: 0, medium: -2, long: -5, extreme: -8 },
      cost: 1800, availability: "restricted", legality: "legal"
    }
  },

  // ── SUPPORT WEAPONS ───────────────────────────────────────────────────────
  {
    name: "Light Machine Gun (LMG)", type: "weapon", img: "icons/weapons/guns/gun-topbar-tan.webp",
    system: {
      description: "<p>Squad automatic weapon providing suppressive fire. Belt-fed with high ammunition capacity. Requires bipod for accurate sustained fire.</p>",
      weapon_type: "support", damage: 8, effective_range: 400, durability: 9,
      dimensions: "100cm / 7.5kg", models: "BioMech Arms Torrent, Dynacorp SAW",
      features: ["full_auto", "belt_fed", "bipod", "suppressive"],
      recoil_penalty: -2, magazine_capacity: 100, current_ammo: 100,
      compatible_ammo: ["10mm Standard", "10mm AP", "10mm Tracer"],
      range_modifiers: { short: 0, medium: 0, long: -1, extreme: -2 },
      cost: 8500, availability: "military", legality: "military_only"
    }
  },
  {
    name: "Grenade Launcher (UGL)", type: "weapon", img: "icons/weapons/guns/rifle-brown.webp",
    system: {
      description: "<p>Underbarrel grenade launcher in 40mm. Mounts beneath an assault rifle or used standalone. Single-shot with break-open loading.</p>",
      weapon_type: "support", damage: 14, effective_range: 200, durability: 8,
      dimensions: "35cm underslung / 1.4kg", models: "Dynacorp GL-40, BioMech Arms Pounder",
      features: ["explosive", "area_effect", "single_shot"],
      recoil_penalty: -2, magazine_capacity: 1, current_ammo: 1,
      compatible_ammo: ["40mm HE", "40mm Smoke", "40mm Flashbang", "40mm Gas"],
      range_modifiers: { short: -2, medium: 0, long: -1, extreme: -3 },
      cost: 2400, availability: "military", legality: "military_only"
    }
  },
  {
    name: "Rocket Launcher (LRAW)", type: "weapon", img: "icons/weapons/guns/gun-topbar-yellow.webp",
    system: {
      description: "<p>Light Recoilless Anti-armor Weapon. Single-use disposable rocket launcher. Effective against vehicles, strongpoints, and large creatures. Launch and discard.</p>",
      weapon_type: "support", damage: 22, effective_range: 300, durability: 6,
      dimensions: "90cm / 3.2kg (loaded)", models: "Dynacorp LRAW-1 (disposable)",
      features: ["explosive", "anti_vehicle", "single_use", "backblast"],
      recoil_penalty: -3, magazine_capacity: 1, current_ammo: 1,
      compatible_ammo: ["LRAW Warhead"],
      range_modifiers: { short: -2, medium: 0, long: 0, extreme: -2 },
      cost: 1200, availability: "military", legality: "military_only"
    }
  },
  {
    name: "Flamethrower", type: "weapon", img: "icons/magic/fire/flame-burning-orange-yellow.webp",
    system: {
      description: "<p>Military flamethrower with fuel backpack. Ignites targets and creates persistent fire zones. Highly effective against Poseidon's native fauna. Backpack holds ~15 seconds of fuel.</p>",
      weapon_type: "support", damage: 10, effective_range: 15, durability: 7,
      dimensions: "80cm nozzle + backpack / 18kg", models: "Dynacorp FlameStar, BioMech Torch",
      features: ["fire", "area_effect", "continuous_fire", "fuel_tank"],
      recoil_penalty: 0, magazine_capacity: 15, current_ammo: 15,
      compatible_ammo: ["Napalm Fuel Canister"],
      range_modifiers: { short: 0, medium: -2, long: -6, extreme: -10 },
      cost: 4200, availability: "military", legality: "military_only"
    }
  },

  // ── UNDERWATER HEAVY ──────────────────────────────────────────────────────
  {
    name: "Torpedo Pistol", type: "weapon", img: "icons/weapons/guns/gun-pistol-brown-yellow.webp",
    system: {
      description: "<p>Compressed-gas pistol firing micro-torpedoes. Purpose-built for deep-water combat at range. Effective against armored targets underwater.</p>",
      weapon_type: "pistol", damage: 10, effective_range: 50, durability: 7,
      dimensions: "35cm / 1.8kg", models: "BioMech Arms AquaStrike PT-1",
      features: ["underwater", "explosive", "semi_auto"],
      recoil_penalty: -1, magazine_capacity: 4, current_ammo: 4,
      compatible_ammo: ["Micro-Torpedo Standard", "Micro-Torpedo AP"],
      range_modifiers: { short: 0, medium: 0, long: -1, extreme: -3 },
      cost: 5500, availability: "military", legality: "military_only"
    }
  },
  {
    name: "Charge Rifle (Underwater)", type: "weapon", img: "icons/weapons/guns/rifle-brown.webp",
    system: {
      description: "<p>Underwater assault rifle firing explosive gel charges effective at medium range. Slower rate of fire but reliable at depth.</p>",
      weapon_type: "rifle", damage: 9, effective_range: 60, durability: 8,
      dimensions: "85cm / 3.8kg", models: "Poseidon Arms Charger",
      features: ["underwater", "semi_auto", "explosive_round"],
      recoil_penalty: -1, magazine_capacity: 8, current_ammo: 8,
      compatible_ammo: ["Gel Charge Standard", "Gel Charge AP"],
      range_modifiers: { short: 0, medium: 0, long: -2, extreme: -4 },
      cost: 6800, availability: "military", legality: "military_only"
    }
  }
];

async function seedWeaponsCompendium() {
  const packName = "blue-planet-recontact.weapons";
  const pack = game.packs.get(packName);
  if (!pack) { ui.notifications.error(`Pack '${packName}' not found!`); return; }
  if (!game.user.isGM) { ui.notifications.warn("Only GMs can seed compendiums."); return; }

  await pack.configure({ locked: false });
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  let added = 0, skipped = 0;

  for (const data of WEAPONS_DATA) {
    if (existingNames.has(data.name)) { skipped++; continue; }
    try {
      await Item.create(data, { pack: packName });
      added++;
    } catch (err) { console.error(`Error creating '${data.name}':`, err); }
  }

  await pack.configure({ locked: true });
  ui.notifications.info(`Weapons compendium seeded: ${added} added, ${skipped} already existed.`);
}

seedWeaponsCompendium();
