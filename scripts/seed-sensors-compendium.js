/**
 * BLUE PLANET RECONTACT — Sensors Compendium Seeder
 * Player's Guide sensor systems for characters, vehicles, and remotes.
 * Run as a GM Script Macro in Foundry VTT.
 */

const SENSORS_DATA = [
  // ── VISUAL & OPTICAL ──────────────────────────────────────────────────
  { name: "Low-Light Camera", type: "sensor", img: "icons/magic/perception/eye-ringed-blue.webp",
    system: { description: "<p>Solid-state low-light camera. Amplifies available light 20x. No infrared — requires some ambient light. Standard security and surveillance device.</p>",
      sensor_type: "visual", range: 200, resolution: "high", power_consumption: "low",
      environmental_conditions: ["darkness", "fog_partial"],
      data_processing: "passive", interface_type: "digital",
      weight: 0.1, dimensions: "micro", manufacturer: "NovaTech Optics",
      special_features: ["20x light amplification", "200m effective range", "Digital output"],
      notes: "No function in total darkness. Needs at least 0.001 lux.",
      cost: 800, availability: "common", legality: "legal" }},

  { name: "Thermal Imager (Short Range)", type: "sensor", img: "icons/magic/fire/flame-burning-orange.webp",
    system: { description: "<p>Passive infrared thermal imager. Detects body heat and thermal differentials. Functions in total darkness and through smoke. 50m effective range.</p>",
      sensor_type: "thermal", range: 50, resolution: "medium", power_consumption: "medium",
      environmental_conditions: ["darkness", "smoke", "fog"],
      data_processing: "passive", interface_type: "digital",
      weight: 0.3, dimensions: "small", manufacturer: "Dynacorp Sensors",
      special_features: ["Total darkness operation", "Smoke penetration", "Temperature overlay"],
      notes: "Ineffective underwater beyond 5m. Can detect cold-blooded creatures differently.",
      cost: 3500, availability: "restricted", legality: "legal" }},

  { name: "Thermal Imager (Long Range)", type: "sensor", img: "icons/magic/fire/flame-burning-orange.webp",
    system: { description: "<p>Long-range passive thermal system for vehicle and installation use. 500m range with high-resolution thermal signature analysis. Identifies individuals by heat signature.</p>",
      sensor_type: "thermal", range: 500, resolution: "high", power_consumption: "high",
      environmental_conditions: ["darkness", "smoke", "light_fog"],
      data_processing: "active", interface_type: "digital",
      weight: 2.5, dimensions: "medium", manufacturer: "Dynacorp Sensors",
      special_features: ["500m range", "Signature identification", "Recording capability"],
      notes: "Heavy rain and dense fog degrade range significantly.",
      cost: 18000, availability: "restricted", legality: "legal" }},

  { name: "Multispectrum Optical Suite", type: "sensor", img: "icons/magic/perception/eye-ringed-teal.webp",
    system: { description: "<p>Integrated optical package: visible, low-light, thermal, UV, and near-IR. Automatic switching and layered overlay display. Standard on military and survey vehicles.</p>",
      sensor_type: "visual", range: 1000, resolution: "very_high", power_consumption: "medium",
      environmental_conditions: ["darkness", "smoke", "light_rain"],
      data_processing: "active", interface_type: "digital",
      weight: 1.8, dimensions: "medium", manufacturer: "NovaTech Optics",
      special_features: ["5-band detection", "1000m effective range", "Auto mode switching", "Recording"],
      notes: "Requires NI or standard display terminal. Can export to HUD.",
      cost: 45000, availability: "restricted", legality: "legal" }},

  // ── ACOUSTIC & SONAR ──────────────────────────────────────────────────
  { name: "Passive Sonar (Hydrophone Array)", type: "sensor", img: "icons/magic/water/water-wave.webp",
    system: { description: "<p>Passive hydrophone array for detecting underwater sounds and vibrations. Identifies vessel signatures and biological sounds. No detectable emission.</p>",
      sensor_type: "acoustic", range: 5000, resolution: "medium", power_consumption: "low",
      environmental_conditions: ["underwater", "surface"],
      data_processing: "passive", interface_type: "digital",
      weight: 0.8, dimensions: "small", manufacturer: "Poseidon Acoustics",
      special_features: ["Passive — undetectable", "5km range", "Signature library", "Biological sound ID"],
      notes: "Background ocean noise limits resolution. Thermoclines reduce effective range.",
      cost: 6500, availability: "common", legality: "legal" }},

  { name: "Active Sonar (Short Range)", type: "sensor", img: "icons/magic/water/wave-surge-blue.webp",
    system: { description: "<p>Pulsed sonar for 3D mapping and target detection. 500m range with high resolution. Detectable by other sonar receivers. Essential for navigation in murky water.</p>",
      sensor_type: "acoustic", range: 500, resolution: "high", power_consumption: "medium",
      environmental_conditions: ["underwater"],
      data_processing: "active", interface_type: "digital",
      weight: 1.5, dimensions: "medium", manufacturer: "Poseidon Acoustics",
      special_features: ["3D mapping", "500m range", "Target sizing", "Navigation aid"],
      notes: "Emissions detectable. Animals may react to pings. Dense schools of fish cause clutter.",
      cost: 12000, availability: "common", legality: "legal" }},

  { name: "Active Sonar (Long Range)", type: "sensor", img: "icons/magic/water/wave-surge-blue.webp",
    system: { description: "<p>High-power long-range sonar system. 20km detection range for large objects. Used for navigation, salvage survey, and anti-submarine work. Vehicle-mounted.</p>",
      sensor_type: "acoustic", range: 20000, resolution: "medium", power_consumption: "high",
      environmental_conditions: ["underwater", "surface"],
      data_processing: "active", interface_type: "digital",
      weight: 8.0, dimensions: "large", manufacturer: "Poseidon Acoustics",
      special_features: ["20km range", "Sub-bottom profiling", "Seabed mapping", "Object identification"],
      notes: "Loud emissions. Marine life disruption possible. High power draw.",
      cost: 80000, availability: "restricted", legality: "legal" }},

  { name: "MARNOC (Marine Navigation Computer)", type: "sensor", img: "icons/tools/navigation/compass-blue.webp",
    system: { description: "<p>Marine Navigation Computer. Integrates sonar, GPS, depth, current sensors into unified navigation display. Calculates safe routes and collision avoidance in real time.</p>",
      sensor_type: "navigation", range: 1000, resolution: "very_high", power_consumption: "medium",
      environmental_conditions: ["underwater", "surface"],
      data_processing: "active", interface_type: "digital",
      weight: 2.0, dimensions: "medium", manufacturer: "NovaTech Navigation",
      special_features: ["Real-time nav", "Collision avoidance", "Chart overlay", "Depth profiling"],
      notes: "Requires updated ocean charts for full functionality.",
      cost: 25000, availability: "common", legality: "legal" }},

  // ── RADAR & LIDAR ──────────────────────────────────────────────────────
  { name: "Surface Radar (Short Range)", type: "sensor", img: "icons/magic/air/wind-tornado-spiral-blue.webp",
    system: { description: "<p>360° maritime surface radar. 50km range for large vessels, 10km for small craft. Weather and collision avoidance use. Standard on surface vessels.</p>",
      sensor_type: "radar", range: 50000, resolution: "medium", power_consumption: "medium",
      environmental_conditions: ["surface", "aerial", "rain", "fog"],
      data_processing: "active", interface_type: "digital",
      weight: 5.0, dimensions: "large", manufacturer: "Dynacorp Electronics",
      special_features: ["360° sweep", "50km range", "Weather detection", "IFF optional"],
      notes: "Detectable by radar warning receivers. Cannot see below waterline.",
      cost: 30000, availability: "common", legality: "legal" }},

  { name: "Lidar (Ground/Vehicle)", type: "sensor", img: "icons/magic/light/beam-rays-green.webp",
    system: { description: "<p>Laser-based 3D ranging system. Creates centimeter-accurate point cloud of surroundings. Used for precision navigation, mapping, and obstacle avoidance at 2.5km range.</p>",
      sensor_type: "lidar", range: 2500, resolution: "very_high", power_consumption: "medium",
      environmental_conditions: ["surface", "aerial", "low_visibility"],
      data_processing: "active", interface_type: "digital",
      weight: 3.0, dimensions: "medium", manufacturer: "NovaTech Precision",
      special_features: ["Centimeter accuracy", "3D point cloud", "2.5km range", "Obstacle mapping"],
      notes: "Laser emission visible on sensor. Heavy rain degrades range.",
      cost: 22000, availability: "restricted", legality: "legal" }},

  // ── CHEMICAL & ENVIRONMENTAL ──────────────────────────────────────────
  { name: "Chemical Sniffer", type: "sensor", img: "icons/magic/nature/leaf-wind-green.webp",
    system: { description: "<p>Miniaturized mass spectrometer for chemical detection. Identifies explosives, drugs, toxins, and specific compounds at trace levels. Handheld or rack-mounted versions.</p>",
      sensor_type: "chemical", range: 5, resolution: "very_high", power_consumption: "low",
      environmental_conditions: ["surface", "aerial"],
      data_processing: "active", interface_type: "digital",
      weight: 0.4, dimensions: "small", manufacturer: "BioMech Sensors",
      special_features: ["Trace detection", "200 compound library", "Handheld portable", "Alarm trigger"],
      notes: "Wind and currents affect accuracy. Water immersion requires sealed housing.",
      cost: 4200, availability: "restricted", legality: "legal" }},

  { name: "Water Quality Analyzer", type: "sensor", img: "icons/magic/water/water-splash-blue.webp",
    system: { description: "<p>Real-time seawater analysis suite: salinity, pH, dissolved oxygen, temperature, toxin markers, bacterial count. Essential for dive safety and ecological surveys.</p>",
      sensor_type: "chemical", range: 1, resolution: "high", power_consumption: "low",
      environmental_conditions: ["underwater", "surface"],
      data_processing: "active", interface_type: "digital",
      weight: 0.6, dimensions: "small", manufacturer: "Poseidon Sciences",
      special_features: ["12-parameter analysis", "Continuous monitoring", "Alert thresholds", "Data logging"],
      notes: "Requires calibration every 30 days. Standard on all research submersibles.",
      cost: 3800, availability: "common", legality: "legal" }},

  { name: "Radiation Detector", type: "sensor", img: "icons/magic/symbols/runes-etched-gold.webp",
    system: { description: "<p>Geiger-Muller counter with gamma, beta, and alpha detection. Logs cumulative dose exposure. Alerts when threshold exceeded. Standard safety equipment in deep survey work.</p>",
      sensor_type: "radiation", range: 10, resolution: "high", power_consumption: "low",
      environmental_conditions: ["underwater", "surface", "aerial"],
      data_processing: "passive", interface_type: "digital",
      weight: 0.2, dimensions: "micro", manufacturer: "Dynacorp Safety",
      special_features: ["Alpha/beta/gamma detection", "Dose logging", "Audio/visual alarm", "Waterproof to 200m"],
      notes: "Poseidon has higher background radiation in some volcanic zones.",
      cost: 1200, availability: "common", legality: "legal" }},

  // ── BIOLOGICAL ────────────────────────────────────────────────────────
  { name: "Biosonar Transceiver (Cetacean)", type: "sensor", img: "icons/magic/water/wave-surge-blue.webp",
    system: { description: "<p>Biosonar interface system allowing cetaceans to share their natural sonar perception with other crew. Translates echolocation data into digital display. Cetacean-only installation.</p>",
      sensor_type: "acoustic", range: 3000, resolution: "very_high", power_consumption: "low",
      environmental_conditions: ["underwater"],
      data_processing: "active", interface_type: "neural",
      weight: 0.5, dimensions: "small", manufacturer: "Poseidon Cetacean Tech",
      special_features: ["3km biosonar sharing", "3D environment model", "NI compatible", "Real-time display"],
      notes: "Requires cetacean operator with natural biosonar. Cannot function independently.",
      cost: 15000, availability: "restricted", legality: "legal" }},

  { name: "Biometric Scanner", type: "sensor", img: "icons/magic/perception/eye-ringed-purple.webp",
    system: { description: "<p>Multi-modal biometric identification: retinal scan, facial recognition, voice print, gait analysis. Identifies individuals from database. Range 10m for passive systems.</p>",
      sensor_type: "visual", range: 10, resolution: "very_high", power_consumption: "medium",
      environmental_conditions: ["surface"],
      data_processing: "active", interface_type: "digital",
      weight: 0.8, dimensions: "small", manufacturer: "NovaTech Security",
      special_features: ["Multi-modal ID", "10m passive range", "Database matching", "Criminal flag alert"],
      notes: "Privacy laws restrict use without warrant in most colonial jurisdictions.",
      cost: 8500, availability: "restricted", legality: "restricted" }},
];

async function seedSensorsCompendium() {
  const packName = "blue-planet-recontact.sensors";
  const pack = game.packs.get(packName);
  if (!pack) { ui.notifications.error(`Pack '${packName}' not found!`); return; }
  if (!game.user.isGM) { ui.notifications.warn("Only GMs can seed compendiums."); return; }

  await pack.configure({ locked: false });
  const existing = await pack.getDocuments();
  const existingNames = new Set(existing.map(d => d.name));
  let added = 0, skipped = 0;

  for (const data of SENSORS_DATA) {
    if (existingNames.has(data.name)) { skipped++; continue; }
    try {
      await Item.create(data, { pack: packName });
      added++;
    } catch (err) { console.error(`Error creating '${data.name}':`, err); }
  }

  await pack.configure({ locked: true });
  ui.notifications.info(`Sensors compendium seeded: ${added} added, ${skipped} already existed.`);
}

seedSensorsCompendium();
