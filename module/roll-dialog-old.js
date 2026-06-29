/**
 * Blue Planet Roll Dialog
 * Comprehensive roll dialog with all Blue Planet Recontact mechanics
 */
export class BluePlanetRollDialog extends Dialog {
  
  constructor(actor, rollData, options = {}) {
    const dialogData = {
      title: `${rollData.label} Roll - ${actor.name}`,
      content: BluePlanetRollDialog._createDialogContent(actor, rollData),
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d10"></i>',
          label: "Roll",
          callback: html => BluePlanetRollDialog._onRoll(actor, rollData, html)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => {}
        }
      },
      default: "roll",
      close: () => {}
    };

    super(dialogData, options);
    this.actor = actor;
    this.rollData = rollData;
  }

  static _createDialogContent(actor, rollData) {
    return `
      <form class="blue-planet-roll-dialog">
        <div class="roll-header">
          <h3>${rollData.label} Roll</h3>
          <p><strong>Base:</strong> ${rollData.attribute} ${rollData.attributeValue || 0} + ${rollData.skillName || 'No Skill'} ${rollData.skillRank || 0}</p>
          <p><strong>Dice Formula:</strong> ${rollData.dice} ${rollData.levelType ? `(${rollData.levelType} level)` : ''}</p>
          <p><strong>Target Number:</strong> ${rollData.targetNumber || 10}</p>
        </div>

        <div class="roll-section">
          <h4>Attribute & Focus</h4>
          <div class="form-group">
            <label>Primary Attribute:</label>
            <select name="attribute">
              <option value="cognition" ${rollData.attribute === 'cognition' ? 'selected' : ''}>Cognition (${actor.system.attributes.cognition.value})</option>
              <option value="psyche" ${rollData.attribute === 'psyche' ? 'selected' : ''}>Psyche (${actor.system.attributes.psyche.value})</option>
              <option value="coordination" ${rollData.attribute === 'coordination' ? 'selected' : ''}>Coordination (${actor.system.attributes.coordination.value})</option>
              <option value="physique" ${rollData.attribute === 'physique' ? 'selected' : ''}>Physique (${actor.system.attributes.physique.value})</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Use Focus Attribute:</label>
            <select name="focus">
              <option value="">No Focus</option>
              ${BluePlanetRollDialog._getFocusOptions(actor, rollData.attribute)}
            </select>
          </div>
        </div>

        <div class="roll-section">
          <h4>Strain</h4>
          <div class="strain-options">
            <div class="strain-type">
              <label>
                <input type="checkbox" name="mental-strain" value="1">
                Spend Mental Strain (+1) - Available: ${4 - (actor.system.strain.mental.value || 0)}
              </label>
              <input type="number" name="mental-strain-amount" min="1" max="${4 - (actor.system.strain.mental.value || 0)}" value="1" disabled>
            </div>
            <div class="strain-type">
              <label>
                <input type="checkbox" name="physical-strain" value="1">
                Spend Physical Strain (+1) - Available: ${6 - (actor.system.strain.physical.value || 0)}
              </label>
              <input type="number" name="physical-strain-amount" min="1" max="${6 - (actor.system.strain.physical.value || 0)}" value="1" disabled>
            </div>
          </div>
        </div>

        <div class="roll-section">
          <h4>Equipment & Biomods</h4>
          <div class="equipment-mods">
            ${BluePlanetRollDialog._getEquipmentMods(actor, rollData)}
          </div>
        </div>

        <div class="roll-section">
          <h4>Situational Modifiers</h4>
          <div class="form-group">
            <label>Difficulty Modifier:</label>
            <select name="difficulty">
              <option value="0">Normal (0)</option>
              <option value="-2">Easy (+2)</option>
              <option value="-1">Simple (+1)</option>
              <option value="1">Hard (-1)</option>
              <option value="2">Extreme (-2)</option>
              <option value="3">Legendary (-3)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Environmental Modifier:</label>
            <input type="number" name="environmental" value="0" min="-10" max="10" placeholder="e.g., -2 for darkness">
          </div>
          
          <div class="form-group">
            <label>Other Modifiers:</label>
            <input type="number" name="other" value="0" min="-10" max="10" placeholder="e.g., +1 for good tools">
          </div>
        </div>

        <div class="roll-section">
          <h4>Roll Options</h4>
          <div class="form-group">
            <label>
              <input type="checkbox" name="pushing">
              Push the Roll (reroll once, but complications on any 1s)
            </label>
          </div>
          
          <div class="form-group">
            <label>Target Number:</label>
            <input type="number" name="target" value="${rollData.targetNumber || 10}" min="1" max="30">
          </div>
        </div>
      </form>
    `;
  }

  static _getFocusOptions(actor, currentAttribute) {
    const attr = actor.system.attributes[currentAttribute];
    if (!attr || !attr.focus) return '';
    
    let options = '';
    if (attr.focus.primary && attr.focus.primary.name) {
      options += `<option value="primary">${attr.focus.primary.name} (${attr.focus.primary.value})</option>`;
    }
    if (attr.focus.secondary && attr.focus.secondary.name) {
      options += `<option value="secondary">${attr.focus.secondary.name} (${attr.focus.secondary.value})</option>`;
    }
    return options;
  }

  static _getEquipmentMods(actor, rollData) {
    const items = actor.items.filter(i => ['weapon', 'equipment', 'biomod'].includes(i.type));
    if (items.length === 0) return '<p>No equipment or biomods available</p>';
    
    let html = '';
    items.forEach(item => {
      const bonus = item.system.bonus || 0;
      if (bonus !== 0) {
        html += `
          <div class="equipment-mod">
            <label>
              <input type="checkbox" name="equipment" value="${bonus}" data-item="${item.id}">
              ${item.name} (${bonus > 0 ? '+' : ''}${bonus})
            </label>
          </div>
        `;
      }
    });
    
    return html || '<p>No equipment bonuses available</p>';
  }

  static async _onRoll(actor, rollData, html) {
    const formData = new FormData(html[0].querySelector('form'));
    
    // Calculate total modifiers
    let totalMod = 0;
    let strainSpent = { mental: 0, physical: 0 };
    let modifierText = [];
    
    // Attribute selection
    const selectedAttribute = formData.get('attribute');
    const attributeValue = actor.system.attributes[selectedAttribute].value;
    let baseValue = attributeValue + (rollData.skillRank || 0);
    
    // Focus attribute
    const focusType = formData.get('focus');
    if (focusType) {
      const focusValue = actor.system.attributes[selectedAttribute].focus[focusType].value;
      const focusName = actor.system.attributes[selectedAttribute].focus[focusType].name;
      baseValue = focusValue + (rollData.skillRank || 0);
      modifierText.push(`Using ${focusName} Focus (${focusValue})`);
    }
    
    // Strain
    if (formData.get('mental-strain')) {
      const amount = parseInt(formData.get('mental-strain-amount')) || 1;
      totalMod += amount;
      strainSpent.mental = amount;
      modifierText.push(`Mental Strain (+${amount})`);
    }
    
    if (formData.get('physical-strain')) {
      const amount = parseInt(formData.get('physical-strain-amount')) || 1;
      totalMod += amount;
      strainSpent.physical = amount;
      modifierText.push(`Physical Strain (+${amount})`);
    }
    
    // Difficulty
    const difficulty = parseInt(formData.get('difficulty')) || 0;
    totalMod -= difficulty; // Negative because difficulty reduces the roll
    if (difficulty !== 0) {
      const diffNames = {'-2': 'Easy', '-1': 'Simple', '1': 'Hard', '2': 'Extreme', '3': 'Legendary'};
      modifierText.push(`${diffNames[difficulty]} (${difficulty > 0 ? '-' : '+'}${Math.abs(difficulty)})`);
    }
    
    // Environmental and other modifiers
    const environmental = parseInt(formData.get('environmental')) || 0;
    const other = parseInt(formData.get('other')) || 0;
    totalMod += environmental + other;
    
    if (environmental !== 0) modifierText.push(`Environmental (${environmental > 0 ? '+' : ''}${environmental})`);
    if (other !== 0) modifierText.push(`Other (${other > 0 ? '+' : ''}${other})`);
    
    // Equipment bonuses
    const equipmentBoxes = html[0].querySelectorAll('input[name="equipment"]:checked');
    equipmentBoxes.forEach(box => {
      const bonus = parseInt(box.value);
      const itemName = actor.items.get(box.dataset.item)?.name || 'Equipment';
      totalMod += bonus;
      modifierText.push(`${itemName} (${bonus > 0 ? '+' : ''}${bonus})`);
    });
    
    const targetNumber = parseInt(formData.get('target')) || 10;
    const finalTarget = baseValue + totalMod;
    const pushing = formData.get('pushing');
    
    // Create the roll using the dice formula from rollData
    const diceFormula = rollData.dice || '1d10';
    console.log(`Rolling with formula: ${diceFormula}`);
    const roll = new Roll(diceFormula);
    await roll.evaluate();
    console.log(`Roll result: ${roll.total} (formula: ${diceFormula})`);
    
    // Calculate success/failure
    const actionValue = finalTarget - roll.total;
    const success = roll.total <= finalTarget;
    
    // Apply strain if used
    if (strainSpent.mental > 0) {
      const newMentalStrain = (actor.system.strain.mental.value || 0) + strainSpent.mental;
      await actor.update({'system.strain.mental.value': Math.min(newMentalStrain, 4)});
    }
    if (strainSpent.physical > 0) {
      const newPhysicalStrain = (actor.system.strain.physical.value || 0) + strainSpent.physical;
      await actor.update({'system.strain.physical.value': Math.min(newPhysicalStrain, 6)});
    }
    
    // Create flavor text
    let flavorText = `<h3>${rollData.label}</h3>`;
    flavorText += `<p><strong>Dice:</strong> ${diceFormula} ${rollData.levelType ? `(${rollData.levelType} level)` : ''}</p>`;
    flavorText += `<p><strong>Base:</strong> ${selectedAttribute.charAt(0).toUpperCase() + selectedAttribute.slice(1)} ${attributeValue}`;
    if (rollData.skillName) flavorText += ` + ${rollData.skillName} ${rollData.skillRank}`;
    flavorText += ` = ${baseValue}</p>`;
    
    if (modifierText.length > 0) {
      flavorText += `<p><strong>Modifiers:</strong> ${modifierText.join(', ')}</p>`;
    }
    
    flavorText += `<p><strong>Final Target:</strong> ${finalTarget}</p>`;
    flavorText += `<p><strong>Roll Result:</strong> ${roll.total} (${roll.result})</p>`;
    
    // Determine result
    let resultText = '';
    let resultColor = '';
    
    if (success) {
      if (actionValue >= 5) {
        resultText = 'EXCEPTIONAL SUCCESS';
        resultColor = '#28a745';
        flavorText += `<p style="color: ${resultColor}"><strong>${resultText}</strong> - Action Value: +${actionValue}</p>`;
        flavorText += `<p><em>🎯 Benefit: +2 on next relevant roll or narrative advantage</em></p>`;
      } else {
        resultText = 'SUCCESS';
        resultColor = '#007bff';
        flavorText += `<p style="color: ${resultColor}"><strong>${resultText}</strong> - Action Value: +${actionValue}</p>`;
        if (actionValue === 0) {
          flavorText += `<p><em>⚠️ Complication: Success with additional challenge</em></p>`;
        }
      }
    } else {
      if (actionValue <= -5) {
        resultText = 'CRITICAL FAILURE';
        resultColor = '#dc3545';
        flavorText += `<p style="color: ${resultColor}"><strong>${resultText}</strong> - Action Value: ${actionValue}</p>`;
        flavorText += `<p><em>💥 Consequence: -2 on next relevant roll or narrative penalty</em></p>`;
      } else {
        resultText = 'FAILURE';
        resultColor = '#6c757d';
        flavorText += `<p style="color: ${resultColor}"><strong>${resultText}</strong> - Action Value: ${actionValue}</p>`;
      }
    }
    
    // Send to chat
    const messageData = {
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: flavorText,
      sound: CONFIG.sounds.dice,
      flags: {
        'blue-planet-recontact': {
          rollType: rollData.type || 'skill',
          success: success,
          actionValue: actionValue,
          targetNumber: finalTarget,
          resultCategory: resultText
        }
      }
    };
    
    return roll.toMessage(messageData);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Enable/disable strain amount inputs
    html.find('input[name="mental-strain"]').change(function() {
      html.find('input[name="mental-strain-amount"]').prop('disabled', !this.checked);
    });
    
    html.find('input[name="physical-strain"]').change(function() {
      html.find('input[name="physical-strain-amount"]').prop('disabled', !this.checked);
    });
    
    // Update focus options when attribute changes
    html.find('select[name="attribute"]').change((event) => {
      const newAttribute = event.target.value;
      const focusSelect = html.find('select[name="focus"]');
      focusSelect.html('<option value="">No Focus</option>' + BluePlanetRollDialog._getFocusOptions(this.actor, newAttribute));
    });
  }
}
