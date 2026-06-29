/**
 * BLUE PLANET RECONTACT — Macro: Populate Vehicle & Remote Compendiums
 * Ejecutar como GM para crear las entradas de ejemplo del rulebook.
 * 
 * CÓMO USAR: Pegar este código en un Macro de tipo Script y ejecutarlo como GM.
 */

// ── VEHICLE DATA (rulebook pp. 245-256) ───────────────────────────────────
const VEHICLES = [
  {
    name: "Jumpcraft de Asalto",
    type: "vehicle",
    img: "icons/vehicles/air/jet-fighter-lightning-orange.webp",
    system: {
      vehicle_type: "aerial", manufacturer: "Dynacorp Aerospace", model: "JC-7A Kestrel",
      availability: "restricted", cost: 320000, condition: "operational",
      dimensions: { size_category: "medium", length: 14, mass: 8.5 },
      durability: { value: 5, armor: 3 },
      autonomy: { cognition: 6, coordination: 8 },
      performance: { speed_safe: 400, speed_max: 680, range: 3000, ceiling: 14000 },
      maneuvers: { attack: 4, defend: 2, chase_evade: 4, performance: -2 },
      crew: { minimum: 1, maximum: 2 }, passengers: { maximum: 8 },
      cargo: { capacity: 800, unit: "kg" },
      interface_type: "hot", power_type: "integrated",
      features: { sealed: true, sensors: true, weapons: true, hardened: true, vr_cockpit: true, ecm: true, gi: true },
      weapons_description: "2× Cañón rotatorio (Ataque +4, DR 14, 1.200m). 8× Misiles guiados (DR 22, 25km). 2× Pod de cohetes sin guía (DR 16, 3km).",
      sensors_description: "Radar 500km, lidar 2.5km, MARNOC, térmica. Compartido con HUD de piloto.",
      description: "Aeronave de despegue y aterrizaje vertical (VTOL) de la familia Jumpcraft, diseñada para operaciones de infantería anfibias. Puede operar como transporte rápido o plataforma de apoyo de fuego.\n\nPilotada con un solo piloto GI, pero optimizada para tripulación de 2."
    }
  },
  {
    name: "Jumpcraft de Carga",
    type: "vehicle",
    img: "icons/vehicles/air/helicopter-light-blue-gray.webp",
    system: {
      vehicle_type: "aerial", manufacturer: "Dynacorp Aerospace", model: "JC-12C Pelican",
      availability: "uncommon", cost: 72000, condition: "operational",
      dimensions: { size_category: "medium", length: 18, mass: 12 },
      durability: { value: 1, armor: 0 },
      autonomy: { cognition: 6, coordination: 2 },
      performance: { speed_safe: 220, speed_max: 290, range: 1200, ceiling: 6000 },
      maneuvers: { attack: -99, defend: 2, chase_evade: 3, performance: 2 },
      crew: { minimum: 1, maximum: 6 }, passengers: { maximum: 20 },
      cargo: { capacity: 1000, unit: "kg" },
      interface_type: "hot", power_type: "integrated",
      features: { sealed: true, sensors: true, smart: true, evac_pods: false, crash_protection: true },
      sensors_description: "Radar básico 50km, lidar 1km, sonar pasivo.",
      description: "El Jumpcraft de carga es el caballo de batalla del transporte aéreo en Poseidón. Versátil, robusto y con bajo mantenimiento, puede despegar y aterrizar desde cualquier terreno despejado de 10m."
    }
  },
  {
    name: "Jumpcraft Utilitario",
    type: "vehicle",
    img: "icons/vehicles/air/helicopter-transport-teal.webp",
    system: {
      vehicle_type: "aerial", manufacturer: "Cortez Aerospace", model: "JC-9U Osprey",
      availability: "common", cost: 72000, condition: "operational",
      dimensions: { size_category: "medium", length: 15, mass: 9 },
      durability: { value: 1, armor: 0 },
      autonomy: { cognition: 6, coordination: 2 },
      performance: { speed_safe: 220, speed_max: 290, range: 1200, ceiling: 6000 },
      maneuvers: { attack: -99, defend: 2, chase_evade: 3, performance: 2 },
      crew: { minimum: 1, maximum: 6 }, passengers: { maximum: 12 },
      cargo: { capacity: 1000, unit: "kg" },
      interface_type: "hot", power_type: "integrated",
      features: { sealed: true, sensors: true, smart: true },
      description: "Versión polivalente del jumpcraft para transporte y logística civil."
    }
  },
  {
    name: "Jumpbike",
    type: "vehicle",
    img: "icons/vehicles/air/rocket-glider-gray.webp",
    system: {
      vehicle_type: "aerial", manufacturer: "FastRide Inc.", model: "Kestrel JB-1",
      availability: "uncommon", cost: 18000, condition: "operational",
      dimensions: { size_category: "light", length: 2.5, mass: 0.18 },
      durability: { value: -2, armor: 0 },
      autonomy: { cognition: 2, coordination: 2 },
      performance: { speed_safe: 280, speed_max: 460, range: 400, ceiling: 1500 },
      maneuvers: { attack: -99, defend: 4, chase_evade: 4, performance: -2 },
      crew: { minimum: 1, maximum: 1 }, passengers: { maximum: 1 },
      cargo: { capacity: 50, unit: "kg" },
      interface_type: "warm", power_type: "rechargeable",
      features: { responsive: true },
      description: "Aeromoto individual de turbofan. Extremadamente ágil pero sin protección alguna. Popular entre mensajeros y exploradores rápidos."
    }
  },
  {
    name: "Hidrofoil Ligero",
    type: "vehicle",
    img: "icons/vehicles/boats/sailboat-tan.webp",
    system: {
      vehicle_type: "aquatic", manufacturer: "Pacifica Marine", model: "Foil-L 400",
      availability: "common", cost: 83000, condition: "operational",
      dimensions: { size_category: "light", length: 12, mass: 3.2 },
      durability: { value: -1, armor: 0 },
      autonomy: { cognition: 4, coordination: 6 },
      performance: { speed_safe: 65, speed_max: 120, range: 950 },
      maneuvers: { attack: -99, defend: -1, chase_evade: 2, performance: 2 },
      crew: { minimum: 1, maximum: 6 }, passengers: { maximum: 8 },
      cargo: { capacity: 500, unit: "kg" },
      interface_type: "warm", power_type: "rechargeable",
      features: { sensors: true, slide_loader: true },
      sensors_description: "Radar básico 50km, sonar pasivo.",
      description: "Embarcación de superficie rápida sobre patines de hidrodeslizamiento. Ligera y ágil, ideal para patrullas costeras y transporte rápido entre instalaciones oceánicas."
    }
  },
  {
    name: "Hidrofoil Pesado",
    type: "vehicle",
    img: "icons/vehicles/boats/boat-patrol-tan.webp",
    system: {
      vehicle_type: "aquatic", manufacturer: "Pacific Defense Systems", model: "HF-Mk2 Barracuda",
      availability: "restricted", cost: 340000, condition: "operational",
      dimensions: { size_category: "heavy", length: 28, mass: 18 },
      durability: { value: 4, armor: 2 },
      autonomy: { cognition: 6, coordination: 4 },
      performance: { speed_safe: 45, speed_max: 90, range: 1800 },
      maneuvers: { attack: 2, defend: 2, chase_evade: -2, performance: -4 },
      crew: { minimum: 4, maximum: 12 }, passengers: { maximum: 20 },
      cargo: { capacity: 5000, unit: "kg" },
      interface_type: "hot", power_type: "integrated",
      features: { hardened: true, armored: true, sensors: true, weapons: true, sealed: true, gi: true, slide_loader: true, waterlock: true },
      weapons_description: "2× Cañón de cubierta 30mm (DR 14, Ataque +2). 2× Lanzatorpedos (DR variable, guiado).",
      sensors_description: "Radar 200km, sonar activo 15km, pasivo 30km, MARNOC.",
      description: "Buque de patrulla pesado para misiones navales de combate. Acceso especial para cetáceos mediante waterlock y slide-loader."
    }
  },
  {
    name: "Catamarán Nativo",
    type: "vehicle",
    img: "icons/vehicles/boats/sailboat-tan.webp",
    system: {
      vehicle_type: "aquatic", manufacturer: "Artefacto nativo", model: "Catamarán de dos cascos",
      availability: "rare", cost: 0, condition: "operational",
      dimensions: { size_category: "medium", length: 9, mass: 1.2 },
      durability: { value: -2, armor: 0 },
      autonomy: { cognition: 0, coordination: 0 },
      performance: { speed_safe: 18, speed_max: 30, range: 800 },
      maneuvers: { attack: -99, defend: -3, chase_evade: -3, performance: 0 },
      crew: { minimum: 2, maximum: 6 }, passengers: { maximum: 4 },
      cargo: { capacity: 400, unit: "kg" },
      interface_type: "cold", power_type: "consumable",
      features: {},
      description: "Embarcación de vela construida con técnicas nativas poseidonianas por los humanos que llevan generaciones en el planeta. Sin tecnología; completamente dependiente de viento y remo."
    }
  },
  {
    name: "Submarino Interceptor",
    type: "vehicle",
    img: "icons/vehicles/boats/submarine-periscope-gray.webp",
    system: {
      vehicle_type: "submersible", manufacturer: "Abyss Systems Corp.", model: "IS-9 Mako",
      availability: "restricted", cost: 950000, condition: "operational",
      dimensions: { size_category: "medium", length: 16, mass: 22 },
      durability: { value: 5, armor: 3 },
      autonomy: { cognition: 6, coordination: 2 },
      performance: { speed_safe: 120, speed_max: 220, range: 950, depth_limit: 800 },
      maneuvers: { attack: 4, defend: 4, chase_evade: 2, performance: 2 },
      crew: { minimum: 1, maximum: 0 }, passengers: { maximum: 0 },
      cargo: { capacity: 150, unit: "kg" },
      interface_type: "hot", power_type: "integrated",
      features: { sealed: true, hardened: true, sensors: true, weapons: true, gi: true, vr_cockpit: true },
      weapons_description: "4× Tubos de torpedo (DR variable, guiado). 2× Lanzadores de minas.",
      sensors_description: "Sonar activo 25km / pasivo 50km, MARNOC, DDF triangulación.",
      description: "Submarino de combate monoplaza de alta velocidad. Diseñado para interceptación, reconocimiento y misiones de ataque solitario."
    }
  },
  {
    name: "Submarino de Investigación",
    type: "vehicle",
    img: "icons/vehicles/boats/submarine-deep-sea-teal.webp",
    system: {
      vehicle_type: "submersible", manufacturer: "OceanStar Research", model: "RS-4 Nautilon",
      availability: "uncommon", cost: 420000, condition: "operational",
      dimensions: { size_category: "medium", length: 14, mass: 18 },
      durability: { value: 2, armor: 1 },
      autonomy: { cognition: 8, coordination: 4 },
      performance: { speed_safe: 30, speed_max: 60, range: 2500, depth_limit: 2000 },
      maneuvers: { attack: -99, defend: -2, chase_evade: -3, performance: 0 },
      crew: { minimum: 2, maximum: 6 }, passengers: { maximum: 4 },
      cargo: { capacity: 1200, unit: "kg" },
      interface_type: "warm", power_type: "rechargeable",
      features: { sealed: true, sensors: true, manipulators: true, gi: true, waterlock: true },
      sensors_description: "Sonar activo 30km (doble vs pasivo), lidar 500m, MARNOC, cámaras HD 360°. Cetáceos +2 COG con sonar como imagen sonora.",
      description: "Plataforma de investigación oceanográfica de media profundidad. Habitáculo amplio con zona de operación para cetáceos mediante waterlock integrado."
    }
  },
  {
    name: "Lanzadera Interorbital",
    type: "vehicle",
    img: "icons/vehicles/air/rocket-exhaust-blue.webp",
    system: {
      vehicle_type: "space", manufacturer: "Star Colonial Transit", model: "IO-3 Alcyone",
      availability: "restricted", cost: 4200000, condition: "operational",
      dimensions: { size_category: "massive", length: 64, mass: 280 },
      durability: { value: 8, armor: 2 },
      autonomy: { cognition: 8, coordination: 6 },
      performance: { speed_safe: 0, speed_max: 28000, range: 500000, ceiling: 999999 },
      maneuvers: { attack: -99, defend: -4, chase_evade: -6, performance: -8 },
      crew: { minimum: 3, maximum: 8 }, passengers: { maximum: 120 },
      cargo: { capacity: 50, unit: "MT" },
      interface_type: "gi", power_type: "integrated",
      features: { sealed: true, hardened: true, sensors: true, gi: true, evac_pods: true, crash_protection: true },
      sensors_description: "Radar 500km, lidar, MARNOC. Sistema integrado con control de tráfico orbital.",
      description: "Lanzadera de pasajeros y carga para vuelos entre Poseidón y las instalaciones orbitales. Opera en atmósfera alta y órbita baja."
    }
  }
];

// ── REMOTE DATA (rulebook pp. 205-218) ────────────────────────────────────
const REMOTES = [
  {
    name: "Remote Cetáceo Estándar — Portátil",
    type: "remote",
    img: "icons/commodities/treasure/orb-swirling-blue.webp",
    system: {
      remote_type: "cetacean", manufacturer: "Hydrospan", model: "CR-25 Compact",
      availability: "uncommon", cost: 225,
      dimensions: { size_category: "portable", mass: 0.65 },
      durability: { value: 3, armor: 0 },
      autonomy: { cognition: 1, coordination: 3 },
      performance: { locomotion: "hover", speed: 8, range_control: 3 },
      maneuvers: { chase_evade: 0 },
      cargo: { capacity: 2, unit: "kg" },
      cetacean_bonuses: { active: false },
      features: { hot: true, smart: true, manipulators: true, rechargeable: true, sealed: true, sensors: true, voice_synth: true },
      sensors_description: "Cámaras AV multiespectro (360°), micrófonos, sonar pasivo integrado. Síntesis de voz para comunicación cetáceo-humano.",
      description: "El Remote Cetáceo estándar es la herramienta de telepresencia más común para cetáceos en entornos terrestres o áereos. Los lift-fans proporcionan levitación estable hasta 3m de altura.\n\nViene con waldo manipuladores para tareas de precisión y síntesis de voz cetáceo-humano."
    }
  },
  {
    name: "Remote Cetáceo Estándar — Móvil",
    type: "remote",
    img: "icons/commodities/treasure/orb-swirling-blue.webp",
    system: {
      remote_type: "cetacean", manufacturer: "MacLeod Bionics", model: "CR-200 Field Unit",
      availability: "uncommon", cost: 3450,
      dimensions: { size_category: "mobile", mass: 15 },
      durability: { value: 3, armor: 0 },
      autonomy: { cognition: 1, coordination: 3 },
      performance: { locomotion: "hover", speed: 12, range_control: 5 },
      maneuvers: { chase_evade: 2 },
      cargo: { capacity: 30, unit: "kg" },
      cetacean_bonuses: { active: false },
      features: { hot: true, smart: true, manipulators: true, rechargeable: true, sealed: true, sensors: true, voice_synth: true },
      sensors_description: "AV full-spectrum, sonar pasivo, MARNOC pasivo, micrófonos direccionales.",
      description: "Versión de campo ampliada del remote cetáceo. Carga máxima de 30kg permite asistir en trabajo físico. Dos brazos waldos articulados con fuerza de 40N."
    }
  },
  {
    name: "CICADA — Compacta",
    type: "remote",
    img: "icons/commodities/treasure/crystal-cyan.webp",
    system: {
      remote_type: "cicada", manufacturer: "Hydrospan", model: "CICADA-I",
      availability: "rare", cost: 7600,
      dimensions: { size_category: "portable", mass: 18.5 },
      durability: { value: 1, armor: 0 },
      autonomy: { cognition: 4, coordination: 5 },
      performance: { locomotion: "aquatic", speed: 15, range_control: 10 },
      maneuvers: { chase_evade: 4 },
      cargo: { capacity: 15, unit: "kg" },
      cetacean_bonuses: { active: false },
      features: { hot: true, smart: true, manipulators: true, rechargeable: true, sealed: true, sensors: true },
      sensors_description: "Sonar activo 400m, cámaras AV, sensor de presión y temperatura. Acopla con remote de superficie integrado.\n\nCetáceos usan sonar de ecolocalización a través de la unidad (rango = rango de sonar del cete).",
      description: "El CICADA (Cybernetic Interactive Cetacean Activity Drone Accessory) es el companion acuático definitivo para cetáceos. Un sled MHD que el cetáceo puede montar para tener apéndices manipuladores funcionales bajo el agua.\n\nLleva integrado un mini-remote de superficie que puede desplegarse para comunicación con humanos."
    }
  },
  {
    name: "CICADA — Estándar",
    type: "remote",
    img: "icons/commodities/treasure/crystal-cyan.webp",
    system: {
      remote_type: "cicada", manufacturer: "Hydrospan", model: "CICADA-III",
      availability: "rare", cost: 26000,
      dimensions: { size_category: "mobile", mass: 165 },
      durability: { value: 2, armor: 0 },
      autonomy: { cognition: 4, coordination: 5 },
      performance: { locomotion: "aquatic", speed: 18, range_control: 15 },
      maneuvers: { chase_evade: 6 },
      cargo: { capacity: 80, unit: "kg" },
      cetacean_bonuses: { active: false },
      features: { hot: true, smart: true, manipulators: true, rechargeable: true, sealed: true, sensors: true, ecm: false },
      sensors_description: "Sonar activo 600m, MARNOC, cámaras multiespectro, sonar pasivo de largo alcance. Remote de superficie retráctil.",
      description: "CICADA de tamaño completo con cuatro apéndices retráctiles. El cetáceo monta sobre la silla ergonómica y controla el sistema directamente con sus flipper-patches neurales.\n\nPermite al cetáceo manipular objetos, operar equipo, escribir en teclados y ejecutar tareas que normalmente requieren manos."
    }
  },
  {
    name: "Remote de Combate — Ligero",
    type: "remote",
    img: "icons/svg/combat.svg",
    system: {
      remote_type: "combat", manufacturer: "Talon Defense Systems", model: "TDS-Raptor Mk1",
      availability: "restricted", cost: 12000,
      dimensions: { size_category: "portable", mass: 8 },
      durability: { value: 3, armor: 1 },
      autonomy: { cognition: 1, coordination: 3 },
      performance: { locomotion: "hover", speed: 20, range_control: 3 },
      maneuvers: { chase_evade: 8 },
      cargo: { capacity: 5, unit: "kg" },
      cetacean_bonuses: { active: false },
      features: { hardened: true, hot: true, sensors: true, weapons: true, rechargeable: true, sealed: true, ecm: true },
      weapons_description: "Pistola pod integrada (DR 7, smart-linked). Tasers retráctiles (aturdimiento). Cuchillas retráctiles (DR 3 + Físico/3).\n\nAtaque RAM: DR = velocidad (m/ronda) ÷ 10. A 20m/ronda = DR 2.",
      sensors_description: "Cámaras AV broadband (low-light, IR, UV, telescópica). Radar 1km. Comms encriptadas. EM shielding.",
      description: "Remote de combate aviar de lift-fans. Puede ejecutar vuelo-rasante, ataques RAM a alta velocidad, y servir como perfilador de combate. Popular para reconocimiento armado y guardia de perímetro."
    }
  },
  {
    name: "Remote de Vigilancia",
    type: "remote",
    img: "icons/svg/eye.svg",
    system: {
      remote_type: "surveillance", manufacturer: "Sight Systems Inc.", model: "SSI-Fly",
      availability: "restricted", cost: 2800,
      dimensions: { size_category: "pocket", mass: 0.15 },
      durability: { value: -3, armor: 0 },
      autonomy: { cognition: 2, coordination: 3 },
      performance: { locomotion: "hover", speed: 6, range_control: 0.5 },
      maneuvers: { chase_evade: 2 },
      cargo: { capacity: 0.1, unit: "kg" },
      cetacean_bonuses: { active: false },
      features: { sensors: true, rechargeable: true, sealed: true, phototropic: true },
      sensors_description: "Cámara AV ultracompacta 360°, micrófono direccional, IR. Transmisión en tiempo real encriptada.",
      description: "Bug de vigilancia con aspecto de insecto volador. El recubrimiento fototropico mimetiza el entorno. Casi invisible a simple vista.\n\nFragilísimo — un golpe directo lo destruye, pero es expendable. Se venden en packs de 10."
    }
  },
  {
    name: "Constelación de Remotes",
    type: "remote",
    img: "icons/magic/control/hypnosis-target-teal.webp",
    system: {
      remote_type: "constellation", manufacturer: "Talon Defense Systems", model: "TDS-Nexus",
      availability: "restricted", cost: 45000,
      dimensions: { size_category: "mobile", mass: 4.8 },
      durability: { value: 2, armor: 0 },
      autonomy: { cognition: 4, coordination: 3 },
      performance: { locomotion: "hover", speed: 16, range_control: 5 },
      maneuvers: { chase_evade: 6 },
      cargo: { capacity: 0, unit: "kg" },
      cetacean_bonuses: { active: false },
      features: { hardened: true, hot: true, sensors: true, gi: true, rechargeable: true, sealed: true, ecm: true },
      sensors_description: "8-12 unidades con sensores solapados. Procesamiento colectivo: cetáceos +4 COG (humanos +2). Cobertura de zona 200m².",
      description: "Sistema de 8-12 remotes interconectados controlados como un único sistema bajo un programa GI de coordinación. El operador puede controlar la constelación como un organismo: cubriendo zona, estableciendo corredores de vigilancia, y ejecutando movimientos coordinados.\n\nLos cetáceos obtienen +4 COG en todas las tareas de coordinación (vs +2 humanos)."
    }
  },
  {
    name: "Remote de Triage",
    type: "remote",
    img: "icons/svg/heal.svg",
    system: {
      remote_type: "triage", manufacturer: "MedStar Corp.", model: "TR-7 Lazarus",
      availability: "uncommon", cost: 35000,
      dimensions: { size_category: "mobile", mass: 12 },
      durability: { value: 2, armor: 0 },
      autonomy: { cognition: 6, coordination: 5 },
      performance: { locomotion: "multi_leg", speed: 10, range_control: 2 },
      maneuvers: { chase_evade: 2 },
      cargo: { capacity: 20, unit: "kg" },
      cetacean_bonuses: { active: false },
      features: { smart: true, sensors: true, sealed: true, manipulators: true },
      sensors_description: "Escáner médico (diagnóstico en tiempo real), cámaras AV, sensor IR para detección de víctimas en escombros.",
      description: "Araña médica autónoma de campo. 8 patas articuladas para movimiento en terrenos difíciles. Carga completa de trauma kit. Puede ejecutar cirugía de campo con supervisión médica remota.\n\nLleva 2 camillas plegadas. Diagnóstico autónomo con recomendaciones para el operador."
    }
  }
];

// ── POPULATE COMPENDIUMS ────────────────────────────────────────────────────
async function populatePack(packName, entries) {
  const pack = game.packs.get(`blue-planet-recontact.${packName}`);
  if (!pack) {
    ui.notifications.error(`Compendio '${packName}' no encontrado. ¿Está registrado en system.json?`);
    return;
  }

  await pack.getDocuments(); // ensure loaded
  const existingNames = pack.contents.map(e => e.name);

  let created = 0, skipped = 0;
  for (const data of entries) {
    if (existingNames.includes(data.name)) {
      console.log(`[BPR] Omitido (ya existe): ${data.name}`);
      skipped++;
      continue;
    }
    await foundry.documents.Actor.create(data, { pack: pack.collection });
    console.log(`[BPR] Creado: ${data.name}`);
    created++;
  }
  ui.notifications.info(`[BPR] ${packName}: ${created} entradas creadas, ${skipped} omitidas.`);
}

// Run
(async () => {
  ui.notifications.info("Creando entradas en compendios de Vehículos y Remotes…");
  await populatePack("vehicles", VEHICLES);
  await populatePack("remotes", REMOTES);
  ui.notifications.info("¡Compendios de Vehículos y Remotes completados!");
})();
