/**
 * Extended Actor Sheet for NPC characters
 * Uses the same functionality as BluePlanetActorSheet but with NPC-specific template
 * Enhanced with all character sheet improvements
 */

import { BluePlanetActorSheet } from "./actor-sheet.js";

/**
 * Extend the basic BluePlanetActorSheet for NPCs
 * @extends {BluePlanetActorSheet}
 */
export class BluePlanetNPCSheet extends BluePlanetActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "actor", "npc"],
      template: "systems/blue-planet-recontact/templates/actor/actor-npc-sheet.hbs",
      width: 900,
      height: 700,
      resizable: true,
      minimizable: true,
      dragHandle: ".window-header",
      popOut: true,
      top: 100,
      left: 300,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities"}],
      dragDrop: [
        {dragSelector: ".item-list .item", dropSelector: null},
        {dragSelector: ".biomod-list .item", dropSelector: ".biomods-section"},
        {dragSelector: ".cyberware-list .item", dropSelector: ".cyberware-section"}
      ]
    });
  }

  /** @override */
  get template() {
    return "systems/blue-planet-recontact/templates/actor/actor-npc-sheet.hbs";
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
        console.log('BluePlanet NPC: Auto-restoring pip states after render');
        this._restoreAllPipStates();
      }, 50);
    }
    
    return result;
  }

  /** @override */
  async getData(options) {
    // Get the base data
    const context = await super.getData(options);

    // Add NPC-specific data preparation
    this._prepareNPCData(context);

    // Initialize pip states from current data
    this._initializePipStates();

    return context;
  }

  /**
   * Prepare NPC-specific data
   * @param {Object} context The actor context to prepare.
   */
  _prepareNPCData(context) {
    // Add NPC tier options
    context.npcTiers = [
      { value: "minor", label: "Minor NPC" },
      { value: "supporting", label: "Supporting NPC" },
      { value: "major", label: "Major NPC" },
      { value: "legendary", label: "Legendary NPC" }
    ];

    // Add NPC role options
    context.npcRoles = [
      { value: "civilian", label: "Civilian" },
      { value: "security", label: "Security" },
      { value: "military", label: "Military" },
      { value: "corporate", label: "Corporate" },
      { value: "government", label: "Government" },
      { value: "criminal", label: "Criminal" },
      { value: "scientist", label: "Scientist" },
      { value: "pilot", label: "Pilot" },
      { value: "merchant", label: "Merchant" },
      { value: "explorer", label: "Explorer" },
      { value: "other", label: "Other" }
    ];

    // Add NPC complexity options
    context.npcComplexity = [
      { value: "simple", label: "Simple (Basic stats only)" },
      { value: "standard", label: "Standard (Full character)" },
      { value: "complex", label: "Complex (Advanced features)" }
    ];

    // Add species options for NPCs
    context.npcSpecies = [
      { value: "human", label: "Human" },
      { value: "modified", label: "Modified Human" },
      { value: "hybrid", label: "Hybrid" },
      { value: "artificial", label: "Artificial" },
      { value: "other", label: "Other" }
    ];

    // Simplify display for NPCs based on tier
    const tier = context.system?.tier || "minor";
    context.simplifiedView = (tier === "minor");
    context.showAdvancedFeatures = (tier === "major" || tier === "legendary");
    
    // NPC-specific skill categories
    context.commonNPCSkills = [
      "Athletics", "Awareness", "Bureaucracy", "Combat", "Computer Use",
      "Deception", "Drive", "First Aid", "Investigate", "Persuasion",
      "Pilot", "Research", "Stealth", "Technical", "Zero-G"
    ];
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // NPC-specific listeners
    
    // Quick NPC setup functionality
    html.find('.npc-quick-setup').click(this._onNPCQuickSetup.bind(this));
    
    // NPC tier change - affects available features
    html.find('.npc-tier-select').change(this._onNPCTierChange.bind(this));
    
    // Quick skill addition for NPCs
    html.find('.add-common-skill').click(this._onAddCommonSkill.bind(this));
    
    // NPC combat quick-roll buttons
    html.find('.npc-quick-attack').click(this._onNPCQuickAttack.bind(this));
    html.find('.npc-quick-defense').click(this._onNPCQuickDefense.bind(this));
    
    // Enhanced portrait functionality for NPCs
    html.find('.npc-portrait-clickable').click(this._onChangePortrait.bind(this));
    
    // Apply initial pip states after DOM is ready
    setTimeout(() => {
      this._restoreAllPipStates();
    }, 100);
  }
  
  /**
   * Handle NPC quick setup
   * @param {Event} event   The originating click event
   * @private
   */
  async _onNPCQuickSetup(event) {
    event.preventDefault();
    
    // Open a dialog to quickly configure basic NPC stats
    const tier = event.currentTarget.dataset.tier || 'minor';
    
    // Quick setup based on tier
    const setupData = this._getNPCQuickSetupData(tier);
    
    await this.actor.update({
      'system.tier': tier,
      'system.attributes': setupData.attributes,
      'system.strain': setupData.strain,
      'system.wounds': setupData.wounds
    });
    
    ui.notifications.info(`NPC configured as ${tier.capitalize()} tier.`);
  }
  
  /**
   * Handle NPC tier changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onNPCTierChange(event) {
    event.preventDefault();
    const newTier = event.currentTarget.value;
    
    await this.actor.update({'system.tier': newTier});
    
    // Re-render to update available features
    this.render(false);
  }
  
  /**
   * Handle adding common skills quickly
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddCommonSkill(event) {
    event.preventDefault();
    const skillName = event.currentTarget.dataset.skill;
    
    if (!skillName) return;
    
    // Add skill to system.skills
    const skills = foundry.utils.deepClone(this.actor.system.skills || {});
    const skillId = skillName.toLowerCase().replace(/\s+/g, '_');
    
    if (skills[skillId]) {
      ui.notifications.warn(`${skillName} already exists.`);
      return;
    }
    
    skills[skillId] = {
      label: skillName,
      rank: 1,
      level_type: 'general',
      attribute: this._getDefaultAttributeForSkill(skillName),
      aspect: 'experiential'
    };
    
    await this.actor.update({'system.skills': skills});
    ui.notifications.info(`Added ${skillName} skill.`);
  }
  
  /**
   * Handle NPC quick attack rolls
   * @param {Event} event   The originating click event
   * @private
   */
  async _onNPCQuickAttack(event) {
    event.preventDefault();
    
    // Quick combat roll for NPCs
    const rollData = {
      label: `${this.actor.name} - Quick Attack`,
      type: 'quick_combat',
      skillName: 'Combat',
      skillRank: 1,
      attribute: 'coordination',
      attributeValue: this.actor.system.attributes.coordination?.value || 0,
      dice: '1d10',
      levelType: 'general',
      targetNumber: 10
    };
    
    // Use the enhanced roll dialog
    try {
      const { showEnhancedBluePlanetRollDialog } = await import('../enhanced-roll-dialog.js');
      showEnhancedBluePlanetRollDialog(this.actor, rollData);
    } catch (error) {
      console.error('BluePlanet NPC Sheet: Error with enhanced roll dialog:', error);
      // Fallback to basic roll
      const roll = new Roll('1d10', this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: rollData.label
      });
    }
  }
  
  /**
   * Handle NPC quick defense rolls
   * @param {Event} event   The originating click event
   * @private
   */
  async _onNPCQuickDefense(event) {
    event.preventDefault();
    
    const rollData = {
      label: `${this.actor.name} - Quick Defense`,
      type: 'quick_defense',
      skillName: 'Athletics',
      skillRank: 1,
      attribute: 'coordination',
      attributeValue: this.actor.system.attributes.coordination?.value || 0,
      dice: '1d10',
      levelType: 'general',
      targetNumber: 10
    };
    
    try {
      const { showEnhancedBluePlanetRollDialog } = await import('../enhanced-roll-dialog.js');
      showEnhancedBluePlanetRollDialog(this.actor, rollData);
    } catch (error) {
      console.error('BluePlanet NPC Sheet: Error with enhanced roll dialog:', error);
      const roll = new Roll('1d10', this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: rollData.label
      });
    }
  }
  
  /**
   * Get quick setup data for NPC tiers
   * @param {string} tier The NPC tier
   * @returns {Object} Setup data
   * @private
   */
  _getNPCQuickSetupData(tier) {
    const setups = {
      minor: {
        attributes: { cognition: { value: 0 }, psyche: { value: 0 }, coordination: { value: 0 }, physique: { value: 0 } },
        strain: { mental: { value: 0, max: 4 }, physical: { value: 0, max: 6 } },
        wounds: { minor: 0, major: 0, mortal: 0 }
      },
      supporting: {
        attributes: { cognition: { value: 1 }, psyche: { value: 1 }, coordination: { value: 1 }, physique: { value: 1 } },
        strain: { mental: { value: 0, max: 5 }, physical: { value: 0, max: 7 } },
        wounds: { minor: 0, major: 0, mortal: 0 }
      },
      major: {
        attributes: { cognition: { value: 2 }, psyche: { value: 2 }, coordination: { value: 2 }, physique: { value: 2 } },
        strain: { mental: { value: 0, max: 6 }, physical: { value: 0, max: 8 } },
        wounds: { minor: 0, major: 0, mortal: 0 }
      },
      legendary: {
        attributes: { cognition: { value: 3 }, psyche: { value: 3 }, coordination: { value: 3 }, physique: { value: 3 } },
        strain: { mental: { value: 0, max: 7 }, physical: { value: 0, max: 9 } },
        wounds: { minor: 0, major: 0, mortal: 0 }
      }
    };
    
    return setups[tier] || setups.minor;
  }
  
  /**
   * Get default attribute for a skill
   * @param {string} skillName The skill name
   * @returns {string} The default attribute
   * @private
   */
  _getDefaultAttributeForSkill(skillName) {
    const skillAttributes = {
      'Athletics': 'physique',
      'Awareness': 'cognition',
      'Bureaucracy': 'cognition',
      'Combat': 'coordination',
      'Computer Use': 'cognition',
      'Deception': 'psyche',
      'Drive': 'coordination',
      'First Aid': 'cognition',
      'Investigate': 'cognition',
      'Persuasion': 'psyche',
      'Pilot': 'coordination',
      'Research': 'cognition',
      'Stealth': 'coordination',
      'Technical': 'cognition',
      'Zero-G': 'coordination'
    };
    
    return skillAttributes[skillName] || 'cognition';
  }
}