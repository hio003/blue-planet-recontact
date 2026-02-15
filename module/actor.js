// Note: chat-utils import removed as automatic scrolling is disabled

/**
 * Create an enhanced Blue Planet roll message with success/failure and mechanics
 * @param {Roll} roll - The evaluated roll
 * @param {Object} data - Roll data including success, actionValue, targetNumber, etc.
 * @param {Actor} actor - The actor making the roll
 * @param {string} rollType - Type of roll (skill, attribute, damage)
 * @param {Object} options - Additional options
 */
export async function createBluePlanetRollMessage(roll, data, actor, rollType, options = {}) {
  const { success, actionValue, targetNumber } = data;
  
  // Determine result category based on action value
  let resultCategory = "";
  let resultColor = "";
  
  if (rollType === "damage") {
    // Damage rolls are handled differently
    resultCategory = data.woundLevel;
    resultColor = data.successes >= 2 ? "#dc3545" : (data.successes === 1 ? "#fd7e14" : "#6c757d");
  } else {
    // Skill and attribute tests
    if (success) {
      if (actionValue >= 5) {
        resultCategory = "EXCEPTIONAL SUCCESS";
        resultColor = "#28a745"; // Green
      } else {
        resultCategory = "SUCCESS";
        resultColor = "#007bff"; // Blue
      }
    } else {
      if (actionValue <= -5) {
        resultCategory = "CRITICAL FAILURE";
        resultColor = "#dc3545"; // Red
      } else {
        resultCategory = "FAILURE";
        resultColor = "#6c757d"; // Gray
      }
    }
  }
  
  // Create detailed flavor text
  let flavorText = options.flavor || "";
  
  if (rollType !== "damage") {
    flavorText += `<br><strong style="color: ${resultColor}">${resultCategory}</strong>`;
    flavorText += `<br><small>Target: ${targetNumber} | Roll: ${roll.total} | Action Value: ${actionValue >= 0 ? '+' : ''}${actionValue}</small>`;
    
    // Add benefits, complications, consequences based on Blue Planet rules
    if (success && actionValue >= 5) {
      flavorText += `<br><em style="color: #28a745">🎯 Benefit: Earn +2 on next relevant test or narrative advantage</em>`;
    } else if (success && actionValue === 0) {
      flavorText += `<br><em style="color: #fd7e14">⚠️ Complication: Success with additional challenge</em>`;
    } else if (!success && actionValue <= -5) {
      flavorText += `<br><em style="color: #dc3545">💥 Consequence: -2 on next relevant test or narrative penalty</em>`;
    }
  } else {
    flavorText += `<br><strong style="color: ${resultColor}">${resultCategory}</strong>`;
    flavorText += `<br><small>Rating: ${data.damageRating} | Successes: ${data.successes}/3</small>`;
  }
  
  // Create enhanced message data
  const messageData = {
    speaker: ChatMessage.getSpeaker({actor: actor}),
    flavor: flavorText,
    rollMode: options.rollMode || game.settings.get("core", "rollMode"),
    sound: CONFIG.sounds.dice,
    flags: {
      "blue-planet-recontact": {
        rollType: rollType,
        success: success,
        actionValue: actionValue,
        targetNumber: targetNumber,
        resultCategory: resultCategory
      }
    }
  };
  
  return roll.toMessage(messageData);
}

/**
 * Extend the basic Actor document for Blue Planet
 * @extends {Actor}
 */
export class BluePlanetActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or active effects.
    const actorData = this;
    const systemData = actorData.system;

    // Make separate methods for each Actor type (character, npc, creature, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'npc') this._prepareCharacterData(actorData);
    if (actorData.type === 'cetacean') this._prepareCetaceanData(actorData);
    if (actorData.type === 'creature') this._prepareCreatureData(actorData);
  }

  /**
   * Prepare Character type specific data
   * This includes characters, NPCs, and cetaceans as they all use similar mechanics
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character' && actorData.type !== 'npc' && actorData.type !== 'cetacean') return;

    const systemData = actorData.system;

    // Calculate strain points based on attributes
    this._calculateStrain(systemData);
    
    // Update focus attributes
    this._updateFocusAttributes(systemData);
    
    // Calculate wound penalties
    this._calculateWoundPenalties(systemData);
  }

  /**
   * Prepare Cetacean type specific data
   */
  _prepareCetaceanData(actorData) {
    if (actorData.type !== 'cetacean') return;

    const systemData = actorData.system;

    // Cetaceans use the same base preparation as characters
    this._prepareCharacterData(actorData);
    
    // Add cetacean-specific calculations
    // Echolocation bonuses, diving capabilities, etc.
  }

  /**
   * Prepare Creature type specific data
   */
  _prepareCreatureData(actorData) {
    if (actorData.type !== 'creature') return;

    const systemData = actorData.system;

    // Creatures use simplified attributes (Awareness, Coordination, Physique)
    // No focus attributes or strain for creatures
  }

  /**
   * Calculate strain points - Fixed values for Blue Planet Recontact
   */
  _calculateStrain(systemData) {
    if (!systemData.strain) return;

    // Fixed strain points according to Blue Planet Recontact rules
    // Mental strain: 4 points
    systemData.strain.mental.max = 4;
    
    // Physical strain: 6 points
    systemData.strain.physical.max = 6;
    
    // Ensure current values don't exceed max
    if (systemData.strain.mental.value > systemData.strain.mental.max) {
      systemData.strain.mental.value = systemData.strain.mental.max;
    }
    if (systemData.strain.physical.value > systemData.strain.physical.max) {
      systemData.strain.physical.value = systemData.strain.physical.max;
    }
  }

  /**
   * Get strain points based on attribute rank
   */
  _getStrainPoints(rank) {
    if (rank <= 0) return 1;
    if (rank <= 2) return 2;
    if (rank <= 4) return 3;
    if (rank <= 8) return 4;
    if (rank <= 12) return 5;
    return 6;
  }

  /**
   * Update focus attributes - only apply +1 bonus when focus is explicitly defined
   * According to Blue Planet Recontact rules: "At character creation a focus attribute 
   * rank is always equal to its associated base attribute rank +1"
   * But this only applies when the focus attribute has been defined by the player.
   */
  _updateFocusAttributes(systemData) {
    for (let [key, attr] of Object.entries(systemData.attributes)) {
      if (attr.focus) {
        // Only apply +1 bonus if the focus attribute has been defined (has a name)
        if (attr.focus.primary && attr.focus.primary.name && attr.focus.primary.name.trim() !== '') {
          attr.focus.primary.value = attr.value + 1;
        } else {
          // If focus is not defined, it should equal the base attribute
          attr.focus.primary.value = attr.value;
        }
        
        if (attr.focus.secondary && attr.focus.secondary.name && attr.focus.secondary.name.trim() !== '') {
          attr.focus.secondary.value = attr.value + 1;
        } else {
          // If focus is not defined, it should equal the base attribute
          attr.focus.secondary.value = attr.value;
        }
      }
    }
  }

  /**
   * Calculate wound penalties
   */
  _calculateWoundPenalties(systemData) {
    if (!systemData.wounds) return;

    const wounds = systemData.wounds;
    systemData.woundPenalty = -(wounds.minor * 1) - (wounds.major * 2) - (wounds.mortal * 3);
  }

  /** @override */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags["blue-planet-recontact"] || {};

    // Make separate methods for each Actor type to keep things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'npc') this._prepareCharacterData(actorData);
    if (actorData.type === 'cetacean') this._prepareCetaceanData(actorData);
    if (actorData.type === 'creature') this._prepareCreatureData(actorData);
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getCreatureRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character' && this.type !== 'npc' && this.type !== 'cetacean') return;

    // Copy the attribute scores to the top level, so that rolls can use
    // formulas like `@cognition.value + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
  }

  /**
   * Prepare creature roll data.
   */
  _getCreatureRollData(data) {
    if (this.type !== 'creature') return;

    // Copy the simplified creature attributes
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
  }

  /**
   * Roll a skill test for this actor
   * @param {string} skillName - The name of the skill to roll
   * @param {string} attributeName - The attribute to use for the roll
   * @param {Object} options - Additional options for the roll
   */
  async rollSkill(skillName, attributeName, options = {}) {
    const skill = this.system.skills[skillName];
    const attribute = this.system.attributes[attributeName];
    
    if (!skill) {
      ui.notifications.warn(`Actor ${this.name} does not have skill: ${skillName}`);
      return null;
    }
    
    if (!attribute) {
      ui.notifications.warn(`Invalid attribute: ${attributeName}`);
      return null;
    }

    // Determine number of dice based on skill level
    let diceCount = 1; // General
    if (skill.core) diceCount = 2;
    if (skill.specialty) diceCount = 3;

    // Calculate target number
    const targetNumber = skill.rank + attribute.value;
    
    // Create the roll formula - keep lowest for skill tests
    const rollFormula = `{${diceCount}d10}kl`;
    
    const roll = new Roll(rollFormula, this.getRollData());
    await roll.evaluate();
    
    const success = roll.total <= targetNumber;
    const actionValue = targetNumber - roll.total;
    
    // Determine skill level for display
    const skillLevel = skill.specialty ? "Specialty" : (skill.core ? "Core" : "General");
    
    // Create enhanced roll message
    const rollData = { success, actionValue, targetNumber };
    const rollOptions = {
      flavor: `${skillName} (${attributeName}) - ${skillLevel}`,
      rollMode: options.rollMode
    };
    
    await createBluePlanetRollMessage(roll, rollData, this, "skill", rollOptions);
    
    return { roll, success, actionValue, targetNumber };
  }

  /**
   * Roll an attribute test for this actor
   * @param {string} attributeName - The attribute to test
   * @param {Object} options - Additional options for the roll
   */
  async rollAttribute(attributeName, options = {}) {
    const attribute = this.system.attributes[attributeName];
    
    if (!attribute) {
      ui.notifications.warn(`Invalid attribute: ${attributeName}`);
      return null;
    }

    let targetNumber, flavorText;
    
    // Check if rolling a focus attribute
    if (options.useFocus && options.focusType && attribute.focus) {
      const focus = attribute.focus[options.focusType];
      if (focus && focus.name && focus.name.trim() !== '') {
        // Use focus attribute value (base + 1 if defined)
        targetNumber = 5 + focus.value;
        flavorText = `${focus.name} (${attributeName.titleCase()}) Test - Target: ${targetNumber}`;
      } else {
        ui.notifications.warn(`Focus attribute not defined for ${attributeName}`);
        return null;
      }
    } else {
      // Use base attribute value
      targetNumber = 5 + attribute.value;
      flavorText = `${attributeName.titleCase()} Test - Target: ${targetNumber}`;
    }
    
    const roll = new Roll("1d10", this.getRollData());
    await roll.evaluate();
    
    const success = roll.total <= targetNumber;
    const actionValue = targetNumber - roll.total;
    
    // Create enhanced roll message
    const rollData = { success, actionValue, targetNumber };
    const rollOptions = {
      flavor: flavorText,
      rollMode: options.rollMode
    };
    
    await createBluePlanetRollMessage(roll, rollData, this, "attribute", rollOptions);
    
    return { roll, success, actionValue, targetNumber };
  }

  /**
   * Roll a damage test
   * @param {number} damageRating - The damage rating to test against
   * @param {Object} options - Additional options for the roll
   */
  async rollDamage(damageRating, options = {}) {
    const roll = new Roll("3d10", this.getRollData());
    await roll.evaluate();
    
    // Count successes (dice that roll <= damage rating)
    let successes = 0;
    for (const die of roll.terms[0].results) {
      if (die.result <= damageRating) successes++;
    }
    
    let woundLevel = "No Effect";
    if (successes === 1) woundLevel = "Minor Wound";
    else if (successes === 2) woundLevel = "Major Wound";
    else if (successes === 3) woundLevel = "Mortal Wound";
    
    // Create enhanced roll message
    const rollData = {
      successes: successes,
      woundLevel: woundLevel,
      damageRating: damageRating,
      success: successes > 0, // For consistency with other rolls
      actionValue: null, // Not applicable for damage rolls
      targetNumber: damageRating
    };
    
    const rollOptions = {
      flavor: `Damage Test`,
      rollMode: options.rollMode
    };
    
    await createBluePlanetRollMessage(roll, rollData, this, "damage", rollOptions);
    
    return { roll, successes, woundLevel, damageRating };
  }
}
