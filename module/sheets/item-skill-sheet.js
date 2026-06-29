import { BluePlanetRollDialog } from '../roll-dialog.js';

/**
 * Blue Planet Skill Sheet
 * @extends {foundry.appv1.sheets.ItemSheet}
 */
export class BluePlanetSkillSheet extends foundry.appv1.sheets.ItemSheet {
  
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "skill"],
      width: 500,
      height: 600,
      tabs: []
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-skill-sheet.hbs`;
  }

  /** @override */
  async getData(options) {
    const context = super.getData(options);
    
    // Add the item's data to context.data for easier access, as well as flags.
    context.system = context.item.system;
    context.flags = context.item.flags;

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Handle roll button
    html.find('.skill-roll-btn').click(this._onRoll.bind(this));
    
    // Handle tags input
    html.find('input[name="system.tags"]').change(this._onTagsChange.bind(this));
    
    // Handle all form changes to ensure data is saved
    html.find('input, select, textarea').change(this._onFormChange.bind(this));
  }

  /**
   * Handle form changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onFormChange(event) {
    // Let Foundry handle the standard form updates
    // This ensures all fields are properly saved
  }
  
  /**
   * Handle changing tags input
   * @param {Event} event   The originating change event
   * @private
   */
  async _onTagsChange(event) {
    event.preventDefault();
    const tags = event.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    return this.item.update({'system.tags': tags});
  }

  /**
   * Handle roll button clicks
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    
    // Find the actor that owns this skill
    const actor = this.item.actor;
    if (!actor) {
      ui.notifications.warn("This skill must be owned by an actor to roll.");
      return;
    }
    
    // Prepare roll data
    const skill = this.item;
    const levelType = skill.system.level_type || 'general';
    const attribute = skill.system.attribute || null; // No default attribute
    const diceFormula = this._getDiceFormula(levelType);
    
    console.log(`BluePlanet Skill Roll - ${skill.name}:`);
    console.log(`  - Level Type: ${levelType}`);
    console.log(`  - Dice Formula: ${diceFormula}`);
    console.log(`  - Attribute: ${attribute}`);
    console.log(`  - Skill System Data:`, skill.system);
    
    const rollData = {
      label: `${skill.name} (${this._getLevelLabel(levelType)})`,
      type: 'skill',
      skillName: skill.name,
      skillRank: skill.system.rank || 0,
      attribute: attribute || 'cognition', // Default to cognition for dialog
      attributeValue: attribute ? (actor.system.attributes[attribute]?.value || 0) : 0,
      dice: diceFormula,
      levelType: levelType,
      targetNumber: 10 // Default target, can be changed in dialog
    };
    
    // Open the roll dialog
    const dialog = new BluePlanetRollDialog(actor, rollData);
    dialog.render(true);
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
}
