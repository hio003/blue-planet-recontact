// BluePlanet Actor Sheet - Updated with creature error fixes v2
import { BluePlanetRollDialog } from '../roll-dialog.js';
import { showBluePlanetRollDialog } from '../roll-dialog-fixed.js';
import { BluePlanetSkillDialog } from '../dialogs/skill-dialog.js';

/**
 * Extend the basic ActorSheet for Blue Planet characters
 * @extends {foundry.appv1.sheets.ActorSheet}
 */
export class BluePlanetActorSheet extends foundry.appv1.sheets.ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "actor"],
      width: 900,
      height: 700,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
      popOut: true,
      // RESIZABLE: Enabled for ALL actor types (character, cetacean, npc, creature)
      // Users can drag the bottom-right corner to resize sheets
      resizable: true,
      minimizable: true,
      dragHandle: ".window-header",
      // Default position - can be moved anywhere
      top: 100,
      left: 300
    });
  }

  /** @override */
  get template() {
    const path = "systems/blue-planet-recontact/templates/actor";
    return `${path}/actor-${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  async render(force = false, options = {}) {
    // Force all renders to be popout windows
    options.popOut = true;
    
    const result = await super.render(force, options);
    
    // Restore pip states after any render
    if (this._pipStates && this._pipStates.size > 0) {
      setTimeout(() => {
        console.log('BluePlanet: Auto-restoring pip states after render');
        this._restoreAllPipStates();
      }, 50);
    }
    
    return result;
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

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare Cetacean data and items.
    if (actorData.type == 'cetacean') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare Creature data and items.
    if (actorData.type == 'creature') {
      try {
        this._prepareItems(context);
        this._prepareCreatureData(context);
      } catch (error) {
        console.error('BluePlanet: Error preparing creature data:', error);
        console.error('Actor:', actorData);
        // Initialize minimal safe data structure
        context.system = context.system || {};
        context.system.attributes = { awareness: 1, coordination: 1, physique: 1 };
        context.system.biology = { threat_level: 'low', resource_value: 'low' };
        context.system.attack = { type: '', damage: 0, venom: {} };
        context.threatLevels = [{ value: "low", label: "Low Threat" }];
        context.resourceValues = [{ value: "low", label: "Low Value" }];
      }
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = this.actor.effects.map(e => foundry.utils.deepClone(e));

    // Initialize pip states from current data
    this._initializePipStates();

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle attribute focus attributes with null checking
    if (context.system && context.system.attributes && typeof context.system.attributes === 'object') {
      for (let [key, attribute] of Object.entries(context.system.attributes)) {
        if (attribute && typeof attribute === 'object') {
          attribute.label = key.charAt(0).toUpperCase() + key.slice(1);
        }
      }
    }

    // Prepare skill sets data with enhanced organization
    context.skillSets = [];
    context.skillsByLevel = {
      specialty: [],
      core: [],
      general: []
    };
    context.skillsByAspect = {
      origin: [],
      background: [],
      occupation: [],
      experiential: []
    };
    
    if (context.system.skills) {
      for (let [key, skill] of Object.entries(context.system.skills)) {
        // Set defaults and prepare skill data
        skill.label = skill.label || key;
        skill.id = key;
        skill.rank = skill.rank || 1;
        skill.attribute = skill.attribute || 'cognition';
        skill.aspect = skill.aspect || 'experiential';
        skill.description = skill.description || '';
        skill.specializations = skill.specializations || [];
        
        // Determine skill level for dice display based on level_type
        const levelType = skill.level_type || 'general';
        if (levelType === 'specialty') {
          skill.level = "Specialty";
          skill.dice = "3d10kl";
        } else if (levelType === 'core') {
          skill.level = "Core";  
          skill.dice = "2d10kl";
        } else {
          skill.level = "General";
          skill.dice = "1d10";
        }
        
        // Legacy support for old skill format
        if (skill.specialty) {
          skill.level = "Specialty";
          skill.dice = "3d10kl";
          skill.level_type = 'specialty';
        } else if (skill.core) {
          skill.level = "Core";  
          skill.dice = "2d10kl";
          skill.level_type = 'core';
        }
        
        // Add to general skillSets array (for backward compatibility)
        context.skillSets.push(skill);
        
        // Group by level for organized display
        if (context.skillsByLevel[levelType]) {
          context.skillsByLevel[levelType].push(skill);
        }
        
        // Group by aspect for categorized display
        if (context.skillsByAspect[skill.aspect]) {
          context.skillsByAspect[skill.aspect].push(skill);
        }
      }
      
      // Sort skills within each level by name
      Object.keys(context.skillsByLevel).forEach(level => {
        context.skillsByLevel[level].sort((a, b) => a.label.localeCompare(b.label));
      });
      
      // Sort skills within each aspect by name
      Object.keys(context.skillsByAspect).forEach(aspect => {
        context.skillsByAspect[aspect].sort((a, b) => a.label.localeCompare(b.label));
      });
    }

    // Calculate total wound penalty
    const wounds = context.system.wounds || {};
    context.system.totalWoundPenalty = -(wounds.minor || 0) - ((wounds.major || 0) * 2) - ((wounds.mortal || 0) * 3);

    // Prepare reputation level text
    const repLevel = context.system.profile?.reputation?.level || 0;
    if (repLevel < 6) context.system.profile.reputation.levelText = "Unknown";
    else if (repLevel < 11) context.system.profile.reputation.levelText = "Rumored";
    else if (repLevel < 16) context.system.profile.reputation.levelText = "Notable";
    else if (repLevel < 21) context.system.profile.reputation.levelText = "(In)famous";
    else context.system.profile.reputation.levelText = "Renowned";
  }

  /**
   * Organize and prepare data for Creature sheets.
   *
   * @param {Object} context The actor data context.
   *
   * @return {undefined}
   */
  _prepareCreatureData(context) {
    console.log('BluePlanet: _prepareCreatureData called', context);
    
    // IMMEDIATE SAFE DEFAULTS - Set these FIRST before ANY processing
    if (!context) {
      console.error('BluePlanet: _prepareCreatureData called with null context');
      return;
    }
    
    // Initialize everything to safe defaults IMMEDIATELY
    context.system = context.system || {};
    context.system.attributes = {
      awareness: 1,
      coordination: 1,
      physique: 1,
      coordination_dual: false,
      physique_dual: false
    };
    context.system.biology = {
      threat_level: 'low',
      resource_value: 'low',
      size_category: 'medium',
      description: '',
      behavior: '',
      distribution: '',
      encounter_rate: '',
      size: { length: 0, mass: 0 }
    };
    context.system.attack = {
      type: '',
      damage: 0,
      venom: { effect: '', onset: '', damage: 0 }
    };
    
    // Set required dropdown data
    context.threatLevels = [
      { value: "low", label: "Low Threat", numeric: 1 },
      { value: "medium", label: "Medium Threat", numeric: 2 },
      { value: "high", label: "High Threat", numeric: 3 }
    ];
    context.resourceValues = [
      { value: "low", label: "Low Value", numeric: 1 },
      { value: "medium", label: "Medium Value", numeric: 2 },
      { value: "high", label: "High Value", numeric: 3 }
    ];
    context.hasVenom = false;
    
    console.log('BluePlanet: Safe defaults set, exiting _prepareCreatureData');
    return; // Exit immediately with safe defaults
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const weapons = [];
    const equipment = [];
    const biomods = [];
    const features = [];
    const skills = [];
    const species = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || "icons/svg/item-bag.svg";
      // Append to weapons.
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      // Append to equipment.
      else if (i.type === 'equipment') {
        equipment.push(i);
      }
      // Append to biomods.
      else if (i.type === 'biomod') {
        biomods.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to skills.
      else if (i.type === 'skill') {
        skills.push(i);
      }
      // Append to species.
      else if (i.type === 'species') {
        species.push(i);
      }
    }

    // Assign and return
    context.weapons = weapons;
    context.equipment = equipment;
    context.biomods = biomods;
    context.features = features;
    context.skills = skills;
    context.species = species;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });
    
    // Weapon damage roll from actor sheet
    html.find('.weapon-damage-roll').click(this._onWeaponDamageRoll.bind(this));
    
    // Item equip/unequip functionality
    html.find('.item-equip').click(this._onItemEquip.bind(this));
    html.find('.item-unequip').click(this._onItemUnequip.bind(this));
    html.find('.item-activate').click(this._onItemActivate.bind(this));
    html.find('.item-deactivate').click(this._onItemDeactivate.bind(this));

    // Active Effect management
    html.find(".effect-control").click(ev => this._onManageActiveEffect(ev));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Attribute rolls (both buttons and clickable names)
    html.find('.attribute-roll').click(this._onAttributeRoll.bind(this));

    // Skill rolls (both buttons and clickable names)
    html.find('.skill-roll').click(this._onSkillRoll.bind(this));

    // Focus attribute selection
    html.find('.focus-select').change(this._onFocusChange.bind(this));

    // Pip track functionality - using event delegation for better reliability
    html.on('click', '.chip-pip', this._onClickChipPip.bind(this));
    html.on('click', '.reputation-pip', this._onClickReputationPip.bind(this));
    html.on('click', '.strain-pip', this._onClickStrainPip.bind(this));
    html.on('click', '.wound-pip', this._onClickWoundPip.bind(this));
    html.on('click', '.threat-pip', this._onClickThreatPip.bind(this));
    html.on('click', '.resource-pip', this._onClickResourcePip.bind(this));
    
    // Profile tab functionality
    html.find('.add-tag-btn').click(this._onAddTag.bind(this));
    html.find('.tag-delete').click(this._onDeleteTag.bind(this));
    html.find('.add-track-btn').click(this._onAddTrack.bind(this));
    
    // Track delete with both direct and event delegation approaches
    const trackDeleteElements = html.find('.track-delete');
    console.log('BluePlanet: Found', trackDeleteElements.length, 'track-delete elements');
    trackDeleteElements.click(this._onDeleteTrack.bind(this));
    
    // Also use event delegation as backup
    html.on('click', '.track-delete', this._onDeleteTrack.bind(this));
    
    // Add global debug function for testing (temporary)
    window.debugDeleteTrack = (key) => {
      console.log('Debug: Attempting to delete track with key:', key);
      this._onDeleteTrack({ preventDefault: () => {}, currentTarget: { dataset: { key } } });
    };
    
    html.find('.add-tie-btn').click(this._onAddTie.bind(this));
    html.find('.tie-delete').click(this._onDeleteTie.bind(this));
    
    // Skill management functionality
    html.find('.skill-edit').click(this._onEditSkill.bind(this));
    html.find('.skill-delete').click(this._onDeleteSkill.bind(this));

    // Portrait change functionality
    html.find('.portrait-clickable').click(this._onChangePortrait.bind(this));

    // Strain recovery functionality
    html.find('.strain-recover').click(this._onStrainRecover.bind(this));
    html.find('.strain-recover-all').click(this._onStrainRecoverAll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
    
    // Apply initial pip states after DOM is ready
    setTimeout(() => {
      this._restoreAllPipStates();
    }, 100);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    
    // Special handling for skills - use the enhanced dialog
    if (type === 'skill') {
      return this._onCreateSkill();
    }
    
    // Handle other item types normally
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
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

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[${dataset.label}]` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Handle attribute rolls
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttributeRoll(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const attributeName = dataset.attribute;
    const focusType = dataset.focus; // 'primary' or 'secondary' if rolling focus attribute
    
    const attribute = this.actor.system.attributes[attributeName];
    if (!attribute) {
      ui.notifications.warn(`Invalid attribute: ${attributeName}`);
      return;
    }
    
    // Helper to capitalize attribute names
    const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    
    // Prepare roll data for the dialog
    let rollData;
    if (focusType && attribute.focus && attribute.focus[focusType] && attribute.focus[focusType].name) {
      // Rolling focus attribute
      const focus = attribute.focus[focusType];
      rollData = {
        label: `${focus.name} (${capitalizeFirst(attributeName)}) Test`,
        type: 'attribute',
        skillName: focus.name,
        skillRank: 5, // Base attribute test difficulty
        attribute: attributeName,
        attributeValue: focus.value || attribute.value + 1,
        dice: '1d10',
        levelType: 'focus',
        targetNumber: 5 + (focus.value || attribute.value + 1),
        focusType: focusType,
        useFocus: true
      };
    } else {
      // Rolling base attribute
      rollData = {
        label: `${capitalizeFirst(attributeName)} Test`,
        type: 'attribute',
        skillName: capitalizeFirst(attributeName),
        skillRank: 5, // Base attribute test difficulty
        attribute: attributeName,
        attributeValue: attribute.value,
        dice: '1d10',
        levelType: 'attribute',
        targetNumber: 5 + attribute.value,
        useFocus: false
      };
    }
    
    // Open the enhanced strain roll dialog
    console.log('BluePlanet Actor Sheet: Opening enhanced attribute roll dialog');
    try {
      const { showEnhancedBluePlanetRollDialog } = await import('../enhanced-roll-dialog.js');
      showEnhancedBluePlanetRollDialog(this.actor, rollData);
    } catch (error) {
      console.error('BluePlanet Actor Sheet: Error opening enhanced attribute roll dialog:', error);
      
      // Fallback to basic dialog
      try {
        const { showBluePlanetRollDialog } = await import('../roll-dialog-fixed.js');
        showBluePlanetRollDialog(this.actor, rollData);
      } catch (fallbackError) {
        console.error('BluePlanet Actor Sheet: All attribute roll dialogs failed:', fallbackError);
        ui.notifications.error('Error opening roll dialog. Check console for details.');
        
        // Final fallback to direct roll
        const options = {};
        if (focusType) {
          options.useFocus = true;
          options.focusType = focusType;
        }
        return this.actor.rollAttribute(attributeName, options);
      }
    }
  }

  /**
   * Handle skill rolls
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
    const attribute = skill.system.attribute || null; // No default attribute
    const diceFormula = this._getDiceFormula(levelType);
    
    console.log(`BluePlanet Character Sheet Skill Roll - ${skill.name}:`);
    console.log(`  - Level Type: ${levelType}`);
    console.log(`  - Dice Formula: ${diceFormula}`);
    console.log(`  - Attribute: ${attribute}`);
    
    const rollData = {
      label: `${skill.name} (${this._getLevelLabel(levelType)})`,
      type: 'skill',
      skillName: skill.name,
      skillRank: skill.system.rank || 1,
      attribute: attribute || 'cognition', // Default to cognition for dialog
      attributeValue: attribute ? (this.actor.system.attributes[attribute]?.value || 0) : 0,
      dice: diceFormula,
      levelType: levelType,
      targetNumber: 10
    };
    
    // Open the enhanced strain roll dialog
    console.log('BluePlanet Actor Sheet: Opening enhanced strain roll dialog');
    try {
      const { showEnhancedBluePlanetRollDialog } = await import('../enhanced-roll-dialog.js');
      showEnhancedBluePlanetRollDialog(this.actor, rollData);
    } catch (error) {
      console.error('BluePlanet Actor Sheet: Error opening enhanced roll dialog, falling back to basic:', error);
      
      // Fallback to basic fixed dialog
      try {
        const { showBluePlanetRollDialog } = await import('../roll-dialog-fixed.js');
        showBluePlanetRollDialog(this.actor, rollData);
      } catch (fallbackError) {
        console.error('BluePlanet Actor Sheet: All roll dialogs failed:', fallbackError);
        ui.notifications.error('Error opening roll dialog. Check console for details.');
      }
    }
  }
  
  /**
   * Handle weapon attack rolls from actor sheet
   * @param {Event} event   The originating click event
   * @private
   */
  async _onWeaponAttackRoll(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const itemId = dataset.itemId;
    
    // Get the weapon item
    const weapon = this.actor.items.get(itemId);
    if (!weapon || weapon.type !== 'weapon') {
      ui.notifications.warn('Weapon not found');
      return;
    }
    
    // Determine appropriate combat skills based on weapon type
    const weaponType = weapon.system.weapon_type || 'melee';
    const combatSkills = this._getCombatSkills(weaponType);
    
    if (combatSkills.length === 0) {
      ui.notifications.warn('No appropriate combat skills found for this weapon type.');
      return;
    }
    
    // Prepare roll data for weapon attack
    const rollData = {
      label: `${weapon.name} Attack`,
      type: 'weapon',
      weaponName: weapon.name,
      weaponType: weaponType,
      skillName: combatSkills[0].name, // Default to first available combat skill
      skillRank: combatSkills[0].rank || 1,
      attribute: combatSkills[0].attribute || 'coordination',
      attributeValue: this.actor.system.attributes[combatSkills[0].attribute || 'coordination']?.value || 0,
      dice: combatSkills[0].dice || '1d10',
      levelType: combatSkills[0].level_type || 'general',
      targetNumber: 10, // Default target number
      combatSkills: combatSkills, // Available combat skills to choose from
      weapon: weapon
    };
    
    // Open the weapon attack roll dialog
    console.log('BluePlanet Actor Sheet: Opening weapon attack roll dialog');
    try {
      const { showWeaponAttackRollDialog } = await import('../weapon-attack-dialog.js');
      showWeaponAttackRollDialog(this.actor, rollData);
    } catch (error) {
      console.error('BluePlanet Actor Sheet: Error opening weapon attack roll dialog:', error);
      
      // Fallback to enhanced dialog
      try {
        const { showEnhancedBluePlanetRollDialog } = await import('../enhanced-roll-dialog.js');
        showEnhancedBluePlanetRollDialog(this.actor, rollData);
      } catch (fallbackError) {
        console.error('BluePlanet Actor Sheet: All weapon attack roll dialogs failed:', fallbackError);
        ui.notifications.error('Error opening weapon attack roll dialog. Check console for details.');
      }
    }
  }
  
  /**
   * Get available combat skills for a weapon type
   * @param {string} weaponType - The type of weapon (melee, firearm, etc.)
   * @returns {Array} Array of available combat skills
   * @private
   */
  _getCombatSkills(weaponType) {
    const combatSkills = [];
    const skills = this.actor.system.skills || {};
    
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
   * Handle weapon damage rolls from actor sheet
   * @param {Event} event   The originating click event
   * @private
   */
  async _onWeaponDamageRoll(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const itemId = dataset.itemId;
    
    // Get the weapon item
    const weapon = this.actor.items.get(itemId);
    if (!weapon || weapon.type !== 'weapon') {
      ui.notifications.warn('Weapon not found');
      return;
    }
    
    const damage = weapon.system.damage;
    
    if (!damage || damage <= 0) {
      ui.notifications.warn("This weapon has no damage rating set.");
      return;
    }
    
    // Import chat utils for scrolling
    const { delayedScrollChatToBottom } = await import('../chat-utils.js');
    
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
    let flavorText = `<h3>${weapon.name}</h3>`;
    flavorText += `<p style="color: black; font-size: 11px; margin: 2px 0;"><em>Damage Test - ${weapon.system.weapon_type.charAt(0).toUpperCase() + weapon.system.weapon_type.slice(1)} Weapon</em></p>`;
    flavorText += `<p><strong>Damage Rating:</strong> ${damage} | <strong>Dice Roll:</strong> [${sortedResults.join(', ')}] | <strong>Successes:</strong> ${successes}</p>`;
    flavorText += `<p style="font-size: 10px; color: #666;"><em>Each die ≤ ${damage} counts as a success</em></p>`;
    flavorText += `<p><strong style="color: ${resultColor}">${woundLevel}</strong></p>`;
    
    // Add additional weapon info if available
    if (weapon.system.effective_range && weapon.system.weapon_type !== 'melee') {
      flavorText += `<p style="color: black; font-size: 11px;"><em>Range: ${weapon.system.effective_range}m</em></p>`;
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
          weapon: weapon.name,
          weaponType: weapon.system.weapon_type,
          damageRating: damage,
          diceResults: sortedResults,
          successes: successes,
          woundLevel: woundLevel
        }
      }
    };
    
    const message = await roll.toMessage(messageData);
    
    // The accordion functionality is handled globally in blue-planet-recontact.js
    // Add debugging to verify the HTML structure
    setTimeout(() => {
      const accordions = $('.damage-accordion-header');
      const contents = $('.damage-accordion-content');
      console.log('BluePlanet: Message created - Headers:', accordions.length, 'Contents:', contents.length);
      
      // Log the structure of the latest accordion
      if (accordions.length > 0) {
        const lastAccordion = accordions.last();
        const targetId = lastAccordion.data('target');
        const targetContent = $(`#${targetId}`);
        console.log('BluePlanet: Last accordion target:', targetId, 'Found content:', targetContent.length);
        
        if (targetContent.length === 0) {
          console.log('BluePlanet: Trying alternative search...');
          const altContent = lastAccordion.parent().find('.damage-accordion-content');
          console.log('BluePlanet: Alternative content found:', altContent.length);
        }
      }
    }, 200);
    
    // Auto-scroll chat messages to bottom
    delayedScrollChatToBottom();
  }
  
  /**
   * Handle equipping an item
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemEquip(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const itemId = dataset.itemId;
    
    const item = this.actor.items.get(itemId);
    if (!item) {
      ui.notifications.warn('Item not found');
      return;
    }
    
    await item.update({"system.equipped": true});
    ui.notifications.info(`${item.name} equipped`);
  }
  
  /**
   * Handle unequipping an item
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemUnequip(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const itemId = dataset.itemId;
    
    const item = this.actor.items.get(itemId);
    if (!item) {
      ui.notifications.warn('Item not found');
      return;
    }
    
    await item.update({"system.equipped": false});
    ui.notifications.info(`${item.name} unequipped`);
  }
  
  /**
   * Handle activating a biomod
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemActivate(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const itemId = dataset.itemId;
    
    const item = this.actor.items.get(itemId);
    if (!item) {
      ui.notifications.warn('Item not found');
      return;
    }
    
    await item.update({"system.active": true});
    ui.notifications.info(`${item.name} activated`);
  }
  
  /**
   * Handle deactivating a biomod
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemDeactivate(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const itemId = dataset.itemId;
    
    const item = this.actor.items.get(itemId);
    if (!item) {
      ui.notifications.warn('Item not found');
      return;
    }
    
    await item.update({"system.active": false});
    ui.notifications.info(`${item.name} deactivated`);
  }

  /**
   * Handle focus attribute changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onFocusChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const attribute = element.dataset.attribute;
    const focus = element.dataset.focus;
    const value = element.value;

    const updateData = {};
    updateData[`system.attributes.${attribute}.focus.${focus}.name`] = value;
    
    return this.actor.update(updateData);
  }

  /**
   * Handle managing active effects
   * @param {Event} event   The originating click event
   * @private
   */
  async _onManageActiveEffect(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest("li");
    const effect = li.dataset.effectId ? this.actor.effects.get(li.dataset.effectId) : null;
    switch (a.dataset.action) {
      case "create":
        return this.actor.createEmbeddedDocuments("ActiveEffect", [{
          label: "New Effect",
          icon: "icons/svg/aura.svg",
          origin: this.actor.uuid,
          "duration.rounds": undefined,
          disabled: false
        }]);
      case "edit":
        return effect.sheet.render(true);
      case "delete":
        return effect.delete();
      case "toggle":
        return effect.update({disabled: !effect.disabled});
    }
  }

  /**
   * Manually update pip visual classes with persistent tracking
   * @param {string} pipType Type of pip (chip, strain, etc)
   * @param {string} subType Subtype for strain pips (mental/physical)
   * @param {number} currentValue The current value to display
   * @private
   */
  _updatePipClasses(pipType, subType = null, currentValue = 0) {
    let selector;
    if (pipType === 'chip') {
      selector = '.chip-pip';
    } else if (pipType === 'strain' && subType) {
      selector = `.strain-pip[data-type="${subType}"]`;
    } else if (pipType === 'reputation') {
      selector = '.reputation-pip';
    } else if (pipType === 'wound' && subType) {
      selector = `.wound-pip[data-type="${subType}"]`;
    } else {
      console.warn(`BluePlanet: Unknown pip type: ${pipType} ${subType}`);
      return;
    }
    
    const pips = document.querySelectorAll(selector);
    pips.forEach(pip => {
      const pipValue = parseInt(pip.dataset.value);
      if (pipValue <= currentValue) {
        pip.classList.add('filled');
        pip.setAttribute('data-manually-filled', 'true'); // Mark as manually filled
      } else {
        pip.classList.remove('filled');
        pip.removeAttribute('data-manually-filled');
      }
    });
    
    console.log(`BluePlanet: Manually updated ${pips.length} ${pipType} ${subType ? subType : ''} pips, ${currentValue} filled`);
    
    // Store the current values to restore after any re-renders
    this._storePipState(pipType, subType, currentValue);
  }

  /**
   * Store pip state for restoration after re-renders
   * @param {string} pipType 
   * @param {string} subType 
   * @param {number} currentValue 
   * @private
   */
  _storePipState(pipType, subType, currentValue) {
    if (!this._pipStates) this._pipStates = new Map();
    
    const key = subType ? `${pipType}-${subType}` : pipType;
    this._pipStates.set(key, currentValue);
    console.log(`BluePlanet: Stored pip state ${key} = ${currentValue}`);
  }

  /**
   * Restore all pip states after a re-render
   * @private
   */
  _restoreAllPipStates() {
    if (!this._pipStates || this._pipStates.size === 0) return;
    
    console.log('BluePlanet: Restoring pip states after render...');
    
    this._pipStates.forEach((value, key) => {
      const parts = key.split('-');
      const pipType = parts[0];
      const subType = parts.length > 1 ? parts[1] : null;
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        this._updatePipClasses(pipType, subType, value);
      }, 10);
    });
  }

  /**
   * Initialize pip states from current actor data
   * @private
   */
  _initializePipStates() {
    if (!this._pipStates) this._pipStates = new Map();
    
    // Initialize CHIPS
    const chips = this.actor.system.advancement?.chips || 0;
    this._pipStates.set('chip', chips);
    
    // Initialize Reputation
    const reputation = this.actor.system.profile?.reputation?.level || 0;
    this._pipStates.set('reputation', reputation);
    
    // Initialize Strain
    if (this.actor.system.strain) {
      const mentalStrain = this.actor.system.strain.mental?.value || 0;
      const physicalStrain = this.actor.system.strain.physical?.value || 0;
      this._pipStates.set('strain-mental', mentalStrain);
      this._pipStates.set('strain-physical', physicalStrain);
    }
    
    // Initialize Wounds
    if (this.actor.system.wounds) {
      const minorWounds = this.actor.system.wounds.minor || 0;
      const majorWounds = this.actor.system.wounds.major || 0;
      const mortalWounds = this.actor.system.wounds.mortal || 0;
      this._pipStates.set('wound-minor', minorWounds);
      this._pipStates.set('wound-major', majorWounds);
      this._pipStates.set('wound-mortal', mortalWounds);
    }
    
    console.log('BluePlanet: Initialized pip states:', Array.from(this._pipStates.entries()));
  }

  /**
   * Update the total wound penalty display
   * @private
   */
  _updateTotalWoundPenalty() {
    const minor = this.actor.system.wounds?.minor || 0;
    const major = this.actor.system.wounds?.major || 0;
    const mortal = this.actor.system.wounds?.mortal || 0;
    const totalPenalty = -(minor + (major * 2) + (mortal * 3));
    
    const totalDisplay = document.querySelector('.total-penalty strong');
    if (totalDisplay) {
      totalDisplay.textContent = `Total Penalty: ${totalPenalty}`;
    }
    
    console.log(`BluePlanet: Updated total wound penalty to ${totalPenalty}`);
  }

  /**
   * Handle clicking on CHIPS pip
   * @param {Event} event   The originating click event
   * @private
   */
  async _onClickChipPip(event) {
    event.preventDefault();
    console.log('BluePlanet: CHIPS pip clicked');
    ui.notifications.info('CHIPS pip clicked!'); // Visible notification
    
    const value = parseInt(event.currentTarget.dataset.value);
    const currentValue = this.actor.system.advancement?.chips || 0;
    
    console.log('BluePlanet: CHIPS - clicked value:', value, 'current:', currentValue);
    console.log('BluePlanet: Full advancement data:', this.actor.system.advancement);
    
    // Toggle behavior: if clicking on current value or lower, decrease by 1
    // If clicking higher, set to that value
    const newValue = (value <= currentValue) ? value - 1 : value;
    
    console.log('BluePlanet: CHIPS - setting new value:', newValue);
    ui.notifications.info(`Setting CHIPS to ${newValue}`);
    
    const result = await this.actor.update({"system.advancement.chips": Math.max(0, newValue)});
    
    // DEBUG: Check if the data was actually updated
    console.log('BluePlanet: CHIPS after update:', this.actor.system.advancement.chips);
    
    // Update pip visuals immediately without re-rendering the entire sheet
    const expectedFilled = Math.max(0, newValue);
    this._updatePipClasses('chip', null, expectedFilled);
    
    // Update the displayed value
    const chipsValueDisplay = document.querySelector('.chips-track .pip-value');
    if (chipsValueDisplay) {
      chipsValueDisplay.textContent = expectedFilled;
    }
    
    return result;
  }
  
  /**
   * Handle clicking on Reputation pip
   * @param {Event} event   The originating click event
   * @private
   */
  async _onClickReputationPip(event) {
    event.preventDefault();
    console.log('BluePlanet: Reputation pip clicked');
    
    const value = parseInt(event.currentTarget.dataset.value);
    const currentValue = this.actor.system.profile?.reputation?.level || 0;
    
    console.log('BluePlanet: Reputation - clicked value:', value, 'current:', currentValue);
    
    // Toggle behavior: if clicking on current value or lower, decrease by 1
    // If clicking higher, set to that value
    const newValue = (value <= currentValue) ? value - 1 : value;
    
    console.log('BluePlanet: Reputation - setting new value:', newValue);
    
    const result = await this.actor.update({"system.profile.reputation.level": Math.max(0, newValue)});
    
    // Update pip visuals immediately
    const expectedFilled = Math.max(0, newValue);
    this._updatePipClasses('reputation', null, expectedFilled);
    
    // Update the displayed value
    const reputationValueDisplay = document.querySelector('.reputation-track .pip-value');
    if (reputationValueDisplay) {
      reputationValueDisplay.textContent = expectedFilled;
    }
    
    return result;
  }
  
  /**
   * Handle clicking on Strain pip
   * @param {Event} event   The originating click event
   * @private
   */
  async _onClickStrainPip(event) {
    event.preventDefault();
    console.log('BluePlanet: Strain pip clicked');
    ui.notifications.info('Strain pip clicked!'); // Visible notification
    
    const value = parseInt(event.currentTarget.dataset.value);
    const type = event.currentTarget.dataset.type; // 'mental' or 'physical'
    const currentValue = this.actor.system.strain?.[type]?.value || 0;
    
    console.log('BluePlanet: Strain - clicked value:', value, 'type:', type, 'current:', currentValue);
    console.log('BluePlanet: Full strain data:', this.actor.system.strain);
    
    // Toggle behavior: if clicking on current value or lower, decrease by 1
    // If clicking higher, set to that value
    const newValue = (value <= currentValue) ? value - 1 : value;
    
    console.log('BluePlanet: Strain - setting new value:', newValue);
    ui.notifications.info(`Setting ${type} strain to ${newValue}`);
    
    const result = await this.actor.update({[`system.strain.${type}.value`]: Math.max(0, newValue)});
    
    // DEBUG: Check if the data was actually updated
    console.log(`BluePlanet: ${type} strain after update:`, this.actor.system.strain[type].value);
    
    // Update pip visuals immediately without re-rendering the entire sheet
    const expectedFilled = Math.max(0, newValue);
    this._updatePipClasses('strain', type, expectedFilled);
    
    // Update the displayed value for the specific strain type
    const strainTypeSection = document.querySelector(`.strain-pip[data-type="${type}"]`)?.closest('.strain-type');
    if (strainTypeSection) {
      const strainValueDisplay = strainTypeSection.querySelector('.pip-value');
      if (strainValueDisplay) {
        const maxValue = this.actor.system.strain[type].max;
        strainValueDisplay.textContent = `${expectedFilled}/${maxValue}`;
        console.log(`BluePlanet: Updated ${type} strain display to ${expectedFilled}/${maxValue}`);
      }
    }
    
    return result;
  }
  
  /**
   * Handle clicking on Wound pip
   * @param {Event} event   The originating click event
   * @private
   */
  async _onClickWoundPip(event) {
    event.preventDefault();
    console.log('BluePlanet: Wound pip clicked');
    
    const value = parseInt(event.currentTarget.dataset.value);
    const type = event.currentTarget.dataset.type; // 'minor', 'major', or 'mortal'
    const currentValue = this.actor.system.wounds?.[type] || 0;
    
    console.log('BluePlanet: Wound - clicked value:', value, 'type:', type, 'current:', currentValue);
    
    // Toggle behavior: if clicking on current value or lower, decrease by 1
    // If clicking higher, set to that value
    const newValue = (value <= currentValue) ? value - 1 : value;
    
    console.log('BluePlanet: Wound - setting new value:', newValue);
    
    const result = await this.actor.update({[`system.wounds.${type}`]: Math.max(0, newValue)});
    
    // Update pip visuals immediately
    const expectedFilled = Math.max(0, newValue);
    this._updatePipClasses('wound', type, expectedFilled);
    
    // Update the displayed penalty value
    const woundTypeSection = document.querySelector(`.wound-pip[data-type="${type}"]`)?.closest('.wound-type');
    if (woundTypeSection) {
      const penaltyDisplay = woundTypeSection.querySelector('.wound-penalty');
      if (penaltyDisplay) {
        let penalty;
        if (type === 'minor') penalty = expectedFilled;
        else if (type === 'major') penalty = expectedFilled * 2;
        else if (type === 'mortal') penalty = expectedFilled * 3;
        penaltyDisplay.textContent = `(-${penalty})`;
      }
    }
    
    // Update total wound penalty
    this._updateTotalWoundPenalty();
    
    return result;
  }
  
  /**
   * Handle adding a new tag
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddTag(event) {
    event.preventDefault();
    // Ensure tags is always an array
    const currentTags = this.actor.system.tags;
    const tags = Array.isArray(currentTags) ? [...currentTags] : [];
    tags.push("");
    return this.actor.update({"system.tags": tags});
  }
  
  /**
   * Handle deleting a tag
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteTag(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    
    // Robust validation for tags
    const currentTags = this.actor.system.tags;
    if (!Array.isArray(currentTags)) {
      console.warn('BluePlanet: tags is not an array, initializing as empty array:', currentTags);
      return this.actor.update({"system.tags": []});
    }
    
    if (index < 0 || index >= currentTags.length) {
      ui.notifications.warn(`Invalid tag index: ${index}`);
      return;
    }
    
    const tags = [...currentTags];
    tags.splice(index, 1);
    return this.actor.update({"system.tags": tags});
  }
  
  /**
   * Handle adding a new track
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddTrack(event) {
    event.preventDefault();
    // Ensure tracks is always an object
    const currentTracks = this.actor.system.tracks;
    const tracks = (currentTracks && typeof currentTracks === 'object' && !Array.isArray(currentTracks)) 
      ? foundry.utils.deepClone(currentTracks) 
      : {};
    const id = foundry.utils.randomID();
    tracks[id] = { name: "", value: 0 };
    return this.actor.update({"system.tracks": tracks});
  }
  
  /**
   * Handle deleting a track
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteTrack(event) {
    console.log('BluePlanet: _onDeleteTrack function called!');
    
    try {
      event.preventDefault();
      const key = event.currentTarget.dataset.key;
      
      console.log('BluePlanet: Delete track called with key:', key);
      console.log('BluePlanet: Current tracks:', this.actor.system.tracks);
      
      if (!key) {
        console.warn('BluePlanet: No track key provided');
        ui.notifications.warn('No track key provided');
        return;
      }
      
      // Simple approach - get tracks and delete the key
      const currentTracks = foundry.utils.deepClone(this.actor.system.tracks || {});
      
      if (!currentTracks.hasOwnProperty(key)) {
        console.warn('BluePlanet: Track key not found:', key);
        console.warn('BluePlanet: Available keys:', Object.keys(currentTracks));
        ui.notifications.warn(`Track "${key}" not found`);
        return;
      }
      
      // Delete the track using Foundry's unset method
      const updateKey = `system.tracks.-=${key}`;
      console.log('BluePlanet: Using unset approach with key:', updateKey);
      
      let result = await this.actor.update({ [updateKey]: null });
      
      console.log('BluePlanet: Unset result:', result);
      
      // If unset failed, try the traditional method
      if (!result) {
        console.log('BluePlanet: Unset failed, trying traditional update...');
        delete currentTracks[key];
        result = await this.actor.update({ "system.tracks": currentTracks });
        console.log('BluePlanet: Traditional update result:', result);
      }
      
      console.log('BluePlanet: Actor tracks after update:', this.actor.system.tracks);
      
      if (result) {
        ui.notifications.info(`Track deleted successfully`);
      } else {
        ui.notifications.error('Both update methods failed');
      }
      
      return result;
      
    } catch (error) {
      console.error('BluePlanet: Error in _onDeleteTrack:', error);
      ui.notifications.error('Error deleting track: ' + error.message);
    }
  }
  
  /**
   * Handle adding a new tie
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddTie(event) {
    event.preventDefault();
    // Ensure ties is always an array
    const currentTies = this.actor.system.ties;
    const ties = Array.isArray(currentTies) ? [...currentTies] : [];
    ties.push({ name: "", relationship: "contact", description: "" });
    return this.actor.update({"system.ties": ties});
  }
  
  /**
   * Handle deleting a tie
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteTie(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    
    // Robust validation for ties
    const currentTies = this.actor.system.ties;
    if (!Array.isArray(currentTies)) {
      console.warn('BluePlanet: ties is not an array, initializing as empty array:', currentTies);
      return this.actor.update({"system.ties": []});
    }
    
    if (index < 0 || index >= currentTies.length) {
      ui.notifications.warn(`Invalid tie index: ${index}`);
      return;
    }
    
    const ties = [...currentTies];
    ties.splice(index, 1);
    return this.actor.update({"system.ties": ties});
  }
  
  /**
   * Handle creating a new skill using the enhanced dialog
   * @private
   */
  async _onCreateSkill() {
    const dialog = new BluePlanetSkillDialog(this.actor);
    return dialog.render(true);
  }
  
  /**
   * Handle editing an existing skill
   * @param {Event} event   The originating click event
   * @private
   */
  async _onEditSkill(event) {
    event.preventDefault();
    const skillId = event.currentTarget.dataset.skillId;
    const skillData = this.actor.system.skills[skillId];
    
    if (!skillData) {
      ui.notifications.warn("Skill not found!");
      return;
    }
    
    const dialog = new BluePlanetSkillDialog(this.actor, skillData);
    return dialog.render(true);
  }
  
  /**
   * Handle deleting a skill
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteSkill(event) {
    event.preventDefault();
    const skillId = event.currentTarget.dataset.skillId || event.currentTarget.closest('[data-skill-id]')?.dataset.skillId;
    
    if (!skillId) {
      ui.notifications.warn("Could not identify skill to delete!");
      return;
    }
    
    const skillData = this.actor.system.skills?.[skillId];
    
    if (!skillData) {
      ui.notifications.warn(`Skill with ID "${skillId}" not found!`);
      return;
    }
    
    const confirm = await Dialog.confirm({
      title: "Delete Skill",
      content: `<p>Are you sure you want to delete the skill "${skillData.label}"? This cannot be undone.</p>`,
      yes: () => true,
      no: () => false
    });
    
    if (!confirm) return;
    
    const currentSkills = foundry.utils.deepClone(this.actor.system.skills || {});
    delete currentSkills[skillId];
    
    try {
      await this.actor.update({ 'system.skills': currentSkills });
      ui.notifications.info(`Skill "${skillData.label}" deleted successfully!`);
    } catch (error) {
      ui.notifications.error("Failed to delete skill. Check console for details.");
      console.error("BluePlanet Actor Sheet: Error deleting skill:", error);
    }
  }

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Object}             OwnedItem data that was dropped
   * @override
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);
    }
  }

  /**
   * Handle the dropping of an item onto this actor sheet.
   * @param {Event} event   The originating drop event
   * @param {Object} data   The data being dropped
   * @private
   */
  async _onDropItem(event, data) {
    if ( !this.actor.isOwner ) return false;
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    // Handle item sorting within the same Actor
    if ( this.actor.uuid === item.parent?.uuid ) return this._onSortItem(event, itemData);

    // Create the owned item
    return this._onDropItemCreate(itemData);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Object} itemData   The item data to create
   * @private
   */
  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    
    // Special handling for skill items
    for (let item of itemData) {
      if (item.type === 'skill') {
        // Add the skill to the actor's skills system
        const skillId = item.name.toLowerCase().replace(/\s+/g, '_');
        const skillData = {
          label: item.name,
          rank: item.system.rank || 1,
          level_type: item.system.level_type || 'general',
          attribute: item.system.attribute || null, // No default attribute
          category: item.system.category || 'other',
          description: item.system.description || '',
          levels: item.system.levels || {},
          tags: item.system.tags || []
        };
        
        // Update the actor's skills
        const currentSkills = foundry.utils.deepClone(this.actor.system.skills || {});
        currentSkills[skillId] = skillData;
        
        await this.actor.update({'system.skills': currentSkills});
        
        ui.notifications.info(`Added skill "${item.name}" to ${this.actor.name}`);
      }
    }
    
    return this.actor.createEmbeddedDocuments("Item", itemData);
  }

  /**
   * Get dice formula based on skill level
   * @param {string} levelType The skill level type
   * @returns {string} The dice formula
   * @private
   */
  _getDiceFormula(levelType) {
    switch (levelType) {
      case 'core':
        return '2d10kl'; // 2d10 keep lowest (Foundry syntax)
      case 'specialty':
        return '3d10kl'; // 3d10 keep lowest (Foundry syntax)
      case 'general':
      default:
        return '1d10'; // Standard 1d10
    }
  }
  
  /**
   * Get human readable label for skill level
   * @param {string} levelType The skill level type
   * @returns {string} The level label
   * @private
   */
  _getLevelLabel(levelType) {
    switch (levelType) {
      case 'core':
        return 'Core Level';
      case 'specialty':
        return 'Specialty Level';
      case 'general':
      default:
        return 'General Level';
    }
  }

  /**
   * Handle changing the actor's portrait image
   * @param {Event} event   The originating click event
   * @private
   */
  async _onChangePortrait(event) {
    event.preventDefault();
    
    // Only allow owners to change the portrait
    if (!this.actor.isOwner) {
      ui.notifications.warn("You do not have permission to change this actor's portrait.");
      return;
    }
    
    const current = this.actor.img;
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: (path) => {
        this.actor.update({ img: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    
    return fp.browse();
  }

  /**
   * Handle clicking on Threat Level pip
   * @param {Event} event   The originating click event
   * @private
   */
  async _onClickThreatPip(event) {
    event.preventDefault();
    console.log('BluePlanet: Threat pip clicked');
    
    const value = parseInt(event.currentTarget.dataset.value);
    let currentValue = this.actor.system.biology?.threat_level || 0;
    
    // Convert string values to numbers for comparison
    if (typeof currentValue === 'string') {
      currentValue = currentValue === 'low' ? 1 : currentValue === 'medium' ? 2 : currentValue === 'high' ? 3 : 0;
    }
    
    console.log('BluePlanet: Threat - clicked value:', value, 'current:', currentValue);
    
    // Toggle behavior: if clicking on current value or lower, decrease by 1
    // If clicking higher, set to that value
    const newValue = (value <= currentValue) ? value - 1 : value;
    
    console.log('BluePlanet: Threat - setting new value:', newValue);
    
    return this.actor.update({"system.biology.threat_level": Math.max(0, newValue)});
  }

  /**
   * Handle clicking on Resource Value pip
   * @param {Event} event   The originating click event
   * @private
   */
  async _onClickResourcePip(event) {
    event.preventDefault();
    console.log('BluePlanet: Resource pip clicked');
    
    const value = parseInt(event.currentTarget.dataset.value);
    let currentValue = this.actor.system.biology?.resource_value || 0;
    
    // Convert string values to numbers for comparison
    if (typeof currentValue === 'string') {
      currentValue = currentValue === 'low' ? 1 : currentValue === 'medium' ? 2 : currentValue === 'high' ? 3 : 0;
    }
    
    console.log('BluePlanet: Resource - clicked value:', value, 'current:', currentValue);
    
    // Toggle behavior: if clicking on current value or lower, decrease by 1
    // If clicking higher, set to that value
    const newValue = (value <= currentValue) ? value - 1 : value;
    
    console.log('BluePlanet: Resource - setting new value:', newValue);
    
    return this.actor.update({"system.biology.resource_value": Math.max(0, newValue)});
  }

  /**
   * Handle strain recovery (partial)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onStrainRecover(event) {
    event.preventDefault();
    
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
              
              // Update pip display
              if (mentalAmount > 0) {
                this._updatePipClasses('strain', 'mental', updates[`system.strain.mental.value`]);
              }
              if (physicalAmount > 0) {
                this._updatePipClasses('strain', 'physical', updates[`system.strain.physical.value`]);
              }
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
   * Handle full strain recovery
   * @param {Event} event   The originating click event
   * @private
   */
  async _onStrainRecoverAll(event) {
    event.preventDefault();
    
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
}
