/**
 * Weapon Attack Roll Dialog Step 2 for Blue Planet Recontact
 * Covers: Combat Modifiers, Target Number, Final Roll Execution
 */

import { 
  applyStrainBonus, 
  getStrainStatus 
} from './strain-mechanics-fixed.js';

import { 
  getWoundPenalty,
  getDiceFormula,
  getLevelLabel 
} from './utils.js';

/**
 * Create and show the weapon attack roll dialog step 2
 * @param {Actor} actor - The actor making the roll
 * @param {Object} rollData - Roll configuration data
 */
export function showWeaponAttackDialogStep2(actor, rollData) {
  console.log('BluePlanet Weapon Attack Dialog Step 2: Creating dialog', { actor: actor?.name, rollData });
  
  // Get current strain status
  const strainStatus = getStrainStatus(actor);
  
  // Generate the content HTML
  const content = createWeaponAttackDialogStep2Content(actor, rollData, strainStatus);
  
  // Create dialog
  const dialogTitle = `${rollData.weaponName} Attack - Step 2`;
  
  // Create the dialog
  const dialog = new Dialog({
    title: dialogTitle,
    content: content,
    buttons: {
      roll: {
        icon: '<i class="fas fa-dice-d10"></i>',
        label: "<span style='font-weight: bold;'>Roll Attack</span>",
        callback: (html) => executeWeaponAttackRoll(actor, rollData, html)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "<span style='font-weight: bold;'>Cancel</span>",
        callback: () => {}
      }
    },
    default: "roll",
    render: (html) => {
      console.log('BluePlanet Weapon Attack Dialog Step 2: Dialog rendered, setting up listeners');
      setupDialogStep2Listeners(html, actor, rollData, strainStatus);
    },
    close: () => {}
  }, {
    classes: ["blue-planet-recontact", "dialog", "sheet", "weapon-attack-step2", "bpr-dialog"],
    width: 720,   
    height: 580,  
    resizable: false,
    minimizable: false });
  
  dialog.render(true);
  return dialog;
}

/**
 * Create the HTML content for weapon attack dialog step 2
 */
function createWeaponAttackDialogStep2Content(actor, rollData, strainStatus) {
  // Calculate strain bonus
  let strainBonus = 0;
  if (rollData.useMentalStrain && strainStatus.mental.available > 0) strainBonus += 2;
  if (rollData.usePhysicalStrain && strainStatus.physical.available > 0) strainBonus += 2;
  
  // Calculate wound penalty
  const woundPenalty = getWoundPenalty(actor);
  
  // Calculate base roll bonus (skill rank + attribute + strain + wounds)
  const baseRollBonus = rollData.selectedSkill.rank + rollData.selectedAttributeValue + strainBonus + woundPenalty;
  
  // Get focus name for display
  let focusDisplay = '';
  if (rollData.selectedFocus) {
    const attributes = actor.system?.attributes || {};
    const attr = attributes[rollData.selectedAttribute];
    if (attr?.focus?.[rollData.selectedFocus]?.name) {
      focusDisplay = ` - Focus: ${attr.focus[rollData.selectedFocus].name}`;
    } else {
      focusDisplay = ` - Focus: ${rollData.selectedFocus}`;
    }
  }

  return `
    <div class="blue-planet-weapon-attack-dialog-step2" style="padding-bottom: 2px !important; margin-bottom: 0 !important;">
      <form style="margin-bottom: 2px !important;">
        <div class="form-group">
          <h4>Selected Configuration</h4>
          <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; color: #ddd; font-size: 11px;">
            <div><strong>Weapon:</strong> ${rollData.weaponName} (${rollData.weaponType})</div>
            <div><strong>Skill:</strong> ${rollData.selectedSkill.name} (${getLevelLabel(rollData.selectedSkill.level_type)}) - Rank ${rollData.selectedSkill.rank}</div>
            <div><strong>Attribute:</strong> ${rollData.selectedAttribute.charAt(0).toUpperCase() + rollData.selectedAttribute.slice(1)} (${rollData.selectedAttributeValue})${focusDisplay}</div>
            <div><strong>Strain:</strong> ${rollData.useMentalStrain ? 'Mental (+2) ' : ''}${rollData.usePhysicalStrain ? 'Physical (+2) ' : ''}${(!rollData.useMentalStrain && !rollData.usePhysicalStrain) ? 'None' : ''}</div>
            <div><strong>Base Roll Bonus:</strong> +${baseRollBonus}</div>
          </div>
        </div>

        <div class="form-group">
          <h4>Combat Modifiers</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; align-items: end;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">RANGE:</label>
              <select name="range-modifier" style="height: 24px; font-size: 11px;">
                <option value="2">Point Blank (+2)</option>
                <option value="0" selected>Effective (0)</option>
                <option value="-2">Long (-2)</option>
                <option value="-4">Extreme (-4)</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">AIMING:</label>
              <select name="aim-modifier" style="height: 24px; font-size: 11px;">
                <option value="0" selected>No Aim (0)</option>
                <option value="1">Aim 1 round (+1)</option>
                <option value="2">Aim 2 rounds (+2)</option>
                <option value="3">Aim 3+ rounds (+3)</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">TARGET:</label>
              <select name="target-modifier" style="height: 24px; font-size: 11px;">
                <option value="0" selected>Normal (0)</option>
                <option value="-2">Partial Cover (-2)</option>
                <option value="-4">Heavy Cover (-4)</option>
                <option value="-2">Moving Target (-2)</option>
                <option value="2">Large Target (+2)</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin- px; align-items: end;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">SITUATION:</label>
              <select name="situation-modifier" style="height: 24px; font-size: 11px;">
                <option value="0" selected>Normal (0)</option>
                <option value="-2">Poor Lighting (-2)</option>
                <option value="-4">Darkness (-4)</option>
                <option value="-2">Unstable Platform (-2)</option>
                <option value="2">Surprise Attack (+2)</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">CUSTOM:</label>
              <input type="number" name="custom-modifier" value="0" step="1" style="height: 22px; text-align: center; font-size: 11px;" placeholder="±0">
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <h4>Target Number</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: end;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">OPPOSED ROLL:</label>
              <input type="number" name="opposed-target" value="" step="1" style="height: 22px; text-align: center; font-size: 11px;" placeholder="Enemy's roll result">
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">FIXED TARGET:</label>
              <input type="number" name="custom-target" value="10" step="1" style="height: 22px; text-align: center; font-size: 11px;" placeholder="Target number">
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <h4>Final Target Number</h4>
          <div style="background: #2a2a2a; padding: 12px; border-radius: 4px; text-align: center; color: #ddd; font-size: 12px;">
            <div style="margin-bottom: 8px;">
              <span>Dice needed: </span><span id="dice-formula" style="color: #40e0d0;">${getDiceFormula(rollData.selectedSkill.level_type)}</span>
              <span> must roll ≤ </span><span id="final-target-display" style="color: #ffd54f; font-weight: bold; font-size: 16px;">${baseRollBonus}</span>
            </div>
            <div style="font-size: 10px; color: #aaa; font-style: italic;">
              <span class="breakdown-text">Based on: Skill ${rollData.selectedSkill.rank} + Attribute ${rollData.selectedAttributeValue} + Strain ${strainBonus} + Wounds ${woundPenalty} + Modifiers +0</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin- px; font-style: italic; color: #aaa;">
          <p>Blue Planet: Roll dice and use lowest result. Success if dice roll ≤ Final Target Number</p>
        </div>
      </form>
    </div>
  `;
}

/**
 * Setup event listeners for the weapon attack dialog step 2
 */
function setupDialogStep2Listeners(html, actor, rollData, strainStatus) {
  console.log('BluePlanet Weapon Attack Dialog Step 2: Setting up listeners');
  
  // Update calculation when inputs change
  const updateCalculation = () => {
    // Calculate modifiers
    const rangeModifier = parseInt(html.find('select[name="range-modifier"]').val()) || 0;
    const aimModifier = parseInt(html.find('select[name="aim-modifier"]').val()) || 0;
    const targetModifier = parseInt(html.find('select[name="target-modifier"]').val()) || 0;
    const situationModifier = parseInt(html.find('select[name="situation-modifier"]').val()) || 0;
    const customModifier = parseInt(html.find('input[name="custom-modifier"]').val()) || 0;
    
    const totalModifiers = rangeModifier + aimModifier + targetModifier + situationModifier + customModifier;
    
    // Calculate final target
    const opposedTarget = parseInt(html.find('input[name="opposed-target"]').val()) || 0;
    const customTarget = parseInt(html.find('input[name="custom-target"]').val()) || 10;
    
    let finalTarget;
    if (opposedTarget > 0) {
      finalTarget = opposedTarget;
    } else {
      finalTarget = customTarget;
    }
    
    // Calculate final target that dice must roll under
    const strainBonus = rollData.useMentalStrain ? 2 : 0 + rollData.usePhysicalStrain ? 2 : 0;
    const woundPenalty = getWoundPenalty(actor);
    const baseDiceTarget = rollData.selectedSkill.rank + rollData.selectedAttributeValue + strainBonus + woundPenalty + totalModifiers;
    
    // Update displays
    html.find('#final-target-display').text(baseDiceTarget);
    
    // Update the breakdown text
    const breakdownText = `Based on: Skill ${rollData.selectedSkill.rank} + Attribute ${rollData.selectedAttributeValue} + Strain ${strainBonus} + Wounds ${woundPenalty} + Modifiers ${totalModifiers >= 0 ? '+' : ''}${totalModifiers}`;
    html.find('.breakdown-text').text(breakdownText);
  };
  
  // Bind all change events
  html.find('input, select').change(updateCalculation);
  html.find('input[type="number"]').on('input', updateCalculation);
  
  // Initial calculation
  updateCalculation();
}

/**
 * Execute the weapon attack roll
 */
async function executeWeaponAttackRoll(actor, rollData, html) {
  console.log('BluePlanet Weapon Attack Dialog Step 2: Executing roll');
  
  try {
    // Collect form data from step 2
    const formData = {
      rangeModifier: parseInt(html.find('select[name="range-modifier"]').val()) || 0,
      aimModifier: parseInt(html.find('select[name="aim-modifier"]').val()) || 0,
      targetModifier: parseInt(html.find('select[name="target-modifier"]').val()) || 0,
      situationModifier: parseInt(html.find('select[name="situation-modifier"]').val()) || 0,
      customModifier: parseInt(html.find('input[name="custom-modifier"]').val()) || 0,
      opposedTarget: parseInt(html.find('input[name="opposed-target"]').val()) || 0,
      customTarget: parseInt(html.find('input[name="custom-target"]').val()) || 10
    };
    
    // Apply strain bonuses
    let strainBonus = 0;
    const strainActions = [];
    
    if (rollData.useMentalStrain) {
      const strainResult = await applyStrainBonus(actor, 'mental', 2);
      if (strainResult.success) {
        strainBonus += 2;
        strainActions.push('Mental Strain (+2)');
      }
    }
    
    if (rollData.usePhysicalStrain) {
      const strainResult = await applyStrainBonus(actor, 'physical', 2);
      if (strainResult.success) {
        strainBonus += 2;
        strainActions.push('Physical Strain (+2)');
      }
    }
    
    // Calculate total modifiers
    const totalModifiers = formData.rangeModifier + formData.aimModifier + 
                          formData.targetModifier + formData.situationModifier + 
                          formData.customModifier;
    
    // Calculate wound penalty
    const woundPenalty = getWoundPenalty(actor);
    
    // Calculate Blue Planet target number (what dice must roll under)
    const skillRank = rollData.selectedSkill.rank || 1;
    const diceTargetNumber = skillRank + rollData.selectedAttributeValue + strainBonus + woundPenalty + totalModifiers;
    const rollFormula = getDiceFormula(rollData.selectedSkill.level_type);
    
    // Create and execute roll
    const roll = new Roll(rollFormula);
    await roll.evaluate();
    
    // In Blue Planet, use the LOWEST die result
    const rollResult = roll.total; // This should be the lowest due to 'kl' in formula
    const success = rollResult <= diceTargetNumber;
    
    // For opposed rolls, we compare our success vs enemy target
    let finalResult = success;
    let opposedInfo = '';
    if (formData.opposedTarget > 0) {
      opposedInfo = ` vs Enemy Target ${formData.opposedTarget}`;
      // In opposed rolls, higher success margin wins
      if (success) {
        finalResult = diceTargetNumber >= formData.opposedTarget;
      } else {
        finalResult = false;
      }
    }
    
    // Create flavor text
    let flavorText = `<h3>${rollData.weaponName} Attack</h3>`;
    flavorText += `<p style="color: black; font-size: 11px; margin: 2px 0;"><em>Attack Roll - ${rollData.selectedSkill.name} (${getLevelLabel(rollData.selectedSkill.level_type)})</em></p>`;
    flavorText += `<p><strong>Dice Roll:</strong> [${roll.terms[0].results.map(r => r.result).join(', ')}] (using lowest: ${rollResult})</p>`;
    flavorText += `<p><strong>Target Number:</strong> ${diceTargetNumber} | <strong>Result:</strong> ${rollResult} ${success ? '≤' : '>'} ${diceTargetNumber}${opposedInfo}</p>`;
    
    if (strainActions.length > 0) {
      flavorText += `<p style="color: #40e0d0; font-size: 10px;"><em>Used: ${strainActions.join(', ')}</em></p>`;
    }
    
    // Add modifier details if any
    const modifierDetails = [];
    if (formData.rangeModifier !== 0) modifierDetails.push(`Range: ${formData.rangeModifier >= 0 ? '+' : ''}${formData.rangeModifier}`);
    if (formData.aimModifier !== 0) modifierDetails.push(`Aim: +${formData.aimModifier}`);
    if (formData.targetModifier !== 0) modifierDetails.push(`Target: ${formData.targetModifier >= 0 ? '+' : ''}${formData.targetModifier}`);
    if (formData.situationModifier !== 0) modifierDetails.push(`Situation: ${formData.situationModifier >= 0 ? '+' : ''}${formData.situationModifier}`);
    if (formData.customModifier !== 0) modifierDetails.push(`Custom: ${formData.customModifier >= 0 ? '+' : ''}${formData.customModifier}`);
    
    if (modifierDetails.length > 0) {
      flavorText += `<p style="color: #666; font-size: 10px;"><em>Modifiers: ${modifierDetails.join(', ')}</em></p>`;
    }
    
    // Determine result category and color based on Blue Planet system
    let resultCategory = "";
    let resultColor = "";
    
    if (finalResult) {
      // Check for exceptional success (roll was much lower than needed)
      const successMargin = diceTargetNumber - rollResult;
      if (successMargin >= 5) {
        resultCategory = "EXCEPTIONAL SUCCESS";
        resultColor = "#28a745";
        flavorText += `<p style="color: ${resultColor}; font-weight: bold;">${resultCategory}</p>`;
        flavorText += `<p style="color: #28a745; font-size: 10px;"><em>🎯 Excellent! Success margin of ${successMargin}</em></p>`;
      } else {
        resultCategory = "SUCCESS";
        resultColor = "#007bff";
        flavorText += `<p style="color: ${resultColor}; font-weight: bold;">${resultCategory}</p>`;
        if (successMargin === 0) {
          flavorText += `<p style="color: #fd7e14; font-size: 10px;"><em>⚠️ Just barely made it!</em></p>`;
        }
      }
    } else {
      // Check for critical failure (rolled much higher than target)
      const failureMargin = rollResult - diceTargetNumber;
      if (failureMargin >= 5) {
        resultCategory = "CRITICAL FAILURE";
        resultColor = "#dc3545";
        flavorText += `<p style="color: ${resultColor}; font-weight: bold;">${resultCategory}</p>`;
        flavorText += `<p style="color: #dc3545; font-size: 10px;"><em>💥 Terrible failure! Missed by ${failureMargin}</em></p>`;
      } else {
        resultCategory = "FAILURE";
        resultColor = "#6c757d";
        flavorText += `<p style="color: ${resultColor}; font-weight: bold;">${resultCategory}</p>`;
      }
    }
    
    // Add damage roll button if attack succeeds
    if (finalResult && rollData.weapon.system.damage > 0) {
      flavorText += `<div style="text-align: center; margin: 10px 0; padding: 8px; background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 4px;">`;
      flavorText += `<button type="button" class="damage-roll-button" data-weapon-id="${rollData.weapon.id}" data-actor-id="${actor.id}" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-weight: bold;">`;
      flavorText += `<i class="fas fa-heart-broken"></i> Roll Damage (DR ${rollData.weapon.system.damage})`;
      flavorText += `</button></div>`;
    }
    
    // Create message data
    const messageData = {
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: flavorText,
      rollMode: game.settings.get("core", "rollMode"),
      sound: CONFIG.sounds.dice,
      flags: {
        "blue-planet-recontact": {
          rollType: 'weapon-attack',
          success: finalResult,
          rollResult: rollResult,
          targetNumber: diceTargetNumber,
          resultCategory: resultCategory,
          weaponName: rollData.weaponName,
          skillUsed: rollData.selectedSkill.name
        }
      }
    };
    
    await roll.toMessage(messageData);
    
    // Consume ammunition if the weapon uses ammo and the attack succeeded
    if (finalResult && rollData.weapon.system.current_ammo > 0) {
      console.log('BluePlanet Weapon Attack: Consuming ammunition after successful attack');
      try {
        const newAmmo = Math.max(0, rollData.weapon.system.current_ammo - 1);
        await rollData.weapon.update({
          'system.current_ammo': newAmmo
        });
        console.log(`BluePlanet Weapon Attack: Ammo consumed. New count: ${newAmmo}`);
        
        // Show notification if ammo is low
        if (newAmmo === 0) {
          ui.notifications.warn(`${rollData.weapon.name} is out of ammunition!`);
        } else if (newAmmo <= 3) {
          ui.notifications.info(`${rollData.weapon.name} has ${newAmmo} rounds remaining`);
        }
      } catch (ammoError) {
        console.error('BluePlanet Weapon Attack: Error consuming ammunition:', ammoError);
      }
    } else if (rollData.weapon.system.current_ammo === 0) {
      console.log('BluePlanet Weapon Attack: No ammunition to consume (empty)');
    } else if (!finalResult) {
      console.log('BluePlanet Weapon Attack: Attack failed, no ammunition consumed');
    }
    
    console.log('BluePlanet Weapon Attack Dialog Step 2: Roll completed successfully');
    
  } catch (error) {
    console.error('BluePlanet Weapon Attack Dialog Step 2: Error during roll:', error);
    ui.notifications.error('Error executing weapon attack roll. Check console for details.');
  }
}