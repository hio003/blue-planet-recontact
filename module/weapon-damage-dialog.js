/**
 * Weapon Damage Roll Dialog with Automatic Targeting for Blue Planet Recontact
 * Handles automatic damage reduction calculations for armor and physique
 */

import { showWoundConfirmationDialog, applyWoundToTarget } from './wound-application.js';

/**
 * Get targeted actor or allow manual selection
 * @returns {Actor|null} The targeted actor if any
 */
function getTargetedActor() {
  // Check for targeted tokens
  const targets = Array.from(game.user.targets);
  console.log('BluePlanet Targeting: Current targets:', {
    count: targets.length,
    targets: targets.map(t => ({ id: t.id, name: t.name, actorId: t.actor?.id, actorName: t.actor?.name }))
  });
  
  if (targets.length === 1) {
    const target = targets[0];
    const actor = target.actor;
    console.log('BluePlanet Targeting: Selected target:', {
      tokenId: target.id,
      tokenName: target.name,
      actorId: actor?.id,
      actorName: actor?.name,
      actorType: actor?.type,
      hasWounds: !!actor?.system?.wounds
    });
    return actor;
  } else if (targets.length > 1) {
    ui.notifications.warn("Multiple targets selected. Please target only one actor for damage calculation.");
    return null;
  }
  
  console.log('BluePlanet Targeting: No targets selected');
  // No targets
  return null;
}

/**
 * Calculate armor reduction for the target
 * @param {Actor} target - The target actor
 * @returns {Object} Armor information and reduction
 */
function calculateArmorReduction(target) {
  if (!target) return { durability: 0, type: "None", description: "No target selected" };
  
  // Look for armor items in the target's inventory
  const armorItems = target.items.filter(item => 
    item.type === 'equipment' && 
    item.system.armor_durability > 0 && 
    item.system.equipped
  );
  
  if (armorItems.length === 0) {
    return { durability: 0, type: "None", description: "No armor equipped" };
  }
  
  // Find the best armor (highest durability)
  const bestArmor = armorItems.reduce((best, current) => 
    current.system.armor_durability > best.system.armor_durability ? current : best
  );
  
  return {
    durability: bestArmor.system.armor_durability || 0,
    type: bestArmor.name,
    description: `${bestArmor.name} (Durability: ${bestArmor.system.armor_durability})`
  };
}

/**
 * Calculate physique reduction for the target
 * @param {Actor} target - The target actor
 * @returns {Object} Physique information and reduction
 */
function calculatePhysiqueReduction(target) {
  if (!target) return { physique: 0, type: "None", description: "No target selected" };
  
  const actorType = target.type;
  const physique = target.system.attributes?.physique?.value || 0;
  const physiqueDual = target.system.attributes?.physique?.dual || 0;
  
  // In Blue Planet, the "dual" attribute is the secondary/reduced Physique for damage reduction
  // For cetaceans and creatures, use physique.dual (the smaller secondary value) if set
  let effectivePhysique = physique;
  let description = `${target.name} (Physique: ${physique})`;
  
  if (actorType === 'cetacean' || actorType === 'creature') {
    // Check if there's a dual physique value (smaller value for large creatures)
    if (physiqueDual > 0 && physiqueDual < physique) {
      effectivePhysique = physiqueDual;
      description = `${target.name} (Large - Dual Physique: ${physiqueDual})`;
    }
  } else if (physiqueDual > 0) {
    // For characters, dual is the secondary physique (e.g., used for damage soak)
    effectivePhysique = physiqueDual;
    description = `${target.name} (Physique dual: ${physiqueDual})`;
  }
  
  return {
    physique: effectivePhysique,
    type: actorType,
    description: description
  };
}

/**
 * Create and show the weapon damage roll dialog with targeting
 * @param {Actor} actor - The attacking actor
 * @param {Item} weapon - The weapon being used
 * @param {Object} rollData - Additional roll data
 */
export function showWeaponDamageDialog(actor, weapon, rollData = {}) {
  console.log('BluePlanet Weapon Damage Dialog: Creating damage dialog', { 
    actor: actor?.name, 
    weapon: weapon?.name, 
    rollData 
  });
  
  // Get targeted actor
  const target = getTargetedActor();
  
  // Calculate reductions
  const armorInfo = calculateArmorReduction(target);
  const physiqueInfo = calculatePhysiqueReduction(target);
  
  // Base damage rating from weapon
  const baseDamageRating = weapon.system.damage || 0;
  const calledShotBonus = rollData.calledShotBonus || 0;
  const ammoModifiers = weapon.getAmmunitionModifiers ? weapon.getAmmunitionModifiers() : { damage_modifier: 0, penetration: 0 };
  const ammoDamageBonus = ammoModifiers.damage_modifier || 0;
  const penetration = ammoModifiers.penetration || 0;
  
  // Calculate effective armor after penetration
  const effectiveArmorDurability = Math.max(0, armorInfo.durability - penetration);
  
  // Calculate total damage bonus
  const totalDamageBonus = calledShotBonus + ammoDamageBonus;
  const adjustedDamageRating = baseDamageRating + totalDamageBonus;
  
  // Calculate final damage rating after reductions
  const finalDamageRating = Math.max(1, adjustedDamageRating - effectiveArmorDurability - physiqueInfo.physique);
  
  // Generate the content HTML
  const content = createWeaponDamageDialogContent({
    weapon,
    target,
    baseDamageRating,
    calledShotBonus,
    ammoDamageBonus,
    penetration,
    armorInfo,
    physiqueInfo,
    effectiveArmorDurability,
    totalDamageBonus,
    adjustedDamageRating,
    finalDamageRating
  });
  
  // Create dialog
  const dialogTitle = `${weapon.name} Damage Roll${target ? ` vs ${target.name}` : ''}`;
  
  const dialog = new Dialog({
    title: dialogTitle,
    content: content,
    buttons: {
      roll: {
        icon: '<i class="fas fa-heart-broken"></i>',
        label: "<span style='font-weight: bold;'>Roll Damage</span>",
        callback: (html) => handleWeaponDamageRoll(actor, weapon, html, {
          target,
          baseDamageRating,
          armorInfo,
          physiqueInfo,
          rollData
        })
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "<span style='font-weight: bold;'>Cancel</span>",
        callback: () => {}
      }
    },
    default: "roll",
    render: (html) => {
      console.log('BluePlanet Weapon Damage Dialog: Dialog rendered, setting up listeners');
      setupWeaponDamageDialogListeners(html);
    },
    close: () => {}
  }, {
    classes: ["blue-planet-recontact", "dialog", "sheet", "weapon-damage", "targeting-enhanced", "bpr-dialog"],
    width: 520,
    height: 480,
    resizable: false,
    minimizable: false
  });
  
  dialog.render(true);
  
  // Setup reactive listener for this dialog
  setupDialogReactiveListener(dialog, weapon);
  
  return dialog;
}

/**
 * Create the HTML content for the weapon damage dialog
 */
function createWeaponDamageDialogContent(data) {
  const {
    weapon,
    target,
    baseDamageRating,
    calledShotBonus,
    ammoDamageBonus,
    penetration,
    armorInfo,
    physiqueInfo,
    effectiveArmorDurability,
    totalDamageBonus,
    adjustedDamageRating,
    finalDamageRating
  } = data;
  
  return `
    <div class="blue-planet-weapon-damage-dialog">
      <form>
        
        <div class="form-group">
          <h4>Weapon Information</h4>
          <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; text-align: center; color: #ddd; font-size: 12px;">
            <div style="margin-bottom: 4px;"><strong>${weapon.name}</strong></div>
            <div style="font-size: 10px; color: #aaa;">Base Damage Rating: ${baseDamageRating}</div>
            ${weapon.system.loaded_ammunition ? `<div style="font-size: 10px; color: #87ceeb;">Ammunition: ${weapon.system.loaded_ammunition.name}</div>` : ''}
          </div>
        </div>
        
        ${target ? `
        <div class="form-group target-section" style="border: 2px solid #17a2b8; border-radius: 6px; padding: 12px; background: rgba(23, 162, 184, 0.1);">
          <h4 style="color: #17a2b8; margin- ;"><i class="fas fa-crosshairs"></i> Target: ${target.name}</h4>
          <div style="font-size: 11px; color: #ddd; margin-bottom: 8px;">
            <em>Automatic damage reductions will be applied based on Blue Planet rules</em>
          </div>
          
          <div class="target-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="armor-details" style="background: rgba(255, 193, 7, 0.1); padding: 8px; border-radius: 4px; border: 1px solid #ffc107;">
              <div style="font-size: 11px; font-weight: bold; color: #ffc107; margin-bottom: 4px;">
                <i class="fas fa-shield-alt"></i> Armor Protection
              </div>
              <div style="font-size: 10px; color: #ddd;">${armorInfo.description}</div>
              ${armorInfo.durability > 0 ? `
                <div style="font-size: 10px; color: #aaa; margin- px;">
                  Durability: ${armorInfo.durability}
                  ${penetration > 0 ? `<br>After Penetration: ${effectiveArmorDurability}` : ''}
                </div>
              ` : ''}
            </div>
            
            <div class="physique-details" style="background: rgba(40, 167, 69, 0.1); padding: 8px; border-radius: 4px; border: 1px solid #28a745;">
              <div style="font-size: 11px; font-weight: bold; color: #28a745; margin-bottom: 4px;">
                <i class="fas fa-running"></i> Physical Resistance
              </div>
              <div style="font-size: 10px; color: #ddd;">${physiqueInfo.description}</div>
            </div>
          </div>
        </div>
        ` : `
        <div class="form-group no-target-section" style="border: 2px dashed #6c757d; border-radius: 6px; padding: 12px; background: rgba(108, 117, 125, 0.1);">
          <h4 style="color: #6c757d; margin- ;"><i class="fas fa-question-circle"></i> No Target Selected</h4>
          <div style="font-size: 11px; color: #aaa; text-align: center;">
            <em>Select a target token to automatically apply armor and physique reductions</em><br>
            <em>Damage will be calculated without target-based reductions</em>
          </div>
        </div>
        `}
        
        <div class="form-group damage-calculation-section">
          <h4>Damage Calculation</h4>
          <div style="background: #2a2a2a; padding: 12px; border-radius: 4px;">
            
            <div class="calculation-breakdown" style="font-size: 11px; color: #ddd; margin-bottom: 12px;">
              <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; margin-bottom: 4px;">
                <span>Base Damage Rating:</span>
                <span style="border-bottom: 1px dotted #555;"></span>
                <span style="font-weight: bold;">${baseDamageRating}</span>
              </div>
              
              ${totalDamageBonus !== 0 ? `
              <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; margin-bottom: 4px; color: ${totalDamageBonus > 0 ? '#28a745' : '#dc3545'};">
                <span>Damage Bonuses:</span>
                <span style="border-bottom: 1px dotted #555;"></span>
                <span style="font-weight: bold;">${totalDamageBonus > 0 ? '+' : ''}${totalDamageBonus}</span>
              </div>
              ${calledShotBonus !== 0 ? `<div style="font-size: 9px; color: #aaa; margin- px;">• Called Shot: ${calledShotBonus}</div>` : ''}
              ${ammoDamageBonus !== 0 ? `<div style="font-size: 9px; color: #aaa; margin- px;">• Ammunition: ${ammoDamageBonus}</div>` : ''}
              ` : ''}
              
              ${target && (effectiveArmorDurability > 0 || physiqueInfo.physique > 0) ? `
              <div style="border- px solid #444; padding- px; margin- px;">
                <div style="font-size: 10px; color: #dc3545; margin-bottom: 4px; font-weight: bold;">Target Reductions:</div>
                ${effectiveArmorDurability > 0 ? `
                <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; margin-bottom: 4px; color: #dc3545;">
                  <span>Armor Durability:</span>
                  <span style="border-bottom: 1px dotted #555;"></span>
                  <span style="font-weight: bold;">-${effectiveArmorDurability}</span>
                </div>
                ` : ''}
                ${physiqueInfo.physique > 0 ? `
                <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; margin-bottom: 4px; color: #dc3545;">
                  <span>Target Physique:</span>
                  <span style="border-bottom: 1px dotted #555;"></span>
                  <span style="font-weight: bold;">-${physiqueInfo.physique}</span>
                </div>
                ` : ''}
              </div>
              ` : ''}
              
              <div style="border- px solid #d4af37; padding- px; margin- px;">
                <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; font-size: 14px; font-weight: bold; color: #d4af37;">
                  <span>Final Damage Rating:</span>
                  <span style="border-bottom: 2px solid #d4af37;"></span>
                  <span id="final-damage-rating">${finalDamageRating}</span>
                </div>
              </div>
            </div>
            
            <div class="manual-adjustments" style="border- px solid #444; padding- px;">
              <h5 style="color: #6c757d; margin-bottom: 8px;">Manual Adjustments (Optional)</h5>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="font-size: 10px; color: #aaa;">Extra Damage Bonus:</label>
                  <input type="number" name="extra-damage-bonus" value="0" min="-10" max="20" style="width: 100%; height: 24px; text-align: center;">
                </div>
                <div>
                  <label style="font-size: 10px; color: #aaa;">Override Final DR:</label>
                  <input type="number" name="override-damage-rating" value="" min="1" max="30" placeholder="Leave blank" style="width: 100%; height: 24px; text-align: center;">
                </div>
              </div>
              <div style="font-size: 9px; color: #666; margin- px; text-align: center;">
                <em>Use these only if special circumstances require manual adjustment</em>
              </div>
            </div>
            
            ${target ? `
            <div class="wound-application-section" style="border- px solid #444; padding- px; margin- px;">
              <h5 style="color: #17a2b8; margin-bottom: 8px;"><i class="fas fa-heart-broken"></i> Wound Application</h5>
              <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #ddd;">
                  <input type="checkbox" name="auto-apply-wounds" checked style="accent-color: #17a2b8;">
                  Automatically apply wounds to ${target.name}
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #ddd;">
                  <input type="checkbox" name="confirm-wounds" checked style="accent-color: #ffc107;">
                  Show confirmation dialog
                </label>
              </div>
              <div style="font-size: 9px; color: #666; margin- px; font-style: italic;">
                Wounds will be automatically applied to the target's character sheet based on damage successes
              </div>
            </div>
            ` : ''}
            
          </div>
        </div>
        
        ${penetration > 0 ? `
        <div class="form-group penetration-info" style="background: rgba(255, 152, 0, 0.1); border: 1px solid #ff9800; border-radius: 4px; padding: 8px; margin- px;">
          <div style="font-size: 11px; color: #ff9800; font-weight: bold; margin-bottom: 4px;">
            <i class="fas fa-sword"></i> Armor Penetration: ${penetration}
          </div>
          <div style="font-size: 9px; color: #ddd;">
            This ammunition reduces the target's armor durability by ${penetration} for this attack.
          </div>
        </div>
        ` : ''}
        
      </form>
    </div>
  `;
}

/**
 * Setup event listeners for the weapon damage dialog
 */
function setupWeaponDamageDialogListeners(html) {
  console.log('BluePlanet Damage Dialog: Setting up listeners for elements:', {
    totalInputs: html.find('input').length,
    checkboxes: html.find('input[type="checkbox"]').length,
    autoApplyCheckbox: html.find('input[name="auto-apply-wounds"]').length,
    confirmCheckbox: html.find('input[name="confirm-wounds"]').length,
    woundSection: html.find('.wound-application-section').length
  });
  
  // Update final damage rating when manual adjustments change
  const updateFinalDamageRating = () => {
    const extraBonus = parseInt(html.find('input[name="extra-damage-bonus"]').val()) || 0;
    const overrideDR = parseInt(html.find('input[name="override-damage-rating"]').val());
    
    // Get original final DR from the span
    const originalFinalDR = parseInt(html.find('#final-damage-rating').text());
    
    let displayDR;
    if (!isNaN(overrideDR) && overrideDR > 0) {
      displayDR = overrideDR;
      html.find('#final-damage-rating').css('color', '#dc3545').text(displayDR);
    } else if (extraBonus !== 0) {
      displayDR = Math.max(1, originalFinalDR + extraBonus);
      html.find('#final-damage-rating').css('color', extraBonus > 0 ? '#28a745' : '#dc3545').text(displayDR);
    } else {
      html.find('#final-damage-rating').css('color', '#d4af37').text(originalFinalDR);
    }
  };
  
  // Bind change events for manual adjustments
  html.find('input[name="extra-damage-bonus"], input[name="override-damage-rating"]').on('input change', updateFinalDamageRating);
  
  // Add debugging for wound application checkboxes
  const autoApplyCheckbox = html.find('input[name="auto-apply-wounds"]');
  const confirmCheckbox = html.find('input[name="confirm-wounds"]');
  
  if (autoApplyCheckbox.length > 0) {
    console.log('BluePlanet Damage Dialog: Auto-apply checkbox found, current state:', autoApplyCheckbox.is(':checked'));
    autoApplyCheckbox.on('change', function() {
      console.log('BluePlanet Damage Dialog: Auto-apply checkbox changed to:', $(this).is(':checked'));
    });
  }
  
  if (confirmCheckbox.length > 0) {
    console.log('BluePlanet Damage Dialog: Confirm checkbox found, current state:', confirmCheckbox.is(':checked'));
    confirmCheckbox.on('change', function() {
      console.log('BluePlanet Damage Dialog: Confirm checkbox changed to:', $(this).is(':checked'));
    });
  }
}

/**
 * Handle the weapon damage roll execution
 */
async function handleWeaponDamageRoll(actor, weapon, html, context) {
  console.log('BluePlanet Weapon Damage Dialog: Handling damage roll');
  
  try {
    // Get form data
    const extraBonus = parseInt(html.find('input[name="extra-damage-bonus"]').val()) || 0;
    const overrideDR = parseInt(html.find('input[name="override-damage-rating"]').val());
    const autoApplyWounds = html.find('input[name="auto-apply-wounds"]').is(':checked');
    const confirmWounds = html.find('input[name="confirm-wounds"]').is(':checked');
    
    console.log('BluePlanet Damage: Form inputs found:', {
      extraBonusInput: html.find('input[name="extra-damage-bonus"]').length,
      overrideDRInput: html.find('input[name="override-damage-rating"]').length,
      autoApplyInput: html.find('input[name="auto-apply-wounds"]').length,
      confirmWoundsInput: html.find('input[name="confirm-wounds"]').length
    });
    console.log('BluePlanet Damage: Form values extracted:', {
      extraBonus,
      overrideDR,
      autoApplyWounds,
      confirmWounds
    });
    
    console.log('BluePlanet Damage: Wound application settings:', {
      autoApplyWounds,
      confirmWounds,
      hasTarget: !!context.target
    });
    
    // Calculate final damage rating
    let finalDamageRating;
    if (!isNaN(overrideDR) && overrideDR > 0) {
      finalDamageRating = overrideDR;
    } else {
      // Recalculate from base values
      const baseDR = context.baseDamageRating + (context.rollData.calledShotBonus || 0);
      const ammoModifiers = weapon.getAmmunitionModifiers ? weapon.getAmmunitionModifiers() : { damage_modifier: 0, penetration: 0 };
      const ammoDamageBonus = ammoModifiers.damage_modifier || 0;
      const penetration = ammoModifiers.penetration || 0;
      
      const effectiveArmor = context.target ? Math.max(0, context.armorInfo.durability - penetration) : 0;
      const physique = context.target ? context.physiqueInfo.physique : 0;
      
      finalDamageRating = Math.max(1, baseDR + ammoDamageBonus + extraBonus - effectiveArmor - physique);
    }
    
    // Create and execute damage roll (3d10 vs DR)
    const roll = new Roll('3d10');
    await roll.evaluate();
    
    // Count successes (dice that rolled <= damage rating)
    let successes = 0;
    roll.dice[0].results.forEach(result => {
      if (result.result <= finalDamageRating) successes++;
    });
    
    // Determine wound level
    let woundLevel = "No Wound";
    let woundPenalty = 0;
    if (successes === 1) {
      woundLevel = "Minor Wound";
      woundPenalty = -1;
    } else if (successes === 2) {
      woundLevel = "Major Wound";
      woundPenalty = -2;
    } else if (successes === 3) {
      woundLevel = "Mortal Wound";
      woundPenalty = -3;
    }
    
    // Create comprehensive flavor text
    let flavorText = `<h3>${weapon.name} Damage</h3>`;
    flavorText += `<p style="color: black; font-size: 11px; margin: 2px 0;"><em>Damage Roll - Rating ${finalDamageRating}</em></p>`;
    
    // Add target information if present
    if (context.target) {
      flavorText += `<div style="background: rgba(23, 162, 184, 0.1); border: 1px solid #17a2b8; border-radius: 4px; padding: 6px; margin: 4px 0;">`;
      flavorText += `<p style="font-size: 10px; color: #17a2b8; margin: 2px 0; font-weight: bold;"><i class="fas fa-crosshairs"></i> Target: ${context.target.name}</p>`;
      
      const reductions = [];
      if (context.armorInfo.durability > 0) {
        const ammoModifiers = weapon.getAmmunitionModifiers ? weapon.getAmmunitionModifiers() : { penetration: 0 };
        const penetration = ammoModifiers.penetration || 0;
        const effectiveArmor = Math.max(0, context.armorInfo.durability - penetration);
        reductions.push(`Armor: -${effectiveArmor}${penetration > 0 ? ` (${context.armorInfo.durability} - ${penetration} pen)` : ''}`);
      }
      if (context.physiqueInfo.physique > 0) {
        reductions.push(`Physique: -${context.physiqueInfo.physique}`);
      }
      
      if (reductions.length > 0) {
        flavorText += `<p style="font-size: 9px; color: #aaa; margin: 2px 0;"><em>Reductions: ${reductions.join(', ')}</em></p>`;
      }
      flavorText += `</div>`;
    }
    
    // Add dice results and wound information
    flavorText += `<p><strong>Dice:</strong> [${roll.terms[0].results.map(r => r.result).join(', ')}] vs DR ${finalDamageRating}</p>`;
    flavorText += `<p><strong>Successes:</strong> ${successes} | <strong>Result:</strong> ${woundLevel}</p>`;
    
    // Add wound level styling
    let woundColor = "#6c757d";
    if (successes === 1) woundColor = "#ffc107";
    else if (successes === 2) woundColor = "#ff9800";
    else if (successes === 3) woundColor = "#dc3545";
    
    flavorText += `<div style="text-align: center; margin: 8px 0; padding: 8px; background: rgba(${successes === 0 ? '108, 117, 125' : successes === 1 ? '255, 193, 7' : successes === 2 ? '255, 152, 0' : '220, 53, 69'}, 0.1); border: 1px solid ${woundColor}; border-radius: 4px;">`;
    flavorText += `<strong style="color: ${woundColor}; font-size: 14px;">${woundLevel}</strong>`;
    if (woundPenalty < 0) {
      flavorText += `<br><span style="color: ${woundColor}; font-size: 11px;">Penalty: ${woundPenalty} to all tests</span>`;
    }
    flavorText += `</div>`;
    
    // Create message data
    const messageData = {
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: flavorText,
      rollMode: game.settings.get("core", "rollMode"),
      sound: CONFIG.sounds.dice,
      flags: {
        "blue-planet-recontact": {
          rollType: 'weapon-damage',
          successes: successes,
          woundLevel: woundLevel,
          woundPenalty: woundPenalty,
          damageRating: finalDamageRating,
          weaponName: weapon.name,
          targetName: context.target?.name || null
        }
      }
    };
    
    await roll.toMessage(messageData);
    
    // Apply wounds to target if enabled and there's a target
    console.log('BluePlanet Damage: Checking wound application conditions:', {
      hasTarget: !!context.target,
      targetName: context.target?.name,
      targetId: context.target?.id,
      autoApplyWounds,
      confirmWounds,
      woundLevel,
      isWoundLevel: woundLevel !== 'No Wound',
      contextTarget: context.target,
      functionsAvailable: {
        applyWoundToTarget: typeof applyWoundToTarget,
        showWoundConfirmationDialog: typeof showWoundConfirmationDialog,
        gameApplyWound: typeof game.blueplanet?.applyWoundToTarget,
        gameShowConfirm: typeof game.blueplanet?.showWoundConfirmationDialog
      }
    });
    
    if (context.target && autoApplyWounds && woundLevel !== 'No Wound') {
      console.log(`BluePlanet Damage: Applying ${woundLevel} to ${context.target.name}`);
      console.log('BluePlanet Damage: Target validation:', {
        targetExists: !!context.target,
        targetName: context.target.name,
        targetId: context.target.id,
        targetType: context.target.type,
        hasSystem: !!context.target.system,
        hasWounds: !!context.target.system?.wounds,
        woundsStructure: context.target.system?.wounds,
        canUpdate: typeof context.target.update === 'function'
      });
      console.log('BluePlanet Damage: Functions available:', {
        applyWoundToTarget: typeof applyWoundToTarget,
        showWoundConfirmationDialog: typeof showWoundConfirmationDialog
      });
      
      const ammoModifiers = weapon.getAmmunitionModifiers ? weapon.getAmmunitionModifiers() : { damage_modifier: 0, penetration: 0 };
      const damageData = {
        weaponName: weapon.name,
        damageRating: finalDamageRating,
        successes: successes,
        rollResult: roll.total,
        attackerName: actor.name,
        armorReduction: context.target ? Math.max(0, context.armorInfo.durability - (ammoModifiers.penetration || 0)) : 0,
        physiqueReduction: context.target ? context.physiqueInfo.physique : 0
      };
      
      console.log('BluePlanet Damage: Damage data prepared:', damageData);
      
      try {
        // Try to use imported functions first, then fallback to global functions
        const applyWoundFunc = applyWoundToTarget || game.blueplanet?.applyWoundToTarget;
        const showConfirmFunc = showWoundConfirmationDialog || game.blueplanet?.showWoundConfirmationDialog;
        
        console.log('BluePlanet Damage: Using functions:', {
          applyWoundFunc: typeof applyWoundFunc,
          showConfirmFunc: typeof showConfirmFunc
        });
        
        if (!applyWoundFunc) {
          throw new Error('applyWoundToTarget function not available');
        }
        
        // CRITICAL: Ensure we're only applying wounds to the TARGET, never the attacker
        console.log('BluePlanet Damage: CRITICAL CHECK - Actors involved:', {
          attacker: { name: actor.name, id: actor.id },
          target: { name: context.target.name, id: context.target.id },
          isSameActor: actor.id === context.target.id
        });
        
        if (actor.id === context.target.id) {
          console.error('BluePlanet Damage: CRITICAL ERROR - Attacker and target are the same actor! Aborting wound application.');
          ui.notifications.error('Cannot apply wound: attacker and target are the same actor!');
          return;
        }
        
        if (confirmWounds) {
          if (!showConfirmFunc) {
            console.warn('BluePlanet Damage: Confirmation dialog function not available, applying directly');
            console.log(`BluePlanet Damage: APPLYING WOUND TO: ${context.target.name} (ID: ${context.target.id})`);
            const applied = await applyWoundFunc(context.target, woundLevel, damageData);
            console.log('BluePlanet Damage: Wound application result (fallback):', applied);
          } else {
            console.log('BluePlanet Damage: Showing wound confirmation dialog...');
            console.log(`BluePlanet Damage: CONFIRMING WOUND FOR: ${context.target.name} (ID: ${context.target.id})`);
            // Show confirmation dialog
            const applied = await showConfirmFunc(context.target, woundLevel, damageData);
            if (applied) {
              console.log(`BluePlanet Damage: Wound successfully applied via confirmation dialog`);
            } else {
              console.log(`BluePlanet Damage: Wound application cancelled by user`);
            }
          }
        } else {
          console.log('BluePlanet Damage: Applying wound directly without confirmation...');
          console.log(`BluePlanet Damage: APPLYING WOUND TO: ${context.target.name} (ID: ${context.target.id})`);
          // Apply directly without confirmation
          const applied = await applyWoundFunc(context.target, woundLevel, damageData);
          console.log('BluePlanet Damage: Wound application result:', applied);
          if (applied) {
            console.log(`BluePlanet Damage: Wound automatically applied`);
          } else {
            console.log(`BluePlanet Damage: Failed to apply wound automatically`);
          }
        }
      } catch (woundError) {
        console.error('BluePlanet Damage: Error applying wound:', woundError);
        ui.notifications.warn(`Could not apply wound to ${context.target.name}. Please apply manually.`);
      }
    } else if (context.target && woundLevel !== 'No Wound') {
      console.log(`BluePlanet Damage: Wound application disabled for ${woundLevel}`);
    }
    
    console.log('BluePlanet Weapon Damage Dialog: Damage roll completed successfully');
    
  } catch (error) {
    console.error('BluePlanet Weapon Damage Dialog: Error during damage roll:', error);
    ui.notifications.error('Error executing weapon damage roll. Check console for details.');
  }
}

/**
 * Setup reactive listener for the damage dialog
 * @param {Dialog} dialog - The dialog instance
 * @param {Item} weapon - The weapon item
 */
function setupDialogReactiveListener(dialog, weapon) {
  // Listen for weapon updates
  const updateHandler = (data) => {
    if (data.weapon.id === weapon.id) {
      console.log('BluePlanet Damage Dialog: Weapon updated, refreshing dialog');
      
      // Update weapon reference
      Object.assign(weapon.system, data.currentValues);
      
      // Show update notification in dialog
      const dialogElement = dialog.element;
      if (dialogElement) {
        // Add update banner
        const existingBanner = dialogElement.find('.weapon-update-banner');
        if (existingBanner.length === 0) {
          const updateBanner = $(`
            <div class="weapon-update-banner" style="
              background: rgba(255, 193, 7, 0.1);
              border: 1px solid #ffc107;
              border-radius: 4px;
              padding: 8px;
              margin: 8px 0;
              text-align: center;
              font-size: 11px;
              color: #856404;
              animation: slideDown 0.3s ease;
            ">
              <i class="fas fa-sync-alt"></i> <strong>Weapon Updated!</strong>
              ${data.changedProperties.includes('damage') ? `Damage: ${data.currentValues.damage}` : ''}
              ${data.changedProperties.includes('effective_range') ? ` Range: ${data.currentValues.effective_range}m` : ''}
            </div>
          `);
          
          dialogElement.find('.window-content form').prepend(updateBanner);
          
          // Auto-remove banner after 5 seconds
          setTimeout(() => {
            updateBanner.fadeOut(300, () => updateBanner.remove());
          }, 5000);
        }
        
        // Update displayed values in the dialog
        if (data.changedProperties.includes('damage')) {
          dialogElement.find('[data-weapon-damage], .base-damage-value').each(function() {
            const element = $(this);
            const text = element.text();
            if (text.match(/\d+/)) {
              element.text(text.replace(/\d+/, data.currentValues.damage));
              element.addClass('value-updated');
              setTimeout(() => element.removeClass('value-updated'), 1000);
            }
          });
          
          // Recalculate final damage rating if shown
          const finalDRElement = dialogElement.find('#final-damage-rating');
          if (finalDRElement.length > 0) {
            // This would need to recalculate based on all factors
            finalDRElement.addClass('value-updated');
            setTimeout(() => finalDRElement.removeClass('value-updated'), 1000);
          }
        }
      }
    }
  };
  
  // Add the listener
  Hooks.on('bluePlanet.weaponUpdated', updateHandler);
  
  // Clean up listener when dialog closes
  const originalClose = dialog.close.bind(dialog);
  dialog.close = function(...args) {
    console.log('BluePlanet Damage Dialog: Cleaning up reactive listener');
    Hooks.off('bluePlanet.weaponUpdated', updateHandler);
    return originalClose(...args);
  };
}
