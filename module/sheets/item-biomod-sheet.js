/**
 * Blue Planet Biomod Item Sheet
 * Extends ItemSheet to provide biomod-specific interface
 */
export class BluePlanetBiomodSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "biomod-sheet"],
      width: 650,
      height: 550,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-biomod-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = context.item;
    const systemData = itemData.system;

    // Add biomod-specific data
    context.biomodTypes = {
      "genetic": "Genetic Enhancement",
      "cybernetic": "Cybernetic Implant",
      "therapeutic": "Therapeutic Modification",
      "cosmetic": "Cosmetic Enhancement",
      "experimental": "Experimental Treatment"
    };

    context.availabilityOptions = {
      "common": "Common",
      "uncommon": "Uncommon",
      "rare": "Rare",
      "restricted": "Restricted",
      "experimental": "Experimental"
    };

    context.legalityOptions = {
      "legal": "Legal",
      "restricted": "Restricted",
      "controlled": "Controlled",
      "illegal": "Illegal"
    };

    // New biomod-specific options from PDF
    context.dimensionsOptions = {
      "micro": "Micro (subcutaneous)",
      "pocket": "Pocket (small implant)", 
      "handheld": "Handheld (prosthetic limb)",
      "portable": "Portable (external apparatus)",
      "mobile": "Mobile (full body system)"
    };

    context.predefinedTransformationTimes = [
      "2 weeks",
      "3 weeks", 
      "1 month",
      "2 months",
      "3 months",
      "4 months",
      "5 months",
      "6 months"
    ];

    context.predefinedHealingTimes = [
      "1 week",
      "2 weeks",
      "3 weeks",
      "1 month",
      "1.5 months",
      "2 months"
    ];

    context.predefinedEffects = [
      "Enhanced Vision (Low-light, Infrared, Telescopic)",
      "Enhanced Hearing (+2 to auditory tests)", 
      "Enhanced Smell (+2 to scent-based tests)",
      "Toxin Resistance (Immunity to specific poisons)",
      "Aquatic Adaptation (Gills, swimming bonuses)",
      "Enhanced Healing (Faster wound recovery)",
      "Environmental Tolerance (Temperature, pressure, radiation)",
      "Neural Interface (Direct computer connection)",
      "Enhanced Reflexes (+1 to Initiative)",
      "Armor Plating (Natural armor bonus)",
      "Enhanced Strength (+1 to Physique tests)",
      "Enhanced Agility (+1 to Coordination tests)"
    ];

    // Attribute bonus calculation
    context.totalAttributeBonus = Object.values(systemData.attributes || {}).reduce((sum, value) => sum + (value || 0), 0);

    // Biomod effects as array for easier template handling
    context.biomodEffects = Array.isArray(systemData.effects) ? systemData.effects : [];

    // Display attribute bonuses in a readable format
    context.attributeBonuses = [];
    for (const [attr, bonus] of Object.entries(systemData.attributes || {})) {
      if (bonus && bonus !== 0) {
        context.attributeBonuses.push({
          name: attr.charAt(0).toUpperCase() + attr.slice(1),
          value: bonus > 0 ? `+${bonus}` : `${bonus}`
        });
      }
    }

    // Installation requirements/warnings
    context.installationWarnings = [];
    if (systemData.type === 'cybernetic') {
      context.installationWarnings.push("Requires surgical installation");
    }
    if (systemData.type === 'genetic') {
      context.installationWarnings.push("Requires genetic therapy");
    }
    if (systemData.type === 'experimental') {
      context.installationWarnings.push("Experimental - side effects unknown");
    }

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Effect management
    html.find('.effect-add').click(this._onAddEffect.bind(this));
    html.find('.effect-delete').click(this._onDeleteEffect.bind(this));

    // Attribute modification controls
    html.find('.attribute-increase').click(this._onAttributeIncrease.bind(this));
    html.find('.attribute-decrease').click(this._onAttributeDecrease.bind(this));
    
    // Special rules management
    html.find('.special-rule-add').click(this._onAddSpecialRule.bind(this));
    html.find('.special-rule-delete').click(this._onDeleteSpecialRule.bind(this));
    
    // Auto-save functionality for all input fields
    html.find('input[name^="system."], select[name^="system."], textarea[name^="system."]').change(this._onFieldChange.bind(this));
    html.find('input[name="name"]').change(this._onNameChange.bind(this));
  }

  /**
   * Handle adding a biomod effect
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddEffect(event) {
    event.preventDefault();
    const effects = [...(this.item.system.effects || [])];
    effects.push("");
    await this.item.update({"system.effects": effects});
  }

  /**
   * Handle deleting a biomod effect
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteEffect(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const effects = [...(this.item.system.effects || [])];
    effects.splice(index, 1);
    await this.item.update({"system.effects": effects});
  }

  /**
   * Handle increasing an attribute bonus
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttributeIncrease(event) {
    event.preventDefault();
    const attribute = event.currentTarget.dataset.attribute;
    const currentValue = this.item.system.attributes[attribute] || 0;
    
    // Limit attribute bonuses to reasonable ranges
    if (currentValue < 5) {
      await this.item.update({[`system.attributes.${attribute}`]: currentValue + 1});
    } else {
      ui.notifications.warn("Maximum attribute bonus reached (+5)");
    }
  }

  /**
   * Handle decreasing an attribute bonus
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttributeDecrease(event) {
    event.preventDefault();
    const attribute = event.currentTarget.dataset.attribute;
    const currentValue = this.item.system.attributes[attribute] || 0;
    
    // Allow negative bonuses (penalties) to reasonable limits
    if (currentValue > -3) {
      await this.item.update({[`system.attributes.${attribute}`]: currentValue - 1});
    } else {
      ui.notifications.warn("Maximum attribute penalty reached (-3)");
    }
  }
  
  /**
   * Handle adding a special rule
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddSpecialRule(event) {
    event.preventDefault();
    const specialRules = [...(this.item.system.special_rules || [])];
    specialRules.push("");
    await this.item.update({"system.special_rules": specialRules});
  }

  /**
   * Handle deleting a special rule
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteSpecialRule(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const specialRules = [...(this.item.system.special_rules || [])];
    specialRules.splice(index, 1);
    await this.item.update({"system.special_rules": specialRules});
  }
  
  /**
   * Handle auto-saving field changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onFieldChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const fieldName = element.name;
    let value = element.value;
    
    // Convert numeric fields
    if (element.type === 'number') {
      value = parseFloat(value) || 0;
    }
    
    // Special validation for cost
    if (fieldName === 'system.cost') {
      value = Math.max(0, value);
    }
    
    console.log(`BluePlanet Biomod: Updating ${fieldName} to:`, value);
    
    try {
      await this.item.update({[fieldName]: value}, {render: false});
      console.log(`BluePlanet Biomod: Successfully updated ${fieldName} (no render)`);
    } catch (error) {
      console.error(`BluePlanet Biomod: Error updating ${fieldName}:`, error);
      ui.notifications.error(`Failed to save ${fieldName}`);
    }
  }
  
  /**
   * Handle name changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onNameChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const value = element.value;
    
    console.log('BluePlanet Biomod: Updating name to:', value);
    
    try {
      await this.item.update({name: value}, {render: false});
      console.log('BluePlanet Biomod: Successfully updated name (no render)');
    } catch (error) {
      console.error('BluePlanet Biomod: Error updating name:', error);
      ui.notifications.error('Failed to save biomod name');
    }
  }
}
