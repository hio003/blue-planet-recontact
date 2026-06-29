/**
 * BLUE PLANET RECONTACT — Populate All Compendiums
 * 
 * Ejecuta todos los seeders de compendios en secuencia.
 * Ejecutar COMO GM en un Macro de tipo Script.
 * 
 * Compendios que se poblarán:
 *   - Weapons (armas)
 *   - Ammunition (munición)
 *   - Cyberware / Hardware
 *   - Sensors
 *   - Features & Backgrounds
 *   - Biomods (Wetwares)   ← usa seed-biomods-compendium.js
 *   - Species              ← usa seed-species-compendium.js
 *   - Vehicles             ← usa populate-vehicle-remote-compendiums.js
 *   - Remotes              ← usa populate-vehicle-remote-compendiums.js
 *   - Creatures            ← seed-creatures-compendium.js
 */

if (!game.user.isGM) {
  ui.notifications.error("Only GMs can populate compendiums.");
  return;
}

// ── Helper ──────────────────────────────────────────────────────────────────

async function seedPack(packName, data, docClass = Item) {
  const pack = game.packs.get(packName);
  if (!pack) {
    ui.notifications.warn(`Pack '${packName}' not found — skipping.`);
    return { added: 0, skipped: 0, missing: true };
  }
  await pack.configure({ locked: false });
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  let added = 0, skipped = 0;
  for (const entry of data) {
    if (existingNames.has(entry.name)) { skipped++; continue; }
    try {
      await docClass.create(entry, { pack: packName });
      added++;
    } catch (err) {
      console.error(`[BPR Seed] Error '${entry.name}':`, err);
    }
  }
  await pack.configure({ locked: true });
  return { added, skipped };
}

// ── DATA ─────────────────────────────────────────────────────────────────────
// (Each data array is inlined to allow running as a single macro)

// Load external scripts dynamically since Foundry macros have limited scope
// Instead we call each seeder function by fetching from module scripts

const BASE = "systems/blue-planet-recontact/scripts";
const seeders = [
  `${BASE}/seed-weapons-compendium.js`,
  `${BASE}/seed-ammunition-compendium.js`,
  `${BASE}/seed-cyberware-compendium.js`,
  `${BASE}/seed-sensors-compendium.js`,
  `${BASE}/seed-features-compendium.js`,
  `${BASE}/seed-biomods-compendium.js`,
  `${BASE}/seed-species-compendium.js`,
  `${BASE}/seed-creatures-compendium.js`,
];

ui.notifications.info("Blue Planet Recontact: Starting compendium population…");
let totalAdded = 0;

for (const scriptPath of seeders) {
  try {
    // Each script calls its own seed function at the end.
    // We evaluate them in order.
    const response = await fetch(scriptPath);
    if (!response.ok) {
      console.warn(`[BPR Seed] Script not found: ${scriptPath}`);
      continue;
    }
    const code = await response.text();
    // Run in an async context
    await new AsyncFunction(code)();
    console.log(`[BPR Seed] Completed: ${scriptPath}`);
  } catch (err) {
    console.error(`[BPR Seed] Error running ${scriptPath}:`, err);
  }
}

// Vehicles and remotes use the existing macro
try {
  const vehicleScript = await fetch(`systems/blue-planet-recontact/macros/populate-vehicle-remote-compendiums.js`);
  if (vehicleScript.ok) {
    await new AsyncFunction(await vehicleScript.text())();
    console.log("[BPR Seed] Vehicles/Remotes completed");
  }
} catch (err) {
  console.error("[BPR Seed] Vehicle/Remote error:", err);
}

ui.notifications.info("Blue Planet Recontact: Compendium population complete! Check each compendium.");
