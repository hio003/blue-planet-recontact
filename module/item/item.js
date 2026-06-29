/**
 * Blue Planet Item Document
 * Extend the base Item document to support Blue Planet specific functionality
 */
export class BluePlanetItem extends Item {
  
  /** @override */
  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);
    
    // Store previous values for comparison
    this._previousValues = {
      damage: this.system.damage,
      effective_range: this.system.effective_range,
      magazine_capacity: this.system.magazine_capacity,
      current_ammo: this.system.current_ammo,
      loaded_ammunition: this.system.loaded_ammunition
    };
  }
  
  /** @override */
  async _onUpdate(changed, options, userId) {
    await super._onUpdate(changed, options, userId);
    
    // Check if important weapon properties changed and emit events
    if (this.type === 'weapon' && changed.system) {
      const previousValues = this._previousValues || {};
      const changedProperties = [];
      
      // Check for significant changes
      if (changed.system.damage !== undefined && changed.system.damage !== previousValues.damage) {
        changedProperties.push('damage');
      }
      if (changed.system.effective_range !== undefined && changed.system.effective_range !== previousValues.effective_range) {
        changedProperties.push('effective_range');
      }
      if (changed.system.magazine_capacity !== undefined && changed.system.magazine_capacity !== previousValues.magazine_capacity) {
        changedProperties.push('magazine_capacity');
      }
      if (changed.system.current_ammo !== undefined && changed.system.current_ammo !== previousValues.current_ammo) {
        changedProperties.push('current_ammo');
      }
      
      // Emit weapon update event if significant properties changed
      if (changedProperties.length > 0) {
        console.log(`BluePlanet Weapon: Properties changed: ${changedProperties.join(', ')}`);
        
        // Emit custom hook for weapon updates
        Hooks.callAll('bluePlanet.weaponUpdated', {
          weapon: this,
          changedProperties,
          previousValues,
          currentValues: {
            damage: this.system.damage,
            effective_range: this.system.effective_range,
            magazine_capacity: this.system.magazine_capacity,
            current_ammo: this.system.current_ammo
          }
        });
        
        // Force update any open weapon sheets
        this._forceUpdateOpenSheets();
        
        // Update any character sheets that contain this weapon
        this._updateParentActorSheets();
        
        // Update any chat messages that reference this weapon
        this._updateRelevantChatMessages(changedProperties);
      }
    }
    
    // Clean up previous values
    delete this._previousValues;
  }

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
    
    // Check ammunition for non-melee weapons
    if (systemData.weapon_type !== 'melee') {
      const ammoCheck = this._checkAmmunition();
      if (!ammoCheck.canFire) {
        ui.notifications.warn(ammoCheck.message);
        return;
      }
    }
    
    // Get ALL skills from the actor's skill sets
    const weaponType = systemData.weapon_type || 'melee';
    const allSkills = this._getAllActorSkills(actor);
    
    if (allSkills.length === 0) {
      ui.notifications.warn('This character has no skills. Please add some skills to use weapons.');
      return;
    }
    
    // Prepare roll data for weapon attack with all skills available
    const firstSkill = allSkills[0];
    const rollData = {
      label: `${this.name} Attack`,
      type: 'weapon',
      weaponName: this.name,
      weaponType: weaponType,
      skillName: firstSkill.name, // Default to first skill
      skillRank: firstSkill.rank || 1,
      attribute: firstSkill.attribute || 'coordination',
      attributeValue: actor.system.attributes[firstSkill.attribute || 'coordination']?.value || 0,
      dice: firstSkill.dice || '1d10',
      levelType: firstSkill.level_type || 'general',
      targetNumber: 10, // Default target number
      allSkills: allSkills, // All available skills to choose from
      weapon: this
    };
    
    // Open the weapon attack roll dialog (Step 1)
    console.log('BluePlanet Item Weapon: Opening weapon attack roll dialog step 1');
    try {
      const { showWeaponAttackDialogStep1 } = await import('../weapon-attack-dialog-step1.js');
      showWeaponAttackDialogStep1(actor, rollData);
    } catch (error) {
      console.error('BluePlanet Item Weapon: Error opening weapon attack roll dialog:', error);
      ui.notifications.error('Error opening weapon attack roll dialog. Check console for details.');
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
   * Get all skills from the actor's skill sets
   * @param {Actor} actor - The actor
   * @returns {Array} Array of all available skills
   * @private
   */
  _getAllActorSkills(actor) {
    const allSkills = [];
    const skills = actor.system.skills || {};
    
    for (let [key, skill] of Object.entries(skills)) {
      const skillLabel = skill.label || key;
      
      allSkills.push({
        id: key,
        name: skillLabel,
        rank: skill.rank || 1,
        attribute: skill.attribute || 'cognition',
        level_type: skill.level_type || 'general',
        dice: this._getDiceFormula(skill.level_type || 'general'),
        aspect: skill.aspect || 'experiential'
      });
    }
    
    // Sort skills alphabetically
    allSkills.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('BluePlanet: Found all actor skills:', allSkills);
    return allSkills;
  }
  
  /**
   * Force update any open sheets for this item
   * @private
   */
  _forceUpdateOpenSheets() {
    // Find all open sheets for this item
    Object.values(ui.windows).forEach(app => {
      if (app instanceof foundry.appv1.sheets.ItemSheet && app.item?.id === this.id) {
        console.log(`BluePlanet Weapon: Force updating sheet for ${this.name}`);
        app.render(false); // Render without forcing position reset
      }
    });
  }
  
  /**
   * Update any character sheets that contain this weapon
   * @private
   */
  _updateParentActorSheets() {
    if (this.actor) {
      console.log(`BluePlanet Weapon: Updating parent actor sheet for ${this.actor.name}`);
      
      // Find and update any open actor sheets
      Object.values(ui.windows).forEach(app => {
        if (app.actor?.id === this.actor.id) {
          // Use a small delay to ensure the item update is fully processed
          setTimeout(() => {
            app.render(false);
          }, 50);
        }
      });
    }
  }
  
  /**
   * Update any chat messages that reference this weapon
   * @param {Array} changedProperties - Array of property names that changed
   * @private
   */
  _updateRelevantChatMessages(changedProperties) {
    // Get recent chat messages that might reference this weapon
    const recentMessages = game.messages.contents.slice(-20); // Check last 20 messages
    const weaponName = this.name;
    
    recentMessages.forEach(message => {
      const flags = message.flags['blue-planet-recontact'];
      
      // Check if this is a weapon-related message
      if (flags && (flags.rollType === 'weapon-attack' || flags.rollType === 'weapon-damage') && 
          flags.weaponName === weaponName) {
        
        console.log(`BluePlanet Weapon: Found related chat message for ${weaponName}`);
        
        // Add update notification to the message if damage changed
        if (changedProperties.includes('damage')) {
          this._addUpdateNotificationToMessage(message, changedProperties);
        }
      }
    });
  }
  
  /**
   * Add an update notification to a chat message
   * @param {ChatMessage} message - The message to update
   * @param {Array} changedProperties - Properties that changed
   * @private
   */
  async _addUpdateNotificationToMessage(message, changedProperties) {
    const currentFlavor = message.flavor || '';
    
    // Check if we already added an update notification
    if (currentFlavor.includes('weapon-updated-notification')) {
      return;
    }
    
    // Create update notification
    const updateNotification = `
      <div class="weapon-updated-notification" style="
        background: rgba(212, 175, 55, 0.1);
        border: 1px solid #d4af37;
        border-radius: 4px;
        padding: 6px;
        margin: 4px 0;
        font-size: 10px;
        color: #d4af37;
        text-align: center;
      ">
        <i class="fas fa-sync-alt"></i> <strong>Weapon Updated:</strong> 
        ${this.name} ${changedProperties.includes('damage') ? `(Damage: ${this.system.damage})` : ''}
        ${changedProperties.includes('effective_range') ? `(Range: ${this.system.effective_range}m)` : ''}
      </div>
    `;
    
    // Update the message with the notification
    try {
      await message.update({
        flavor: currentFlavor + updateNotification
      });
      console.log(`BluePlanet Weapon: Added update notification to message ${message.id}`);
    } catch (error) {
      console.warn(`BluePlanet Weapon: Could not update message ${message.id}:`, error);
    }
  }

  /**
   * Create default combat skills when none are found
   * @param {string} weaponType - The type of weapon
   * @returns {Array} Array of default combat skills
   * @private
   */
  _createDefaultCombatSkills(weaponType) {
    const defaultSkills = [];
    
    // Create appropriate default skills based on weapon type
    const defaultSkillMap = {
      'melee': { name: 'Melee Combat', attribute: 'coordination' },
      'firearm': { name: 'Firearms', attribute: 'coordination' },
      'thrown': { name: 'Athletics', attribute: 'coordination' },
      'bow': { name: 'Archery', attribute: 'coordination' },
      'energy': { name: 'Energy Weapons', attribute: 'coordination' },
      'exotic': { name: 'Exotic Weapons', attribute: 'coordination' }
    };
    
    const defaultSkill = defaultSkillMap[weaponType.toLowerCase()] || defaultSkillMap['melee'];
    
    // Create a basic skill with rank 1
    defaultSkills.push({
      id: `default_${weaponType}`,
      name: defaultSkill.name,
      rank: 1,
      attribute: defaultSkill.attribute,
      level_type: 'general',
      dice: '1d10'
    });
    
    // Also add a generic "Untrained Combat" option
    defaultSkills.push({
      id: 'default_untrained',
      name: 'Untrained Combat',
      rank: 1,
      attribute: 'coordination',
      level_type: 'general',
      dice: '1d10'
    });
    
    console.log('BluePlanet: Created default combat skills:', defaultSkills);
    return defaultSkills;
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
   * @param {Object} options Additional options including calledShotBonus
   * @private
   */
  async rollWeaponDamage(systemData, options = {}) {
    const baseDamage = systemData.damage;
    const calledShotBonus = options.calledShotBonus || 0;
    const damage = baseDamage + calledShotBonus;
    
    if (!baseDamage || baseDamage <= 0) {
      ui.notifications.warn("This weapon has no damage rating set.");
      return;
    }
    
    // Consume ammunition for non-melee weapons
    if (systemData.weapon_type !== 'melee') {
      const consumed = await this.consumeAmmunition(1);
      if (!consumed) {
        ui.notifications.error('Failed to consume ammunition for damage roll.');
        return;
      }
    }

    // Blue Planet uses 3d10 for damage tests - count ALL successful dice
    const roll = new Roll("3d10");
    await roll.evaluate();
    
    // Count successes against damage rating (each die <= damage rating)
    let successes = 0;
    const diceResults = roll.dice[0].results.map(die => die.result);
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
    
    if (calledShotBonus > 0) {
      flavorText += `<p style="color: #e74c3c; font-size: 11px; margin: 2px 0;"><strong><i class="fas fa-crosshairs"></i> Called Shot: Base DR ${baseDamage} + ${calledShotBonus} = ${damage}</strong></p>`;
    }
    
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
  
  /* -------------------------------------------- */
  /*  Ammunition Management Methods                */
  /* -------------------------------------------- */
  
  /**
   * Check if weapon has ammunition for firing
   * @returns {Object} Result object with canFire boolean and message
   * @private
   */
  _checkAmmunition() {
    const systemData = this.system;
    
    // Melee weapons don't need ammunition
    if (systemData.weapon_type === 'melee') {
      return { canFire: true, message: '' };
    }
    
    // Check if weapon has loaded ammunition
    if (!systemData.loaded_ammunition) {
      return { 
        canFire: false, 
        message: `${this.name} has no ammunition loaded. Load ammunition first.` 
      };
    }
    
    // Check if weapon has current ammo count
    const currentAmmo = systemData.current_ammo || 0;
    if (currentAmmo <= 0) {
      return { 
        canFire: false, 
        message: `${this.name} is empty. Reload or load ammunition.` 
      };
    }
    
    return { canFire: true, message: '' };
  }
  
  /**
   * Consume ammunition after firing
   * @param {number} rounds Number of rounds to consume (default 1)
   * @returns {Promise<boolean>} True if ammunition was consumed successfully
   */
  async consumeAmmunition(rounds = 1) {
    const systemData = this.system;
    
    // Check if we can fire
    const ammoCheck = this._checkAmmunition();
    if (!ammoCheck.canFire) {
      console.warn('BluePlanet Weapon: Cannot consume ammunition -', ammoCheck.message);
      return false;
    }
    
    const currentAmmo = systemData.current_ammo || 0;
    if (currentAmmo < rounds) {
      console.warn(`BluePlanet Weapon: Not enough ammunition. Need ${rounds}, have ${currentAmmo}`);
      return false;
    }
    
    // Update weapon ammo count
    const newAmmoCount = currentAmmo - rounds;
    await this.update({ 'system.current_ammo': newAmmoCount });
    
    // Also update the source ammunition item if it exists
    if (this.actor && systemData.loaded_ammunition?.id) {
      const ammunition = this.actor.items.get(systemData.loaded_ammunition.id);
      if (ammunition && ammunition.type === 'ammunition') {
        const currentFired = ammunition.system.rounds_fired || 0;
        await ammunition.update({ 'system.rounds_fired': currentFired + rounds });
      }
    }
    
    console.log(`BluePlanet Weapon: Consumed ${rounds} round(s) from ${this.name}. ${newAmmoCount} rounds remaining.`);
    return true;
  }
  
  /**
   * Get ammunition modifiers for attacks
   * @returns {Object} Object containing ammunition modifiers
   */
  getAmmunitionModifiers() {
    const systemData = this.system;
    
    if (!systemData.loaded_ammunition) {
      return {
        attack_modifier: 0,
        damage_modifier: 0,
        range_modifier: 0,
        penetration: 0,
        ammo_type: 'standard'
      };
    }
    
    const loadedAmmo = systemData.loaded_ammunition;
    return {
      attack_modifier: loadedAmmo.attack_modifier || 0,
      damage_modifier: loadedAmmo.damage_modifier || 0,
      range_modifier: loadedAmmo.range_modifier || 0,
      penetration: loadedAmmo.penetration || 0,
      ammo_type: loadedAmmo.ammo_type || 'standard'
    };
  }
}
