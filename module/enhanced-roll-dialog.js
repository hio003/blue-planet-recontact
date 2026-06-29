/**
 * Enhanced Blue Planet Roll Dialog with Strain Mechanics
 * Integrates the strain system for +2 bonuses and rerolls
 */

import { 
  applyStrainBonus, 
  attemptStrainReroll, 
  determineStrainType, 
  getStrainStatus 
} from './strain-mechanics-fixed.js';

import { 
  getWoundPenalty 
} from './utils.js';

/**
 * Get dialog title based on roll type
 * @param {Object} rollData - Roll configuration data
 * @returns {string} - Appropriate dialog title
 */
function getDialogTitle(rollData) {
  if (rollData.type === 'attribute') {
    if (rollData.levelType === 'focus' && rollData.focusType) {
      return `Focus Roll`;
    } else {
      return `Attribute Roll`;
    }
  } else if (rollData.type === 'skill') {
    return `${rollData.skillName || 'Skill'} Roll`;
  } else {
    return `${rollData.skillName || 'Test'} Roll`;
  }
}

/**
 * Create and show the enhanced Blue Planet roll dialog with strain mechanics
 * @param {Actor} actor - The actor making the roll
 * @param {Object} rollData - Roll configuration data
 */
export function showEnhancedBluePlanetRollDialog(actor, rollData) {
  console.log('BluePlanet Enhanced Roll Dialog: Creating dialog with strain mechanics', { actor: actor?.name, rollData });
  
  // Get current strain status
  const strainStatus = getStrainStatus(actor);
  const recommendedStrainType = determineStrainType(rollData.attribute || 'cognition');
  
  // Generate the content HTML
  const content = createEnhancedDialogContent(actor, rollData, strainStatus, recommendedStrainType);
  
  // Create dialog with dynamic title
  const dialogTitle = getDialogTitle(rollData);
  
  // Create the dialog
  const dialog = new Dialog({
    title: dialogTitle,
    content: content,
    buttons: {
      roll: {
        icon: '<i class="fas fa-dice-d10"></i>',
        label: "<span style='font-weight: bold;'>Roll</span>",
        callback: (html) => handleEnhancedRoll(actor, rollData, html)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "<span style='font-weight: bold;'>Cancel</span>",
        callback: () => {}
      }
    },
    default: "roll",
    render: (html) => {
      console.log('BluePlanet Enhanced Roll Dialog: Dialog rendered, setting up listeners');
      setupEnhancedDialogListeners(html, actor, rollData, strainStatus);
      
      // Adjust spacing to match the title-to-Base-Calculation spacing
      setTimeout(() => {
        const finalTarget = html.find('.final-target')[0];
        const dialogButtons = html.closest('.dialog').find('.dialog-buttons')[0];
        
        if (finalTarget) {
          // Small margin like between title and Base Calculation
          finalTarget.style.marginBottom = '6px';
          finalTarget.style.paddingBottom = '8px';
        }
        
        if (dialogButtons) {
          // Bring buttons closer, similar spacing as other sections
          dialogButtons.style.marginTop = '-25px';
          dialogButtons.style.paddingTop = '4px';
        }
        
        // Reduce form container padding to make room
        const formContainer = html.find('form')[0];
        if (formContainer) {
          formContainer.style.paddingBottom = '0px';
        }
      }, 50);
      
      console.log('BluePlanet Enhanced Roll Dialog: Dialog rendered with fixed size');
    },
    close: () => {}
  }, {
    classes: ["blue-planet-recontact", "dialog", "sheet", "strain-enhanced", "bpr-dialog"],
    width: 700,   
    height: 520,  // Reduced to eliminate scroll after spacing adjustment
    resizable: false, // Disabled resizing since it won't be needed
    minimizable: false,
    top: 50,
    left: 200
  });
  
  dialog.render(true);
  return dialog;
}

/**
 * Create the HTML content for the enhanced dialog
 */
function createEnhancedDialogContent(actor, rollData, strainStatus, recommendedStrainType) {
  // Safe attribute access
  const attributes = actor.system?.attributes || {};
  
  const cognition = attributes.cognition?.value || 0;
  const psyche = attributes.psyche?.value || 0;
  const coordination = attributes.coordination?.value || 0;
  const physique = attributes.physique?.value || 0;
  
  // For attribute rolls, the "skill rank" is actually the base difficulty (usually 5)
  // For skill rolls, it's the actual skill rank
  const isAttributeRoll = rollData.type === 'attribute';
  const baseTarget = (rollData.skillRank || 0) + (rollData.attributeValue || 0);
  
  // Get focus options with preselection based on rollData
  const focusOptions = getFocusOptions(actor, rollData.attribute || 'cognition', rollData.focusType);
  
  // Check for attribute damage from strain (check actor flags)
  const attributeDamage = actor.flags['blue-planet-recontact']?.strainDamage || {};
  const hasAttributeDamage = Object.keys(attributeDamage).length > 0;
  
  return `
    <div class="blue-planet-enhanced-roll-dialog" style="padding-bottom: 2px !important; margin-bottom: 0 !important;">
      <form style="margin-bottom: 2px !important;">
        <div class="form-group">
          <h4>Base Calculation</h4>
          <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; text-align: center; color: #ddd; font-size: 12px; font-weight: bold;">
            <span>${isAttributeRoll ? 'Base Difficulty' : (rollData.skillName || 'Skill')} ${rollData.skillRank || 0}</span>
            <span> + </span>
            <span id="attr-display">Attribute 0</span>
            <span> + </span>
            <span id="strain-bonus" style="color: #40e0d0;">Strain 0</span>
            ${getWoundPenalty(actor) < 0 ? `<span> + </span><span style="color: #ff6b6b;">Wounds ${getWoundPenalty(actor)}</span>` : ''}
            <span> = </span>
            <span id="base-total" style="font-weight: bold;">${baseTarget + getWoundPenalty(actor)}</span>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
              <div></div>
              <label style="display: flex; align-items: center; gap: 5px; color: #ff9900; font-size: 10px; font-weight: bold;">
                <input type="checkbox" name="opposed-test" id="opposed-test"> Opposed Test
              </label>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <h4>Attribute Selection</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="display: flex; flex-direction: column;">
              <label style="margin-bottom: 2px;">ATTRIBUTE:</label>
              <select name="attribute" id="attribute-select" style="height: 24px;">
                <option value="cognition" ${rollData.attribute === 'cognition' ? 'selected' : ''}>Cognition (${cognition})</option>
                <option value="psyche" ${rollData.attribute === 'psyche' ? 'selected' : ''}>Psyche (${psyche})</option>
                <option value="coordination" ${rollData.attribute === 'coordination' ? 'selected' : ''}>Coordination (${coordination})</option>
                <option value="physique" ${rollData.attribute === 'physique' ? 'selected' : ''}>Physique (${physique})</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="margin-bottom: 2px;">FOCUS:</label>
              <select name="focus" id="focus-select" style="height: 24px;">
                <option value="">No Focus</option>
                ${focusOptions}
              </select>
            </div>
          </div>
        </div>
        
        <div class="form-group strain-section" style="border: 1px solid #357abd; border-radius: 4px; padding: 15px; background: rgba(53, 122, 189, 0.15);">
          <h4 style="color: #40e0d0;"><i class="fas fa-bolt"></i> Strain Mechanics</h4>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="text-align: center;">
              <label style="font-weight: bold;">MENTAL STRAIN</label>
              <div style="font-size: 11px; color: #aaa; margin-bottom: 6px;">Available: ${strainStatus.mental.available}/${strainStatus.mental.max}</div>
              <label style="display: flex; align-items: center; justify-content: center; gap: 5px; color: #ddd; font-size: 11px;">
                <input type="checkbox" name="use-mental-strain"> USE FOR +2 BONUS
              </label>
            </div>
            <div style="text-align: center;">
              <label style="font-weight: bold;">PHYSICAL STRAIN</label>
              <div style="font-size: 11px; color: #aaa; margin-bottom: 6px;">Available: ${strainStatus.physical.available}/${strainStatus.physical.max}</div>
              <label style="display: flex; align-items: center; justify-content: center; gap: 5px; color: #ddd; font-size: 11px;">
                <input type="checkbox" name="use-physical-strain"> USE FOR +2 BONUS
              </label>
            </div>
          </div>
        </div>
        
        
        <div class="form-group">
          <h4>Modifiers</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; align-items: end;">
            <div style="display: flex; flex-direction: column;">
              <label style="margin-bottom: 2px;">DIFFICULTY:</label>
              <select name="difficulty" style="height: 24px;">
                <option value="0">Normal (0)</option>
                <option value="-4">Easy (+4)</option>
                <option value="-2">Simple (+2)</option>
                <option value="2">Hard (-2)</option>
                <option value="4">Extreme (-4)</option>
                <option value="6">Legendary (-6)</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="margin-bottom: 2px;">WOUNDS:</label>
              <input type="number" name="wound-penalty" value="${getWoundPenalty(actor)}" readonly style="background: #2a2a2a; color: ${getWoundPenalty(actor) < 0 ? '#ff6b6b' : '#ddd'}; height: 24px;" title="Automatic wound penalty from injuries">
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="margin-bottom: 2px;">OTHER:</label>
              <input type="number" name="other" value="0" min="-10" max="10" style="height: 24px;">
            </div>
          </div>
        </div>
        
        <div class="final-target" style="text-align: center; background: #1a3e5c; border-radius: 4px; margin: 2px 0 2px 0 !important; padding: 4px !important;">
          <h4 style="color: #6bb6ff; margin: 0 0 2px 0 !important;">Final Target Number</h4>
          <div id="final-target-display" style="font-weight: bold; color: #ffffff; margin: 0 !important;">${baseTarget}</div>
        </div>
      </form>
    </div>
  `;
}



/**
 * Get focus options for an attribute
 */
function getFocusOptions(actor, currentAttribute, selectedFocusType) {
  const attributes = actor.system?.attributes;
  if (!attributes || !currentAttribute || !attributes[currentAttribute]) {
    return '';
  }
  
  const attr = attributes[currentAttribute];
  if (!attr.focus) {
    return '';
  }
  
  let options = '';
  if (attr.focus.primary && attr.focus.primary.name) {
    const selected = selectedFocusType === 'primary' ? 'selected' : '';
    options += `<option value="primary" ${selected}>${attr.focus.primary.name} (${attr.focus.primary.value || 0})</option>`;
  }
  if (attr.focus.secondary && attr.focus.secondary.name) {
    const selected = selectedFocusType === 'secondary' ? 'selected' : '';
    options += `<option value="secondary" ${selected}>${attr.focus.secondary.name} (${attr.focus.secondary.value || 0})</option>`;
  }
  
  return options;
}

/**
 * Setup enhanced dialog listeners
 */
function setupEnhancedDialogListeners(html, actor, rollData, strainStatus) {
  // Strain checkbox handlers
  html.find('input[name="use-mental-strain"]').change(function() {
    if (this.checked && strainStatus.mental.available < 1) {
      ui.notifications.warn("No mental strain available!");
      this.checked = false;
      return;
    }
    // Uncheck physical strain if mental is checked (only one type allowed)
    if (this.checked) {
      html.find('input[name="use-physical-strain"]').prop('checked', false);
    }
    updateTargetCalculation(html, actor, rollData);
  });
  
  html.find('input[name="use-physical-strain"]').change(function() {
    if (this.checked && strainStatus.physical.available < 1) {
      ui.notifications.warn("No physical strain available!");
      this.checked = false;
      return;
    }
    // Uncheck mental strain if physical is checked (only one type allowed)
    if (this.checked) {
      html.find('input[name="use-mental-strain"]').prop('checked', false);
    }
    updateTargetCalculation(html, actor, rollData);
  });
  
  // Attribute and modifier change handlers (wound penalty is automatic, no listener needed)
  html.find('#attribute-select, #focus-select, select[name="difficulty"], input[name="other"]').change(() => {
    updateTargetCalculation(html, actor, rollData);
  });
  
  html.find('#attribute-select').change(() => {
    updateFocusOptions(html, actor);
  });
  
  // Initialize display
  updateTargetCalculation(html, actor, rollData);
}

/**
 * Update target number calculation
 */
function updateTargetCalculation(html, actor, rollData) {
  const selectedAttribute = html.find('#attribute-select').val();
  const focusType = html.find('#focus-select').val();
  const difficulty = parseInt(html.find('select[name="difficulty"]').val()) || 0;
  const woundPenalty = getWoundPenalty(actor);
  const other = parseInt(html.find('input[name="other"]').val()) || 0;
  const useMentalStrain = html.find('input[name="use-mental-strain"]').prop('checked');
  const usePhysicalStrain = html.find('input[name="use-physical-strain"]').prop('checked');
  
  const attributes = actor.system?.attributes || {};
  const attribute = attributes[selectedAttribute];
  
  let attributeValue = 0;
  let attributeText = '';
  
  if (!attribute) {
    attributeText = 'Unknown Attribute 0';
    attributeValue = 0;
  } else if (focusType && attribute.focus && attribute.focus[focusType]) {
    const focusValue = attribute.focus[focusType].value || 0;
    const focusName = attribute.focus[focusType].name || 'Focus';
    attributeValue = focusValue;
    attributeText = `${focusName} ${focusValue}`;
  } else {
    attributeValue = attribute.value || 0;
    attributeText = `${selectedAttribute.charAt(0).toUpperCase() + selectedAttribute.slice(1)} ${attributeValue}`;
  }
  
  const strainBonus = (useMentalStrain || usePhysicalStrain) ? 2 : 0;
  const skillRank = rollData.skillRank || 0;
  const baseTotal = skillRank + attributeValue + strainBonus;
  const finalTarget = baseTotal + other - difficulty + woundPenalty; // Wound penalty is already negative
  
  html.find('#attr-display').text(attributeText);
  html.find('#strain-bonus').text(`Strain ${strainBonus}`).css('color', strainBonus > 0 ? '#40e0d0' : '#aaa');
  html.find('#base-total').text(baseTotal);
  html.find('#final-target-display').text(finalTarget);
}

/**
 * Update focus options
 */
function updateFocusOptions(html, actor) {
  const selectedAttribute = html.find('#attribute-select').val();
  const focusSelect = html.find('#focus-select');
  const focusOptions = getFocusOptions(actor, selectedAttribute, null);
  focusSelect.html('<option value="">No Focus</option>' + focusOptions);
}

/**
 * Handle the enhanced roll execution
 */
async function handleEnhancedRoll(actor, rollData, html) {
  console.log('BluePlanet Enhanced Roll: Processing roll with strain mechanics');
  
  // Get form data
  const form = html.find('form')[0];
  const formData = new FormData(form);
  
  const selectedAttribute = formData.get('attribute');
  const focusType = formData.get('focus');
  const difficulty = parseInt(formData.get('difficulty')) || 0;
  const woundPenalty = getWoundPenalty(actor);
  const other = parseInt(formData.get('other')) || 0;
  const useMentalStrain = formData.get('use-mental-strain') ? true : false;
  const usePhysicalStrain = formData.get('use-physical-strain') ? true : false;
  const isOpposedTest = formData.get('opposed-test') ? true : false;
  
  // Calculate final values
  let attributeValue = 0;
  const attributes = actor.system?.attributes || {};
  const attribute = attributes[selectedAttribute];
  
  if (focusType && attribute && attribute.focus && attribute.focus[focusType]) {
    attributeValue = attribute.focus[focusType].value || 0;
  } else if (attribute) {
    attributeValue = attribute.value || 0;
  }
  
  // Apply strain bonus if selected
  let strainBonus = 0;
  let strainType = null;
  let strainApplied = false;
  
  if (useMentalStrain) {
    strainType = 'mental';
    strainApplied = await applyStrainBonus(actor, strainType, 1);
    if (strainApplied) strainBonus = 2;
  } else if (usePhysicalStrain) {
    strainType = 'physical';
    strainApplied = await applyStrainBonus(actor, strainType, 1);
    if (strainApplied) strainBonus = 2;
  }
  
  const baseTarget = (rollData.skillRank || 0) + attributeValue + strainBonus;
  const finalTarget = baseTarget + other - difficulty + woundPenalty; // Wound penalty is already negative
  
  // Make the roll
  const roll = new Roll(rollData.dice || '1d10');
  await roll.evaluate();
  
  const success = roll.total <= finalTarget;
  const actionValue = finalTarget - roll.total;
  
  // Enhanced roll data for the result
  const enhancedRollData = {
    ...rollData,
    selectedAttribute,
    focusType,
    strainUsed: strainApplied ? strainType : null,
    strainBonus: strainBonus,
    baseTarget: baseTarget,
    finalTarget: finalTarget,
    success: success,
    actionValue: actionValue,
    targetNumber: finalTarget,
    isOpposedTest: isOpposedTest
  };
  
  // Create the roll message with strain reroll option
  await createEnhancedRollMessage(roll, enhancedRollData, actor);
}

/**
 * Create enhanced roll message with reroll options
 */
async function createEnhancedRollMessage(roll, rollData, actor) {
  const { success, actionValue, finalTarget, strainUsed, strainBonus } = rollData;
  
  // Detect roll mode early for use throughout the function
  const currentRollMode = game.settings.get('core', 'rollMode');
  const isGMPrivateRoll = (currentRollMode === 'gmroll' || currentRollMode === 'blindroll');
  const isPlayerMakingPrivateRoll = isGMPrivateRoll && !game.user.isGM;
  const isGMPrivateOpposedTest = isGMPrivateRoll && rollData.isOpposedTest;
  
  // Determine result category
  let resultCategory = "";
  let resultColor = "";
  
  if (success) {
    if (actionValue >= 5) {
      resultCategory = "EXCEPTIONAL SUCCESS";
      resultColor = "#28a745";
    } else {
      resultCategory = "SUCCESS";
      resultColor = "#007bff";
    }
  } else {
    if (actionValue <= -5) {
      resultCategory = "CRITICAL FAILURE";
      resultColor = "#dc3545";
    } else {
      resultCategory = "FAILURE";
      resultColor = "#6c757d";
    }
  }
  
  // Create flavor text
  let flavorText = `<h3>${rollData.skillName || 'Test'}</h3>`;
  
  // Add attribute info for skill rolls
  if (rollData.type === 'skill' && rollData.selectedAttribute) {
    let attributeDisplay = rollData.selectedAttribute.charAt(0).toUpperCase() + rollData.selectedAttribute.slice(1);
    
    // If a focus was used, get the specific focus name
    if (rollData.focusType && rollData.focusType !== '') {
      const attributes = actor.system?.attributes;
      const attribute = attributes?.[rollData.selectedAttribute];
      const focusObj = attribute?.focus?.[rollData.focusType];
      const focusName = focusObj?.name || 'Focus';
      attributeDisplay = `${attributeDisplay} Focus (${focusName})`;
    }
    
    flavorText += `<p style="color: black; font-size: 11px; margin: 2px 0;"><em>Used with ${attributeDisplay}</em></p>`;
  }
  
  // Add strain info right after attribute/focus info
  if (strainUsed && strainBonus > 0) {
    flavorText += `<p style="color: black;"><em><i class="fas fa-bolt"></i> Used ${strainUsed} strain (+${strainBonus})</em></p>`;
  }
  
  // Add opposed test button if checkbox was marked
  if (rollData.isOpposedTest) {
    flavorText += `<div style="text-align: center; margin: 8px 0; padding: 6px; background: rgba(255, 153, 0, 0.1); border: 1px solid #ff9900; border-radius: 4px;">`;
    
    // Determine if this should be treated as GM private based on roll mode
    const isGMPrivateOrBlindRoll = currentRollMode === 'gmroll' || currentRollMode === 'blindroll';
    const gmPrivateAttr = isGMPrivateOrBlindRoll ? ' data-gm-private="true"' : '';
    const actionValueToShow = isGMPrivateOrBlindRoll ? 'hidden' : actionValue;
    
    flavorText += `<button class="opposed-test-btn" data-actor-id="${actor.id}" data-action-value="${actionValueToShow}" data-message-id="{{messageId}}"${gmPrivateAttr} style="background: #ff9900; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-weight: bold;">`;
    flavorText += `<i class="fas fa-balance-scale"></i> OPPOSED TEST`;
    flavorText += `</button>`;
    
    if (isGMPrivateOrBlindRoll) {
      flavorText += `<p style="color: #cc7700; font-size: 10px; margin: 4px 0 0 0; font-style: italic;">Results will be sent privately to GM</p>`;
    } else {
      flavorText += `<p style="color: #cc7700; font-size: 10px; margin: 4px 0 0 0; font-style: italic;">Compare with other participants</p>`;
    }
    
    flavorText += `</div>`;
  }
  
  // Add target, roll, and action value info
  flavorText += `<p><strong>Target Number:</strong> ${finalTarget} | <strong>Roll:</strong> ${roll.total} | <strong>Action Value:</strong> ${actionValue >= 0 ? '+' : ''}${actionValue}</p>`;
  
  // Add success/failure result after the target/roll info
  flavorText += `<p><strong style="color: ${resultColor}">${resultCategory}</strong></p>`;
  
  // Show wound penalty if applicable
  const woundPenalty = getWoundPenalty(actor);
  if (woundPenalty < 0) {
    flavorText += `<p style="color: black;"><em><i class="fas fa-heart-broken"></i> Wound penalty (${woundPenalty})</em></p>`;
  }
  
  // Add strain reroll option for failures
  if (!success) {
    const strainStatus = getStrainStatus(actor);
    const availableStrain = {
      mental: strainStatus.mental.available,
      physical: strainStatus.physical.available
    };
    
    if (availableStrain.mental > 0 || availableStrain.physical > 0) {
      flavorText += `<div style="margin-top: 8px; padding: 6px; background: rgba(220, 53, 69, 0.1); border-radius: 4px;">`;
      flavorText += `<p style="color: black; margin: 0 0 4px 0; font-size: 12px;"><strong><i class="fas fa-redo"></i> Strain Reroll Available</strong></p>`;
      
      if (availableStrain.mental > 0) {
        flavorText += `<button class="strain-reroll-btn" data-actor-id="${actor.id}" data-strain-type="mental" data-target="${finalTarget}" data-formula="${rollData.dice || '1d10'}" style="margin-right: 4px; background: #357abd; color: white; border: none; padding: 3px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;">Mental Strain Reroll (${availableStrain.mental} avail)</button>`;
      }
      
      if (availableStrain.physical > 0) {
        flavorText += `<button class="strain-reroll-btn" data-actor-id="${actor.id}" data-strain-type="physical" data-target="${finalTarget}" data-formula="${rollData.dice || '1d10'}" style="background: #357abd; color: white; border: none; padding: 3px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;">Physical Strain Reroll (${availableStrain.physical} avail)</button>`;
      }
      
      flavorText += `<p style="color: black; font-size: 10px; margin: 4px 0 0 0; font-style: italic;">Warning: Failed rerolls cause temporary attribute loss</p>`;
      flavorText += `</div>`;
    }
  }
  
  // Add benefits/consequences
  if (success && actionValue >= 5) {
    flavorText += `<p style="color: #28a745;"><em>🎯 Benefit: Earn +2 on next relevant test or narrative advantage</em></p>`;
  } else if (success && actionValue === 0) {
    flavorText += `<p style="color: #fd7e14;"><em>⚠️ Complication: Success with additional challenge</em></p>`;
  } else if (!success && actionValue <= -5) {
    flavorText += `<p style="color: #dc3545;"><em>💥 Consequence: -2 on next relevant test or narrative penalty</em></p>`;
  }
  
  // Roll mode variables are already declared at the top of the function
  
  // If this is a player making a blind/GM roll, do NOT create a player-visible card; only send GM message.
  if (isPlayerMakingPrivateRoll) {
    const gmMessageData = {
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: flavorText,
      rollMode: currentRollMode,
      sound: CONFIG.sounds.dice,
      flags: {
        "blue-planet-recontact": {
          rollType: rollData.type,
          success: success,
          actionValue: actionValue,
          targetNumber: finalTarget,
          resultCategory: resultCategory,
          strainEnhanced: true,
          isOpposedTest: rollData.isOpposedTest || false,
          isGMPrivateOpposedTest: isGMPrivateOpposedTest,
          isPlayerPrivateRoll: true,
          actorId: actor.id,
          actorName: actor.name
        }
      }
    };
    return await roll.toMessage(gmMessageData);
  }
  
  // For GM users or public rolls, create normal message
  const messageData = {
    speaker: ChatMessage.getSpeaker({actor: actor}),
    flavor: flavorText,
    rollMode: currentRollMode,
    sound: CONFIG.sounds.dice,
    flags: {
      "blue-planet-recontact": {
        rollType: rollData.type,
        success: success,
        actionValue: actionValue,
        targetNumber: finalTarget,
        resultCategory: resultCategory,
        strainEnhanced: true,
        isOpposedTest: rollData.isOpposedTest || false,
        isGMPrivateOpposedTest: isGMPrivateOpposedTest && game.user.isGM,
        actorId: actor.id,
        actorName: actor.name
      }
    }
  };
  
  const message = await roll.toMessage(messageData);
  
  // If GM is making a private opposed test, create an additional visible message for players
  let playerMessage = null;
  if (game.user.isGM && isGMPrivateOpposedTest) {
    const playerFlavorText = `
      <h3>Roll request!</h3>
      <p style="color: black; font-size: 11px; margin: 2px 0;"><em>The GM has requested an opposed test...</em></p>
      <div style="text-align: center; margin: 8px 0; padding: 6px; background: rgba(255, 153, 0, 0.1); border: 1px solid #ff9900; border-radius: 4px;">
        <button class="opposed-test-btn" data-actor-id="${actor.id}" data-action-value="hidden" data-gm-private="true" style="background: #ff9900; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-weight: bold;">
          <i class="fas fa-balance-scale"></i> OPPOSED TEST
        </button>
        <p style="color: #cc7700; font-size: 10px; margin: 4px 0 0 0; font-style: italic;">Results will be sent privately to GM</p>
      </div>
    `;
    
    // Create anonymous speaker for GM private requests
    const anonymousSpeaker = {
      scene: null,
      actor: null,
      token: null,
      alias: "Anonymous"
    };
    
    const playerMessageData = {
      speaker: anonymousSpeaker,
      flavor: playerFlavorText,
      rollMode: 'roll', // Always visible to players
      flags: {
        "blue-planet-recontact": {
          rollType: 'gm-opposed-test-request',
          isGMPrivateOpposedTest: true,
          originalMessageId: message.id,
          actorId: actor.id,
          actorName: actor.name
        }
      }
    };
    
    playerMessage = await foundry.documents.ChatMessage.create(playerMessageData);
  }
  
  // Note: Global opposed test listener is set up in module initialization
  
  // Add click listeners for strain reroll buttons
  if (!success) {
    setTimeout(() => {
      $(document).off('click', '.strain-reroll-btn').on('click', '.strain-reroll-btn', async function(e) {
        e.preventDefault();
        const button = $(this);
        const actorId = button.data('actor-id');
        const strainType = button.data('strain-type');
        const targetNumber = button.data('target');
        const formula = button.data('formula');
        
        const targetActor = game.actors.get(actorId);
        if (!targetActor) {
          ui.notifications.error("Actor not found!");
          return;
        }
        
        // Attempt strain reroll
        const rerollResult = await attemptStrainReroll(
          targetActor, 
          strainType, 
          roll, 
          { targetNumber: parseInt(targetNumber) || finalTarget }, 
          formula
        );
        
        if (rerollResult) {
          // Find and delete the original message
          const originalMessage = button.closest('.chat-message')[0];
          const originalMessageId = originalMessage?.dataset?.messageId;
          
          if (originalMessageId) {
            const messageToDelete = game.messages.get(originalMessageId);
            if (messageToDelete) {
              await messageToDelete.delete();
            }
          }
          
          // Create new complete message (not just a reroll message)
          await createStrainRerollMessage(rerollResult, targetActor, rollData);
        }
      });
    }, 100);
  }
  
  return message;
}

/**
 * Create message for strain reroll results - replaces original message completely
 */
async function createStrainRerollMessage(rerollResult, actor, originalRollData) {
  const { success, roll, actionValue, strainSpent, attributeLost, attributeReduction, targetNumber } = rerollResult;
  
  let resultCategory = "";
  let resultColor = "";
  
  if (success) {
    resultCategory = actionValue >= 5 ? "EXCEPTIONAL SUCCESS" : "SUCCESS";
    resultColor = actionValue >= 5 ? "#28a745" : "#007bff";
  } else {
    resultCategory = actionValue <= -5 ? "CRITICAL FAILURE" : "FAILURE";
    resultColor = actionValue <= -5 ? "#dc3545" : "#6c757d";
  }
  
  // Create a complete message (like the original) but with reroll results
  let flavorText = `<h3>${originalRollData.skillName || 'Test'}</h3>`;
  
  // Add attribute info for skill rolls (same format as original)
  if (originalRollData.type === 'skill' && originalRollData.selectedAttribute) {
    let attributeDisplay = originalRollData.selectedAttribute.charAt(0).toUpperCase() + originalRollData.selectedAttribute.slice(1);
    
    // If a focus was used, get the specific focus name
    if (originalRollData.focusType && originalRollData.focusType !== '') {
      const attributes = actor.system?.attributes;
      const attribute = attributes?.[originalRollData.selectedAttribute];
      const focusObj = attribute?.focus?.[originalRollData.focusType];
      const focusName = focusObj?.name || 'Focus';
      attributeDisplay = `${attributeDisplay} Focus (${focusName})`;
    }
    
    flavorText += `<p style="color: black; font-size: 11px; margin: 2px 0;"><em>Used with ${attributeDisplay}</em></p>`;
  }
  
  // Add strain spent info
  flavorText += `<p style="color: black;"><em><i class="fas fa-bolt"></i> Used ${strainSpent} strain (reroll)</em></p>`;
  
  // Add target, roll, and action value info
  flavorText += `<p><strong>Target Number:</strong> ${targetNumber} | <strong>Roll:</strong> ${roll.total} | <strong>Action Value:</strong> ${actionValue >= 0 ? '+' : ''}${actionValue}</p>`;
  
  // Add success/failure result
  flavorText += `<p><strong style="color: ${resultColor}">${resultCategory}</strong></p>`;
  
  // Add attribute loss warning if applicable
  if (attributeLost && attributeReduction) {
    flavorText += `<p style="color: black;"><em><i class="fas fa-exclamation-triangle"></i> Lost 1 ${attributeReduction.attributeName} temporarily (now ${attributeReduction.newValue})</em></p>`;
    flavorText += `<p style="color: black; font-size: 11px;"><em>Recover through rest and medical attention</em></p>`;
  }
  
  // Add benefits/consequences based on result
  if (success && actionValue >= 5) {
    flavorText += `<p style="color: #28a745;"><em>🎯 Benefit: Earn +2 on next relevant test or narrative advantage</em></p>`;
  } else if (success && actionValue === 0) {
    flavorText += `<p style="color: #fd7e14;"><em>⚠️ Complication: Success with additional challenge</em></p>`;
  } else if (!success && actionValue <= -5) {
    flavorText += `<p style="color: #dc3545;"><em>💥 Consequence: -2 on next relevant test or narrative penalty</em></p>`;
  }
  
  const messageData = {
    speaker: ChatMessage.getSpeaker({actor: actor}),
    flavor: flavorText,
    rollMode: game.settings.get('core', 'rollMode'),
    flags: {
      "blue-planet-recontact": {
        rollType: originalRollData.type,
        success: success,
        actionValue: actionValue,
        targetNumber: targetNumber,
        resultCategory: resultCategory,
        strainEnhanced: true,
        strainReroll: true,
        attributeLost: attributeLost
      }
    }
  };
  
  return roll.toMessage(messageData);
}

// Note: Global opposed test listener is now set up in blue-planet-recontact.js
// for all users when the module initializes

// Export the main function
export default showEnhancedBluePlanetRollDialog;
