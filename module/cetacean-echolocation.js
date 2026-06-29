/**
 * Cetacean Echolocation Mechanics for Blue Planet Recontact
 * 
 * According to Blue Planet Recontact rules:
 * - Basic echolocation: 100m underwater, 40m in air
 * - Enhanced echolocation (biomod): Double range + stun attack (cachalotes)
 * - +2 COG bonus when using sonar/radar equipment
 * - Remote constellation bonus: +4 COG (vs +2 for humans)
 * - 3D maneuverability: +2 COO for complex aerial/aquatic maneuvers
 * - Intimidation bonuses vs humans swimming: +1 to +8 depending on species
 */

/**
 * Echolocation configuration by species
 */
export const ECHOLOCATION_CONFIG = {
  // Base cetacean
  default: {
    range_underwater: 100,    // meters
    range_air: 40,            // meters
    cogBonus: 2,              // COG bonus when using radar/sonar
    remoteConstellationBonus: 4, // vs 2 for humans
    maneuverabilityBonus: 2,  // COO bonus for 3D maneuvers
    stunAttack: false,
    intimidationBonus: 2      // vs humans swimming
  },
  // Enhanced echolocation (via biomod)
  enhanced: {
    range_underwater: 400,    // meters (doubled from base cetacean)
    range_air: 80,            // meters (doubled)
    cogBonus: 2,
    remoteConstellationBonus: 4,
    maneuverabilityBonus: 2,
    stunAttack: true,         // Sonic stun attack available
    stunDamageRating: 8,      // Damage rating for stun
    intimidationBonus: 4
  },
  // Sperm whale / cachalote (natural stun ability)
  sperm_whale: {
    range_underwater: 400,
    range_air: 80,
    cogBonus: 2,
    remoteConstellationBonus: 4,
    maneuverabilityBonus: 2,
    stunAttack: true,
    stunDamageRating: 12,     // More powerful stun
    intimidationBonus: 8
  },
  // Orca
  orca: {
    range_underwater: 200,
    range_air: 60,
    cogBonus: 2,
    remoteConstellationBonus: 4,
    maneuverabilityBonus: 2,
    stunAttack: false,
    intimidationBonus: 8      // Apex predator
  },
  // Dolphin
  dolphin: {
    range_underwater: 100,
    range_air: 40,
    cogBonus: 2,
    remoteConstellationBonus: 4,
    maneuverabilityBonus: 2,
    stunAttack: false,
    intimidationBonus: 2
  }
};

/**
 * Get echolocation config for a cetacean actor
 * @param {Actor} actor - A cetacean actor
 * @returns {Object} Echolocation config
 */
export function getCetaceanEcholocationConfig(actor) {
  if (!actor || actor.type !== 'cetacean') return null;
  
  const species = (actor.system.species || '').toLowerCase();
  
  // Check for enhanced echolocation biomod
  const hasEnhancedEcholocation = actor.items.some(item => 
    item.type === 'biomod' && 
    item.system.active === true &&
    item.name.toLowerCase().includes('echoloc')
  );
  
  if (hasEnhancedEcholocation) return ECHOLOCATION_CONFIG.enhanced;
  if (species.includes('sperm') || species.includes('cachalote')) return ECHOLOCATION_CONFIG.sperm_whale;
  if (species.includes('orca')) return ECHOLOCATION_CONFIG.orca;
  if (species.includes('dolphin') || species.includes('dolfín')) return ECHOLOCATION_CONFIG.dolphin;
  
  return ECHOLOCATION_CONFIG.default;
}

/**
 * Apply echolocation bonus to a roll context for cetaceans
 * When using sonar/radar: +2 COG to relevant tests
 * 
 * @param {Actor} actor - The cetacean actor
 * @param {string} rollType - Type of roll ('perception', 'navigation', 'targeting', etc.)
 * @param {Object} options - Roll options
 * @returns {number} The COG bonus to apply
 */
export function getEcholocationBonus(actor, rollType = 'perception', options = {}) {
  if (!actor || actor.type !== 'cetacean') return 0;
  if (!actor.system.echolocation) return 0;
  
  const config = getCetaceanEcholocationConfig(actor);
  if (!config) return 0;
  
  // Echolocation provides COG bonus for perception and navigation tests
  const echolocationRolls = ['perception', 'awareness', 'navigation', 'targeting', 'detection'];
  if (echolocationRolls.some(t => rollType.toLowerCase().includes(t))) {
    return config.cogBonus;
  }
  
  // Remote constellation bonus (for telepresence/remote control)
  if (rollType.toLowerCase().includes('remote') || rollType.toLowerCase().includes('telepresence')) {
    return config.remoteConstellationBonus;
  }
  
  // 3D maneuverability (COO bonus for complex maneuvers)
  if (rollType.toLowerCase().includes('maneuver') || rollType.toLowerCase().includes('pilot')) {
    return config.maneuverabilityBonus;
  }
  
  return 0;
}

/**
 * Roll echolocation stun attack
 * Only available to cachalotes/sperm whales or cetaceans with enhanced echolocation biomod
 * @param {Actor} attacker - The cetacean attacker
 * @param {Actor} target - The target
 * @returns {Promise<Object>} Roll result
 */
export async function rollSonicStunAttack(attacker, target) {
  const config = getCetaceanEcholocationConfig(attacker);
  
  if (!config || !config.stunAttack) {
    ui.notifications.warn(`${attacker.name} does not have a sonic stun ability.`);
    return null;
  }
  
  const damageRating = config.stunDamageRating;
  
  // First roll attack: COO test
  const cooValue = attacker.system.attributes?.coordination?.value || 0;
  const targetNumber = 5 + cooValue;
  
  const attackRoll = new Roll('1d10');
  await attackRoll.evaluate();
  
  const success = attackRoll.total <= targetNumber;
  const actionValue = targetNumber - attackRoll.total;
  
  let flavorText = `🔊 Sonic Stun Attack — COO Test (Target: ${targetNumber})`;
  flavorText += success ? `<br><strong style="color:#17a2b8">HIT (AV: +${actionValue})</strong>` 
                        : `<br><strong style="color:#dc3545">MISS</strong>`;
  
  await attackRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: attacker }),
    flavor: flavorText,
    rollMode: game.settings.get('core', 'rollMode')
  });
  
  if (success && target) {
    // Roll damage
    const damageRoll = new Roll('3d10');
    await damageRoll.evaluate();
    
    let successes = 0;
    damageRoll.dice[0].results.forEach(r => {
      if (r.result <= damageRating) successes++;
    });
    
    const stunLevel = successes === 0 ? 'No Effect' :
                      successes === 1 ? 'Stunned (1 round)' :
                      successes === 2 ? 'Stunned (3 rounds)' :
                      'Incapacitated';
    
    await damageRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      flavor: `🔊 Sonic Stun Damage (Rating ${damageRating}) — ${stunLevel}<br>Target: ${target?.name || 'unknown'}`,
      rollMode: game.settings.get('core', 'rollMode')
    });
    
    return { success, actionValue, successes, stunLevel };
  }
  
  return { success, actionValue, successes: 0, stunLevel: 'Miss' };
}

/**
 * Show echolocation info dialog for a cetacean
 * @param {Actor} actor - The cetacean actor
 */
export function showEcholocationInfo(actor) {
  const config = getCetaceanEcholocationConfig(actor);
  if (!config) {
    ui.notifications.warn(`${actor.name} does not have echolocation.`);
    return;
  }
  
  const echoActive = actor.system.echolocation;
  const species = actor.system.species || 'Cetacean';
  
  const content = `
    <div style="color:#ddd; padding:8px;">
      <div style="background:rgba(23,162,184,0.15); border:1px solid #17a2b8; border-radius:6px; 
                  padding:12px; margin-bottom:12px; text-align:center;">
        <h3 style="margin:0 0 4px 0; color:#17a2b8;">🔊 Echolocation</h3>
        <div style="font-size:12px; color:#aaa;">${species}</div>
        <div style="font-size:16px; font-weight:bold; margin- px; 
                    color:${echoActive ? '#28a745' : '#dc3545'}">
          ${echoActive ? '✓ ACTIVE' : '✗ PASSIVE ONLY'}
        </div>
      </div>
      
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:6px 8px; color:#aaa;">Range (underwater)</td>
          <td style="padding:6px 8px; font-weight:bold; color:#17a2b8;">${config.range_underwater}m</td>
        </tr>
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:6px 8px; color:#aaa;">Range (air)</td>
          <td style="padding:6px 8px; font-weight:bold; color:#17a2b8;">${config.range_air}m</td>
        </tr>
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:6px 8px; color:#aaa;">COG bonus (sonar/radar)</td>
          <td style="padding:6px 8px; font-weight:bold; color:#28a745;">+${config.cogBonus}</td>
        </tr>
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:6px 8px; color:#aaa;">Remote constellation bonus</td>
          <td style="padding:6px 8px; font-weight:bold; color:#28a745;">+${config.remoteConstellationBonus} COG</td>
        </tr>
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:6px 8px; color:#aaa;">3D maneuver bonus</td>
          <td style="padding:6px 8px; font-weight:bold; color:#28a745;">+${config.maneuverabilityBonus} COO</td>
        </tr>
        <tr style="border-bottom:1px solid #333;">
          <td style="padding:6px 8px; color:#aaa;">Intimidation (vs swimmers)</td>
          <td style="padding:6px 8px; font-weight:bold; color:#ffc107;">+${config.intimidationBonus}</td>
        </tr>
        ${config.stunAttack ? `
        <tr>
          <td style="padding:6px 8px; color:#aaa;">Sonic stun attack</td>
          <td style="padding:6px 8px; font-weight:bold; color:#dc3545;">✓ DR ${config.stunDamageRating}</td>
        </tr>
        ` : ''}
      </table>
      
      <div style="margin- px; font-size:10px; color:#888; padding:8px; background:#1a1a1a; border-radius:4px;">
        <strong>Rules:</strong> Echolocation provides passive 3D spatial awareness. Active echolocation 
        grants +${config.cogBonus} COG to perception tests and reveals hidden targets. 
        Cetaceans controlling remote constellations gain +${config.remoteConstellationBonus} COG (vs +2 for humans).
      </div>
      
      ${config.stunAttack ? `
      <div style="margin- px; text-align:center;">
        <button id="roll-sonic-stun" style="padding:6px 14px; background:#333; border:1px solid #dc3545; 
          color:#dc3545; border-radius:4px; cursor:pointer; font-size:11px;">
          🔊 Roll Sonic Stun Attack
        </button>
      </div>
      ` : ''}
    </div>
  `;
  
  const dialog = new Dialog({
    title: `Echolocation — ${actor.name}`,
    content,
    buttons: { close: { label: 'Close' } },
    default: 'close',
    render: (html) => {
      html.find('#roll-sonic-stun').on('click', async () => {
        const targets = Array.from(game.user.targets);
        const target = targets.length > 0 ? targets[0].actor : null;
        await rollSonicStunAttack(actor, target);
        dialog.close();
      });
    }
  }, {
    classes: ['blue-planet-recontact', 'dialog', "bpr-dialog"],
    width: 380,
    height: 'auto'
  });
  
  dialog.render(true);
}

/**
 * Register cetacean echolocation hooks
 */
export function registerEcholocationHooks() {
  // Make echolocation functions globally accessible
  globalThis.blueplanet = globalThis.blueplanet || {};
  globalThis.blueplanet.getEcholocationBonus = getEcholocationBonus;
  globalThis.blueplanet.rollSonicStunAttack = rollSonicStunAttack;
  globalThis.blueplanet.showEcholocationInfo = showEcholocationInfo;
  
  console.log('BluePlanet: Cetacean echolocation mechanics registered');
}
