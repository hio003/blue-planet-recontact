/**
 * BLUE PLANET RECONTACT — Ammunition Compendium Seeder
 * Player's Guide ammunition types for all weapon categories.
 * Run as a GM Script Macro in Foundry VTT.
 */

const AMMO_DATA = [
  // ── 5mm ────────────────────────────────────────────────────────────────
  { name: "5mm Standard", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Standard 5mm ball ammunition. Full metal jacket, reliable feeding.</p>",
      ammo_type: "standard", package_size: 100, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 0, weight_per_round: 0.006, cost_per_round: 0.08,
      compatible_weapons: ["5mm Holdout Pistol", "5mm PDW"], manufacturer: "Dynacorp Munitions" }},

  { name: "5mm HP (Hollow Point)", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Hollow point expanding 5mm round. Greater tissue damage, limited penetration.</p>",
      ammo_type: "hollow_point", package_size: 50, attack_modifier: 0, damage_modifier: 2,
      range_modifier: 0, penetration: -2, weight_per_round: 0.006, cost_per_round: 0.30,
      compatible_weapons: ["5mm Holdout Pistol", "5mm PDW"], manufacturer: "Poseidon Arms" }},

  { name: "5mm AP (Armor Piercing)", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-silver.webp",
    system: { description: "<p>Steel-core 5mm armor piercing. Penetrates light armor at cost of stopping power.</p>",
      ammo_type: "armor_piercing", package_size: 50, attack_modifier: 0, damage_modifier: -1,
      range_modifier: 0, penetration: 3, weight_per_round: 0.008, cost_per_round: 0.40,
      compatible_weapons: ["5mm Holdout Pistol", "5mm PDW"], manufacturer: "BioMech Arms" }},

  // ── 10mm ───────────────────────────────────────────────────────────────
  { name: "10mm Standard", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Standard 10mm FMJ. The most common round on Poseidon. Balanced performance.</p>",
      ammo_type: "standard", package_size: 100, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 0, weight_per_round: 0.012, cost_per_round: 0.15,
      compatible_weapons: ["10mm Autopistol", "10mm Assault Rifle"], manufacturer: "Dynacorp Munitions" }},

  { name: "10mm HP (Hollow Point)", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Expanding hollow point in 10mm. High stopping power, reduces risk of over-penetration in populated areas.</p>",
      ammo_type: "hollow_point", package_size: 50, attack_modifier: 0, damage_modifier: 3,
      range_modifier: 0, penetration: -3, weight_per_round: 0.012, cost_per_round: 0.55,
      compatible_weapons: ["10mm Autopistol", "10mm Assault Rifle"], manufacturer: "Poseidon Arms" }},

  { name: "10mm AP (Armor Piercing)", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-silver.webp",
    system: { description: "<p>Tungsten-core 10mm AP. Effective against light armor and hard targets.</p>",
      ammo_type: "armor_piercing", package_size: 50, attack_modifier: 0, damage_modifier: -1,
      range_modifier: 0, penetration: 4, weight_per_round: 0.015, cost_per_round: 0.70,
      compatible_weapons: ["10mm Autopistol", "10mm Assault Rifle"], manufacturer: "BioMech Arms" }},

  { name: "10mm Frangible", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Fragmenting round that disintegrates on hard surfaces. No ricochet, minimal over-penetration. Ideal for use aboard pressurized habitats.</p>",
      ammo_type: "frangible", package_size: 50, attack_modifier: 0, damage_modifier: 1,
      range_modifier: 0, penetration: -4, weight_per_round: 0.010, cost_per_round: 0.80,
      compatible_weapons: ["10mm Autopistol", "10mm Assault Rifle"], manufacturer: "NovaTech" }},

  { name: "10mm Tracer", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-red.webp",
    system: { description: "<p>Phosphorescent tracer round. Marks trajectory for spotting and suppression. Every 5th round in military belts.</p>",
      ammo_type: "tracer", package_size: 50, attack_modifier: 1, damage_modifier: 0,
      range_modifier: 0, penetration: 0, weight_per_round: 0.013, cost_per_round: 0.25,
      compatible_weapons: ["10mm Assault Rifle", "Light Machine Gun (LMG)"], manufacturer: "Dynacorp Munitions" }},

  // ── 15mm ───────────────────────────────────────────────────────────────
  { name: "15mm Standard", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Standard 15mm pistol round. High power, significant recoil. Effective against hardened targets.</p>",
      ammo_type: "standard", package_size: 50, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 1, weight_per_round: 0.030, cost_per_round: 0.45,
      compatible_weapons: ["15mm Heavy Pistol"], manufacturer: "BioMech Arms" }},

  { name: "15mm AP", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-silver.webp",
    system: { description: "<p>Armor piercing 15mm round. Penetrates medium armor. High recoil and muzzle flash.</p>",
      ammo_type: "armor_piercing", package_size: 25, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 5, weight_per_round: 0.035, cost_per_round: 1.20,
      compatible_weapons: ["15mm Heavy Pistol"], manufacturer: "BioMech Arms" }},

  // ── 7mm ────────────────────────────────────────────────────────────────
  { name: "7mm Standard", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Standard 7mm rifle cartridge. Good accuracy at range with moderate recoil.</p>",
      ammo_type: "standard", package_size: 50, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 1, weight_per_round: 0.018, cost_per_round: 0.35,
      compatible_weapons: ["7mm Sniper Rifle"], manufacturer: "Poseidon Arms" }},

  { name: "7mm Match", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-silver.webp",
    system: { description: "<p>High-precision match-grade 7mm round. Consistent powder charge and seating depth for maximum accuracy at extreme range.</p>",
      ammo_type: "match", package_size: 20, attack_modifier: 2, damage_modifier: 0,
      range_modifier: 100, penetration: 1, weight_per_round: 0.018, cost_per_round: 2.00,
      compatible_weapons: ["7mm Sniper Rifle"], manufacturer: "NovaTech Precision" }},

  { name: "7mm Subsonic", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-silver.webp",
    system: { description: "<p>Subsonic 7mm round for suppressed use. Significantly quieter but reduced range and penetration.</p>",
      ammo_type: "subsonic", package_size: 20, attack_modifier: 0, damage_modifier: -2,
      range_modifier: -150, penetration: -1, weight_per_round: 0.022, cost_per_round: 1.80,
      compatible_weapons: ["7mm Sniper Rifle"], manufacturer: "SonoEdge" }},

  // ── SHOTGUN 12g ────────────────────────────────────────────────────────
  { name: "12g Buckshot", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Standard 00 buckshot. Spreads 9 pellets in a cone. Devastating at close range. Less effective at distance.</p>",
      ammo_type: "buckshot", package_size: 25, attack_modifier: 1, damage_modifier: 0,
      range_modifier: -10, penetration: -1, weight_per_round: 0.040, cost_per_round: 0.60,
      compatible_weapons: ["12g Combat Shotgun", "12g Auto-Shotgun"], manufacturer: "Dynacorp Munitions" }},

  { name: "12g Slug", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-silver.webp",
    system: { description: "<p>Single slug projectile for shotgun. Greater range and penetration than buckshot. Used for armored targets and long-range engagement.</p>",
      ammo_type: "slug", package_size: 25, attack_modifier: 0, damage_modifier: 2,
      range_modifier: 20, penetration: 3, weight_per_round: 0.045, cost_per_round: 0.90,
      compatible_weapons: ["12g Combat Shotgun", "12g Auto-Shotgun"], manufacturer: "Poseidon Arms" }},

  { name: "12g Flechette", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-silver.webp",
    system: { description: "<p>Flechette shotgun round. Multiple steel darts with excellent penetration and range. Effective against armored personnel.</p>",
      ammo_type: "flechette", package_size: 25, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 15, penetration: 4, weight_per_round: 0.035, cost_per_round: 1.20,
      compatible_weapons: ["12g Combat Shotgun", "12g Auto-Shotgun"], manufacturer: "BioMech Arms" }},

  { name: "12g Less-Lethal Bean Bag", type: "ammunition", img: "icons/weapons/ammunition/bullets-cartridge-shell-gold.webp",
    system: { description: "<p>Non-lethal bean bag round. Blunt impact, minimal penetration. Standard for crowd control and non-lethal takedowns.</p>",
      ammo_type: "less_lethal", package_size: 25, attack_modifier: 0, damage_modifier: -4,
      range_modifier: -15, penetration: -5, weight_per_round: 0.040, cost_per_round: 0.70,
      compatible_weapons: ["12g Combat Shotgun", "12g Auto-Shotgun"], manufacturer: "Poseidon Security" }},

  // ── FLECHETTE (NEEDLER) ────────────────────────────────────────────────
  { name: "Flechette Standard", type: "ammunition", img: "icons/weapons/ammunition/arrow-head-war-flight.webp",
    system: { description: "<p>Standard ceramic flechette for needler pistols. Near-silent, leaves no detectable residue.</p>",
      ammo_type: "flechette", package_size: 100, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 2, weight_per_round: 0.001, cost_per_round: 0.20,
      compatible_weapons: ["Needler Pistol"], manufacturer: "SonoEdge" }},

  { name: "Flechette Toxin", type: "ammunition", img: "icons/magic/death/skull-poison-green.webp",
    system: { description: "<p>Toxin-coated flechette. Delivers fast-acting paralytic on penetration. Incapacitates within 1-3 rounds. Restricted substance.</p>",
      ammo_type: "toxin", package_size: 20, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 2, weight_per_round: 0.001, cost_per_round: 8.00,
      compatible_weapons: ["Needler Pistol"], manufacturer: "NovaTech Pharma" }},

  // ── GEL ────────────────────────────────────────────────────────────────
  { name: "Gel Round Standard", type: "ammunition", img: "icons/magic/water/water-splash-blue.webp",
    system: { description: "<p>Polymer gel projectile. Absorbs energy on impact, causing blunt trauma without penetration. Standard non-lethal option.</p>",
      ammo_type: "gel", package_size: 30, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: -5, weight_per_round: 0.025, cost_per_round: 0.50,
      compatible_weapons: ["Gel Pistol"], manufacturer: "Poseidon Security" }},

  { name: "Gel Round Neurostun", type: "ammunition", img: "icons/magic/water/water-splash-blue.webp",
    system: { description: "<p>Gel round infused with neurostun compound. Delivers paralytic through skin on impact. Highly effective, tightly regulated.</p>",
      ammo_type: "gel_toxin", package_size: 20, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: -5, weight_per_round: 0.030, cost_per_round: 5.00,
      compatible_weapons: ["Gel Pistol"], manufacturer: "NovaTech Pharma" }},

  // ── GRENADES ───────────────────────────────────────────────────────────
  { name: "40mm HE Grenade", type: "ammunition", img: "icons/weapons/thrown/grenade.webp",
    system: { description: "<p>High explosive 40mm grenade. Fragmentation radius 10m. Standard infantry anti-personnel round.</p>",
      ammo_type: "explosive", package_size: 6, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 2, weight_per_round: 0.230, cost_per_round: 45.00,
      compatible_weapons: ["Grenade Launcher (UGL)"], manufacturer: "Dynacorp Munitions" }},

  { name: "40mm Smoke Grenade", type: "ammunition", img: "icons/magic/air/fog-smoke-dense-gray.webp",
    system: { description: "<p>Smoke-generating 40mm round. Creates obscuring smoke cloud 8m diameter lasting 60 seconds. Used for concealment and marking.</p>",
      ammo_type: "smoke", package_size: 6, attack_modifier: 0, damage_modifier: -14,
      range_modifier: 0, penetration: -10, weight_per_round: 0.200, cost_per_round: 18.00,
      compatible_weapons: ["Grenade Launcher (UGL)"], manufacturer: "Dynacorp Munitions" }},

  { name: "40mm Flashbang", type: "ammunition", img: "icons/magic/light/explosion-star-gold.webp",
    system: { description: "<p>Stun/disorientation 40mm round. Blinding flash and 180dB bang. Disorients targets for 3-5 seconds. Non-lethal at range.</p>",
      ammo_type: "flashbang", package_size: 6, attack_modifier: 2, damage_modifier: -8,
      range_modifier: 0, penetration: -10, weight_per_round: 0.180, cost_per_round: 25.00,
      compatible_weapons: ["Grenade Launcher (UGL)"], manufacturer: "Poseidon Security" }},

  // ── UNDERWATER ─────────────────────────────────────────────────────────
  { name: "UWR Flechette Standard", type: "ammunition", img: "icons/weapons/ammunition/arrow-head-war-flight.webp",
    system: { description: "<p>Supercavitating steel flechette for underwater rifle. Maintains velocity to 30m depth. Ineffective on surface beyond 50m.</p>",
      ammo_type: "underwater_flechette", package_size: 40, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 3, weight_per_round: 0.008, cost_per_round: 0.80,
      compatible_weapons: ["Underwater Rifle (UWR)"], manufacturer: "BioMech Arms" }},

  { name: "Micro-Torpedo Standard", type: "ammunition", img: "icons/weapons/thrown/grenade.webp",
    system: { description: "<p>Miniature self-propelled torpedo with shaped-charge warhead. Effective against armored underwater targets. 50m range.</p>",
      ammo_type: "torpedo", package_size: 4, attack_modifier: 0, damage_modifier: 0,
      range_modifier: 0, penetration: 6, weight_per_round: 0.500, cost_per_round: 280.00,
      compatible_weapons: ["Torpedo Pistol"], manufacturer: "BioMech Arms" }},
];

async function seedAmmunitionCompendium() {
  const packName = "blue-planet-recontact.ammunition";
  const pack = game.packs.get(packName);
  if (!pack) { ui.notifications.error(`Pack '${packName}' not found!`); return; }
  if (!game.user.isGM) { ui.notifications.warn("Only GMs can seed compendiums."); return; }

  await pack.configure({ locked: false });
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  let added = 0, skipped = 0;

  for (const data of AMMO_DATA) {
    if (existingNames.has(data.name)) { skipped++; continue; }
    try {
      await Item.create(data, { pack: packName });
      added++;
    } catch (err) { console.error(`Error creating '${data.name}':`, err); }
  }

  await pack.configure({ locked: true });
  ui.notifications.info(`Ammunition compendium seeded: ${added} added, ${skipped} already existed.`);
}

seedAmmunitionCompendium();
