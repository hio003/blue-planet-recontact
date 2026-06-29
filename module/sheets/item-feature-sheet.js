/**
 * Blue Planet Feature Item Sheet
 * Extends ItemSheet to provide feature-specific interface
 */
export class BluePlanetFeatureSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "feature-sheet"],
      width: 500,
      height: 450,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-feature-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = context.item;
    const systemData = itemData.system;

    // Ensure system data is available in the template
    context.system = systemData;

    // Feature categories
    context.categoryOptions = {
      "technology": "Technology Feature",
      "weapon": "Weapon Feature"
    };

    // Technology feature types (pages 1-2 of PDF)
    context.technologyFeatureTypes = {
      "": "Select Type...",
      "concealable": "Concealable",
      "hardened": "Hardened", 
      "interfacing_type": "Interfacing Type",
      "manipulators": "Manipulators",
      "power_type": "Power Type",
      "responsive_materials": "Responsive Materials",
      "sealed": "Sealed",
      "sensors": "Sensors",
      // Narrative/conditional features
      "air_gapped": "Air-Gapped",
      "damaged": "Damaged",
      "drained": "Drained",
      "encrypted": "Encrypted",
      "handmade": "Handmade",
      "junk": "Junk",
      "jury_rigged": "Jury-Rigged",
      "malfunctioning": "Malfunctioning",
      "premium": "Premium",
      "upgraded": "Upgraded",
      "waterlogged": "Waterlogged"
    };

    // Weapon feature types (pages 3-4 of PDF)
    context.weaponFeatureTypes = {
      "": "Select Type...",
      "ammo_capacity": "Ammo Capacity",
      "ammo_type": "Ammo Type", 
      "close_combat": "Close Combat",
      "indirect": "Indirect",
      "optics": "Optics",
      "rate_of_fire": "Rate of Fire",
      "sniper": "Sniper",
      "suppressive": "Suppressive",
      "two_handed": "Two-Handed"
    };

    // Bonus types
    context.bonusTypeOptions = {
      "none": "No Bonus/Penalty",
      "target_number": "Target Number Bonus",
      "damage_rating": "Damage Rating Modifier", 
      "armor_reduction": "Armor Reduction",
      "range_modifier": "Range Modifier",
      "custom": "Custom Effect"
    };

    // Interfacing subtypes (for technology features)
    context.interfacingSubtypes = {
      "": "Select Interfacing Type...",
      "cold": "Cold (No digital controls)",
      "warm": "Warm (Digital access, voice interactive)",
      "hot": "Hot (Neural interface capable)",
      "flat": "Flat (No remote/independent operation)",
      "smart": "Smart (Interactive, autonomous)",
      "gi": "GI (General Intelligence, sapient-level)"
    };

    // Power subtypes (for technology features)
    context.powerSubtypes = {
      "": "Select Power Type...",
      "external": "External",
      "integrated": "Integrated", 
      "kinetic": "Kinetic",
      "physiological": "Physiological",
      "rechargeable": "Rechargeable"
    };

    // Ammo type subtypes (for weapon features)
    context.ammoSubtypes = {
      "": "Select Ammo Type...",
      "antipersonnel": "Antipersonnel",
      "armor_piercing": "Armor-Piercing",
      "he": "HE (High-Explosive)",
      "heap": "HEAP (High-Explosive, Armor-Piercing)",
      "self_guided": "Self-Guided",
      "self_propelled": "Self-Propelled"
    };

    // Rate of fire subtypes (for weapon features)
    context.rateOfFireSubtypes = {
      "": "Select Rate of Fire...",
      "single_shot": "Single Shot",
      "burst_fire": "Burst Fire", 
      "full_auto": "Full-Auto"
    };

    // Ammo capacity subtypes (for weapon features)
    context.ammoCapacitySubtypes = {
      "": "Select Capacity...",
      "low": "Low Capacity",
      "high": "High Capacity"
    };

    context.availabilityOptions = {
      "common": "Common",
      "uncommon": "Uncommon",
      "rare": "Rare", 
      "restricted": "Restricted"
    };

    context.legalityOptions = {
      "legal": "Legal",
      "restricted": "Restricted",
      "controlled": "Controlled", 
      "illegal": "Illegal"
    };

    // Determine which feature types to show based on category
    if (systemData.category === "weapon") {
      context.currentFeatureTypes = context.weaponFeatureTypes;
    } else {
      context.currentFeatureTypes = context.technologyFeatureTypes;
    }

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Category change handler
    html.find('select[name="system.category"]').change(this._onCategoryChange.bind(this));
    
    // Auto-save functionality for all input fields
    html.find('input[name^="system."], select[name^="system."], textarea[name^="system."]').change(this._onFieldChange.bind(this));
    html.find('input[name="name"]').change(this._onNameChange.bind(this));
  }

  /**
   * Handle category change to update available feature types
   * @param {Event} event   The originating change event
   * @private
   */
  async _onCategoryChange(event) {
    event.preventDefault();
    const newCategory = event.target.value;
    
    // Clear feature_type when category changes
    await this.item.update({
      "system.category": newCategory,
      "system.feature_type": ""
    });
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
      value = parseInt(value) || 0;
    }
    
    // Special validation for specific fields
    if (fieldName === 'system.bonus_value') {
      value = Math.max(-10, Math.min(10, value));
    } else if (fieldName === 'system.cost') {
      value = Math.max(0, parseFloat(value) || 0);
    }
    
    console.log(`BluePlanet Feature: Updating ${fieldName} to:`, value);
    
    try {
      await this.item.update({[fieldName]: value}, {render: false});
      console.log(`BluePlanet Feature: Successfully updated ${fieldName} (no render)`);
    } catch (error) {
      console.error(`BluePlanet Feature: Error updating ${fieldName}:`, error);
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
    
    console.log('BluePlanet Feature: Updating name to:', value);
    
    try {
      await this.item.update({name: value}, {render: false});
      console.log('BluePlanet Feature: Successfully updated name (no render)');
    } catch (error) {
      console.error('BluePlanet Feature: Error updating name:', error);
      ui.notifications.error('Failed to save feature name');
    }
  }
}