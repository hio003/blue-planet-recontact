/**
 * Blue Planet Roll Dialog - Fixed Version
 * Uses standard Foundry Dialog pattern to avoid rendering issues
 */

/**
 * Create and show the Blue Planet roll dialog
 * @param {Actor} actor - The actor making the roll
 * @param {Object} rollData - Roll configuration data
 */
export function showBluePlanetRollDialog(actor, rollData) {
  console.log('BluePlanet Roll Dialog: Creating standard dialog', { actor: actor?.name, rollData });
  
  // Generate the content HTML
  const content = createDialogContent(actor, rollData);
  
  // Create the dialog using standard Foundry pattern
  const dialog = new Dialog({
    title: "Blue Planet Roll Setup",
    content: content,
    buttons: {
      next: {
        icon: '<i class="fas fa-arrow-right"></i>',
        label: "<span style='font-weight: bold; color: #4b9cd3;'>Next</span>",
        callback: (html) => handleNextStep(actor, rollData, html)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "<span style='font-weight: bold;'>Cancel</span>",
        callback: () => {}
      }
    },
    default: "next",
    render: (html) => {
      console.log('BluePlanet Roll Dialog: Dialog rendered, setting up listeners');
      setupDialogListeners(html, actor, rollData);
    },
    close: () => {}
  }, {
    classes: ["blue-planet-recontact", "dialog", "sheet", "bpr-dialog"],
    width: 330,
    height: 300,
    resizable: false
  });
  
  dialog.render(true);
  return dialog;
}

/**
 * Create the HTML content for the dialog
 */
function createDialogContent(actor, rollData) {
  console.log('BluePlanet Roll Dialog: Creating content');
  
  // Safe attribute access
  const attributes = actor.system?.attributes || {};
  const strain = actor.system?.strain || { mental: { value: 0 }, physical: { value: 0 } };
  
  const cognition = attributes.cognition?.value || 0;
  const psyche = attributes.psyche?.value || 0;
  const coordination = attributes.coordination?.value || 0;
  const physique = attributes.physique?.value || 0;
  
  const mentalStrain = strain.mental?.value || 0;
  const physicalStrain = strain.physical?.value || 0;
  
  // For attribute rolls, the "skill rank" is actually the base difficulty (usually 5)
  // For skill rolls, it's the actual skill rank
  const isAttributeRoll = rollData.type === 'attribute';
  const baseTarget = (rollData.skillRank || 0) + (rollData.attributeValue || 0);
  
  // Get focus options
  const focusOptions = getFocusOptions(actor, rollData.attribute || 'cognition');
  
  return `
    <div class="blue-planet-roll-dialog" style="font-size: 12px; color: #ddd;">
      <div class="dialog-header" style="margin-bottom: 10px;">
        <h3 style="margin: 0; color: #4b9cd3; font-size: 14px;">${rollData.skillName || 'Test'}</h3>
        <p style="margin: 3px 0; color: #bbb; font-size: 11px;">${isAttributeRoll ? (rollData.levelType === 'focus' ? 'Focus Attribute' : 'Base Attribute') : rollData.levelType.charAt(0).toUpperCase() + rollData.levelType.slice(1) + ' Level'} - ${rollData.dice || '1d10'}</p>
      </div>
      
      <form>
        <div class="form-group" style="margin-bottom: 8px;">
          <h4 style="color: #4b9cd3; font-size: 12px; margin: 0 0 5px 0;">Base Calculation</h4>
          <div style="background: #2a2a2a; padding: 6px; border-radius: 3px; text-align: center; color: #ddd; font-size: 11px;">
            <span>${isAttributeRoll ? 'Base Difficulty' : (rollData.skillName || 'Skill')} ${rollData.skillRank || 0}</span>
            <span> + </span>
            <span id="attr-display">Attribute 0</span>
            <span> = </span>
            <span id="base-total" style="font-weight: bold;">${baseTarget}</span>
          </div>
        </div>
        
        <div class="form-group" style="margin-bottom: 8px;">
          <h4 style="color: #4b9cd3; font-size: 12px; margin: 0 0 5px 0;">Attributes</h4>
          <div style="display: flex; gap: 6px;">
            <div style="flex: 1;">
              <label style="color: #ddd; font-size: 11px;">Attribute:</label>
              <select name="attribute" id="attribute-select" style="width: 100%; font-size: 11px;">
                <option value="cognition" ${rollData.attribute === 'cognition' ? 'selected' : ''}>Cognition (${cognition})</option>
                <option value="psyche" ${rollData.attribute === 'psyche' ? 'selected' : ''}>Psyche (${psyche})</option>
                <option value="coordination" ${rollData.attribute === 'coordination' ? 'selected' : ''}>Coordination (${coordination})</option>
                <option value="physique" ${rollData.attribute === 'physique' ? 'selected' : ''}>Physique (${physique})</option>
              </select>
            </div>
            <div style="flex: 1;">
              <label style="color: #ddd; font-size: 11px;">Focus:</label>
              <select name="focus" id="focus-select" style="width: 100%; font-size: 11px;">
                <option value="">No Focus</option>
                ${focusOptions}
              </select>
            </div>
          </div>
        </div>
        
        <div class="form-group" style="margin-bottom: 8px;">
          <h4 style="color: #4b9cd3; font-size: 12px; margin: 0 0 5px 0;">Strain</h4>
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1;">
              <label style="display: flex; align-items: center; gap: 3px; color: #ddd; font-size: 11px;">
                <input type="checkbox" name="mental-strain"> Mental
              </label>
              <div style="display: flex; align-items: center; gap: 3px; margin- px;">
                <input type="number" name="mental-strain-amount" min="1" max="${Math.max(1, 4 - mentalStrain)}" value="1" disabled style="width: 40px; font-size: 10px;">
                <span style="font-size: 10px; color: #aaa;">Avail: ${4 - mentalStrain}</span>
              </div>
            </div>
            <div style="flex: 1;">
              <label style="display: flex; align-items: center; gap: 3px; color: #ddd; font-size: 11px;">
                <input type="checkbox" name="physical-strain"> Physical
              </label>
              <div style="display: flex; align-items: center; gap: 3px; margin- px;">
                <input type="number" name="physical-strain-amount" min="1" max="${Math.max(1, 6 - physicalStrain)}" value="1" disabled style="width: 40px; font-size: 10px;">
                <span style="font-size: 10px; color: #aaa;">Avail: ${6 - physicalStrain}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `;
}

/**
 * Get focus options for an attribute
 */
function getFocusOptions(actor, currentAttribute) {
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
    options += `<option value="primary">${attr.focus.primary.name} (${attr.focus.primary.value || 0})</option>`;
  }
  if (attr.focus.secondary && attr.focus.secondary.name) {
    options += `<option value="secondary">${attr.focus.secondary.name} (${attr.focus.secondary.value || 0})</option>`;
  }
  
  return options;
}

/**
 * Setup dialog listeners
 */
function setupDialogListeners(html, actor, rollData) {
  // Strain checkbox handlers
  html.find('input[name="mental-strain"]').change(function() {
    html.find('input[name="mental-strain-amount"]').prop('disabled', !this.checked);
  });
  
  html.find('input[name="physical-strain"]').change(function() {
    html.find('input[name="physical-strain-amount"]').prop('disabled', !this.checked);
  });
  
  // Attribute change handler
  html.find('#attribute-select').change(() => {
    updateAttributeDisplay(html, actor, rollData);
    updateFocusOptions(html, actor);
  });
  
  html.find('#focus-select').change(() => {
    updateAttributeDisplay(html, actor, rollData);
  });
  
  // Initialize display
  updateAttributeDisplay(html, actor, rollData);
}

/**
 * Update attribute display
 */
function updateAttributeDisplay(html, actor, rollData) {
  const selectedAttribute = html.find('#attribute-select').val();
  const focusType = html.find('#focus-select').val();
  
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
  
  html.find('#attr-display').text(attributeText);
  
  const skillRank = rollData.skillRank || 0;
  const baseTotal = skillRank + attributeValue;
  html.find('#base-total').text(baseTotal);
}

/**
 * Update focus options
 */
function updateFocusOptions(html, actor) {
  const selectedAttribute = html.find('#attribute-select').val();
  const focusSelect = html.find('#focus-select');
  const focusOptions = getFocusOptions(actor, selectedAttribute);
  focusSelect.html('<option value="">No Focus</option>' + focusOptions);
}

/**
 * Handle next step
 */
async function handleNextStep(actor, rollData, html) {
  console.log('BluePlanet Roll Dialog: Next step clicked');
  
  // Get form data
  const form = html.find('form')[0];
  const formData = new FormData(form);
  
  const selectedAttribute = formData.get('attribute');
  const focusType = formData.get('focus');
  const mentalStrain = formData.get('mental-strain') ? parseInt(formData.get('mental-strain-amount')) || 1 : 0;
  const physicalStrain = formData.get('physical-strain') ? parseInt(formData.get('physical-strain-amount')) || 1 : 0;
  
  // Calculate base target with selected attribute
  let attributeValue = 0;
  const attributes = actor.system?.attributes || {};
  const attribute = attributes[selectedAttribute];
  
  if (focusType && attribute && attribute.focus && attribute.focus[focusType]) {
    attributeValue = attribute.focus[focusType].value || 0;
  } else if (attribute) {
    attributeValue = attribute.value || 0;
  }
  
  const baseTarget = (rollData.skillRank || 0) + attributeValue + mentalStrain + physicalStrain;
  
  // Show modifiers dialog (or proceed with simple roll for now)
  showModifiersDialog(actor, {
    ...rollData,
    selectedAttribute,
    focusType,
    mentalStrain,
    physicalStrain,
    baseTarget
  });
}

/**
 * Simple modifiers dialog (can be expanded later)
 */
function showModifiersDialog(actor, rollData) {
  const dialog = new Dialog({
    title: "Roll Modifiers",
    content: `
      <div class="blue-planet-roll-dialog" style="font-size: 12px; color: #ddd;">
        <h3 style="color: #4b9cd3; font-size: 14px; text-align: center; margin: 0 0 8px 0;">Final Target: <span id="final-target">${rollData.baseTarget}</span></h3>
        <p style="color: #bbb; font-size: 11px; text-align: center; margin: 0 0 10px 0;">Base: ${rollData.skillRank || 0} + ${rollData.selectedAttribute} + Strain = ${rollData.baseTarget}</p>
        
        <div class="form-group" style="margin-bottom: 8px;">
          <label style="color: #ddd; font-size: 11px;">Difficulty:</label>
          <select name="difficulty" style="width: 100%; font-size: 11px;">
            <option value="0">Normal (0)</option>
            <option value="-2">Easy (+2)</option>
            <option value="-1">Simple (+1)</option>
            <option value="1">Hard (-1)</option>
            <option value="2">Extreme (-2)</option>
            <option value="3">Legendary (-3)</option>
          </select>
        </div>
        
        <div class="form-group" style="margin-bottom: 8px;">
          <label style="color: #ddd; font-size: 11px;">Other Modifier:</label>
          <input type="number" name="other" value="0" min="-10" max="10" style="width: 100%; font-size: 11px;">
        </div>
      </div>
    `,
    buttons: {
      roll: {
        icon: '<i class="fas fa-dice-d10"></i>',
        label: "<span style='font-weight: bold; color: #4b9cd3;'>Roll</span>",
        callback: (html) => executeRoll(actor, rollData, html)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "<span style='font-weight: bold;'>Cancel</span>"
      }
    },
    default: "roll"
  }, {
    classes: ["blue-planet-recontact", "dialog", "sheet", "bpr-dialog"],
    width: 330,
    height: 300,
    resizable: false
  });
  
  dialog.render(true);
}

/**
 * Execute the roll
 */
async function executeRoll(actor, rollData, html) {
  const form = html.find('form')[0];
  const formData = new FormData(form);
  
  const difficulty = parseInt(formData.get('difficulty')) || 0;
  const other = parseInt(formData.get('other')) || 0;
  
  const finalTarget = rollData.baseTarget + other - difficulty;
  
  // Apply strain
  if (rollData.mentalStrain > 0) {
    const newStrain = Math.min((actor.system.strain.mental.value || 0) + rollData.mentalStrain, 4);
    await actor.update({'system.strain.mental.value': newStrain});
  }
  if (rollData.physicalStrain > 0) {
    const newStrain = Math.min((actor.system.strain.physical.value || 0) + rollData.physicalStrain, 6);
    await actor.update({'system.strain.physical.value': newStrain});
  }
  
  // Make the roll
  const roll = new Roll(rollData.dice || '1d10');
  await roll.evaluate();
  
  const success = roll.total <= finalTarget;
  const actionValue = finalTarget - roll.total;
  
  // Use the enhanced roll message system
  const rollMessageData = { success, actionValue, targetNumber: finalTarget };
  const rollType = rollData.type === 'attribute' ? 'attribute' : 'skill';
  const rollOptions = {
    flavor: rollData.label || rollData.skillName,
    rollMode: game.settings.get('core', 'rollMode')
  };
  
  // Import and use the enhanced message system
  try {
    const { createBluePlanetRollMessage } = await import('./actor/actor.js');
    await createBluePlanetRollMessage(roll, rollMessageData, actor, rollType, rollOptions);
  } catch (error) {
    console.error('Failed to use enhanced roll message, falling back to basic message:', error);
    
    // Fallback to basic message
    let flavor = `<h3>${rollData.label || rollData.skillName}</h3>`;
    flavor += `<p><strong>Target:</strong> ${finalTarget} | <strong>Roll:</strong> ${roll.total}</p>`;
    if (success) {
      flavor += `<p style="color: green;"><strong>SUCCESS</strong> (Action Value: ${actionValue})</p>`;
    } else {
      flavor += `<p style="color: red;"><strong>FAILURE</strong> (Action Value: ${actionValue})</p>`;
    }
    
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: flavor
    });
  }
}

// Export the main function as the default export
export default showBluePlanetRollDialog;