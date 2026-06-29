/**
 * Weapon Attack Roll Dialog Step 1 for Blue Planet Recontact
 * Covers: Weapon Info, Skill Selection, Attribute Selection, Strain Mechanics
 */

import { 
  determineStrainType, 
  getStrainStatus 
} from './strain-mechanics-fixed.js';

import { 
  getWoundPenalty,
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
 * Create and show the weapon attack roll dialog step 1
 * @param {Actor} actor - The actor making the roll
 * @param {Object} rollData - Roll configuration data
 */
export function showWeaponAttackDialogStep1(actor, rollData) {
  console.log('BluePlanet Weapon Attack Dialog Step 1: Creating dialog', { actor: actor?.name, rollData });
  
  // Get current strain status
  const strainStatus = getStrainStatus(actor);
  const recommendedStrainType = determineStrainType('weapon', rollData.attribute, rollData);
  
  // Generate the content HTML
  const content = createWeaponAttackDialogStep1Content(actor, rollData, strainStatus, recommendedStrainType);
  
  // Create dialog
  const dialogTitle = `${rollData.weaponName} Attack - Step 1`;
  
  // Create the dialog
  const dialog = new Dialog({
    title: dialogTitle,
    content: content,
    buttons: {
      next: {
        icon: '<i class="fas fa-arrow-right"></i>',
        label: "<span style='font-weight: bold;'>Next</span>",
        callback: (html) => proceedToStep2(actor, rollData, html)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "<span style='font-weight: bold;'>Cancel</span>",
        callback: () => {}
      }
    },
    default: "next",
    render: (html) => {
      console.log('BluePlanet Weapon Attack Dialog Step 1: Dialog rendered, setting up listeners');
      setupDialogStep1Listeners(html, actor, rollData, strainStatus);
    },
    close: () => {}
  }, {
    classes: ["blue-planet-recontact", "dialog", "sheet", "weapon-attack-step1", "strain-enhanced", "bpr-dialog"],
    width: 700,   
    height: 480,  
    resizable: false,
    minimizable: false });
  
  dialog.render(true);
  return dialog;
}

/**
 * Create the HTML content for weapon attack dialog step 1
 */
function createWeaponAttackDialogStep1Content(actor, rollData, strainStatus, recommendedStrainType) {
  // Safe attribute access
  const attributes = actor.system?.attributes || {};
  
  const cognition = attributes.cognition?.value || 0;
  const psyche = attributes.psyche?.value || 0;
  const coordination = attributes.coordination?.value || 0;
  const physique = attributes.physique?.value || 0;
  
  const baseTarget = (rollData.skillRank || 0) + (rollData.attributeValue || 0);
  
  // Get focus options with preselection based on rollData
  const focusOptions = getFocusOptions(actor, rollData.attribute || 'coordination', rollData.focusType);
  
  // Create skill options from all available skills
  const skillOptions = rollData.allSkills.map(skill => 
    `<option value="${skill.id}" ${skill.id === rollData.allSkills[0]?.id ? 'selected' : ''}>${skill.name} (${getLevelLabel(skill.level_type)}) - Rank ${skill.rank}</option>`
  ).join('');

  return `
    <div class="blue-planet-weapon-attack-dialog-step1" style="padding-bottom: 2px !important; margin-bottom: 0 !important;">
      <form style="margin-bottom: 2px !important;">
        <div class="form-group">
          <h4>Weapon Information</h4>
          <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; color: #ddd; font-size: 12px;">
            <div style="margin-bottom: 4px;"><strong>${rollData.weaponName}</strong> (${rollData.weaponType.charAt(0).toUpperCase() + rollData.weaponType.slice(1)})</div>
            ${rollData.weapon.system.damage ? `<div style="font-size: 10px; color: #aaa;">Damage Rating: ${rollData.weapon.system.damage}</div>` : ''}
            ${rollData.weapon.system.effective_range ? `<div style="font-size: 10px; color: #aaa;">Effective Range: ${rollData.weapon.system.effective_range}m</div>` : ''}
          </div>
        </div>

        <div class="form-group">
          <h4>Skill Selection</h4>
          <select name="skill" id="skill-select" style="width: 100%; height: 28px;">
            ${skillOptions}
          </select>
        </div>
        
        <div class="form-group">
          <h4>Base Calculation Preview</h4>
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
        
        <div style="text-align: center; margin- px; font-style: italic; color: #aaa;">
          <p>Next: Combat Modifiers & Target Number Selection</p>
        </div>
      </form>
    </div>
  `;
}

/**
 * Setup event listeners for the weapon attack dialog step 1
 */
function setupDialogStep1Listeners(html, actor, rollData, strainStatus) {
  console.log('BluePlanet Weapon Attack Dialog Step 1: Setting up listeners');
  
  const attributes = actor.system?.attributes || {};
  
  // Update calculation when skill changes
  html.find('#skill-select').change((event) => {
    const skillId = event.target.value;
    const selectedSkill = rollData.allSkills.find(s => s.id === skillId);
    
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
    const skillId = html.find('#skill-select').val();
    const selectedSkill = rollData.allSkills.find(s => s.id === skillId) || rollData.allSkills[0];
    
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
  
  // Initial calculation
  updateCalculation();
}

/**
 * Proceed to step 2 of the weapon attack dialog
 */
async function proceedToStep2(actor, rollData, html) {
  console.log('BluePlanet Weapon Attack Dialog: Proceeding to step 2');
  
  try {
    // Collect form data from step 1
    const formData = {
      skillId: html.find('#skill-select').val(),
      attribute: html.find('#attribute-select').val(),
      focus: html.find('#focus-select').val(),
      useMentalStrain: html.find('input[name="use-mental-strain"]').is(':checked'),
      usePhysicalStrain: html.find('input[name="use-physical-strain"]').is(':checked')
    };
    
    // Get selected skill info
    const selectedSkill = rollData.allSkills.find(s => s.id === formData.skillId) || rollData.allSkills[0];
    
    // Calculate attribute value
    const attributes = actor.system?.attributes || {};
    let attributeValue = attributes[formData.attribute]?.value || 0;
    if (formData.focus && attributes[formData.attribute]?.focus?.[formData.focus]?.value !== undefined) {
      attributeValue = attributes[formData.attribute].focus[formData.focus].value;
    }
    
    // Update rollData with step 1 selections
    rollData.selectedSkill = selectedSkill;
    rollData.selectedAttribute = formData.attribute;
    rollData.selectedAttributeValue = attributeValue;
    rollData.selectedFocus = formData.focus;
    rollData.useMentalStrain = formData.useMentalStrain;
    rollData.usePhysicalStrain = formData.usePhysicalStrain;
    
    // Close current dialog
    // The dialog will close automatically when we return
    
    // Open step 2 dialog
    const { showWeaponAttackDialogStep2 } = await import('./weapon-attack-dialog-step2.js');
    showWeaponAttackDialogStep2(actor, rollData);
    
  } catch (error) {
    console.error('BluePlanet Weapon Attack Dialog: Error proceeding to step 2:', error);
    ui.notifications.error('Error proceeding to step 2. Check console for details.');
  }
}