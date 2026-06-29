// Note: chat-utils import removed as automatic scrolling is disabled

/**
 * Import the enhanced roll message function from actor.js
 * This ensures consistent roll messaging across all sheet types
 */
import { createBluePlanetRollMessage } from "./actor.js";

/**
 * Extend the basic ActorSheet for Blue Planet creatures
 * @extends {foundry.appv1.sheets.ActorSheet}
 */
export class BluePlanetCreatureSheet extends foundry.appv1.sheets.ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "actor", "creature"],
      template: "systems/blue-planet-recontact/templates/actor/actor-creature-sheet.hbs",
      width: 800,
      height: 650,
      resizable: true,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "biology"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  get template() {
    return "systems/blue-planet-recontact/templates/actor/actor-creature-sheet.hbs";
  }

  /** @override */
  async getData(options) {
    // Retrieve the data structure from the base sheet.
    const context = super.getData(options);

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare creature-specific data
    this._prepareCreatureData(context);

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = this.actor.effects.map(e => foundry.utils.deepClone(e));

    return context;
  }

  /**
   * Organize and prepare creature-specific data
   *
   * @param {Object} context The actor context to prepare.
   */
  _prepareCreatureData(context) {
    // Handle creature attributes
    if (context.system.attributes) {
      for (let [key, attribute] of Object.entries(context.system.attributes)) {
        // Ensure attribute exists and is an object before setting properties
        if (attribute && typeof attribute === 'object') {
          attribute.label = key.charAt(0).toUpperCase() + key.slice(1);
        }
      }
    }

    // Prepare threat level options
    context.threatLevels = [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ];

    // Prepare resource value options
    context.resourceValues = [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ];

    // Format size display
    if (context.system.biology) {
      const bio = context.system.biology;
      if (bio.size) {
        bio.sizeDisplay = `${bio.size.length || 0}m / ${bio.size.mass || 0}kg`;
      }
    }

    // Prepare attack information
    if (context.system.attack) {
      const attack = context.system.attack;
      
      // Determine if creature has venom
      context.hasVenom = attack.venom && (attack.venom.effect || attack.venom.damage > 0);
      
      // Format attack display
      if (attack.type && attack.damage) {
        context.attackDisplay = `${attack.type} (Damage ${attack.damage})`;
      }
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Attribute rolls
    html.find('.attribute-roll').click(this._onAttributeRoll.bind(this));

    // Skill rolls
    html.find('.skill-roll').click(this._onSkillRoll.bind(this));

    // Attack rolls
    html.find('.attack-roll').click(this._onAttackRoll.bind(this));

    // Damage rolls
    html.find('.damage-roll').click(this._onDamageRoll.bind(this));
    
    // Strain recovery functionality (for intelligent creatures)
    html.find('.strain-recover').click(this._onStrainRecover.bind(this));
    html.find('.strain-recover-all').click(this._onStrainRecoverAll.bind(this));
    
    // Wound tracking functionality
    html.find('.wound-pip').click(this._onWoundClick.bind(this));
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[${dataset.label}]` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode')
  });
      return roll;
    }
  }

  /**
   * Handle attribute rolls for creatures
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttributeRoll(event) {
    event.preventDefault();
    const attributeName = event.currentTarget.dataset.attribute;
    const focusType = event.currentTarget.dataset.focus || null;
    
    // Creatures use simplified attribute tests
    const attribute = this.actor.system.attributes[attributeName];
    
    if (!attribute) {
      ui.notifications.warn(`Invalid attribute: ${attributeName}`);
      return null;
    }

    // Prepare roll data for enhanced dialog
    const rollData = {
      label: `${this.actor.name} - ${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Test`,
      type: 'attribute',
      attributeName: attributeName,
      attributeValue: attribute.value || 0,
      dice: '1d10', // Creatures use 1d10 for attributes
      levelType: 'general',
      targetNumber: 10
    };
    
    // Add focus type if specified
    if (focusType) {
      rollData.focusType = focusType;
    }
    
    console.log(`BluePlanet Creature Sheet Attribute Roll - ${this.actor.name} - ${attributeName}:`);
    console.log(`  - Attribute Value: ${attribute.value}`);
    console.log(`  - Dice Formula: 1d10`);
    
    // Open the enhanced strain roll dialog
    console.log('BluePlanet Creature Sheet: Opening enhanced strain roll dialog');
    try {
      const { showEnhancedBluePlanetRollDialog } = await import('../enhanced-roll-dialog.js');
      showEnhancedBluePlanetRollDialog(this.actor, rollData);
    } catch (error) {
      console.error('BluePlanet Creature Sheet: Error opening enhanced attribute roll dialog:', error);
      
      // Fallback to basic roll
      const targetNumber = 5 + attribute.value;
      const roll = new Roll("1d10", this.actor.getRollData());
      await roll.evaluate();
      
      const success = roll.total <= targetNumber;
      const actionValue = targetNumber - roll.total;
      
      const fallbackRollData = { success, actionValue, targetNumber };
      const rollOptions = {
        flavor: `${this.actor.name} - ${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Test`,
        rollMode: game.settings.get("core", "rollMode")
      };
      
      await createBluePlanetRollMessage(roll, fallbackRollData, this.actor, "attribute", rollOptions);
      return { roll, success, actionValue, targetNumber };
    }
  }

  /**
   * Handle skill rolls for creatures
   * @param {Event} event   The originating click event
   * @private
   */
  async _onSkillRoll(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const skillId = dataset.skill;
    
    // Find skill from system.skills or from items
    let skill = null;
    let skillData = null;
    
    // First check system skills (built-in skills)
    if (this.actor.system.skills && this.actor.system.skills[skillId]) {
      skillData = this.actor.system.skills[skillId];
      skill = {
        name: skillData.label || skillId,
        system: {
          rank: skillData.rank || 1,
          level_type: skillData.level_type || 'general',
          attribute: skillData.attribute || 'cognition'
        }
      };
    } else {
      // Check for skill items
      skill = this.actor.items.find(i => i.type === 'skill' && i.id === skillId);
    }
    
    if (!skill) {
      ui.notifications.warn(`Skill not found: ${skillId}`);
      return;
    }
    
    // Prepare roll data
    const levelType = skill.system.level_type || 'general';
    const attribute = skill.system.attribute || 'cognition';
    const diceFormula = this._getDiceFormula(levelType);
    
    console.log(`BluePlanet Creature Sheet Skill Roll - ${this.actor.name} - ${skill.name}:`);
    console.log(`  - Level Type: ${levelType}`);
    console.log(`  - Dice Formula: ${diceFormula}`);
    console.log(`  - Attribute: ${attribute}`);
    
    const rollData = {
      label: `${skill.name} (${this._getLevelLabel(levelType)})`,
      type: 'skill',
      skillName: skill.name,
      skillRank: skill.system.rank || 1,
      attribute: attribute,
      attributeValue: this.actor.system.attributes[attribute]?.value || 0,
      dice: diceFormula,
      levelType: levelType,
      targetNumber: 10
    };
    
    // Open the enhanced strain roll dialog
    console.log('BluePlanet Creature Sheet: Opening enhanced strain roll dialog');
    try {
      const { showEnhancedBluePlanetRollDialog } = await import('../enhanced-roll-dialog.js');
      showEnhancedBluePlanetRollDialog(this.actor, rollData);
    } catch (error) {
      console.error('BluePlanet Creature Sheet: Error opening enhanced skill roll dialog:', error);
      ui.notifications.error('Error opening skill roll dialog. Check console for details.');
    }
  }

  /**
   * Get dice formula for skill level type
   * @param {string} levelType - The skill level type
   * @returns {string} - The dice formula
   * @private
   */
  _getDiceFormula(levelType) {
    switch (levelType) {
      case 'specialty': return '3d10kl';
      case 'core': return '2d10kl';
      default: return '1d10';
    }
  }

  /**
   * Get level label for skill level type
   * @param {string} levelType - The skill level type
   * @returns {string} - The level label
   * @private
   */
  _getLevelLabel(levelType) {
    switch (levelType) {
      case 'specialty': return 'Specialty';
      case 'core': return 'Core';
      default: return 'General';
    }
  }

  /**
   * Handle attack rolls for creatures
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttackRoll(event) {
    event.preventDefault();
    
    const attack = this.actor.system.attack;
    if (!attack || !attack.damage) {
      ui.notifications.warn("This creature has no defined attack");
      return null;
    }

    // Roll damage test directly
    return this._onDamageRoll(event, attack.damage);
  }

  /**
   * Handle damage rolls
   * @param {Event} event   The originating click event
   * @param {number} damageRating   Optional damage rating override
   * @private
   */
  async _onDamageRoll(event, damageRating = null) {
    event.preventDefault();
    
    const rating = damageRating || parseInt(event.currentTarget.dataset.damage) || this.actor.system.attack?.damage || 0;
    
    if (rating <= 0) {
      ui.notifications.warn("No damage rating specified");
      return null;
    }

    const roll = new Roll("3d10", this.actor.getRollData());
    await roll.evaluate();
    
    // Count successes (dice that roll <= damage rating)
    let successes = 0;
    for (const die of roll.dice[0].results) {
      if (die.result <= rating) successes++;
    }
    
    let woundLevel = "No Effect";
    if (successes === 1) woundLevel = "Minor Wound";
    else if (successes === 2) woundLevel = "Major Wound";
    else if (successes === 3) woundLevel = "Mortal Wound";

    // Add venom information if present
    let venomInfo = "";
    const attack = this.actor.system.attack;
    if (attack?.venom && (attack.venom.effect || attack.venom.damage > 0)) {
      venomInfo = `<br><em style="color: #8b0000">🐍 Venom: ${attack.venom.effect || "Toxic"} (${attack.venom.onset || "Immediate"}, Damage ${attack.venom.damage || 0})</em>`;
    }
    
    // Create enhanced roll message
    const rollData = {
      successes: successes,
      woundLevel: woundLevel,
      damageRating: rating,
      success: successes > 0,
      actionValue: null,
      targetNumber: rating
    };
    
    const rollOptions = {
      flavor: `${this.actor.name} Attack${venomInfo}`,
      rollMode: game.settings.get("core", "rollMode")
    };
    
    await createBluePlanetRollMessage(roll, rollData, this.actor, "damage", rollOptions);
    
    return { roll, successes, woundLevel, damageRating: rating };
  }
  
  /**
   * Handle strain recovery (partial) for intelligent creatures
   * @param {Event} event   The originating click event
   * @private
   */
  async _onStrainRecover(event) {
    event.preventDefault();
    
    // Check if this creature has strain
    if (!this.actor.system.strain) {
      ui.notifications.warn("This creature does not have strain points.");
      return;
    }
    
    // Import strain mechanics
    const { recoverFromStrain } = await import('../strain-mechanics-fixed.js');
    
    // Show recovery dialog
    const dialog = new Dialog({
      title: "Strain Recovery",
      content: `
        <div class="blue-planet-strain-dialog">
          <p>Recover strain and attribute damage through rest and recovery.</p>
          <p><em>Note:</em> This requires adequate rest, shelter, food, and medical attention as determined by the GM.</p>
          <hr>
          <div class="form-group">
            <label>Mental Strain to Recover:</label>
            <input type="number" name="mental-strain" min="0" max="${this.actor.system.strain?.mental?.value || 0}" value="${Math.min(2, this.actor.system.strain?.mental?.value || 0)}" style="width: 60px;">
            <span style="font-size: 11px; color: #aaa;">/ ${this.actor.system.strain?.mental?.value || 0}</span>
          </div>
          <div class="form-group">
            <label>Physical Strain to Recover:</label>
            <input type="number" name="physical-strain" min="0" max="${this.actor.system.strain?.physical?.value || 0}" value="${Math.min(2, this.actor.system.strain?.physical?.value || 0)}" style="width: 60px;">
            <span style="font-size: 11px; color: #aaa;">/ ${this.actor.system.strain?.physical?.value || 0}</span>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="recover-attributes" checked> Recover attribute damage
            </label>
          </div>
        </div>
      `,
      buttons: {
        recover: {
          label: "Recover",
          callback: async (html) => {
            const mentalAmount = parseInt(html.find('[name="mental-strain"]').val()) || 0;
            const physicalAmount = parseInt(html.find('[name="physical-strain"]').val()) || 0;
            const recoverAttributes = html.find('[name="recover-attributes"]').prop('checked');
            
            // Custom recovery amounts
            const currentMental = this.actor.system.strain?.mental?.value || 0;
            const currentPhysical = this.actor.system.strain?.physical?.value || 0;
            
            const updates = {};
            if (mentalAmount > 0) {
              updates[`system.strain.mental.value`] = Math.max(0, currentMental - mentalAmount);
            }
            if (physicalAmount > 0) {
              updates[`system.strain.physical.value`] = Math.max(0, currentPhysical - physicalAmount);
            }
            
            if (Object.keys(updates).length > 0) {
              await this.actor.update(updates);
            }
            
            if (recoverAttributes) {
              await recoverFromStrain(this.actor, {
                recoverStrain: false, // We already handled strain above
                recoverAttributes: true,
                attributeAmount: 'full'
              });
            }
            
            const messages = [];
            if (mentalAmount > 0) messages.push(`${mentalAmount} mental strain`);
            if (physicalAmount > 0) messages.push(`${physicalAmount} physical strain`);
            if (recoverAttributes) messages.push('attribute damage');
            
            if (messages.length > 0) {
              ui.notifications.info(`Recovered: ${messages.join(', ')}`);
            }
          }
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "recover"
    });
    
    dialog.render(true);
  }

  /**
   * Handle full strain recovery for intelligent creatures
   * @param {Event} event   The originating click event
   * @private
   */
  async _onStrainRecoverAll(event) {
    event.preventDefault();
    
    // Check if this creature has strain
    if (!this.actor.system.strain) {
      ui.notifications.warn("This creature does not have strain points.");
      return;
    }
    
    const confirmed = await Dialog.confirm({
      title: "Full Recovery",
      content: `
        <p><strong>Recover all strain and attribute damage?</strong></p>
        <p>This represents extended rest with proper shelter, food, medical care, and recovery time.</p>
        <p>This should typically only be allowed by the GM after appropriate in-game time and circumstances.</p>
      `
    });
    
    if (!confirmed) return;
    
    // Import strain mechanics
    const { recoverFromStrain } = await import('../strain-mechanics-fixed.js');
    
    await recoverFromStrain(this.actor, {
      recoverStrain: true,
      recoverAttributes: true,
      strainAmount: 'full',
      attributeAmount: 'full'
    });
  }
  
  /**
   * Handle wound pip clicks to track creature injuries
   * @param {Event} event   The originating click event
   * @private
   */
  async _onWoundClick(event) {
    event.preventDefault();
    const element = $(event.currentTarget);
    const woundType = element.data('type');
    const value = parseInt(element.data('value'));
    
    if (!woundType || !value) {
      console.warn('BluePlanet Creature: Invalid wound data', { woundType, value });
      return;
    }
    
    // Get current wound values, ensuring they exist
    const currentWounds = {
      minor: this.actor.system.wounds?.minor || 0,
      major: this.actor.system.wounds?.major || 0,
      mortal: this.actor.system.wounds?.mortal || 0
    };
    
    const currentValue = currentWounds[woundType];
    
    // Determine new value: if clicking on current level, decrease by 1; otherwise set to clicked value
    let newValue;
    if (currentValue === value) {
      newValue = Math.max(0, value - 1);
    } else {
      newValue = value;
    }
    
    // Update the actor with new wound value
    const updatePath = `system.wounds.${woundType}`;
    const updateData = {};
    updateData[updatePath] = newValue;
    
    try {
      await this.actor.update(updateData);
      
      // Provide user feedback
      const woundLabel = woundType.charAt(0).toUpperCase() + woundType.slice(1);
      if (newValue > currentValue) {
        ui.notifications.info(`${this.actor.name} sustained ${woundLabel} wound (${newValue})`);
      } else if (newValue < currentValue) {
        ui.notifications.info(`${this.actor.name} ${woundLabel} wound reduced to ${newValue}`);
      }
      
      console.log(`BluePlanet Creature: Updated ${woundType} wounds from ${currentValue} to ${newValue}`);
    } catch (error) {
      console.error('BluePlanet Creature: Error updating wounds:', error);
      ui.notifications.error('Failed to update creature wounds');
    }
  }
}
