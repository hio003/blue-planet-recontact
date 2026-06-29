/**
 * Weapon Attack Roll Dialog for Blue Planet Recontact
 * Specialized dialog for weapon attack rolls with combat skill selection
 */

import { 
  applyStrainBonus, 
  attemptStrainReroll, 
  determineStrainType, 
  getStrainStatus 
} from './strain-mechanics-fixed.js';

import { 
  getWoundPenalty,
  getDiceFormula,
  getLevelLabel 
} from './utils.js';

/**
 * Get focus options for attribute
 * @param {Actor} actor - The actor
 * @param {string} attribute - The attribute name
 * @param {string} preselectedFocus - Preselected focus type
 * @returns {string} - HTML options string
 */
function getFocusOptions(actor, attribute, preselectedFocus) {
  const attr = actor.system.attributes?.[attribute];
  if (!attr?.focus) return '';
  
  let options = '';
  
  if (attr.focus.primary?.name) {
    const selected = preselectedFocus === 'primary' ? 'selected' : '';
    options += `<option value="primary" ${selected}>${attr.focus.primary.name} (${attr.focus.primary.value || attr.value + 1})</option>`;
  }
  
  if (attr.focus.secondary?.name) {
    const selected = preselectedFocus === 'secondary' ? 'selected' : '';
    options += `<option value="secondary" ${selected}>${attr.focus.secondary.name} (${attr.focus.secondary.value || attr.value + 1})</option>`;
  }
  
  return options;
}


/**
 * Create and show the weapon attack roll dialog
 * @param {Actor} actor - The actor making the roll
 * @param {Object} rollData - Roll configuration data
 */
export function showWeaponAttackRollDialog(actor, rollData) {
  console.log('BluePlanet Weapon Attack Dialog: Creating dialog', { actor: actor?.name, rollData });
  
  // Get current strain status
  const strainStatus = getStrainStatus(actor);
  const recommendedStrainType = determineStrainType('weapon', rollData.attribute, rollData);
  
  // Generate the content HTML
  const content = createWeaponAttackDialogContent(actor, rollData, strainStatus, recommendedStrainType);
  
  // Create dialog
  const dialogTitle = `${rollData.weaponName} Attack Roll`;
  
  // Create the dialog
  const dialog = new Dialog({
    title: dialogTitle,
    content: content,
    buttons: {
      roll: {
        icon: '<i class="fas fa-dice-d10"></i>',
        label: "<span style='font-weight: bold;'>Roll Attack</span>",
        callback: (html) => handleWeaponAttackRoll(actor, rollData, html)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "<span style='font-weight: bold;'>Cancel</span>",
        callback: () => {}
      }
    },
    default: "roll",
    render: (html) => {
      console.log('BluePlanet Weapon Attack Dialog: Dialog rendered, setting up listeners');
      setupWeaponAttackDialogListeners(html, actor, rollData, strainStatus);
      
      // Adjust spacing to match the title-to-Base-Calculation spacing
      setTimeout(() => {
        const finalTarget = html.find('.final-target')[0];
        const dialogButtons = html.closest('.dialog').find('.dialog-buttons')[0];
        
        if (finalTarget) {
          finalTarget.style.marginBottom = '6px';
          finalTarget.style.paddingBottom = '8px';
        }
        
        if (dialogButtons) {
          dialogButtons.style.marginTop = '-25px';
          dialogButtons.style.paddingTop = '4px';
        }
        
        // Reduce form container padding to make room
        const formContainer = html.find('form')[0];
        if (formContainer) {
          formContainer.style.paddingBottom = '0px';
        }
      }, 50);
      
      console.log('BluePlanet Weapon Attack Dialog: Dialog rendered with fixed size');
    },
    close: () => {}
  }, {
    classes: ["blue-planet-recontact", "dialog", "sheet", "weapon-attack", "strain-enhanced", "bpr-dialog"],
    width: 720,   
    height: 580,  
    resizable: false,
    minimizable: false });
  
  dialog.render(true);
  return dialog;
}

/**
 * Create the HTML content for the weapon attack dialog
 */
function createWeaponAttackDialogContent(actor, rollData, strainStatus, recommendedStrainType) {
  // Safe attribute access
  const attributes = actor.system?.attributes || {};
  
  const cognition = attributes.cognition?.value || 0;
  const psyche = attributes.psyche?.value || 0;
  const coordination = attributes.coordination?.value || 0;
  const physique = attributes.physique?.value || 0;
  
  const baseTarget = (rollData.skillRank || 0) + (rollData.attributeValue || 0);
  
  // Get focus options with preselection based on rollData
  const focusOptions = getFocusOptions(actor, rollData.attribute || 'coordination', rollData.focusType);
  
  // Check for attribute damage from strain
  const attributeDamage = strainStatus.attributeDamage;
  const hasAttributeDamage = Object.keys(attributeDamage).length > 0;
  
  // Get ammunition modifiers for display
  const ammoModifiers = rollData.weapon.getAmmunitionModifiers() || {
    attack_modifier: 0,
    damage_modifier: 0,
    penetration_modifier: 0
  };
  
  // Create combat skill options
  const combatSkillOptions = rollData.combatSkills.map(skill => 
    `<option value="${skill.id}" ${skill.id === rollData.combatSkills[0]?.id ? 'selected' : ''}>${skill.name} (${getLevelLabel(skill.level_type)}) - Rank ${skill.rank}</option>`
  ).join('');

  return `
    <div class="blue-planet-weapon-attack-dialog" style="padding-bottom: 2px !important; margin-bottom: 0 !important;">
      <form style="margin-bottom: 2px !important;">
        <div class="form-group">
          <h4>Weapon Information</h4>
          <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; color: #ddd; font-size: 12px;">
            <div style="margin-bottom: 4px;"><strong>${rollData.weaponName}</strong> (${rollData.weaponType.charAt(0).toUpperCase() + rollData.weaponType.slice(1)})</div>
            ${rollData.weapon.system.damage ? `<div style="font-size: 10px; color: #aaa;">Damage Rating: ${rollData.weapon.system.damage}</div>` : ''}
            ${rollData.weapon.system.effective_range ? `<div style="font-size: 10px; color: #aaa;">Effective Range: ${rollData.weapon.system.effective_range}m</div>` : ''}
            ${rollData.weaponType !== 'melee' ? `<div style="font-size: 10px; color: ${(rollData.weapon.system.current_ammo || 0) > 0 ? '#32cd32' : '#dc3545'};">Ammo: ${rollData.weapon.system.current_ammo || 0}/${rollData.weapon.system.magazine_capacity || 'N/A'}</div>` : ''}
            ${rollData.weapon.system.loaded_ammunition ? `<div style="font-size: 10px; color: #87ceeb;">Loaded: ${rollData.weapon.system.loaded_ammunition.name} (${rollData.weapon.system.loaded_ammunition.system?.ammo_type || 'standard'})</div>` : rollData.weaponType !== 'melee' ? `<div style="font-size: 10px; color: #dc3545;">No ammo loaded</div>` : ''}
            ${(ammoModifiers.attack_modifier !== 0 || ammoModifiers.damage_modifier !== 0 || ammoModifiers.penetration_modifier !== 0) && rollData.weapon.system.loaded_ammunition ? `<div style="font-size: 9px; color: #ffd700;">Bonuses: ${ammoModifiers.attack_modifier !== 0 ? `Atk ${ammoModifiers.attack_modifier >= 0 ? '+' : ''}${ammoModifiers.attack_modifier}` : ''}${ammoModifiers.damage_modifier !== 0 ? ` Dmg ${ammoModifiers.damage_modifier >= 0 ? '+' : ''}${ammoModifiers.damage_modifier}` : ''}${ammoModifiers.penetration_modifier !== 0 ? ` Pen ${ammoModifiers.penetration_modifier >= 0 ? '+' : ''}${ammoModifiers.penetration_modifier}` : ''}</div>` : ''}
          </div>
        </div>

        <div class="form-group">
          <h4>Combat Skill Selection</h4>
          <select name="combat-skill" id="combat-skill-select" style="width: 100%; height: 28px;">
            ${combatSkillOptions}
          </select>
        </div>
        
        <div class="form-group">
          <h4>Base Calculation</h4>
          <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; color: #ddd; font-size: 12px; font-weight: bold;">
            <span id="skill-display">${rollData.skillName} ${rollData.skillRank || 0}</span>
            <span> + </span>
            <span id="attr-display">Attribute 0</span>
            <span> + </span>
            <span id="strain-bonus" style="color: #40e0d0;">Strain 0</span>
            ${getWoundPenalty(actor) < 0 ? `<span> + </span><span style="color: #ff6b6b;">Wounds ${getWoundPenalty(actor)}</span>` : ''}
            <span> = </span>
            <span id="base-total" style="font-weight: bold;">${baseTarget + getWoundPenalty(actor)}</span>
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
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; align-items: end;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">DIFFICULTY:</label>
              <select name="difficulty" style="height: 24px; font-size: 11px;">
                <option value="0" selected>Normal (0)</option>
                <option value="-4">Easy (+4)</option>
                <option value="-2">Simple (+2)</option>
                <option value="2">Hard (-2)</option>
                <option value="4">Extreme (-4)</option>
                <option value="6">Legendary (-6)</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">OPPOSED ROLL:</label>
              <input type="number" name="opposed-target" value="" step="1" style="height: 22px; text-align: center; font-size: 11px;" placeholder="Leave blank">
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">CUSTOM TARGET:</label>
              <input type="number" name="custom-target" value="" step="1" style="height: 22px; text-align: center; font-size: 11px;" placeholder="Override">
            </div>
          </div>
        </div>
        
        <div class="form-group called-shots-section" style="border: 1px solid #e74c3c; border-radius: 4px; padding: 15px; background: rgba(231, 76, 60, 0.15);">
          <h4 style="color: #e74c3c;"><i class="fas fa-crosshairs"></i> Called Shot (Optional)</h4>
          <p style="font-size: 11px; color: #ddd; margin: 5px 0;"><em>Sacrifice accuracy for increased damage. Each -1 to hit gives +1 damage rating.</em></p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; align-items: end;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">TARGET PENALTY:</label>
              <select name="called-shot-penalty" style="height: 24px; font-size: 11px;">
                <option value="0" selected>No Called Shot (0)</option>
                <option value="1">+1 to hit (-1 damage) - Pull Punch</option>
                <option value="2">+2 to hit (-2 damage) - Pull Punch</option>
                <option value="3">+3 to hit (-3 damage) - Pull Punch</option>
                <option value="-1">-1 to hit (+1 damage)</option>
                <option value="-2">-2 to hit (+2 damage)</option>
                <option value="-3">-3 to hit (+3 damage)</option>
                <option value="-4">-4 to hit (+4 damage)</option>
                <option value="-5">-5 to hit (+5 damage)</option>
                <option value="-6">-6 to hit (+6 damage)</option>
              </select>
            </div>
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">DAMAGE BONUS:</label>
              <div style="height: 24px; display: flex; align-items: center; background: rgba(231, 76, 60, 0.2); border-radius: 3px; padding: 0 8px;">
                <span id="damage-bonus-display" style="font-size: 11px; color: #e74c3c; font-weight: bold;">+0</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group final-target" style="margin- px;">
          <h4 style="text-align: center; color: #40e0d0;">Final Target Number: <span id="final-target-number">10</span></h4>
        </div>
      </form>
    </div>
  `;
}

/**
 * Setup event listeners for the weapon attack dialog
 */
function setupWeaponAttackDialogListeners(html, actor, rollData, strainStatus) {
  console.log('BluePlanet Weapon Attack Dialog: Setting up listeners');
  
  const attributes = actor.system?.attributes || {};
  
  // Update calculation when combat skill changes
  html.find('#combat-skill-select').change((event) => {
    const skillId = event.target.value;
    const selectedSkill = rollData.combatSkills.find(s => s.id === skillId);
    
    if (selectedSkill) {
      // Update rollData with selected skill
      rollData.skillName = selectedSkill.name;
      rollData.skillRank = selectedSkill.rank;
      rollData.attribute = selectedSkill.attribute;
      rollData.levelType = selectedSkill.level_type;
      rollData.dice = selectedSkill.dice;
      
      // Update attribute dropdown
      html.find('#attribute-select').val(selectedSkill.attribute);
      
      // Update displays
      html.find('#skill-display').text(`${selectedSkill.name} ${selectedSkill.rank}`);
      
      // Trigger attribute change to update calculation
      html.find('#attribute-select').trigger('change');
    }
  });
  
  // Update calculation when inputs change
  const updateCalculation = () => {
    const selectedAttribute = html.find('#attribute-select').val();
    const selectedFocus = html.find('#focus-select').val();
    const useMentalStrain = html.find('input[name="use-mental-strain"]').is(':checked');
    const usePhysicalStrain = html.find('input[name="use-physical-strain"]').is(':checked');
    
    // Get current skill info
    const skillId = html.find('#combat-skill-select').val();
    const selectedSkill = rollData.combatSkills.find(s => s.id === skillId) || rollData.combatSkills[0];
    
    // Calculate attribute value
    let attributeValue = attributes[selectedAttribute]?.value || 0;
    if (selectedFocus && attributes[selectedAttribute]?.focus?.[selectedFocus]?.value !== undefined) {
      attributeValue = attributes[selectedAttribute].focus[selectedFocus].value;
    }
    
    // Calculate strain bonus
    let strainBonus = 0;
    if (useMentalStrain && strainStatus.mental.available > 0) strainBonus += 2;
    if (usePhysicalStrain && strainStatus.physical.available > 0) strainBonus += 2;
    
    // Calculate wound penalty
    const woundPenalty = getWoundPenalty(actor);
    
    // Update displays
    html.find('#attr-display').text(`${selectedAttribute.charAt(0).toUpperCase() + selectedAttribute.slice(1)} ${attributeValue}`);
    html.find('#strain-bonus').text(`Strain ${strainBonus}`);
    
    // Calculate base total
    const baseTotal = (selectedSkill.rank || 1) + attributeValue + strainBonus + woundPenalty;
    html.find('#base-total').text(baseTotal);
    
    // Calculate modifiers
    const rangeModifier = parseInt(html.find('select[name="range-modifier"]').val()) || 0;
    const aimModifier = parseInt(html.find('select[name="aim-modifier"]').val()) || 0;
    const targetModifier = parseInt(html.find('select[name="target-modifier"]').val()) || 0;
    const situationModifier = parseInt(html.find('select[name="situation-modifier"]').val()) || 0;
    const customModifier = parseInt(html.find('input[name="custom-modifier"]').val()) || 0;
    const calledShotPenalty = parseInt(html.find('select[name="called-shot-penalty"]').val()) || 0;
    
    // Update called shot damage bonus display
    const damageBonus = -calledShotPenalty; // Invert sign: -1 penalty = +1 damage
    const displayText = damageBonus > 0 ? `+${damageBonus}` : damageBonus < 0 ? `${damageBonus}` : '+0';
    html.find('#damage-bonus-display').text(displayText);
    
    const totalModifiers = rangeModifier + aimModifier + targetModifier + situationModifier + customModifier + calledShotPenalty;
    
    // Calculate final target
    const baseTN = 10; // Moderate baseline in Blue Planet
    const difficultyMod = parseInt(html.find('select[name="difficulty"]').val()) || 0; // +/- rule-of-2 mapping
    const opposedTarget = parseInt(html.find('input[name="opposed-target"]').val()) || 0;
    const customTarget = parseInt(html.find('input[name="custom-target"]').val());
    
    let finalTarget;
    if (!isNaN(customTarget)) {
      finalTarget = customTarget;
    } else if (opposedTarget > 0) {
      finalTarget = opposedTarget;
    } else {
      // Lower TN when "easier" (positive player bonus), increase when harder
      finalTarget = baseTN - difficultyMod;
    }
    
    html.find('#final-target-number').text(finalTarget);
  };
  
  // Update focus options when attribute changes
  html.find('#attribute-select').change((event) => {
    const selectedAttribute = event.target.value;
    const focusSelect = html.find('#focus-select');
    
    focusSelect.empty();
    focusSelect.append('<option value="">No Focus</option>');
    
    const focusOptions = getFocusOptions(actor, selectedAttribute, '');
    if (focusOptions) {
      focusSelect.append(focusOptions);
    }
    
    updateCalculation();
  });
  
  // Bind all change events
  html.find('input, select').change(updateCalculation);
  html.find('input[type="number"]').on('input', updateCalculation);
  
  // Initial calculation
  updateCalculation();
}

/**
 * Handle the weapon attack roll execution
 */
async function handleWeaponAttackRoll(actor, rollData, html) {
  console.log('BluePlanet Weapon Attack Dialog: Handling roll');
  
  try {
    // Collect form data
    const formData = {
      combatSkillId: html.find('#combat-skill-select').val(),
      attribute: html.find('#attribute-select').val(),
      focus: html.find('#focus-select').val(),
      useMentalStrain: html.find('input[name="use-mental-strain"]').is(':checked'),
      usePhysicalStrain: html.find('input[name="use-physical-strain"]').is(':checked'),
      rangeModifier: parseInt(html.find('select[name="range-modifier"]').val()) || 0,
      aimModifier: parseInt(html.find('select[name="aim-modifier"]').val()) || 0,
      targetModifier: parseInt(html.find('select[name="target-modifier"]').val()) || 0,
      situationModifier: parseInt(html.find('select[name="situation-modifier"]').val()) || 0,
      customModifier: parseInt(html.find('input[name="custom-modifier"]').val()) || 0,
      calledShotPenalty: parseInt(html.find('select[name="called-shot-penalty"]').val()) || 0,
      difficulty: parseInt(html.find('select[name="difficulty"]').val()) || 0,
      opposedTarget: parseInt(html.find('input[name="opposed-target"]').val()) || 0,
      customTarget: parseInt(html.find('input[name="custom-target"]').val())
    };
    
    // Get selected skill info
    const selectedSkill = rollData.combatSkills.find(s => s.id === formData.combatSkillId) || rollData.combatSkills[0];
    
    // Get ammunition modifiers
    const ammoModifiers = rollData.weapon.getAmmunitionModifiers() || {
      attack_modifier: 0,
      damage_modifier: 0,
      penetration_modifier: 0,
      ammo_type: 'standard'
    };
    const ammoAttackBonus = ammoModifiers.attack_modifier || 0;
    
    // Calculate final roll data
    const attributes = actor.system?.attributes || {};
    let attributeValue = attributes[formData.attribute]?.value || 0;
    
    if (formData.focus && attributes[formData.attribute]?.focus?.[formData.focus]?.value !== undefined) {
      attributeValue = attributes[formData.attribute].focus[formData.focus].value;
    }
    
    // Apply strain bonuses
    let strainBonus = 0;
    const strainActions = [];
    
    if (formData.useMentalStrain) {
      const strainResult = await applyStrainBonus(actor, 'mental', 2);
      if (strainResult.success) {
        strainBonus += 2;
        strainActions.push('Mental Strain (+2)');
      }
    }
    
    if (formData.usePhysicalStrain) {
      const strainResult = await applyStrainBonus(actor, 'physical', 2);
      if (strainResult.success) {
        strainBonus += 2;
        strainActions.push('Physical Strain (+2)');
      }
    }
    
    // Calculate total modifiers (including called shot penalty and ammunition bonus)
    const totalModifiers = formData.rangeModifier + formData.aimModifier + 
                          formData.targetModifier + formData.situationModifier + 
                          formData.customModifier + formData.calledShotPenalty + ammoAttackBonus;
    
    // Calculate final target number
    let targetNumber;
    if (!isNaN(formData.customTarget)) {
      targetNumber = formData.customTarget;
    } else if (formData.opposedTarget > 0) {
      targetNumber = formData.opposedTarget;
    } else {
      // Difficulty is a +/- rule-of-2 modifier applied against a base TN of 10
      targetNumber = 10 - formData.difficulty;
    }
    
    // Calculate wound penalty
    const woundPenalty = getWoundPenalty(actor);
    
    // Final roll values
    const skillRank = selectedSkill.rank || 1;
    const finalAttributeValue = attributeValue + strainBonus + woundPenalty + totalModifiers;
    const rollFormula = getDiceFormula(selectedSkill.level_type);
    
    // Create and execute roll
    const roll = new Roll(rollFormula);
    await roll.evaluate();
    
    const rollTotal = roll.total;
    const actionValue = rollTotal + skillRank + finalAttributeValue - targetNumber;
    const success = actionValue >= 0;
    
    // Consume ammunition for successful attacks (non-melee weapons only)
    if (success && rollData.weapon.system.weapon_type !== 'melee') {
      const consumed = await rollData.weapon.consumeAmmunition(1);
      if (!consumed) {
        console.warn('BluePlanet Weapon Attack: Failed to consume ammunition after successful attack');
      }
    }
    
    // Create flavor text
    let flavorText = `<h3>${rollData.weaponName} Attack</h3>`;
    flavorText += `<p style="color: black; font-size: 11px; margin: 2px 0;"><em>Attack Roll - ${selectedSkill.name} (${getLevelLabel(selectedSkill.level_type)})</em></p>`;
    
    // Add ammunition info for non-melee weapons
    if (rollData.weapon.system.weapon_type !== 'melee') {
      const currentAmmo = rollData.weapon.system.current_ammo || 0;
      const remainingAfterShot = success ? currentAmmo - 1 : currentAmmo;
      if (rollData.weapon.system.loaded_ammunition) {
        flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;"><em>Ammunition: ${rollData.weapon.system.loaded_ammunition.name} (${rollData.weapon.system.loaded_ammunition.system?.ammo_type || 'standard'})</em></p>`;
        if (success) {
          flavorText += `<p style="color: #17a2b8; font-size: 10px; margin: 2px 0;"><em>🔸 Consumed 1 round - ${remainingAfterShot} rounds remaining</em></p>`;
        }
      }
    }
    
    flavorText += `<p><strong>Dice:</strong> [${roll.terms[0].results.map(r => r.result).join(', ')}] | <strong>Skill:</strong> ${skillRank} | <strong>Attribute:</strong> ${attributeValue} | <strong>Total Bonus:</strong> ${strainBonus + woundPenalty + totalModifiers}</p>`;
    flavorText += `<p><strong>Target Number:</strong> ${targetNumber} | <strong>Action Value:</strong> ${actionValue >= 0 ? '+' : ''}${actionValue}</p>`;
    
    // Add damage roll button if attack succeeds
    if (success && rollData.weapon.system.damage > 0) {
      const baseDR = rollData.weapon.system.damage;
      const calledShotBonus = -formData.calledShotPenalty; // Invert: -1 penalty = +1 damage
      const ammoDamageBonus = ammoModifiers.damage_modifier || 0;
      const totalDamageBonus = calledShotBonus + ammoDamageBonus;
      const effectiveDR = baseDR + totalDamageBonus;
      
      flavorText += `<div style="text-align: center; margin: 10px 0; padding: 8px; background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 4px;">`;
      
      if (calledShotBonus > 0) {
        flavorText += `<p style="font-size: 11px; color: #e74c3c; margin: 4px 0;"><strong><i class="fas fa-crosshairs"></i> Called Shot: +${calledShotBonus} damage</strong></p>`;
      }
      if (ammoDamageBonus !== 0) {
        flavorText += `<p style="font-size: 11px; color: #17a2b8; margin: 4px 0;"><strong><i class="fas fa-bullseye"></i> Ammunition: ${ammoDamageBonus >= 0 ? '+' : ''}${ammoDamageBonus} damage</strong></p>`;
      }
      
      flavorText += `<button type="button" class="damage-roll-button" data-weapon-id="${rollData.weapon.id}" data-actor-id="${actor.id}" data-called-shot-bonus="${totalDamageBonus}" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-weight: bold;">`;
      flavorText += `<i class="fas fa-heart-broken"></i> Roll Damage (DR ${baseDR}${totalDamageBonus > 0 ? `+${totalDamageBonus} = ${effectiveDR}` : totalDamageBonus < 0 ? `${totalDamageBonus} = ${effectiveDR}` : ''})`;
      flavorText += `</button></div>`;
    }
    
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
    if (ammoAttackBonus !== 0) modifierDetails.push(`Ammo: ${ammoAttackBonus >= 0 ? '+' : ''}${ammoAttackBonus}`);
    
    if (modifierDetails.length > 0) {
      flavorText += `<p style="color: #666; font-size: 10px;"><em>Modifiers: ${modifierDetails.join(', ')}</em></p>`;
    }
    
    // Determine result category and color
    let resultCategory = "";
    let resultColor = "";
    
    if (success) {
      if (actionValue >= 5) {
        resultCategory = "EXCEPTIONAL SUCCESS";
        resultColor = "#28a745";
        flavorText += `<p style="color: ${resultColor}; font-weight: bold;">${resultCategory}</p>`;
        flavorText += `<p style="color: #28a745; font-size: 10px;"><em>🎯 Benefit: Earn +2 on next relevant test or narrative advantage</em></p>`;
      } else {
        resultCategory = "SUCCESS";
        resultColor = "#007bff";
        flavorText += `<p style="color: ${resultColor}; font-weight: bold;">${resultCategory}</p>`;
        if (actionValue === 0) {
          flavorText += `<p style="color: #fd7e14; font-size: 10px;"><em>⚠️ Complication: Success with additional challenge</em></p>`;
        }
      }
    } else {
      if (actionValue <= -5) {
        resultCategory = "CRITICAL FAILURE";
        resultColor = "#dc3545";
        flavorText += `<p style="color: ${resultColor}; font-weight: bold;">${resultCategory}</p>`;
        flavorText += `<p style="color: #dc3545; font-size: 10px;"><em>💥 Consequence: -2 on next relevant test or narrative penalty</em></p>`;
      } else {
        resultCategory = "FAILURE";
        resultColor = "#6c757d";
        flavorText += `<p style="color: ${resultColor}; font-weight: bold;">${resultCategory}</p>`;
      }
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
          success: success,
          actionValue: actionValue,
          targetNumber: targetNumber,
          resultCategory: resultCategory,
          weaponName: rollData.weaponName,
          skillUsed: selectedSkill.name
        }
      }
    };
    
    await roll.toMessage(messageData);
    
    console.log('BluePlanet Weapon Attack Dialog: Roll completed successfully');
    
  } catch (error) {
    console.error('BluePlanet Weapon Attack Dialog: Error during roll:', error);
    ui.notifications.error('Error executing weapon attack roll. Check console for details.');
  }
}