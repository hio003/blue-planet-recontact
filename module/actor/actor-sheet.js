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
      dragDrop: [
        {dragSelector: ".item-list .item", dropSelector: null},
        {dragSelector: ".biomod-list .item", dropSelector: ".biomods-section"},
        {dragSelector: ".cyberware-list .item", dropSelector: ".cyberware-section"}
      ],
      popOut: true,
      // RESIZABLE: Enabled for ALL actor types (character, cetacean, npc, creature)
      // Users can drag the bottom-right corner to resize sheets
      resizable: true,
      minimizable: true,
      dragHandle: ".window-header",
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
    
    // Apply theme class to the window element
    if (this.element?.[0]) {
      const globalTheme = game.settings.get('blue-planet-recontact', 'defaultSheetTheme') ?? 'blue-planet';
      const theme = this.actor.getFlag('blue-planet-recontact', 'sheetTheme') ?? globalTheme;
      const el = this.element[0];
      el.classList.remove('bpr-theme-blue-planet', 'bpr-theme-dark');
      el.classList.add(`bpr-theme-${theme}`);
    }

    // Restore pip states after any render
    if (this._pipStates && this._pipStates.size > 0) {
      setTimeout(() => {
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

    // Theme: per-actor flag overrides global setting
    const globalTheme = game.settings.get('blue-planet-recontact', 'defaultSheetTheme') ?? 'blue-planet';
    context.sheetTheme = this.actor.getFlag('blue-planet-recontact', 'sheetTheme') ?? globalTheme;

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

    // Prepare reputation level text (Blue Planet: levels from Unknown to Renowned)
    const repLevel = context.system.profile?.reputation?.level || 0;
    if (repLevel < 6) context.system.profile.reputation.levelText = "Unknown";
    else if (repLevel < 11) context.system.profile.reputation.levelText = "Rumored";
    else if (repLevel < 16) context.system.profile.reputation.levelText = "Notable";
    else if (repLevel < 21) context.system.profile.reputation.levelText = "(In)famous";
    else context.system.profile.reputation.levelText = "Renowned";
    
    // Provide reputation type options for the template
    context.reputationTypes = [
      { value: "", label: "— None —" },
      { value: "criminal", label: "Criminal" },
      { value: "corporate", label: "Corporate / GEO" },
      { value: "native", label: "Native / Indigenous" },
      { value: "scientific", label: "Scientific Community" },
      { value: "military", label: "Military / Security" },
      { value: "maritime", label: "Maritime / Aquatic" },
      { value: "underground", label: "Underground / Black Market" },
      { value: "political", label: "Political" },
      { value: "celebrity", label: "Celebrity / Media" }
    ];
    // Reputation effects by level
    context.reputationEffect = repLevel < 6 ? "No social bonuses." :
      repLevel < 11 ? "+1 to relevant social tests with those who know of you." :
      repLevel < 16 ? "+2 to social tests; people seek you out." :
      repLevel < 21 ? "+3 to social tests; significant political/social weight." :
      "+4 to social tests; legendary status.";
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
    const ammunition = [];
    const equipment = [];
    const biomods = [];
    const cyberware = [];
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
      // Append to ammunition.
      else if (i.type === 'ammunition') {
        ammunition.push(i);
      }
      // Append to equipment.
      else if (i.type === 'equipment') {
        equipment.push(i);
      }
      // Append to biomods.
      else if (i.type === 'biomod') {
        biomods.push(i);
      }
      // Append to cyberware.
      else if (i.type === 'cyberware') {
        cyberware.push(i);
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
    context.ammunition = ammunition;
    context.equipment = equipment;
    context.biomods = biomods;
    context.cyberware = cyberware;
    context.features = features;
    context.skills = skills;
    context.species = species;
    
    // Calculate capacity statistics for the CAPACITIES tab
    context.activeBiomodCount = biomods.filter(b => b.system?.active === true).length;
    context.activeCyberwareCount = cyberware.filter(c => c.system?.active === true).length;
    
    // Calculate total strain cost from active biomods and cyberware
    let totalStrainCost = 0;
    biomods.forEach(b => {
      if (b.system?.active === true && b.system?.strainCost) {
        totalStrainCost += parseInt(b.system.strainCost) || 0;
      }
    });
    cyberware.forEach(c => {
      if (c.system?.active === true && c.system?.strainCost) {
        totalStrainCost += parseInt(c.system.strainCost) || 0;
      }
    });
    context.totalCapacityStrainCost = totalStrainCost;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // ── Theme toggle ────────────────────────────────────────────────────
    html.find('.theme-toggle-btn').on('click', async (ev) => {
      const current = ev.currentTarget.dataset.currentTheme ?? 'blue-planet';
      const next    = current === 'blue-planet' ? 'dark' : 'blue-planet';
      await this.actor.setFlag('blue-planet-recontact', 'sheetTheme', next);
      // render() aplicará la nueva clase automáticamente
    });

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
    
    // Weapon attack roll from actor sheet
    html.find('.weapon-attack-roll').click(this._onWeaponAttackRoll.bind(this));
    
    // Weapon damage roll from actor sheet
    html.find('.weapon-damage-roll').click(this._onWeaponDamageRoll.bind(this));
    
    // Item equip/unequip functionality
    html.find('.item-equip').click(this._onItemEquip.bind(this));
    html.find('.item-unequip').click(this._onItemUnequip.bind(this));
    html.find('.item-activate').click(this._onItemActivate.bind(this));
    html.find('.item-deactivate').click(this._onItemDeactivate.bind(this));
    
    // Item chat functionality
    html.find('.item-chat').click(this._onItemChat.bind(this));

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

    // Armor durability controls (event delegation)
    html.on('click', '.armor-dura-plus', this._onArmorDurabilityPlus.bind(this));
    html.on('click', '.armor-dura-minus', this._onArmorDurabilityMinus.bind(this));
    html.on('change', '.armor-dura-input', this._onArmorDurabilityInput.bind(this));
    html.on('change', '.armor-dura-max-input', this._onArmorDurabilityMaxInput.bind(this));
    
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
    
    // Accordion functionality for cetacean abilities
    html.find('.accordion-header').click(this._onAccordionToggle.bind(this));

    // Make weapon names clickable for attack rolls
    html.find('.item[data-item-id] .item-name h4').each((i, element) => {
      const li = $(element).closest('.item');
      const itemId = li.data('item-id');
      const item = this.actor.items.get(itemId);
      
      if (item && item.type === 'weapon') {
        $(element).addClass('weapon-name-clickable');
        $(element).css({
          'cursor': 'pointer',
          'color': '#4a90e2',
          'text-decoration': 'underline'
        });
        
        $(element).on('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          console.log('BluePlanet: Weapon name clicked:', item.name);
          this._onWeaponNameClick(event, itemId);
        });
        
        $(element).on('mouseenter', function() {
          $(this).css({
            'color': '#357abd',
            'text-shadow': '0 0 4px rgba(74, 144, 226, 0.3)'
          });
        });
        
        $(element).on('mouseleave', function() {
          $(this).css({
            'color': '#4a90e2',
            'text-shadow': 'none'
          });
        });
      }
    });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
    
    // Enhanced Ammunition functionality (both enhanced and compact)
    html.find('.load-ammo-btn').click(this._onLoadAmmoToWeapon.bind(this));
    html.find('.load-ammo-btn-compact').click(this._onLoadAmmoToWeaponCompact.bind(this));
    html.on('change', '.ammo-capacity-input', this._onAmmoCapacityChange.bind(this));
    html.on('change', '.current-ammo-input', this._onCurrentAmmoChange.bind(this));
    html.on('change', '.compatible-weapon-select', this._onCompatibleWeaponSelect.bind(this));
    html.on('change', '.compatible-weapon-select-compact', this._onCompatibleWeaponSelectCompact.bind(this));
    
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
    const data = foundry.utils.duplicate(header.dataset);
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
    return await foundry.documents.Item.create(itemData, {parent: this.actor});
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
        rollMode: game.settings.get('core', 'rollMode')
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
   * Handle clicking on weapon name for attack roll
   * @param {Event} event   The originating click event
   * @param {string} itemId The weapon item ID
   * @private
   */
  async _onWeaponNameClick(event, itemId) {
    console.log('BluePlanet: _onWeaponNameClick called with itemId:', itemId);
    
    // Get the weapon item
    const weapon = this.actor.items.get(itemId);
    if (!weapon || weapon.type !== 'weapon') {
      ui.notifications.warn('Weapon not found');
      return;
    }
    
    // Call the weapon's roll method for attack
    try {
      await weapon.roll();
      console.log('BluePlanet: Weapon attack roll initiated successfully');
    } catch (error) {
      console.error('BluePlanet: Error initiating weapon attack roll:', error);
      ui.notifications.error('Error initiating weapon attack roll. Check console for details.');
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
    
    console.log('BluePlanet Actor Sheet: Weapon attack roll clicked for:', weapon.name);
    
    // Call the weapon's roll method (same as clicking weapon name)
    try {
      await weapon.roll();
      console.log('BluePlanet Actor Sheet: Weapon attack roll initiated successfully');
    } catch (error) {
      console.error('BluePlanet Actor Sheet: Error initiating weapon attack roll:', error);
      ui.notifications.error('Error initiating weapon attack roll. Check console for details.');
    }
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
      flavorText += `<div style="margin- px; border-radius: 4px; border: 1px solid rgba(108, 117, 125, 0.3);">`;
      flavorText += `<div class="damage-accordion-header" data-target="${woundId}" style="padding: 6px; background: rgba(108, 117, 125, 0.1); cursor: pointer; user-select: none; border-radius: 4px 4px 0 0;">`;
      flavorText += `<p style="color: black; margin: 0; font-size: 12px;"><i class="fas fa-chevron-right accordion-arrow" style="margin-right: 6px; transition: transform 0.2s;"></i><strong><i class="fas fa-shield-alt"></i> No Injury - Click for details</strong></p>`;
      flavorText += `</div>`;
      flavorText += `<div id="${woundId}" class="damage-accordion-content" style="display: none; padding: 6px; background: rgba(108, 117, 125, 0.05); border-radius: 0 0 4px 4px;">`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Attack misses, deflected, or causes no harm</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• No wound penalties applied</p>`;
      flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Character continues normally</p>`;
      flavorText += `</div></div>`;
    } else if (successes === 1) {
      flavorText += `<div style="margin- px; border-radius: 4px; border: 1px solid rgba(255, 193, 7, 0.4);">`;
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
      flavorText += `<div style="margin- px; border-radius: 4px; border: 1px solid rgba(220, 53, 69, 0.4);">`;
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
      flavorText += `<div style="margin- px; border-radius: 4px; border: 1px solid rgba(139, 0, 0, 0.4);">`;
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
    flavorText += `<div style="margin- px; border-radius: 4px; border: 1px solid rgba(74, 144, 226, 0.3);">`;
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
   * Armor durability handlers
   */
  _rebuildArmorPips(itemId, curr, max) {
    try {
      const track = this.element.find(`.armor-dura-track[data-item-id="${itemId}"]`);
      if (!track || track.length === 0) return;
      let html = '';
      const maximum = Math.max(1, parseInt(max) || 1);
      const current = Math.max(0, Math.min(maximum, parseInt(curr) || 0));
      for (let i = 0; i < maximum; i++) {
        const filled = i < current ? 'filled' : '';
        html += `<span class=\"pip armor-pip ${filled}\" data-index=\"${i}\"></span>`;
      }
      track.html(html);
    } catch (_) {}
  }
  async _onArmorDurabilityPlus(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const max = item.system?.max_durability ?? 10;
    const curr = item.system?.durability ?? 0;
    const next = Math.min(max, curr + 1);
    await item.update({ 'system.durability': next });
    this._rebuildArmorPips(itemId, next, max);
  }

  async _onArmorDurabilityMinus(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const max = item.system?.max_durability ?? 10;
    const curr = item.system?.durability ?? 0;
    const next = Math.max(0, curr - 1);
    await item.update({ 'system.durability': next });
    this._rebuildArmorPips(itemId, next, max);
  }

  async _onArmorDurabilityInput(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    const max = item.system?.max_durability ?? 10;
    let value = parseInt(event.currentTarget.value) || 0;
    value = Math.max(0, Math.min(max, value));
    await item.update({ 'system.durability': value });
    this._rebuildArmorPips(itemId, value, max);
  }

  async _onArmorDurabilityMaxInput(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    let max = parseInt(event.currentTarget.value) || 1;
    max = Math.max(1, max);
    const curr = Math.max(0, Math.min(max, item.system?.durability ?? 0));
    await item.update({ 'system.max_durability': max, 'system.durability': curr });
    this._rebuildArmorPips(itemId, curr, max);
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
    
    // CRITICAL FIX: Only select pips within THIS actor sheet, not globally
    const pips = this.element ? this.element.find(selector) : $(selector);
    pips.each(function() {
      const pip = $(this);
      const pipValue = parseInt(pip.data('value'));
      if (pipValue <= currentValue) {
        pip.addClass('filled');
        pip.attr('data-manually-filled', 'true'); // Mark as manually filled
      } else {
        pip.removeClass('filled');
        pip.removeAttr('data-manually-filled');
      }
    });
    
    console.log(`BluePlanet: Manually updated ${pips.length} ${pipType} ${subType ? subType : ''} pips, ${currentValue} filled`);
    console.log(`BluePlanet: Actor sheet ID: ${this.actor.id}, Actor name: ${this.actor.name}`);
    
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
    
    const totalDisplay = this.element ? this.element.find('.total-penalty strong')[0] : null;
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
    const chipsValueDisplay = this.element ? this.element.find('.chips-track .pip-value')[0] : null;
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
    const reputationValueDisplay = this.element ? this.element.find('.reputation-track .pip-value')[0] : null;
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
    const strainTypeSection = this.element ? this.element.find(`.strain-pip[data-type="${type}"]`).closest('.strain-type')[0] : null;
    if (strainTypeSection) {
      const strainValueDisplay = $(strainTypeSection).find('.pip-value')[0];
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
    const woundTypeSection = this.element ? this.element.find(`.wound-pip[data-type="${type}"]`).closest('.wound-type')[0] : null;
    if (woundTypeSection) {
      const penaltyDisplay = $(woundTypeSection).find('.wound-penalty')[0];
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
   * Handle accordion toggle for cetacean abilities
   * @param {Event} event   The originating click event
   * @private
   */
  _onAccordionToggle(event) {
    event.preventDefault();
    const header = $(event.currentTarget);
    const targetId = header.data('accordion-target');
    const content = $(`#${targetId}`);
    const toggle = header.find('.accordion-toggle');
    
    if (content.hasClass('collapsed')) {
      content.removeClass('collapsed').slideDown(200);
      toggle.removeClass('fa-chevron-down').addClass('fa-chevron-up');
    } else {
      content.addClass('collapsed').slideUp(200);
      toggle.removeClass('fa-chevron-up').addClass('fa-chevron-down');
    }
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
    const data = foundry.applications.ux.TextEditor.getDragEventData(event);
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
          <div class="form-group">
            <label>Minor Wounds to Heal:</label>
            <input type="number" name="minor-wounds" min="0" max="${this.actor.system.wounds?.minor || 0}" value="${Math.min(1, this.actor.system.wounds?.minor || 0)}" style="width: 60px;">
            <span style="font-size: 11px; color: #aaa;">/ ${this.actor.system.wounds?.minor || 0}</span>
          </div>
          <div class="form-group">
            <label>Major Wounds to Heal:</label>
            <input type="number" name="major-wounds" min="0" max="${this.actor.system.wounds?.major || 0}" value="${Math.min(1, this.actor.system.wounds?.major || 0)}" style="width: 60px;">
            <span style="font-size: 11px; color: #aaa;">/ ${this.actor.system.wounds?.major || 0}</span>
          </div>
          <div class="form-group">
            <label>Mortal Wounds to Heal:</label>
            <input type="number" name="mortal-wounds" min="0" max="${this.actor.system.wounds?.mortal || 0}" value="0" style="width: 60px;">
            <span style="font-size: 11px; color: #aaa;">/ ${this.actor.system.wounds?.mortal || 0}</span>
            <div style="font-size: 9px; color: #666; font-style: italic;">Mortal wounds typically require medical attention</div>
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
            
            // Wound recovery amounts
            const minorWoundsAmount = parseInt(html.find('[name="minor-wounds"]').val()) || 0;
            const majorWoundsAmount = parseInt(html.find('[name="major-wounds"]').val()) || 0;
            const mortalWoundsAmount = parseInt(html.find('[name="mortal-wounds"]').val()) || 0;
            
            // Custom recovery amounts
            const currentMental = this.actor.system.strain?.mental?.value || 0;
            const currentPhysical = this.actor.system.strain?.physical?.value || 0;
            
            // Current wounds
            const currentMinorWounds = this.actor.system.wounds?.minor || 0;
            const currentMajorWounds = this.actor.system.wounds?.major || 0;
            const currentMortalWounds = this.actor.system.wounds?.mortal || 0;
            
            const updates = {};
            if (mentalAmount > 0) {
              updates[`system.strain.mental.value`] = Math.max(0, currentMental - mentalAmount);
            }
            if (physicalAmount > 0) {
              updates[`system.strain.physical.value`] = Math.max(0, currentPhysical - physicalAmount);
            }
            
            // Add wound healing updates
            if (minorWoundsAmount > 0) {
              updates[`system.wounds.minor`] = Math.max(0, currentMinorWounds - minorWoundsAmount);
            }
            if (majorWoundsAmount > 0) {
              updates[`system.wounds.major`] = Math.max(0, currentMajorWounds - majorWoundsAmount);
            }
            if (mortalWoundsAmount > 0) {
              updates[`system.wounds.mortal`] = Math.max(0, currentMortalWounds - mortalWoundsAmount);
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
            if (minorWoundsAmount > 0) messages.push(`${minorWoundsAmount} minor wound${minorWoundsAmount > 1 ? 's' : ''}`);
            if (majorWoundsAmount > 0) messages.push(`${majorWoundsAmount} major wound${majorWoundsAmount > 1 ? 's' : ''}`);
            if (mortalWoundsAmount > 0) messages.push(`${mortalWoundsAmount} mortal wound${mortalWoundsAmount > 1 ? 's' : ''}`);
            
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
      recoverWounds: true,
      strainAmount: 'full',
      attributeAmount: 'full',
      woundAmount: {
        minor: this.actor.system.wounds?.minor || 0,
        major: this.actor.system.wounds?.major || 0,
        mortal: this.actor.system.wounds?.mortal || 0
      }
    });
  }

  /* -------------------------------------------- */
  /* Enhanced Ammunition Methods                  */
  /* -------------------------------------------- */

  /**
   * Handle loading ammunition into a compatible weapon
   * @param {Event} event   The originating click event
   * @private
   */
  async _onLoadAmmoToWeapon(event) {
    event.preventDefault();
    
    const ammoId = event.currentTarget.dataset.ammoId;
    const ammo = this.actor.items.get(ammoId);
    
    if (!ammo) {
      ui.notifications.error('Ammunition not found.');
      return;
    }
    
    // Get selected weapon from the dropdown
    const selectElement = this.element.find(`.compatible-weapon-select[data-item-id="${ammoId}"]`);
    const weaponId = selectElement.val();
    
    if (!weaponId) {
      ui.notifications.warn('Please select a weapon to load first.');
      return;
    }
    
    const weapon = this.actor.items.get(weaponId);
    if (!weapon) {
      ui.notifications.error('Selected weapon not found.');
      return;
    }
    
    // Check if ammunition is available
    const totalRounds = (ammo.system.quantity || 0) * (ammo.system.package_size || 0);
    const usedRounds = ammo.system.rounds_fired || 0;
    const availableRounds = totalRounds - usedRounds;
    
    if (availableRounds <= 0) {
      ui.notifications.warn('No ammunition available to load.');
      return;
    }
    
    // Calculate how much to load
    const weaponCapacity = weapon.system.magazine_capacity || 0;
    const currentAmmo = weapon.system.current_ammo || 0;
    const spaceInWeapon = weaponCapacity - currentAmmo;
    const roundsToLoad = Math.min(availableRounds, spaceInWeapon);
    
    if (roundsToLoad <= 0) {
      ui.notifications.warn('Weapon is already fully loaded.');
      return;
    }
    
    // Update weapon with loaded ammunition
    await weapon.update({
      'system.current_ammo': currentAmmo + roundsToLoad,
      'system.loaded_ammunition': {
        id: ammo.id,
        name: ammo.name,
        ammo_type: ammo.system.ammo_type,
        attack_modifier: ammo.system.attack_modifier || 0,
        damage_modifier: ammo.system.damage_modifier || 0,
        range_modifier: ammo.system.range_modifier || 0,
        penetration: ammo.system.penetration || 0
      }
    });
    
    // Update ammunition consumed
    await ammo.update({
      'system.rounds_fired': usedRounds + roundsToLoad
    });
    
    ui.notifications.info(`Loaded ${roundsToLoad} rounds of ${ammo.name} into ${weapon.name}.`);
    
    // Reset the dropdown
    selectElement.val('');
  }
  
  /**
   * Handle ammunition capacity changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onAmmoCapacityChange(event) {
    event.preventDefault();
    
    const itemId = event.currentTarget.dataset.itemId;
    const newCapacity = parseInt(event.currentTarget.value) || 1;
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.warn('BluePlanet: Ammunition item not found:', itemId);
      return;
    }
    
    console.log('BluePlanet: Updating ammunition capacity:', {
      itemName: item.name,
      oldCapacity: item.system.package_size,
      newCapacity: newCapacity
    });
    
    await item.update({
      'system.package_size': Math.max(1, newCapacity)
    });
    
    // Update the total rounds display in real time - works for both enhanced and compact
    const li = event.currentTarget.closest('.ammunition-item-enhanced, .ammunition-item-compact');
    const quantity = item.system.quantity || 0;
    const totalRounds = quantity * Math.max(1, newCapacity);
    
    console.log('BluePlanet: Calculated total rounds:', {
      quantity: quantity,
      capacity: newCapacity,
      totalRounds: totalRounds
    });
    
    $(li).find('.total-rounds').text(`/${totalRounds}`);
    
    // Also update the current ammo input max value
    const currentAmmoInput = $(li).find('.current-ammo-input');
    currentAmmoInput.attr('max', totalRounds);
    
    // If current value exceeds new total, clamp it
    const currentValue = parseInt(currentAmmoInput.val()) || 0;
    if (currentValue > totalRounds) {
      currentAmmoInput.val(totalRounds);
      // Update the item's rounds_fired accordingly - set to 0 if clamping to max
      await item.update({ 'system.rounds_fired': 0 });
    }
  }
  
  /**
   * Handle current ammunition changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onCurrentAmmoChange(event) {
    event.preventDefault();
    
    const itemId = event.currentTarget.dataset.itemId;
    const newCurrent = parseInt(event.currentTarget.value) || 0;
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.warn('BluePlanet: Ammunition item not found for current ammo change:', itemId);
      return;
    }
    
    const totalRounds = (item.system.quantity || 0) * (item.system.package_size || 0);
    const validCurrent = Math.max(0, Math.min(newCurrent, totalRounds));
    
    // Calculate rounds fired based on current remaining
    const roundsFired = totalRounds - validCurrent;
    
    console.log('BluePlanet: Updating current ammunition:', {
      itemName: item.name,
      totalRounds: totalRounds,
      newCurrent: newCurrent,
      validCurrent: validCurrent,
      roundsFired: roundsFired,
      oldRoundsFired: item.system.rounds_fired || 0
    });
    
    await item.update({
      'system.rounds_fired': Math.max(0, roundsFired)
    });
    
    // Update the input to the valid value if it was clamped
    if (validCurrent !== newCurrent) {
      console.log('BluePlanet: Clamping current ammo value from', newCurrent, 'to', validCurrent);
      event.currentTarget.value = validCurrent;
    }
  }
  
  /**
   * Handle compatible weapon selection changes
   * @param {Event} event   The originating change event
   * @private
   */
  _onCompatibleWeaponSelect(event) {
    const selectElement = $(event.currentTarget);
    const loadBtn = selectElement.siblings('.load-ammo-btn');
    
    if (selectElement.val()) {
      loadBtn.prop('disabled', false).removeClass('disabled');
    } else {
      loadBtn.prop('disabled', true).addClass('disabled');
    }
  }

  /**
   * Handle loading ammunition into a compatible weapon (compact version)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onLoadAmmoToWeaponCompact(event) {
    event.preventDefault();
    
    const ammoId = event.currentTarget.dataset.ammoId;
    const ammo = this.actor.items.get(ammoId);
    
    if (!ammo) {
      ui.notifications.error('Ammunition not found.');
      return;
    }
    
    // Get selected weapon from the compact dropdown
    const selectElement = this.element.find(`.compatible-weapon-select-compact[data-item-id="${ammoId}"]`);
    const weaponId = selectElement.val();
    
    if (!weaponId) {
      ui.notifications.warn('Please select a weapon to load first.');
      return;
    }
    
    const weapon = this.actor.items.get(weaponId);
    if (!weapon) {
      ui.notifications.error('Selected weapon not found.');
      return;
    }
    
    // Check if ammunition is available
    const totalRounds = (ammo.system.quantity || 0) * (ammo.system.package_size || 0);
    const usedRounds = ammo.system.rounds_fired || 0;
    const availableRounds = totalRounds - usedRounds;
    
    if (availableRounds <= 0) {
      ui.notifications.warn('No ammunition available to load.');
      return;
    }
    
    // Calculate how much to load
    const weaponCapacity = weapon.system.magazine_capacity || 0;
    const currentAmmo = weapon.system.current_ammo || 0;
    const spaceInWeapon = weaponCapacity - currentAmmo;
    const roundsToLoad = Math.min(availableRounds, spaceInWeapon);
    
    if (roundsToLoad <= 0) {
      ui.notifications.warn('Weapon is already fully loaded.');
      return;
    }
    
    // Update weapon with loaded ammunition
    await weapon.update({
      'system.current_ammo': currentAmmo + roundsToLoad,
      'system.loaded_ammunition': {
        id: ammo.id,
        name: ammo.name,
        ammo_type: ammo.system.ammo_type,
        attack_modifier: ammo.system.attack_modifier || 0,
        damage_modifier: ammo.system.damage_modifier || 0,
        range_modifier: ammo.system.range_modifier || 0,
        penetration: ammo.system.penetration || 0
      }
    });
    
    // Update ammunition consumed
    await ammo.update({
      'system.rounds_fired': usedRounds + roundsToLoad
    });
    
    ui.notifications.info(`Loaded ${roundsToLoad} rounds of ${ammo.name} into ${weapon.name}.`);
    
    // Reset the dropdown
    selectElement.val('');
  }
  
  /**
   * Handle compatible weapon selection changes (compact version)
   * @param {Event} event   The originating change event
   * @private
   */
  _onCompatibleWeaponSelectCompact(event) {
    const selectElement = $(event.currentTarget);
    const loadBtn = selectElement.siblings('.load-ammo-btn-compact');
    
    if (selectElement.val()) {
      loadBtn.prop('disabled', false).removeClass('disabled');
    } else {
      loadBtn.prop('disabled', true).addClass('disabled');
    }
  }

  /**
   * Handle showing item information in chat
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemChat(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const itemId = dataset.itemId;
    
    const item = this.actor.items.get(itemId);
    if (!item) {
      ui.notifications.warn('Item not found');
      return;
    }

    console.log('BluePlanet: Showing item in chat:', item);
    
    // Create chat card based on item type
    let chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: await this._generateItemChatCard(item),
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    };

    // Send the chat message
    foundry.documents.ChatMessage.create(chatData);
  }

  /**
   * Generate HTML content for item chat card
   * @param {Item} item   The item to display
   * @private
   */
  async _generateItemChatCard(item) {
    const itemData = item.system;
    let content = `
      <div class="blue-planet-item-chat-card" style="
        background: linear-gradient(135deg, #0d1f2d 0%, #1a3e5c 50%, #0d1f2d 100%);
        border: 2px solid #4a90e2;
        border-radius: 12px;
        padding: 15px;
        color: #ffffff;
        font-family: 'Segoe UI', Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <div class="item-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 2px solid rgba(107, 182, 255, 0.3); padding-bottom: 8px;">
          <img src="${item.img}" style="width: 48px; height: 48px; border-radius: 6px; border: 2px solid #6bb6ff;" />
          <div>
            <h3 style="margin: 0; color: #6bb6ff; text-shadow: 0 0 8px rgba(107, 182, 255, 0.4);">${item.name}</h3>
            <p style="margin: 2px 0 0 0; color: #b8d4f0; font-style: italic; font-size: 13px;">${this._getItemTypeLabel(item.type)}</p>
          </div>
        </div>
    `;

    // Add description if available
    if (itemData.description) {
      content += `
        <div class="item-description" style="background: rgba(26, 62, 92, 0.4); padding: 10px; border-radius: 6px; margin-bottom: 12px; border- px solid #6bb6ff;">
          <p style="margin: 0; color: #e8f4fd; line-height: 1.4;">${itemData.description}</p>
        </div>
      `;
    }

    // Add item-specific stats based on type
    content += this._getItemSpecificStats(item);

    content += `</div>`;
    
    return content;
  }

  /**
   * Get readable label for item type
   * @param {string} itemType
   * @private
   */
  _getItemTypeLabel(itemType) {
    const typeLabels = {
      weapon: "🗡️ Weapon",
      ammunition: "🎯 Ammunition",
      equipment: "⚙️ Equipment",
      biomod: "🧬 Biomodification",
      cyberware: "🤖 Cyberware",
      feature: "⭐ Feature",
      skill: "📚 Skill"
    };
    return typeLabels[itemType] || itemType.charAt(0).toUpperCase() + itemType.slice(1);
  }

  /**
   * Get item-specific statistics for chat card
   * @param {Item} item
   * @private
   */
  _getItemSpecificStats(item) {
    const itemData = item.system;
    let statsHtml = `<div class="item-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px;">`;

    switch (item.type) {
      case 'weapon':
        if (itemData.damage) statsHtml += `<div class="stat-item" style="background: rgba(255, 215, 0, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(255, 215, 0, 0.3);"><strong style="color: #ffd700;">Damage Rating:</strong> ${itemData.damage}</div>`;
        if (itemData.weapon_type) statsHtml += `<div class="stat-item" style="background: rgba(74, 144, 226, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(74, 144, 226, 0.3);"><strong style="color: #4a90e2;">Type:</strong> ${itemData.weapon_type.charAt(0).toUpperCase() + itemData.weapon_type.slice(1)}</div>`;
        if (itemData.effective_range) statsHtml += `<div class="stat-item" style="background: rgba(40, 167, 69, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(40, 167, 69, 0.3);"><strong style="color: #28a745;">Range:</strong> ${itemData.effective_range}m</div>`;
        if (itemData.durability) statsHtml += `<div class="stat-item" style="background: rgba(107, 182, 255, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(107, 182, 255, 0.3);"><strong style="color: #6bb6ff;">Durability:</strong> ${itemData.durability}</div>`;
        if (itemData.dimensions) statsHtml += `<div class="stat-item" style="background: rgba(107, 182, 255, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(107, 182, 255, 0.3);"><strong style="color: #6bb6ff;">Dimensions:</strong> ${itemData.dimensions.charAt(0).toUpperCase() + itemData.dimensions.slice(1)}</div>`;
        if (itemData.features && itemData.features.length > 0) {
          statsHtml += `<div class="stat-item" style="background: rgba(64, 224, 208, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(64, 224, 208, 0.3); grid-column: 1 / -1;"><strong style="color: #40e0d0;">Features:</strong> ${itemData.features.join(', ')}</div>`;
        }
        break;
        
      case 'ammunition':
        if (itemData.damage_modifier) statsHtml += `<div class="stat-item" style="background: rgba(255, 215, 0, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(255, 215, 0, 0.3);"><strong style="color: #ffd700;">Damage Mod:</strong> ${itemData.damage_modifier >= 0 ? '+' : ''}${itemData.damage_modifier}</div>`;
        if (itemData.attack_modifier) statsHtml += `<div class="stat-item" style="background: rgba(220, 53, 69, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(220, 53, 69, 0.3);"><strong style="color: #dc3545;">Attack Mod:</strong> ${itemData.attack_modifier >= 0 ? '+' : ''}${itemData.attack_modifier}</div>`;
        if (itemData.range_modifier) statsHtml += `<div class="stat-item" style="background: rgba(40, 167, 69, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(40, 167, 69, 0.3);"><strong style="color: #28a745;">Range Mod:</strong> ${itemData.range_modifier}%</div>`;
        if (itemData.penetration) statsHtml += `<div class="stat-item" style="background: rgba(255, 152, 0, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(255, 152, 0, 0.3);"><strong style="color: #ff9800;">Penetration:</strong> ${itemData.penetration}</div>`;
        if (itemData.dimensions) statsHtml += `<div class="stat-item" style="background: rgba(107, 182, 255, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(107, 182, 255, 0.3);"><strong style="color: #6bb6ff;">Dimensions:</strong> ${itemData.dimensions.charAt(0).toUpperCase() + itemData.dimensions.slice(1)}</div>`;
        if (itemData.availability) statsHtml += `<div class="stat-item" style="background: rgba(156, 39, 176, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(156, 39, 176, 0.3);"><strong style="color: #9c27b0;">Availability:</strong> ${itemData.availability.charAt(0).toUpperCase() + itemData.availability.slice(1)}</div>`;
        break;
        
      case 'equipment':
        if (itemData.durability) statsHtml += `<div class="stat-item" style="background: rgba(107, 182, 255, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(107, 182, 255, 0.3);"><strong style="color: #6bb6ff;">Durability:</strong> ${itemData.durability}</div>`;
        if (itemData.dimensions) statsHtml += `<div class="stat-item" style="background: rgba(107, 182, 255, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(107, 182, 255, 0.3);"><strong style="color: #6bb6ff;">Dimensions:</strong> ${itemData.dimensions.charAt(0).toUpperCase() + itemData.dimensions.slice(1)}</div>`;
        if (itemData.availability) statsHtml += `<div class="stat-item" style="background: rgba(156, 39, 176, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(156, 39, 176, 0.3);"><strong style="color: #9c27b0;">Availability:</strong> ${itemData.availability.charAt(0).toUpperCase() + itemData.availability.slice(1)}</div>`;
        if (itemData.features && itemData.features.length > 0) {
          statsHtml += `<div class="stat-item" style="background: rgba(64, 224, 208, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(64, 224, 208, 0.3); grid-column: 1 / -1;"><strong style="color: #40e0d0;">Features:</strong> ${itemData.features.join(', ')}</div>`;
        }
        break;
        
      case 'biomod':
        if (itemData.type) statsHtml += `<div class="stat-item" style="background: rgba(40, 167, 69, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(40, 167, 69, 0.3);"><strong style="color: #28a745;">Type:</strong> ${itemData.type.charAt(0).toUpperCase() + itemData.type.slice(1)}</div>`;
        if (itemData.availability) statsHtml += `<div class="stat-item" style="background: rgba(156, 39, 176, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(156, 39, 176, 0.3);"><strong style="color: #9c27b0;">Availability:</strong> ${itemData.availability.charAt(0).toUpperCase() + itemData.availability.slice(1)}</div>`;
        if (itemData.active !== undefined) statsHtml += `<div class="stat-item" style="background: rgba(${itemData.active ? '40, 167, 69' : '220, 53, 69'}, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(${itemData.active ? '40, 167, 69' : '220, 53, 69'}, 0.3);"><strong style="color: ${itemData.active ? '#28a745' : '#dc3545'};">Status:</strong> ${itemData.active ? 'Active' : 'Inactive'}</div>`;
        break;
        
      case 'cyberware':
        if (itemData.type) statsHtml += `<div class="stat-item" style="background: rgba(74, 144, 226, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(74, 144, 226, 0.3);"><strong style="color: #4a90e2;">Type:</strong> ${itemData.type.charAt(0).toUpperCase() + itemData.type.slice(1)}</div>`;
        if (itemData.durability) statsHtml += `<div class="stat-item" style="background: rgba(107, 182, 255, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(107, 182, 255, 0.3);"><strong style="color: #6bb6ff;">Durability:</strong> ${itemData.durability}</div>`;
        if (itemData.availability) statsHtml += `<div class="stat-item" style="background: rgba(156, 39, 176, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(156, 39, 176, 0.3);"><strong style="color: #9c27b0;">Availability:</strong> ${itemData.availability.charAt(0).toUpperCase() + itemData.availability.slice(1)}</div>`;
        if (itemData.active !== undefined) statsHtml += `<div class="stat-item" style="background: rgba(${itemData.active ? '40, 167, 69' : '220, 53, 69'}, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(${itemData.active ? '40, 167, 69' : '220, 53, 69'}, 0.3);"><strong style="color: ${itemData.active ? '#28a745' : '#dc3545'};">Status:</strong> ${itemData.active ? 'Active' : 'Inactive'}</div>`;
        if (itemData.features && itemData.features.length > 0) {
          statsHtml += `<div class="stat-item" style="background: rgba(64, 224, 208, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(64, 224, 208, 0.3); grid-column: 1 / -1;"><strong style="color: #40e0d0;">Features:</strong> ${itemData.features.join(', ')}</div>`;
        }
        break;
    }

    // Add cost if available
    if (itemData.cost) {
      statsHtml += `<div class="stat-item" style="background: rgba(255, 215, 0, 0.1); padding: 6px; border-radius: 4px; border: 1px solid rgba(255, 215, 0, 0.3);"><strong style="color: #ffd700;">Cost:</strong> ¤${itemData.cost}</div>`;
    }

    statsHtml += `</div>`;
    
    return statsHtml;
  }
}
