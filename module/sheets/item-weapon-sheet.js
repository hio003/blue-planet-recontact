import { delayedScrollChatToBottom } from "../chat-utils.js";

/**
 * Blue Planet Weapon Item Sheet
 * Extends ItemSheet to provide weapon-specific interface
 */
export class BluePlanetWeaponSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "weapon-sheet"],
      width: 600,
      height: 500,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: null, dropSelector: ".drop-zone, .ammo-drop-zone" }]
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-weapon-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = context.item;
    const systemData = itemData.system;

    console.log('BluePlanet Weapon: getData() called');
    console.log('BluePlanet Weapon: itemData:', itemData);
    console.log('BluePlanet Weapon: systemData:', systemData);

    // Ensure system data is available in the template
    context.system = systemData;
    
    // Add weapon-specific data
    context.weaponTypes = {
      "melee": "Melee",
      "ranged": "Ranged", 
      "underwater": "Underwater",
      "explosive": "Explosive",
      "beam": "Beam"
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

    // New weapon-specific options from PDF
    context.dimensionsOptions = {
      "pocket": "Pocket",
      "handheld": "Handheld",
      "portable": "Portable",
      "mobile": "Mobile",
      "industrial": "Industrial"
    };

    context.ammoCapacityOptions = {
      "high": "High Capacity",
      "low": "Low Capacity"
    };

    context.rateOfFireOptions = {
      "single": "Single Shot",
      "burst": "Burst Fire",
      "full": "Full-Auto"
    };

    context.predefinedAmmoTypes = [
      "Antipersonnel",
      "Armor-Piercing", 
      "HE (High-Explosive)",
      "HEAP (High-Explosive, Armor-Piercing)",
      "Self-Guided",
      "Self-Propelled"
    ];

    context.predefinedFeatures = [
      "Close Combat",
      "Indirect", 
      "Optics",
      "Sniper",
      "Suppressive",
      "Two-Handed",
      "Concealable",
      "Hardened",
      "Reliable",
      "Automatic",
      "Non-Lethal"
    ];

    // Calculate effective range display
    if (systemData.effective_range > 0) {
      context.rangeDisplay = `${systemData.effective_range}m`;
    } else {
      context.rangeDisplay = systemData.weapon_type === 'melee' ? 'Melee' : 'Unknown';
    }

    // Weapon features as array for easier template handling
    context.weaponFeatures = Array.isArray(systemData.features) ? systemData.features : [];

    console.log('BluePlanet Weapon: Final context:', context);
    console.log('BluePlanet Weapon: context.system:', context.system);
    console.log('BluePlanet Weapon: weapon_type specifically:', context.system?.weapon_type);
    
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Weapon damage roll removed - now handled in character sheet

    // Feature management
    html.find('.feature-add-button').click(this._onAddFeature.bind(this));
    html.find('.feature-delete').click(this._onDeleteFeature.bind(this));
    html.find('.quick-feature-btn').click(this._onQuickAddFeature.bind(this));
    
    // Ammunition type management
    html.find('.ammo-type-add').click(this._onAddAmmoType.bind(this));
    html.find('.ammo-type-delete').click(this._onDeleteAmmoType.bind(this));
    
    // Drop zone functionality - handle both empty and populated states
    html.find('.drop-zone').on('dragover', this._onDragOver.bind(this));
    html.find('.drop-zone').on('dragleave', this._onDragLeave.bind(this));
    html.find('.drop-zone').on('drop', this._onDrop.bind(this));
    
    // Ammo drop zone functionality
    html.find('.ammo-drop-zone').on('dragover', this._onDragOver.bind(this));
    html.find('.ammo-drop-zone').on('dragleave', this._onDragLeave.bind(this));
    html.find('.ammo-drop-zone').on('drop', this._onAmmoDrop.bind(this));
    
    // Prevent form submission on drag events
    html.find('.drop-zone, .ammo-drop-zone').on('dragenter', function(e) { e.preventDefault(); });
    html.find('.drop-zone, .ammo-drop-zone').on('dragstart', function(e) { e.preventDefault(); });
    
    // Disable auto-save to prevent render conflicts
    // Only save when the sheet is submitted or closed
    console.log(`BluePlanet Weapon: Auto-save disabled, will save on sheet close/submit`);
    
    // Optional: Add visual indication when fields change
    const systemFields = html.find('input[name^="system."], select[name^="system."], textarea[name^="system."]');
    const nameField = html.find('input[name="name"]');
    
    console.log(`BluePlanet Weapon: Found ${systemFields.length} system fields and ${nameField.length} name fields`);
    
    // Add visual feedback when fields are modified (without saving)
    systemFields.on('input change', function() {
      $(this).addClass('modified');
    });
    
    nameField.on('input change', function() {
      $(this).addClass('modified');
    });
  }

  // Weapon damage rolling is now handled in the character sheet

  /**
   * Handle adding a weapon feature
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddFeature(event) {
    event.preventDefault();
    const features = [...(this.item.system.features || [])];
    features.push("");
    await this.item.update({"system.features": features});
  }
  
  /**
   * Handle quick adding a predefined weapon feature
   * @param {Event} event   The originating click event
   * @private
   */
  async _onQuickAddFeature(event) {
    event.preventDefault();
    const featureName = event.currentTarget.dataset.feature;
    const features = [...(this.item.system.features || [])];
    
    // Check if feature already exists
    if (features.includes(featureName)) {
      ui.notifications.warn(`Feature "${featureName}" is already added to this weapon.`);
      return;
    }
    
    features.push(featureName);
    await this.item.update({"system.features": features});
    ui.notifications.info(`Added feature "${featureName}" to ${this.item.name}.`);
  }

  /**
   * Handle deleting a weapon feature
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteFeature(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const features = [...(this.item.system.features || [])];
    features.splice(index, 1);
    await this.item.update({"system.features": features});
  }
  
  /**
   * Handle adding an ammunition type
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddAmmoType(event) {
    event.preventDefault();
    const ammoTypes = [...(this.item.system.ammo_types || [])];
    ammoTypes.push("");
    await this.item.update({"system.ammo_types": ammoTypes});
  }

  /**
   * Handle deleting an ammunition type
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteAmmoType(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const ammoTypes = [...(this.item.system.ammo_types || [])];
    ammoTypes.splice(index, 1);
    await this.item.update({"system.ammo_types": ammoTypes});
  }
  
  /**
   * Handle drag over drop zone
   * @param {Event} event   The originating drag event
   * @private
   */
  _onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).addClass('drag-over');
  }
  
  /**
   * Handle drag leave drop zone
   * @param {Event} event   The originating drag event
   * @private
   */
  _onDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).removeClass('drag-over');
  }
  
  /**
   * Handle drop on drop zone
   * @param {Event} event   The originating drop event
   * @private
   */
  async _onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).removeClass('drag-over');
    
    let data;
    try {
      data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
    } catch (err) {
      console.log('Invalid drop data');
      return;
    }
    
    // Only handle feature items
    if (!data.type || data.type !== 'Item') return;
    
    const item = await Item.implementation.fromDropData(data);
    if (!item || item.type !== 'feature') {
      ui.notifications.warn('Only feature items can be dropped here.');
      return;
    }
    
    // Add the feature name to the weapon's features array
    const features = [...(this.item.system.features || [])];
    const featureName = item.name;
    
    // Check if feature already exists
    if (features.includes(featureName)) {
      ui.notifications.warn(`Feature "${featureName}" is already added to this weapon.`);
      return;
    }
    
    features.push(featureName);
    await this.item.update({"system.features": features});
    ui.notifications.info(`Added feature "${featureName}" to ${this.item.name}.`);
  }
  
  /**
   * Handle drop on ammo drop zone
   * @param {Event} event   The originating drop event
   * @private
   */
  async _onAmmoDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).removeClass('drag-over');
    
    let data;
    try {
      data = JSON.parse(event.originalEvent.dataTransfer.getData('text/plain'));
    } catch (err) {
      console.log('Invalid drop data');
      return;
    }
    
    // Only handle item drops
    if (!data.type || data.type !== 'Item') return;
    
    const item = await Item.implementation.fromDropData(data);
    if (!item || item.type !== 'ammo_type') {
      ui.notifications.warn('Only ammunition type items can be dropped here.');
      return;
    }
    
    // Add the ammo type name to the weapon's ammo_types array
    const ammoTypes = [...(this.item.system.ammo_types || [])];
    const ammoTypeName = item.name;
    
    // Check if ammo type already exists
    if (ammoTypes.includes(ammoTypeName)) {
      ui.notifications.warn(`Ammunition type "${ammoTypeName}" is already added to this weapon.`);
      return;
    }
    
    ammoTypes.push(ammoTypeName);
    await this.item.update({"system.ammo_types": ammoTypes});
    ui.notifications.info(`Added ammunition type "${ammoTypeName}" to ${this.item.name}.`);
  }
  
  
  /** @override */
  async _updateObject(event, formData) {
    console.log('BluePlanet Weapon: _updateObject called with formData:', formData);
    
    // Convert string numbers to actual numbers
    if (formData['system.damage'] !== undefined) {
      formData['system.damage'] = parseFloat(formData['system.damage']) || 0;
      formData['system.damage'] = Math.max(0, Math.min(25, formData['system.damage']));
    }
    
    if (formData['system.effective_range'] !== undefined) {
      formData['system.effective_range'] = parseFloat(formData['system.effective_range']) || 0;
      formData['system.effective_range'] = Math.max(0, formData['system.effective_range']);
    }
    
    if (formData['system.cost'] !== undefined) {
      formData['system.cost'] = parseFloat(formData['system.cost']) || 0;
      formData['system.cost'] = Math.max(0, formData['system.cost']);
    }
    
    // Handle new numeric fields
    if (formData['system.durability'] !== undefined) {
      formData['system.durability'] = parseInt(formData['system.durability']) || 0;
      formData['system.durability'] = Math.max(-10, Math.min(10, formData['system.durability']));
    }
    
    if (formData['system.recoil_penalty'] !== undefined) {
      formData['system.recoil_penalty'] = parseInt(formData['system.recoil_penalty']) || 0;
      formData['system.recoil_penalty'] = Math.max(0, Math.min(10, formData['system.recoil_penalty']));
    }
    
    console.log('BluePlanet Weapon: Processed formData:', formData);
    console.log('BluePlanet Weapon: About to save weapon data...');
    
    // Use the standard Foundry update process
    const result = await super._updateObject(event, formData);
    
    console.log('BluePlanet Weapon: Weapon data saved successfully!');
    ui.notifications.info('Weapon saved successfully');
    
    return result;
  }
  
  /** @override */
  async close(options={}) {
    // Force save any pending changes before closing
    console.log('BluePlanet Weapon: Sheet closing, forcing save...');
    
    try {
      const form = this.form;
      if (form) {
        const formData = new FormDataExtended(form).object;
        console.log('BluePlanet Weapon: Final formData before close:', formData);
        
        // Process and save the form data
        await this._updateObject(null, formData);
        console.log('BluePlanet Weapon: Successfully saved before closing');
      }
    } catch (error) {
      console.error('BluePlanet Weapon: Error saving before close:', error);
      ui.notifications.warn('Some weapon data may not have been saved');
    }
    
    return super.close(options);
  }
}
