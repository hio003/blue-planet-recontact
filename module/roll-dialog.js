/**
 * Blue Planet Roll Dialog - First Dialog (Base Setup)
 * Base roll setup with attribute, focus, and strain selection
 */
export class BluePlanetRollDialog extends Dialog {
  
  constructor(actor, rollData, options = {}) {
    console.log('BluePlanet Roll Dialog: Constructor called', { actor: actor?.name, rollData });
    
    let content = '';
    try {
      content = BluePlanetRollDialog._createBaseDialogContent(actor, rollData);
      console.log('BluePlanet Roll Dialog: Content generated successfully');
    } catch (error) {
      console.error('BluePlanet Roll Dialog: Error generating content:', error);
      content = `<div style="color: red; padding: 20px;">
        <h3>Error Loading Dialog</h3>
        <p>There was an error loading the roll dialog content.</p>
        <p>Error: ${error.message}</p>
      </div>`;
    }
    
    const dialogData = {
      title: `Roll Setup`,
      content: content,
      buttons: {
        next: {
          icon: '<i class="fas fa-arrow-right"></i>',
          label: "Next",
          callback: html => this._onNext(html)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => {}
        }
      },
      default: "next",
      close: () => {},
      render: true
    };

    console.log('BluePlanet Roll Dialog: About to call super() with dialog data');
    super(dialogData, foundry.utils.mergeObject(options, {
      classes: ["blue-planet-recontact", "sheet", "dialog"],
      width: 330,
      height: 300,
      resizable: false,
      minimizable: false
    }));
    this.actor = actor;
    this.rollData = rollData;
    console.log('BluePlanet Roll Dialog: Constructor completed');
  }

  static _createBaseDialogContent(actor, rollData) {
    console.log('BluePlanet Roll Dialog: Creating content...', { actor: actor.name, rollData });
    
    // Safe attribute access with defaults
    const attributes = actor.system?.attributes || {};
    const strain = actor.system?.strain || { mental: { value: 0 }, physical: { value: 0 } };
    
    const cognition = attributes.cognition?.value || 0;
    const psyche = attributes.psyche?.value || 0;
    const coordination = attributes.coordination?.value || 0;
    const physique = attributes.physique?.value || 0;
    
    const mentalStrain = strain.mental?.value || 0;
    const physicalStrain = strain.physical?.value || 0;
    
    const baseTarget = (rollData.skillRank || 0) + (rollData.attributeValue || 0);
    
    // Get focus options safely
    let focusOptions = '';
    try {
      focusOptions = BluePlanetRollDialog._getFocusOptions(actor, rollData.attribute || 'cognition');
    } catch (error) {
      console.error('BluePlanet Roll Dialog: Error getting focus options:', error);
      focusOptions = '';
    }
    
    console.log('BluePlanet Roll Dialog: Content data prepared', {
      cognition, psyche, coordination, physique,
      mentalStrain, physicalStrain,
      baseTarget, focusOptions
    });
    
    const content = `
      <form class="blue-planet-roll-dialog flexcol">
        <div class="compact-header">
          <div class="skill-info">
            <span class="skill-name">${rollData.skillName || 'Skill'}</span>
            <span class="skill-level">(${rollData.levelType ? rollData.levelType.charAt(0).toUpperCase() + rollData.levelType.slice(1) : 'General'} - ${rollData.dice || '1d10'})</span>
          </div>
        </div>

        <div class="sheet-main">
          <section class="main-content">
            <div class="base-calculation-section">
              <h3>Base Roll Calculation</h3>
              <div class="calculation-display">
                <span class="skill-part">${rollData.skillName || 'Skill'} ${rollData.skillRank || 0}</span>
                <span class="plus">+</span>
                <span class="attribute-part" id="attr-display">Attribute 0</span>
                <span class="equals">=</span>
                <span class="total" id="base-total">${baseTarget}</span>
              </div>
            </div>

            <div class="attribute-section">
              <h3>Attributes</h3>
              <div style="display: flex; gap: 8px;">
                <div class="form-group" style="flex: 1; margin-bottom: 4px;">
                  <label>Attribute:</label>
                  <select name="attribute" id="attribute-select">
                    <option value="cognition" ${rollData.attribute === 'cognition' ? 'selected' : ''}>Cognition (${cognition})</option>
                    <option value="psyche" ${rollData.attribute === 'psyche' ? 'selected' : ''}>Psyche (${psyche})</option>
                    <option value="coordination" ${rollData.attribute === 'coordination' ? 'selected' : ''}>Coordination (${coordination})</option>
                    <option value="physique" ${rollData.attribute === 'physique' ? 'selected' : ''}>Physique (${physique})</option>
                  </select>
                </div>
                <div class="form-group" style="flex: 1; margin-bottom: 4px;">
                  <label>Focus:</label>
                  <select name="focus" id="focus-select">
                    <option value="">No Focus</option>
                    ${focusOptions}
                  </select>
                </div>
              </div>
            </div>

            <div class="strain-section">
              <h3>Strain</h3>
              <div class="strain-options">
                <div class="strain-type">
                  <label>Mental:</label>
                  <div class="strain-controls">
                    <input type="checkbox" name="mental-strain">
                    <input type="number" name="mental-strain-amount" min="1" max="${Math.max(1, 4 - mentalStrain)}" value="1" disabled>
                    <span class="strain-info">Avail: ${4 - mentalStrain}</span>
                  </div>
                </div>
                <div class="strain-type">
                  <label>Physical:</label>
                  <div class="strain-controls">
                    <input type="checkbox" name="physical-strain">
                    <input type="number" name="physical-strain-amount" min="1" max="${Math.max(1, 6 - physicalStrain)}" value="1" disabled>
                    <span class="strain-info">Avail: ${6 - physicalStrain}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    `;
    
    console.log('BluePlanet Roll Dialog: Content created, length:', content.length);
    return content;
  }

  /**
   * Handle Next button click - opens second dialog
   * @param {jQuery} html The first dialog HTML
   * @private
   */
  async _onNext(html) {
    // Get data from first dialog
    const form = html.find('form')[0];
    const formData = new FormData(form);
    const selectedAttribute = formData.get('attribute');
    const focusType = formData.get('focus');
    const mentalStrain = formData.get('mental-strain') ? parseInt(formData.get('mental-strain-amount')) || 1 : 0;
    const physicalStrain = formData.get('physical-strain') ? parseInt(formData.get('physical-strain-amount')) || 1 : 0;
    
    // Calculate base target with selected attribute
    let attributeValue = 0;
    if (focusType) {
      attributeValue = this.actor.system.attributes[selectedAttribute].focus[focusType].value;
    } else {
      attributeValue = this.actor.system.attributes[selectedAttribute].value;
    }
    
    const baseTarget = (this.rollData.skillRank || 0) + attributeValue + mentalStrain + physicalStrain;
    
    // Close first dialog
    this.close();
    
    // Open second dialog
    const secondDialog = new BluePlanetModifiersDialog(this.actor, {
      ...this.rollData,
      selectedAttribute,
      focusType,
      mentalStrain,
      physicalStrain,
      baseTarget
    });
    secondDialog.render(true);
  }

  static _getFocusOptions(actor, currentAttribute) {
    console.log('BluePlanet Roll Dialog: Getting focus options for', currentAttribute);
    
    // Safe attribute access
    const attributes = actor.system?.attributes;
    if (!attributes || !currentAttribute || !attributes[currentAttribute]) {
      console.log('BluePlanet Roll Dialog: No attributes or invalid attribute:', currentAttribute);
      return '';
    }
    
    const attr = attributes[currentAttribute];
    if (!attr.focus) {
      console.log('BluePlanet Roll Dialog: No focus found for attribute:', currentAttribute);
      return '';
    }
    
    let options = '';
    try {
      if (attr.focus.primary && attr.focus.primary.name) {
        options += `<option value="primary">${attr.focus.primary.name} (${attr.focus.primary.value || 0})</option>`;
      }
      if (attr.focus.secondary && attr.focus.secondary.name) {
        options += `<option value="secondary">${attr.focus.secondary.name} (${attr.focus.secondary.value || 0})</option>`;
      }
    } catch (error) {
      console.error('BluePlanet Roll Dialog: Error creating focus options:', error);
      return '';
    }
    
    console.log('BluePlanet Roll Dialog: Focus options created:', options);
    return options;
  }

  /** @override */
  render(force, options) {
    const result = super.render(force, options);
    
    // Force size after render with a slight delay to ensure DOM is ready
    setTimeout(() => {
      this.position.width = 330;
      this.position.height = 300;
      
      if (this.element && this.element.length) {
        // Direct style setting
        this.element[0].style.width = '330px';
        this.element[0].style.height = '300px';
        this.element[0].style.maxWidth = '330px';
        this.element[0].style.maxHeight = '300px';
        this.element[0].style.minWidth = '330px';
        this.element[0].style.minHeight = '300px';
        this.element[0].style.resize = 'none';
        
        // Also use jQuery as backup
        this.element.css({
          'width': '330px !important',
          'height': '300px !important',
          'max-width': '330px !important',
          'max-height': '300px !important',
          'min-width': '330px !important',
          'min-height': '300px !important',
          'resize': 'none !important'
        });
        
        console.log('Blue Planet: Forced dialog size to 330x300');
        
        // Inject aggressive CSS to override any conflicting styles
        const styleId = 'blue-planet-dialog-force-' + this.id;
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            .application.dialog.blue-planet-recontact.sheet[data-appid="${this.appId}"] {
              width: 330px !important;
              height: 300px !important;
              max-width: 330px !important;
              max-height: 300px !important;
              min-width: 330px !important;
              min-height: 300px !important;
              resize: none !important;
            }
          `;
          document.head.appendChild(style);
        }
      }
    }, 50);
    
    return result;
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
    
    // Update attribute display when attribute changes
    html.find('#attribute-select').change(() => {
      this._updateAttributeDisplay(html);
      this._updateFocusOptions(html);
    });
    
    html.find('#focus-select').change(() => {
      this._updateAttributeDisplay(html);
    });
    
    // Initialize displays
    this._updateAttributeDisplay(html);
  }
  
  /**
   * Update attribute display in section 1
   * @param {jQuery} html The dialog HTML
   * @private
   */
  _updateAttributeDisplay(html) {
    console.log('BluePlanet Roll Dialog: Updating attribute display');
    
    try {
      const selectedAttribute = html.find('#attribute-select').val();
      const focusType = html.find('#focus-select').val();
      
      let attributeValue = 0;
      let attributeText = '';
      
      const attributes = this.actor.system?.attributes || {};
      const attribute = attributes[selectedAttribute];
      
      if (!attribute) {
        console.warn('BluePlanet Roll Dialog: No attribute found for:', selectedAttribute);
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
      
      const skillRank = this.rollData.skillRank || 0;
      const baseTotal = skillRank + attributeValue;
      html.find('#base-total').text(baseTotal);
      
      console.log('BluePlanet Roll Dialog: Display updated', { attributeText, baseTotal });
    } catch (error) {
      console.error('BluePlanet Roll Dialog: Error updating display:', error);
    }
  }
  
  /**
   * Update focus options when attribute changes
   * @param {jQuery} html The dialog HTML
   * @private
   */
  _updateFocusOptions(html) {
    console.log('BluePlanet Roll Dialog: Updating focus options');
    
    try {
      const selectedAttribute = html.find('#attribute-select').val();
      const focusSelect = html.find('#focus-select');
      
      let focusOptions = '';
      try {
        focusOptions = BluePlanetRollDialog._getFocusOptions(this.actor, selectedAttribute);
      } catch (error) {
        console.error('BluePlanet Roll Dialog: Error getting focus options:', error);
        focusOptions = '';
      }
      
      focusSelect.html('<option value="">No Focus</option>' + focusOptions);
      console.log('BluePlanet Roll Dialog: Focus options updated');
    } catch (error) {
      console.error('BluePlanet Roll Dialog: Error updating focus options:', error);
    }
  }
}

/**
 * Blue Planet Modifiers Dialog - Second Dialog (Modifiers and Roll)
 * Equipment, biomods, and situational modifiers
 */
export class BluePlanetModifiersDialog extends Dialog {
  
  constructor(actor, rollData, options = {}) {
    const dialogData = {
      title: `Roll Modifiers`,
      content: BluePlanetModifiersDialog._createModifiersDialogContent(actor, rollData),
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d10"></i>',
          label: "Roll",
          callback: html => BluePlanetModifiersDialog._onRoll(actor, rollData, html)
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => {}
        }
      },
      default: "roll",
      close: () => {},
      render: true
    };

    super(dialogData, foundry.utils.mergeObject(options, {
      classes: ["blue-planet-recontact", "sheet", "dialog"],
      width: 330,
      height: 300,
      resizable: false,
      minimizable: false
    }));
    this.actor = actor;
    this.rollData = rollData;
  }
  
  static _createModifiersDialogContent(actor, rollData) {
    return `
      <form class="blue-planet-roll-dialog flexcol">
        <div class="sheet-header">
          <div class="header-content">
            <div class="name-section">
              <h1 class="character-name">Final Target: <span id="final-target">${rollData.baseTarget}</span></h1>
              <div class="character-concept">Base: ${rollData.skillRank || 0} + ${rollData.selectedAttribute}${rollData.focusType ? ' (Focus)' : ''} + Strain = ${rollData.baseTarget}</div>
            </div>
          </div>
        </div>

        <div class="sheet-main">
          <section class="main-content">
            <div class="equipment-section">
              <h3>Equipment & Biomods</h3>
              <div class="equipment-list">
                ${BluePlanetModifiersDialog._getEquipmentMods(actor, rollData)}
              </div>
            </div>
            
            <div class="modifiers-section">
              <h3>Modifiers</h3>
              <div style="display: flex; gap: 6px;">
                <div class="form-group" style="flex: 1; margin-bottom: 4px;">
                  <label>Difficulty:</label>
                  <select name="difficulty">
                    <option value="0">Normal (0)</option>
                    <option value="-4">Easy (+4)</option>
                    <option value="-2">Simple (+2)</option>
                    <option value="2">Hard (-2)</option>
                    <option value="4">Extreme (-4)</option>
                    <option value="6">Legendary (-6)</option>
                  </select>
                </div>
                <div class="form-group" style="flex: 1; margin-bottom: 4px;">
                  <label>Environmental:</label>
                  <input type="number" name="environmental" value="0" min="-10" max="10" placeholder="-2">
                </div>
                <div class="form-group" style="flex: 1; margin-bottom: 4px;">
                  <label>Other:</label>
                  <input type="number" name="other" value="0" min="-10" max="10" placeholder="+1">
                </div>
              </div>
            </div>
            
            <div class="roll-options-section">
              <h3>Roll Options</h3>
              <div class="form-group">
                <label>
                  <input type="checkbox" name="pushing">
                  Push the Roll (reroll once, complications on 1s)
                </label>
              </div>
            </div>
          </section>
        </div>
      </form>
    `;
  }

  /** @override */
  render(force, options) {
    const result = super.render(force, options);
    
    // Force size after render with a slight delay to ensure DOM is ready
    setTimeout(() => {
      this.position.width = 330;
      this.position.height = 300;
      
      if (this.element && this.element.length) {
        // Direct style setting
        this.element[0].style.width = '330px';
        this.element[0].style.height = '300px';
        this.element[0].style.maxWidth = '330px';
        this.element[0].style.maxHeight = '300px';
        this.element[0].style.minWidth = '330px';
        this.element[0].style.minHeight = '300px';
        this.element[0].style.resize = 'none';
        
        // Also use jQuery as backup
        this.element.css({
          'width': '330px !important',
          'height': '300px !important',
          'max-width': '330px !important',
          'max-height': '300px !important',
          'min-width': '330px !important',
          'min-height': '300px !important',
          'resize': 'none !important'
        });
        
        console.log('Blue Planet: Forced modifiers dialog size to 330x300');
        
        // Inject aggressive CSS to override any conflicting styles
        const styleId = 'blue-planet-dialog-force-' + this.id;
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            .application.dialog.blue-planet-recontact.sheet[data-appid="${this.appId}"] {
              width: 330px !important;
              height: 300px !important;
              max-width: 330px !important;
              max-height: 300px !important;
              min-width: 330px !important;
              min-height: 300px !important;
              resize: none !important;
            }
          `;
          document.head.appendChild(style);
        }
      }
    }, 50);
    
    return result;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Update target number when modifiers change
    html.find('select[name="difficulty"], input[name="environmental"], input[name="other"], input[name="equipment"]').change(() => {
      this._updateFinalTarget(html);
    });
    
    // Initialize display
    this._updateFinalTarget(html);
  }
  
  /**
   * Update final target number display
   * @param {jQuery} html The dialog HTML
   * @private
   */
  _updateFinalTarget(html) {
    let finalTarget = this.rollData.baseTarget;
    
    // Add equipment bonuses
    html.find('input[name="equipment"]:checked').each(function() {
      finalTarget += parseInt(this.value) || 0;
    });
    
    // Add situational modifiers
    const difficulty = parseInt(html.find('select[name="difficulty"]').val()) || 0;
    const environmental = parseInt(html.find('input[name="environmental"]').val()) || 0;
    const other = parseInt(html.find('input[name="other"]').val()) || 0;
    
    finalTarget += environmental + other - difficulty; // Difficulty is subtracted
    
    html.find('#final-target').text(finalTarget);
  }

  static _getEquipmentMods(actor, rollData) {
    const items = actor.items.filter(i => ['weapon', 'equipment', 'biomod'].includes(i.type));
    if (items.length === 0) return '<p class="no-equipment">No equipment or biomods available</p>';
    
    let html = '';
    items.forEach(item => {
      const bonus = item.system.bonus || 0;
      if (bonus !== 0) {
        html += `
          <div class="equipment-item">
            <label>
              <input type="checkbox" name="equipment" value="${bonus}" data-item="${item.id}">
              ${item.name} (${bonus > 0 ? '+' : ''}${bonus})
            </label>
          </div>
        `;
      }
    });
    
    return html || '<p class="no-equipment">No equipment bonuses available</p>';
  }

  static async _onRoll(actor, rollData, html) {
    const form = html.find('form')[0];
    const formData = new FormData(form);
    
    // Calculate total modifiers
    let totalMod = 0;
    let modifierText = [];
    
    // Base calculation 
    let baseValue = rollData.baseTarget;
    
    // Add equipment bonuses
    html.find('input[name="equipment"]:checked').each(function() {
      const bonus = parseInt(this.value) || 0;
      const itemName = actor.items.get(this.dataset.item)?.name || 'Equipment';
      totalMod += bonus;
      modifierText.push(`${itemName} (${bonus > 0 ? '+' : ''}${bonus})`);
    });
    
    // Add situational modifiers
    const difficulty = parseInt(formData.get('difficulty')) || 0;
    const environmental = parseInt(formData.get('environmental')) || 0;
    const other = parseInt(formData.get('other')) || 0;
    
    totalMod += environmental + other - difficulty; // Difficulty is subtracted
    
    if (difficulty !== 0) {
      const diffNames = {'-4': 'Easy', '-2': 'Simple', '2': 'Hard', '4': 'Extreme', '6': 'Legendary'};
      modifierText.push(`${diffNames[difficulty]} (${difficulty > 0 ? '-' : '+'}${Math.abs(difficulty)})`);
    }
    if (environmental !== 0) modifierText.push(`Environmental (${environmental > 0 ? '+' : ''}${environmental})`);
    if (other !== 0) modifierText.push(`Other (${other > 0 ? '+' : ''}${other})`);
    
    const finalTarget = baseValue + totalMod;
    const pushing = formData.get('pushing');
    
    // Apply strain if used
    if (rollData.mentalStrain > 0) {
      const newMentalStrain = (actor.system.strain.mental.value || 0) + rollData.mentalStrain;
      await actor.update({'system.strain.mental.value': Math.min(newMentalStrain, 4)});
    }
    if (rollData.physicalStrain > 0) {
      const newPhysicalStrain = (actor.system.strain.physical.value || 0) + rollData.physicalStrain;
      await actor.update({'system.strain.physical.value': Math.min(newPhysicalStrain, 6)});
    }
    
    // Create the roll using the dice formula from rollData
    const diceFormula = rollData.dice || '1d10';
    console.log(`Rolling with formula: ${diceFormula}`);
    const roll = new Roll(diceFormula);
    await roll.evaluate();
    console.log(`Roll result: ${roll.total} (formula: ${diceFormula})`);
    
    // Calculate success/failure
    const actionValue = finalTarget - roll.total;
    const success = roll.total <= finalTarget;
    
    // Create flavor text
    let flavorText = `<h3>${rollData.label}</h3>`;
    flavorText += `<p><strong>Dice:</strong> ${diceFormula} ${rollData.levelType ? `(${rollData.levelType} level)` : ''}</p>`;
    flavorText += `<p><strong>Base:</strong> ${rollData.selectedAttribute.charAt(0).toUpperCase() + rollData.selectedAttribute.slice(1)}`;
    if (rollData.skillName) flavorText += ` + ${rollData.skillName} ${rollData.skillRank}`;
    if (rollData.mentalStrain > 0) flavorText += ` + Mental Strain ${rollData.mentalStrain}`;
    if (rollData.physicalStrain > 0) flavorText += ` + Physical Strain ${rollData.physicalStrain}`;
    flavorText += ` = ${rollData.baseTarget}</p>`;
    
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
}
