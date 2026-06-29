// Note: chat-utils import removed as automatic scrolling is disabled

// Import strain mechanics for proper strain calculation
import { calculateMaxStrain } from '../strain-mechanics-fixed.js';

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
    
    // Apply mechanical effects from active biomods and equipped equipment
    this._applyItemMechanics(systemData);
    
    // Calculate wound penalties (after applying mechanics like pain inhibitors)
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
    // No focus attributes for creatures, but they can have strain and wounds
    
    // Calculate wound penalties if wounds exist
    this._calculateWoundPenalties(systemData);
    
    // Calculate total wound penalty for display
    if (systemData.wounds) {
      const wounds = systemData.wounds;
      systemData.totalWoundPenalty = (wounds.minor * 1) + (wounds.major * 2) + (wounds.mortal * 3);
    }
  }

  /**
   * Calculate strain points based on Psyche and Physique attributes
   * According to Blue Planet official rules table
   */
  _calculateStrain(systemData) {
    if (!systemData.strain || !systemData.attributes) return;

    const psycheValue = systemData.attributes.psyche?.value || 0;
    const physiqueValue = systemData.attributes.physique?.value || 0;
    
    // Calculate max strain based on attributes using Blue Planet official table
    const maxMentalStrain = calculateMaxStrain(psycheValue);
    const maxPhysicalStrain = calculateMaxStrain(physiqueValue);
    
    // Update max values
    systemData.strain.mental.max = maxMentalStrain;
    systemData.strain.physical.max = maxPhysicalStrain;
    
    // Ensure current values don't exceed max
    if (systemData.strain.mental.value > maxMentalStrain) {
      systemData.strain.mental.value = maxMentalStrain;
    }
    if (systemData.strain.physical.value > maxPhysicalStrain) {
      systemData.strain.physical.value = maxPhysicalStrain;
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
   * Aggregate and apply mechanics from active biomods and equipped equipment
   * Stores results in system.calculated for downstream use
   */
  _applyItemMechanics(systemData) {
    const items = this.items ?? [];

    const attributeMods = { cognition: 0, psyche: 0, coordination: 0, physique: 0 };
    let initiativeBonus = 0;
    let woundPenaltyReductionMajor = 0;
    let woundPenaltyReductionMortal = 0;
    let naturalArmor = 0;
    let unarmedDamageBonus = 0;
    let strainMentalMod = 0;
    let strainPhysicalMod = 0;

    for (const it of items) {
      const t = it.type;
      const s = it.system || {};

      // Only apply when the item is active/equipped as appropriate
      const isActiveBiomod = (t === 'biomod') && (s.active === true);
      const isActiveCyberware = (t === 'cyberware') && (s.active === true);
      const isEquippedEquip = (t === 'equipment') && (s.equipped === true);
      if (!isActiveBiomod && !isActiveCyberware && !isEquippedEquip) continue;

      // Attribute bonuses (biomod and cyberware)
      if ((t === 'biomod' || t === 'cyberware') && s.attributes) {
        attributeMods.cognition += Number(s.attributes.cognition || 0);
        attributeMods.psyche += Number(s.attributes.psyche || 0);
        attributeMods.coordination += Number(s.attributes.coordination || 0);
        attributeMods.physique += Number(s.attributes.physique || 0);
      }

      // Strain modifiers (biomod and cyberware)
      if ((t === 'biomod' || t === 'cyberware') && s.strain_modifiers) {
        strainMentalMod += Number(s.strain_modifiers.mental || 0);
        strainPhysicalMod += Number(s.strain_modifiers.physical || 0);
      }

      // Generic mechanics (both biomod and equipment)
      const mech = s.mechanics || {};
      initiativeBonus += Number(mech.initiative_bonus || 0);
      naturalArmor += Number(mech.natural_armor || 0);
      unarmedDamageBonus += Number(mech.unarmed_damage_bonus || 0);
      const wpr = mech.wound_penalty_reduction || {};
      woundPenaltyReductionMajor += Number(wpr.major || 0);
      woundPenaltyReductionMortal += Number(wpr.mortal || 0);
    }

    // Expose calculated values on actor system for use in rolls/UI
    systemData.calculated = systemData.calculated || {};
    systemData.calculated.attributeMods = attributeMods;
    systemData.calculated.mechanics = {
      initiativeBonus,
      naturalArmor,
      unarmedDamageBonus,
      woundPenaltyReductionMajor,
      woundPenaltyReductionMortal
    };

    // Apply strain capacity modifiers, if present
    if (systemData.strain) {
      systemData.strain.mental.max = Math.max(0, (systemData.strain.mental.max || 0) + strainMentalMod);
      systemData.strain.physical.max = Math.max(0, (systemData.strain.physical.max || 0) + strainPhysicalMod);
      // Ensure current values don't exceed new max
      systemData.strain.mental.value = Math.min(systemData.strain.mental.value || 0, systemData.strain.mental.max || 0);
      systemData.strain.physical.value = Math.min(systemData.strain.physical.value || 0, systemData.strain.physical.max || 0);
    }
  }

  /**
   * Calculate wound penalties
   */
  _calculateWoundPenalties(systemData) {
    if (!systemData.wounds) return;

    const wounds = systemData.wounds;
    let penalty = -(wounds.minor * 1) - (wounds.major * 2) - (wounds.mortal * 3);

    // Reduce penalties if mechanics specify reductions (e.g., Pain Inhibitor)
    const mech = systemData.calculated?.mechanics || {};
    if (wounds.major > 0 && (mech.woundPenaltyReductionMajor || 0) > 0) {
      penalty = Math.min(0, penalty + mech.woundPenaltyReductionMajor);
    }
    if (wounds.mortal > 0 && (mech.woundPenaltyReductionMortal || 0) > 0) {
      penalty = Math.min(0, penalty + mech.woundPenaltyReductionMortal);
    }

    systemData.woundPenalty = penalty;
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

    // Calculate target number (wound penalty is negative, reduces target number)
    const attrMod = this.system?.calculated?.attributeMods?.[attributeName] || 0;
    const woundPenalty = this.system?.woundPenalty || 0; // negative value
    // Strain at max: -2 penalty to all rolls
    const mentalStrain = this.system?.strain?.mental;
    const physicalStrain = this.system?.strain?.physical;
    const strainPenalty = (
      (mentalStrain && mentalStrain.value >= mentalStrain.max && mentalStrain.max > 0 ? -2 : 0) +
      (physicalStrain && physicalStrain.value >= physicalStrain.max && physicalStrain.max > 0 ? -2 : 0)
    );
    const totalPenalty = woundPenalty + strainPenalty;
    const targetNumber = skill.rank + attribute.value + attrMod + totalPenalty;
    
    // Create the roll formula - keep lowest for skill tests
    const rollFormula = `{${diceCount}d10}kl`;
    
    const roll = new Roll(rollFormula, this.getRollData());
    await roll.evaluate();
    
    const success = roll.total <= targetNumber;
    const actionValue = targetNumber - roll.total;
    
    // Determine skill level for display
    const skillLevel = skill.specialty ? "Specialty" : (skill.core ? "Core" : "General");
    
    // Build penalty description for flavor
    let penaltyParts = [];
    if (woundPenalty < 0) penaltyParts.push(`Wounds ${woundPenalty}`);
    if (strainPenalty < 0) penaltyParts.push(`Strain ${strainPenalty}`);
    const penaltyText = penaltyParts.length ? ` [${penaltyParts.join(', ')}]` : '';
    
    // Create enhanced roll message
    const rollData = { success, actionValue, targetNumber };
    const rollOptions = {
      flavor: `${skillName} (${attributeName}) - ${skillLevel}${penaltyText}`,
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
    
    // Apply wound and strain penalties
    const woundPenalty = this.system?.woundPenalty || 0;
    const mentalStrain = this.system?.strain?.mental;
    const physicalStrain = this.system?.strain?.physical;
    const strainPenalty = (
      (mentalStrain && mentalStrain.value >= mentalStrain.max && mentalStrain.max > 0 ? -2 : 0) +
      (physicalStrain && physicalStrain.value >= physicalStrain.max && physicalStrain.max > 0 ? -2 : 0)
    );
    const totalPenalty = woundPenalty + strainPenalty;
    let penaltyParts = [];
    if (woundPenalty < 0) penaltyParts.push(`Wounds ${woundPenalty}`);
    if (strainPenalty < 0) penaltyParts.push(`Strain ${strainPenalty}`);
    const penaltyText = penaltyParts.length ? ` [${penaltyParts.join(', ')}]` : '';
    
    // Check if rolling a focus attribute
    if (options.useFocus && options.focusType && attribute.focus) {
      const focus = attribute.focus[options.focusType];
      if (focus && focus.name && focus.name.trim() !== '') {
        // Use focus attribute value (base + 1 if defined)
        targetNumber = 5 + focus.value + totalPenalty;
        flavorText = `${focus.name} (${attributeName.titleCase()}) Test - Target: ${targetNumber}${penaltyText}`;
      } else {
        ui.notifications.warn(`Focus attribute not defined for ${attributeName}`);
        return null;
      }
    } else {
      // Use base attribute value
      targetNumber = 5 + attribute.value + totalPenalty;
      flavorText = `${attributeName.titleCase()} Test - Target: ${targetNumber}${penaltyText}`;
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
    for (const die of roll.dice[0].results) {
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
