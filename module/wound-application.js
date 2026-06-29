/**
 * Wound Application System for Blue Planet Recontact
 * Handles automatic application of wounds to targeted actors
 */

/**
 * Apply wounds to a target actor based on damage roll results
 * @param {Actor} target - The target actor
 * @param {string} woundLevel - The wound level (Minor Wound, Major Wound, Mortal Wound, No Wound)
 * @param {Object} damageData - Additional damage data
 * @returns {Promise<boolean>} Success status
 */
export async function applyWoundToTarget(target, woundLevel, damageData = {}) {
  console.log('BluePlanet Wounds: applyWoundToTarget called with:', {
    target: target?.name || 'null',
    targetId: target?.id || 'null',
    woundLevel,
    damageData
  });
  
  // CRITICAL VALIDATION: Prevent self-inflicted wounds
  if (damageData.attackerName && target?.name === damageData.attackerName) {
    console.error('BluePlanet Wounds: CRITICAL ERROR - Attempting to apply wound to attacker!');
    console.error('BluePlanet Wounds: Attacker:', damageData.attackerName);
    console.error('BluePlanet Wounds: Target:', target.name);
    ui.notifications.error('ERROR: Cannot apply wounds to the attacker!');
    return false;
  }
  
  if (!target) {
    console.warn('BluePlanet Wounds: No target provided for wound application');
    return false;
  }
  
  console.log(`BluePlanet Wounds: Applying ${woundLevel} to ${target.name}`);
  console.log('BluePlanet Wounds: Call stack:', new Error().stack?.split('\n').slice(1, 5));
  console.log('BluePlanet Wounds: Target system data:', target.system);
  console.log('BluePlanet Wounds: Current wounds:', target.system.wounds);
  
  try {
    // Ensure wounds structure exists and is properly initialized
    let currentWounds;
    if (target.system.wounds) {
      currentWounds = foundry.utils.deepClone(target.system.wounds);
    } else {
      console.warn('BluePlanet Wounds: Target has no wounds structure, initializing...');
      currentWounds = { minor: 0, major: 0, mortal: 0 };
    }
    
    // Ensure all wound types are present
    currentWounds.minor = currentWounds.minor || 0;
    currentWounds.major = currentWounds.major || 0;
    currentWounds.mortal = currentWounds.mortal || 0;
    
    console.log('BluePlanet Wounds: Current wounds initialized:', currentWounds);
    let woundApplied = false;
    let woundType = null;
    
    // Determine which wound to apply based on the level
    console.log('BluePlanet Wounds: Processing wound level:', woundLevel);
    switch (woundLevel) {
      case 'Minor Wound':
        console.log('BluePlanet Wounds: Adding minor wound');
        currentWounds.minor += 1;
        woundApplied = true;
        woundType = 'minor';
        break;
        
      case 'Major Wound':
        console.log('BluePlanet Wounds: Adding major wound');
        currentWounds.major += 1;
        woundApplied = true;
        woundType = 'major';
        break;
        
      case 'Mortal Wound':
        console.log('BluePlanet Wounds: Adding mortal wound');
        currentWounds.mortal += 1;
        woundApplied = true;
        woundType = 'mortal';
        break;
        
      case 'No Wound':
      default:
        console.log(`BluePlanet Wounds: No wound to apply (${woundLevel})`);
        return true; // Success, but no wound applied
    }
    
    if (woundApplied) {
      console.log('BluePlanet Wounds: Updating target with new wounds:', currentWounds);
      // Update the target actor
      const updateData = { 'system.wounds': currentWounds };
      console.log('BluePlanet Wounds: Update data:', updateData);
      
      const updateResult = await target.update(updateData);
      console.log('BluePlanet Wounds: Update result:', updateResult);
      
      // Verify the update worked
      const updatedWounds = target.system.wounds;
      console.log('BluePlanet Wounds: Wounds after update:', updatedWounds);
      
      // Show notification
      const woundText = woundType === 'minor' ? 'Minor Wound (-1)' : 
                       woundType === 'major' ? 'Major Wound (-2)' : 
                       'Mortal Wound (-3)';
      
      ui.notifications.info(`${target.name} takes a ${woundText}`, {
        console: false,
        permanent: false
      });
      
      // Create visual effect if target has a token
      await createWoundVisualEffect(target, woundType);
      
      // Update target's condition status
      await updateTargetCondition(target);
      
      console.log(`BluePlanet Wounds: Successfully applied ${woundLevel} to ${target.name}`);
      
      // Emit hook for other systems to listen to
      Hooks.callAll('bluePlanet.woundApplied', {
        target: target,
        woundType: woundType,
        woundLevel: woundLevel,
        newWounds: currentWounds,
        damageData: damageData
      });
      
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error(`BluePlanet Wounds: Error applying wound to ${target.name}:`, error);
    ui.notifications.error(`Failed to apply wound to ${target.name}`);
    return false;
  }
}

/**
 * Show confirmation dialog before applying wounds
 * @param {Actor} target - The target actor
 * @param {string} woundLevel - The wound level to apply
 * @param {Object} damageData - Damage roll data
 * @returns {Promise<boolean>} Whether the wound was applied
 */
export async function showWoundConfirmationDialog(target, woundLevel, damageData = {}) {
  return new Promise((resolve) => {
    // Don't show confirmation for No Wound
    if (woundLevel === 'No Wound') {
      resolve(false);
      return;
    }
    
    const woundPenalty = woundLevel === 'Minor Wound' ? '-1' :
                        woundLevel === 'Major Wound' ? '-2' :
                        woundLevel === 'Mortal Wound' ? '-3' : '0';
    
    const currentWounds = target.system.wounds || { minor: 0, major: 0, mortal: 0 };
    const totalWounds = currentWounds.minor + currentWounds.major + currentWounds.mortal;
    const newTotal = totalWounds + 1;
    
    const content = `
      <div class="wound-confirmation-dialog">
        <div class="target-info" style="text-align: center; margin-bottom: 16px; padding: 12px; background: rgba(23, 162, 184, 0.1); border: 1px solid #17a2b8; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #17a2b8;"><i class="fas fa-crosshairs"></i> ${target.name}</h3>
          <div style="font-size: 12px; color: #ddd;">
            Current Wounds: Minor ${currentWounds.minor} | Major ${currentWounds.major} | Mortal ${currentWounds.mortal}
          </div>
        </div>
        
        <div class="wound-result" style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 18px; font-weight: bold; color: ${woundLevel === 'Minor Wound' ? '#ffc107' : woundLevel === 'Major Wound' ? '#ff9800' : '#dc3545'}; margin-bottom: 8px;">
            ${woundLevel}
          </div>
          <div style="font-size: 14px; color: #aaa;">
            Penalty: ${woundPenalty} to all tests
          </div>
        </div>
        
        <div class="damage-details" style="background: #2a2a2a; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
          <div style="font-size: 12px; color: #ddd;">
            <strong>Damage Details:</strong><br>
            Rating: ${damageData.damageRating || 'Unknown'}<br>
            Successes: ${damageData.successes || 0}<br>
            ${damageData.weaponName ? `Weapon: ${damageData.weaponName}` : ''}
          </div>
        </div>
        
        <div class="confirmation-question" style="text-align: center; color: #fff; font-weight: bold;">
          Apply this wound to ${target.name}?
        </div>
      </div>
    `;
    
    const dialog = new Dialog({
      title: `Apply Wound - ${woundLevel}`,
      content: content,
      buttons: {
        apply: {
          icon: '<i class="fas fa-heart-broken"></i>',
          label: "<span style='font-weight: bold; color: #dc3545;'>Apply Wound</span>",
          callback: async () => {
            const success = await applyWoundToTarget(target, woundLevel, damageData);
            resolve(success);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "<span style='font-weight: bold;'>Cancel</span>",
          callback: () => resolve(false)
        }
      },
      default: "apply",
      render: (html) => {
        // Add some styling
        html.find('.dialog').addClass('wound-confirmation');
      },
      close: () => resolve(false)
    }, {
      classes: ["blue-planet-recontact", "dialog", "wound-confirmation", "bpr-dialog"],
      width: 400,
      height: "auto",
      resizable: false
    });
    
    dialog.render(true);
  });
}

/**
 * Create visual effect for wound application
 * @param {Actor} target - The target actor
 * @param {string} woundType - Type of wound (minor, major, mortal)
 */
async function createWoundVisualEffect(target, woundType) {
  // Find the target's token on the canvas
  const tokens = canvas.tokens.placeables.filter(token => token.actor?.id === target.id);
  
  if (tokens.length === 0) {
    console.log(`BluePlanet Wounds: No token found for ${target.name}`);
    return;
  }
  
  const token = tokens[0];
  
  // Create a visual effect based on wound type
  const colors = {
    minor: '#ffc107',
    major: '#ff9800', 
    mortal: '#dc3545'
  };
  
  const color = colors[woundType] || '#ffc107';
  
  try {
    // Create a temporary visual effect
    const effect = $(`
      <div class="wound-effect" style="
        position: absolute; %; %;
        transform: translate(-50%, -50%);
        background: ${color};
        color: #000;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        animation: woundPulse 2s ease-out;
        pointer-events: none;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      ">
        ${woundType === 'minor' ? 'MINOR' : woundType === 'major' ? 'MAJOR' : 'MORTAL'}
      </div>
    `);
    
    // Position it over the token
    const tokenElement = $(token.mesh.texture.canvas).parent();
    tokenElement.append(effect);
    
    // Remove after animation
    setTimeout(() => {
      effect.remove();
    }, 2000);
    
  } catch (error) {
    console.warn('BluePlanet Wounds: Could not create visual effect:', error);
  }
  
  // Add CSS for animation if not exists
  if (!document.getElementById('wound-effect-styles')) {
    const styles = document.createElement('style');
    styles.id = 'wound-effect-styles';
    styles.textContent = `
      @keyframes woundPulse {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
        20% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}

/**
 * Update target's condition status based on wounds
 * @param {Actor} target - The target actor
 */
async function updateTargetCondition(target) {
  const wounds = target.system.wounds || { minor: 0, major: 0, mortal: 0 };
  const totalWounds = wounds.minor + wounds.major + wounds.mortal;
  const totalPenalty = wounds.minor + (wounds.major * 2) + (wounds.mortal * 3);
  
  let condition = '';
  
  if (totalWounds === 0) {
    condition = '';
  } else if (wounds.mortal > 0) {
    condition = `Mortally Wounded (-${totalPenalty} to all tests)`;
  } else if (wounds.major > 0) {
    condition = `Seriously Wounded (-${totalPenalty} to all tests)`;
  } else if (wounds.minor > 0) {
    condition = `Lightly Wounded (-${totalPenalty} to all tests)`;
  }
  
  try {
    await target.update({
      'system.status.condition': condition
    });
    
    console.log(`BluePlanet Wounds: Updated condition for ${target.name}: ${condition || 'None'}`);
  } catch (error) {
    console.warn(`BluePlanet Wounds: Could not update condition for ${target.name}:`, error);
  }
}

/**
 * Get wound penalty for an actor
 * @param {Actor} actor - The actor
 * @returns {number} Total wound penalty
 */
export function getWoundPenalty(actor) {
  if (!actor?.system?.wounds) return 0;
  
  const wounds = actor.system.wounds;
  return wounds.minor + (wounds.major * 2) + (wounds.mortal * 3);
}

/**
 * Get wound summary for display
 * @param {Actor} actor - The actor
 * @returns {Object} Wound summary
 */
export function getWoundSummary(actor) {
  const wounds = actor?.system?.wounds || { minor: 0, major: 0, mortal: 0 };
  const totalWounds = wounds.minor + wounds.major + wounds.mortal;
  const totalPenalty = getWoundPenalty(actor);
  
  return {
    wounds: wounds,
    totalWounds: totalWounds,
    totalPenalty: totalPenalty,
    hasMortalWounds: wounds.mortal > 0,
    hasMajorWounds: wounds.major > 0,
    hasMinorWounds: wounds.minor > 0,
    hasAnyWounds: totalWounds > 0,
    condition: totalWounds === 0 ? 'Healthy' :
               wounds.mortal > 0 ? 'Mortally Wounded' :
               wounds.major > 0 ? 'Seriously Wounded' :
               'Lightly Wounded'
  };
}

/**
 * Remove a wound from a target (for healing or correction)
 * @param {Actor} target - The target actor
 * @param {string} woundType - Type of wound to remove (minor, major, mortal)
 * @returns {Promise<boolean>} Success status
 */
export async function removeWoundFromTarget(target, woundType) {
  if (!target?.system?.wounds) {
    console.warn('BluePlanet Wounds: Target has no wound data');
    return false;
  }
  
  const currentWounds = foundry.utils.deepClone(target.system.wounds);
  
  if (currentWounds[woundType] > 0) {
    currentWounds[woundType] -= 1;
    
    try {
      await target.update({
        'system.wounds': currentWounds
      });
      
      await updateTargetCondition(target);
      
      ui.notifications.info(`Removed ${woundType} wound from ${target.name}`);
      
      Hooks.callAll('bluePlanet.woundRemoved', {
        target: target,
        woundType: woundType,
        newWounds: currentWounds
      });
      
      return true;
    } catch (error) {
      console.error(`BluePlanet Wounds: Error removing wound from ${target.name}:`, error);
      return false;
    }
  }
  
  return false;
}