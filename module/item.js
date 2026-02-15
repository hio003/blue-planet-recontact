/**
 * Blue Planet Item Document
 * Extend the base Item document to support Blue Planet specific functionality
 */
export class BluePlanetItem extends Item {

  /** @override */
  prepareData() {
    // Prepare data for the item - this is called when the item is created or updated
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Prepare base data that doesn't depend on other items or actors
    super.prepareBaseData();
  }

  /** @override */
  prepareDerivedData() {
    // Prepare derived data that depends on other items or actors
    super.prepareDerivedData();
    
    const itemData = this;
    const systemData = itemData.system;

    // Add item-specific derived data calculations
    switch (itemData.type) {
      case 'weapon':
        this._prepareWeaponData(systemData);
        break;
      case 'equipment':
        this._prepareEquipmentData(systemData);
        break;
      case 'biomod':
        this._prepareBiomodData(systemData);
        break;
      case 'skill':
        this._prepareSkillData(systemData);
        break;
      case 'ammo_type':
        this._prepareAmmoTypeData(systemData);
        break;
      case 'sensor':
        this._prepareSensorData(systemData);
        break;
      case 'feature':
        this._prepareFeatureData(systemData);
        break;
    }
  }

  /**
   * Prepare weapon-specific derived data
   * @param {Object} systemData The item's system data
   * @private
   */
  _prepareWeaponData(systemData) {
    // Ensure damage rating is valid
    systemData.damage = Math.max(0, Math.min(25, systemData.damage || 0));
    
    // Ensure effective range is valid
    systemData.effective_range = Math.max(0, systemData.effective_range || 0);
    
    // Ensure features array exists
    if (!Array.isArray(systemData.features)) {
      systemData.features = [];
    }
  }

  /**
   * Prepare equipment-specific derived data
   * @param {Object} systemData The item's system data
   * @private
   */
  _prepareEquipmentData(systemData) {
    // Ensure quantity is at least 1
    systemData.quantity = Math.max(1, systemData.quantity || 1);
    
    // Ensure weight is non-negative
    systemData.weight = Math.max(0, systemData.weight || 0);
    
    // Ensure durability values are valid
    systemData.max_durability = Math.max(1, systemData.max_durability || 10);
    systemData.durability = Math.max(0, Math.min(systemData.max_durability, systemData.durability || systemData.max_durability));
    
    // Calculate total weight
    systemData.totalWeight = systemData.weight * systemData.quantity;
    
    // Ensure features array exists
    if (!Array.isArray(systemData.features)) {
      systemData.features = [];
    }
  }

  /**
   * Prepare biomod-specific derived data
   * @param {Object} systemData The item's system data
   * @private
   */
  _prepareBiomodData(systemData) {
    // Ensure attributes object exists
    if (typeof systemData.attributes !== 'object') {
      systemData.attributes = {
        cognition: 0,
        psyche: 0,
        coordination: 0,
        physique: 0
      };
    }

    // Clamp attribute bonuses to valid ranges
    for (const [attr, value] of Object.entries(systemData.attributes)) {
      systemData.attributes[attr] = Math.max(-3, Math.min(5, value || 0));
    }
    
    // Calculate total attribute bonus
    systemData.totalAttributeBonus = Object.values(systemData.attributes).reduce((sum, value) => sum + value, 0);
    
    // Ensure effects array exists
    if (!Array.isArray(systemData.effects)) {
      systemData.effects = [];
    }
  }

  /**
   * Prepare skill-specific derived data
   * @param {Object} systemData The item's system data
   * @private
   */
  _prepareSkillData(systemData) {
    // Ensure rank is valid
    systemData.rank = Math.max(1, Math.min(10, systemData.rank || 1));
    
    // Ensure levels object exists
    if (typeof systemData.levels !== 'object') {
      systemData.levels = {
        general: "",
        core: "",
        specialty: ""
      };
    }
  }

  /**
   * Prepare ammo_type-specific derived data
   * @param {Object} systemData The item's system data
   * @private
   */
  _prepareAmmoTypeData(systemData) {
    // Ensure damage modifier is valid
    systemData.damage_modifier = Math.max(-10, Math.min(10, systemData.damage_modifier || 0));
    
    // Ensure range modifier is valid
    systemData.range_modifier = Math.max(-100, Math.min(100, systemData.range_modifier || 0));
    
    // Ensure weight is non-negative
    systemData.weight = Math.max(0, systemData.weight || 0.1);
    
    // Ensure quantity per unit is at least 1
    systemData.quantity_per_unit = Math.max(1, systemData.quantity_per_unit || 20);
    
    // Ensure features array exists
    if (!Array.isArray(systemData.features)) {
      systemData.features = [];
    }
    
    // Ensure compatible weapons array exists
    if (!Array.isArray(systemData.compatible_weapons)) {
      systemData.compatible_weapons = [];
    }
  }

  /**
   * Prepare sensor-specific derived data
   * @param {Object} systemData The item's system data
   * @private
   */
  _prepareSensorData(systemData) {
    // Ensure range is non-negative
    systemData.range = Math.max(0, systemData.range || 0);
    
    // Ensure weight is non-negative
    systemData.weight = Math.max(0, systemData.weight || 0.5);
    
    // Ensure environmental conditions array exists
    if (!Array.isArray(systemData.environmental_conditions)) {
      systemData.environmental_conditions = [];
    }
    
    // Ensure special features array exists
    if (!Array.isArray(systemData.special_features)) {
      systemData.special_features = [];
    }
  }

  /**
   * Prepare feature-specific derived data
   * @param {Object} systemData The item's system data
   * @private
   */
  _prepareFeatureData(systemData) {
    // Ensure category is valid
    if (!['technology', 'weapon'].includes(systemData.category)) {
      systemData.category = 'technology';
    }
    
    // Ensure bonus value is within valid range
    systemData.bonus_value = Math.max(-10, Math.min(10, systemData.bonus_value || 0));
    
    // Ensure bonus type is valid
    const validBonusTypes = ['none', 'target_number', 'damage_rating', 'armor_reduction', 'range_modifier', 'custom'];
    if (!validBonusTypes.includes(systemData.bonus_type)) {
      systemData.bonus_type = 'none';
    }
    
    // Clear bonus value if bonus type is none
    if (systemData.bonus_type === 'none') {
      systemData.bonus_value = 0;
    }
  }

  /**
   * Handle rolling this item
   * @param {Object} options Options for the roll
   * @returns {Promise}
   */
  async roll(options = {}) {
    const itemData = this;
    const systemData = itemData.system;

    // Get the actor that owns this item
    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn("This item is not owned by an actor and cannot be rolled.");
      return;
    }

    switch (itemData.type) {
      case 'weapon':
        return this._rollWeaponAttack(systemData, options);
      case 'skill':
        return this._rollSkillTest(systemData, options);
      default:
        ui.notifications.info(`${itemData.name} cannot be rolled.`);
        return;
    }
  }

  /**
   * Roll weapon attack
   * @param {Object} systemData The weapon's system data
   * @param {Object} options Roll options
   * @private
   */
  async _rollWeaponAttack(systemData, options = {}) {
    // Get the actor that owns this weapon
    const actor = this.actor;
    if (!actor) {
      ui.notifications.warn("This weapon is not owned by an actor and cannot be rolled.");
      return;
    }
    
    // Determine appropriate combat skills based on weapon type
    const weaponType = systemData.weapon_type || 'melee';
    const combatSkills = this._getCombatSkills(actor, weaponType);
    
    if (combatSkills.length === 0) {
      ui.notifications.warn('No appropriate combat skills found for this weapon type.');
      return;
    }
    
    // Prepare roll data for weapon attack
    const rollData = {
      label: `${this.name} Attack`,
      type: 'weapon',
      weaponName: this.name,
      weaponType: weaponType,
      skillName: combatSkills[0].name, // Default to first available combat skill
      skillRank: combatSkills[0].rank || 1,
      attribute: combatSkills[0].attribute || 'coordination',
      attributeValue: actor.system.attributes[combatSkills[0].attribute || 'coordination']?.value || 0,
      dice: combatSkills[0].dice || '1d10',
      levelType: combatSkills[0].level_type || 'general',
      targetNumber: 10, // Default target number
      combatSkills: combatSkills, // Available combat skills to choose from
      weapon: this
    };
    
    // Open the weapon attack roll dialog
    console.log('BluePlanet Item Weapon: Opening weapon attack roll dialog');
    try {
      const { showWeaponAttackRollDialog } = await import('../weapon-attack-dialog.js');
      showWeaponAttackRollDialog(actor, rollData);
    } catch (error) {
      console.error('BluePlanet Item Weapon: Error opening weapon attack roll dialog:', error);
      
      // Fallback to enhanced dialog
      try {
        const { showEnhancedBluePlanetRollDialog } = await import('../enhanced-roll-dialog.js');
        showEnhancedBluePlanetRollDialog(actor, rollData);
      } catch (fallbackError) {
        console.error('BluePlanet Item Weapon: All weapon attack roll dialogs failed:', fallbackError);
        ui.notifications.error('Error opening weapon attack roll dialog. Check console for details.');
      }
    }
  }
  
  /**
   * Get available combat skills for a weapon type from actor
   * @param {Actor} actor - The actor
   * @param {string} weaponType - The type of weapon (melee, firearm, etc.)
   * @returns {Array} Array of available combat skills
   * @private
   */
  _getCombatSkills(actor, weaponType) {
    const combatSkills = [];
    const skills = actor.system.skills || {};
    
    // Define weapon type to skill mappings
    const weaponSkillMap = {
      'melee': ['Melee', 'Brawling', 'Martial Arts'],
      'firearm': ['Firearms', 'Gunnery', 'Heavy Weapons'],
      'thrown': ['Athletics', 'Thrown Weapons'],
      'bow': ['Archery', 'Primitive Weapons'],
      'energy': ['Energy Weapons', 'Advanced Weapons'],
      'exotic': ['Exotic Weapons', 'Advanced Systems']
    };
    
    // Get appropriate skill names for this weapon type
    const skillNames = weaponSkillMap[weaponType.toLowerCase()] || ['Melee', 'Firearms'];
    
    // Find matching skills from actor's skill list
    for (let [key, skill] of Object.entries(skills)) {
      const skillLabel = skill.label || key;
      
      // Check if this skill matches any of the appropriate skills for the weapon type
      if (skillNames.some(name => 
        skillLabel.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(skillLabel.toLowerCase())
      )) {
        combatSkills.push({
          id: key,
          name: skillLabel,
          rank: skill.rank || 1,
          attribute: skill.attribute || 'coordination',
          level_type: skill.level_type || 'general',
          dice: this._getDiceFormula(skill.level_type || 'general')
        });
      }
    }
    
    // If no specific combat skills found, add some default combat skills if they exist
    if (combatSkills.length === 0) {
      const defaultCombatSkills = ['Firearms', 'Melee', 'Brawling', 'Athletics'];
      for (let defaultSkill of defaultCombatSkills) {
        for (let [key, skill] of Object.entries(skills)) {
          const skillLabel = skill.label || key;
          if (skillLabel.toLowerCase() === defaultSkill.toLowerCase()) {
            combatSkills.push({
              id: key,
              name: skillLabel,
              rank: skill.rank || 1,
              attribute: skill.attribute || 'coordination',
              level_type: skill.level_type || 'general',
              dice: this._getDiceFormula(skill.level_type || 'general')
            });
            break;
          }
        }
      }
    }
    
    return combatSkills;
  }
  
  /**
   * Get dice formula for skill level type
   * @param {string} levelType - The skill level type
   * @returns {string} - Dice formula
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
   * Roll weapon damage
   * @param {Object} systemData The weapon's system data
   * @param {Object} options Roll options
   */
  async rollWeaponDamage(systemData, options = {}) {
    const damage = systemData.damage;
    
    if (!damage || damage <= 0) {
      ui.notifications.warn("This weapon has no damage rating set.");
      return;
    }

    // Blue Planet uses 3d10 for damage tests - count ALL successful dice
    const roll = new Roll("3d10");
    await roll.evaluate();
    
    // Count successes against damage rating (each die <= damage rating)
    let successes = 0;
    const diceResults = roll.terms[0].results.map(die => die.result);
    diceResults.forEach(dieResult => {
      if (dieResult <= damage) {
        successes++;
      }
    });
    
    // Sort results for display
    const sortedResults = [...diceResults].sort((a, b) => a - b);
    
    // Determine wound level based on successes
    let woundLevel = "";
    let resultColor = "";
    
    if (successes === 0) {
      woundLevel = "NO INJURY";
      resultColor = "#6c757d";
    } else if (successes === 1) {
      woundLevel = "MINOR WOUND";
      resultColor = "#fd7e14";
    } else if (successes === 2) {
      woundLevel = "MAJOR WOUND";
      resultColor = "#dc3545";
    } else if (successes >= 3) {
      woundLevel = "MORTAL WOUND";
      resultColor = "#8b0000";
    }
    
    // Create flavor text similar to skill rolls
    let flavorText = `<h3>${this.name}</h3>`;
    flavorText += `<p style="color: black; font-size: 11px; margin: 2px 0;"><em>Damage Test - ${systemData.weapon_type.charAt(0).toUpperCase() + systemData.weapon_type.slice(1)} Weapon</em></p>`;
    flavorText += `<p><strong>Damage Rating:</strong> ${damage} | <strong>Dice Roll:</strong> [${sortedResults.join(', ')}] | <strong>Successes:</strong> ${successes}</p>`;
    flavorText += `<p style="font-size: 10px; color: #666;"><em>Each die ≤ ${damage} counts as a success</em></p>`;
    flavorText += `<p><strong style="color: ${resultColor}">${woundLevel}</strong></p>`;
    
    // Add additional weapon info if available
    if (systemData.effective_range && systemData.weapon_type !== 'melee') {
      flavorText += `<p style="color: black; font-size: 11px;"><em>Range: ${systemData.effective_range}m</em></p>`;
    }
    
    // Add collapsible wound effects explanation  
    const woundId = `wound-details-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (successes === 0) {
      flavorText += `<div style="margin-top: 8px; border-radius: 4px; border: 1px solid rgba(108, 117, 125, 0.3);">`;
      flavorText += `<div class="damage-accordion-header" data-target="${woundId}" style="padding: 6px; background: rgba(108, 117, 125, 0.1); cursor: pointer; user-select: none; border-radius: 4px 4px 0 0;">`;
      flavorText += `<p style="color: black; margin: 0; font-size: 12px;"><i class="fas fa-chevron-right accordion-arrow" style="margin-right: 6px; transition: transform 0.2s;"></i><strong><i class="fas fa-shield-alt"></i> No Injury - Click for details</strong></p>`;
      flavorText += `</div>`;
      flavorText += `<div id="${woundId}" class="damage-accordion-content" style="display: none; padding: 6px; background: rgba(108, 117, 125, 0.05); border-radius: 0 0 4px 4px;">`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Attack misses, deflected, or causes no harm</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• No wound penalties applied</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Character continues normally</p>`;
      flavorText += `</div></div>`;
    } else if (successes === 1) {
      flavorText += `<div style="margin-top: 8px; border-radius: 4px; border: 1px solid rgba(255, 193, 7, 0.4);">`;
      flavorText += `<div class="damage-accordion-header" data-target="${woundId}" style="padding: 6px; background: rgba(255, 193, 7, 0.15); cursor: pointer; user-select: none; border-radius: 4px 4px 0 0;">`;
      flavorText += `<p style="color: black; margin: 0; font-size: 12px;"><i class="fas fa-chevron-right accordion-arrow" style="margin-right: 6px; transition: transform 0.2s;"></i><strong><i class="fas fa-band-aid"></i> Minor Wound - Click for details</strong></p>`;
      flavorText += `</div>`;
      flavorText += `<div id="${woundId}" class="damage-accordion-content" style="display: none; padding: 6px; background: rgba(255, 193, 7, 0.05); border-radius: 0 0 4px 4px;">`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <strong>-1 penalty to all tests</strong> until healed</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Scratches, bruises, or light cuts</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Heals naturally with time and rest</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Can be treated with basic first aid</p>`;
      flavorText += `</div></div>`;
    } else if (successes === 2) {
      flavorText += `<div style="margin-top: 8px; border-radius: 4px; border: 1px solid rgba(220, 53, 69, 0.4);">`;
      flavorText += `<div class="damage-accordion-header" data-target="${woundId}" style="padding: 6px; background: rgba(220, 53, 69, 0.15); cursor: pointer; user-select: none; border-radius: 4px 4px 0 0;">`;
      flavorText += `<p style="color: black; margin: 0; font-size: 12px;"><i class="fas fa-chevron-right accordion-arrow" style="margin-right: 6px; transition: transform 0.2s;"></i><strong><i class="fas fa-heart-broken"></i> Major Wound - Click for details</strong></p>`;
      flavorText += `</div>`;
      flavorText += `<div id="${woundId}" class="damage-accordion-content" style="display: none; padding: 6px; background: rgba(220, 53, 69, 0.05); border-radius: 0 0 4px 4px;">`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <strong>-2 penalty to all tests</strong> until healed</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Deep cuts, broken bones, or serious injury</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• May cause unconsciousness (Physique test)</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Requires medical attention to heal properly</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Without treatment, may become infected</p>`;
      flavorText += `</div></div>`;
    } else if (successes >= 3) {
      flavorText += `<div style="margin-top: 8px; border-radius: 4px; border: 1px solid rgba(139, 0, 0, 0.4);">`;
      flavorText += `<div class="damage-accordion-header" data-target="${woundId}" style="padding: 6px; background: rgba(139, 0, 0, 0.15); cursor: pointer; user-select: none; border-radius: 4px 4px 0 0;">`;
      flavorText += `<p style="color: black; margin: 0; font-size: 12px;"><i class="fas fa-chevron-right accordion-arrow" style="margin-right: 6px; transition: transform 0.2s;"></i><strong><i class="fas fa-skull"></i> Mortal Wound - Click for details</strong></p>`;
      flavorText += `</div>`;
      flavorText += `<div id="${woundId}" class="damage-accordion-content" style="display: none; padding: 6px; background: rgba(139, 0, 0, 0.05); border-radius: 0 0 4px 4px;">`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <strong>-3 penalty to all tests</strong> until healed</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Life-threatening injury - organ damage</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Unconsciousness and death risk</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <strong>Requires immediate medical attention</strong></p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• May require surgery or advanced treatment</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Character may die without intervention</p>`;
      flavorText += `</div></div>`;
    }
    
    // Add collapsible GM reminder
    const gmId = `gm-reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    flavorText += `<div style="margin-top: 8px; border-radius: 4px; border: 1px solid rgba(74, 144, 226, 0.3);">`;
    flavorText += `<div class="damage-accordion-header" data-target="${gmId}" style="padding: 4px 6px; background: rgba(74, 144, 226, 0.1); cursor: pointer; user-select: none; border-radius: 4px 4px 0 0;">`;
    flavorText += `<p style="color: black; margin: 0; font-size: 11px;"><i class="fas fa-chevron-right accordion-arrow" style="margin-right: 6px; transition: transform 0.2s;"></i><strong><i class="fas fa-info-circle"></i> GM Reminder - Click for damage modifiers</strong></p>`;
    flavorText += `</div>`;
    flavorText += `<div id="${gmId}" class="damage-accordion-content" style="display: none; padding: 6px; background: rgba(74, 144, 226, 0.05); border-radius: 0 0 4px 4px;">`;
    flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;"><strong>Base DR ${damage}</strong> may be modified by:</p>`;
    flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <strong>Armor Durability:</strong> Subtract armor's durability rating</p>`;
    flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <strong>Target Physique:</strong> Subtract target's Physique attribute</p>`;
    flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <strong>Called Shots:</strong> +1 DR per attack penalty (or -1 for pulling punches)</p>`;
    flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <em>For cetaceans/large creatures, use smaller Physique rank</em></p>`;
    flavorText += `</div></div>`;
    
    // Create message data similar to skill rolls
    const messageData = {
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: flavorText,
      rollMode: game.settings.get('core', 'rollMode'),
      sound: CONFIG.sounds.dice,
      flags: {
        "blue-planet-recontact": {
          rollType: 'damage',
          weapon: this.name,
          weaponType: systemData.weapon_type,
          damageRating: damage,
          diceResults: sortedResults,
          successes: successes,
          woundLevel: woundLevel
        }
      }
    };
    
    return await roll.toMessage(messageData);
  }

  /**
   * Roll a skill test
   * @param {Object} systemData The skill's system data
   * @param {Object} options Roll options
   * @private
   */
  async _rollSkillTest(systemData, options = {}) {
    // This would require more complex skill system implementation
    ui.notifications.info("Skill rolling not yet implemented.");
    return;
  }
}
