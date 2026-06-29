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
    
    // Initialize ammunition-related fields
    if (!systemData.magazine_capacity) systemData.magazine_capacity = 30;
    if (!systemData.current_ammo) systemData.current_ammo = systemData.magazine_capacity;
    if (!systemData.loaded_ammunition) systemData.loaded_ammunition = null;
    
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

    // Get available ammunition from the actor's inventory
    context.availableAmmunition = [];
    if (this.item.actor) {
      const actor = this.item.actor;
      const ammunitionItems = actor.items.filter(item => 
        item.type === 'ammunition' && 
        item.system.remaining_rounds > 0 &&
        this._isAmmunitionCompatible(item, systemData)
      );
      context.availableAmmunition = ammunitionItems.map(item => ({
        id: item.id,
        name: item.name,
        system: item.system
      }));
    }
    
    console.log('BluePlanet Weapon: Final context:', context);
    console.log('BluePlanet Weapon: context.system:', context.system);
    console.log('BluePlanet Weapon: weapon_type specifically:', context.system?.weapon_type);
    console.log('BluePlanet Weapon: Available ammunition:', context.availableAmmunition);
    
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Feature management
    html.find('.feature-add-button').click(this._onAddFeature.bind(this));
    html.find('.feature-delete').click(this._onDeleteFeature.bind(this));
    html.find('.quick-feature-btn').click(this._onQuickAddFeature.bind(this));
    
    // Compatible ammo management
    html.find('.ammo-type-add').click(this._onAddCompatibleAmmo.bind(this));
    html.find('.ammo-type-delete').click(this._onDeleteCompatibleAmmo.bind(this));
    
    // Drop zone functionality - handle both empty and populated states
    html.find('.drop-zone').on('dragover', this._onDragOver.bind(this));
    html.find('.drop-zone').on('dragleave', this._onDragLeave.bind(this));
    html.find('.drop-zone').on('drop', this._onDrop.bind(this));
    
    // Ammo drop zone functionality
    html.find('.ammo-drop-zone').on('dragover', this._onDragOver.bind(this));
    html.find('.ammo-drop-zone').on('dragleave', this._onDragLeave.bind(this));
    html.find('.ammo-drop-zone').on('drop', this._onAmmoDrop.bind(this));
    
    // Ammunition management controls
    html.find('.load-ammo-btn').click(this._onLoadAmmo.bind(this));
    html.find('.unload-ammo-btn').click(this._onUnloadAmmo.bind(this));
    html.find('.reload-btn').click(this._onReloadWeapon.bind(this));
    html.find('.fire-single-btn').click(this._onFireSingle.bind(this));
    html.find('.fire-burst-btn').click(this._onFireBurst.bind(this));
    html.find('.fire-auto-btn').click(this._onFireAuto.bind(this));
    
    // Prevent form submission on drag events
    html.find('.drop-zone, .ammo-drop-zone').on('dragenter', function(e) { e.preventDefault(); });
    html.find('.drop-zone, .ammo-drop-zone').on('dragstart', function(e) { e.preventDefault(); });
    
    // REACTIVE UPDATE SYSTEM - Real-time updates for critical fields
    this._setupReactiveUpdates(html);
    
    console.log(`BluePlanet Weapon: Reactive update system activated for ${this.item.name}`);
  }
  
  /**
   * Setup reactive updates for weapon properties
   * @param {jQuery} html - The rendered HTML
   * @private
   */
  _setupReactiveUpdates(html) {
    // Find critical weapon fields that should update immediately
    const criticalFields = html.find('input[name="system.damage"], input[name="system.effective_range"], input[name="system.magazine_capacity"], input[name="system.current_ammo"]');
    const nameField = html.find('input[name="name"]');
    
    console.log(`BluePlanet Weapon: Found ${criticalFields.length} critical fields for reactive updates`);
    
    // Debounce function to prevent too many updates
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };
    
    // Create debounced update function
    const debouncedUpdate = debounce(async (field, value, fieldName) => {
      const updateData = {};
      
      if (fieldName === 'name') {
        updateData.name = value;
      } else {
        updateData[fieldName] = fieldName === 'system.damage' || fieldName === 'system.effective_range' || fieldName === 'system.magazine_capacity' || fieldName === 'system.current_ammo' ? parseInt(value) || 0 : value;
      }
      
      console.log(`BluePlanet Weapon: Reactive update for ${fieldName}:`, value);
      
      try {
        // Add visual feedback
        field.addClass('updating');
        
        // Update the item
        await this.item.update(updateData);
        
        // Show success feedback
        field.removeClass('updating').addClass('updated');
        setTimeout(() => {
          field.removeClass('updated');
        }, 1000);
        
        // Emit custom event for other systems to listen to
        $(document).trigger('weaponFieldUpdated', {
          weapon: this.item,
          field: fieldName,
          value: value,
          updateData: updateData
        });
        
      } catch (error) {
        console.error(`BluePlanet Weapon: Error updating ${fieldName}:`, error);
        field.removeClass('updating').addClass('update-error');
        setTimeout(() => {
          field.removeClass('update-error');
        }, 2000);
        ui.notifications.error(`Failed to update ${fieldName}`);
      }
    }, 500); // 500ms debounce
    
    // Setup reactive listeners for critical fields
    criticalFields.on('input', function() {
      const field = $(this);
      const value = field.val();
      const fieldName = field.attr('name');
      
      // Validate input based on field type
      if (fieldName.includes('damage') || fieldName.includes('range') || fieldName.includes('capacity') || fieldName.includes('ammo')) {
        const numValue = parseInt(value) || 0;
        if (numValue >= 0) {
          debouncedUpdate(field, numValue, fieldName);
        }
      }
    });
    
    // Setup reactive listener for name field
    nameField.on('input', function() {
      const field = $(this);
      const value = field.val();
      
      if (value && value.trim().length > 0) {
        debouncedUpdate(field, value.trim(), 'name');
      }
    });
    
    // Add CSS for visual feedback
    if (!document.getElementById('weapon-reactive-styles')) {
      const styles = document.createElement('style');
      styles.id = 'weapon-reactive-styles';
      styles.textContent = `
        .weapon-sheet input.updating {
          border-color: #ffc107;
          box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
          background: linear-gradient(45deg, rgba(255, 193, 7, 0.1) 25%, transparent 25%, transparent 75%, rgba(255, 193, 7, 0.1) 75%);
          background-size: 20px 20px;
          animation: progressBar 1s linear infinite;
        }
        
        .weapon-sheet input.updated {
          border-color: #28a745;
          box-shadow: 0 0 5px rgba(40, 167, 69, 0.5);
          background: rgba(40, 167, 69, 0.1);
        }
        
        .weapon-sheet input.update-error {
          border-color: #dc3545;
          box-shadow: 0 0 5px rgba(220, 53, 69, 0.5);
          background: rgba(220, 53, 69, 0.1);
        }
        
        @keyframes progressBar {
          0% { background-position: 0 0; }
          100% { background-position: 20px 20px; }
        }
      `;
      document.head.appendChild(styles);
    }
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
   * Handle adding compatible ammunition
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddCompatibleAmmo(event) {
    event.preventDefault();
    const compatibleAmmo = [...(this.item.system.compatible_ammo || [])];
    compatibleAmmo.push("");
    await this.item.update({"system.compatible_ammo": compatibleAmmo});
  }

  /**
   * Handle deleting compatible ammunition
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteCompatibleAmmo(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const compatibleAmmo = [...(this.item.system.compatible_ammo || [])];
    compatibleAmmo.splice(index, 1);
    await this.item.update({"system.compatible_ammo": compatibleAmmo});
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
    if (!item || item.type !== 'ammunition') {
      ui.notifications.warn('Only ammunition items can be dropped here.');
      return;
    }
    
    // Check if this is a melee weapon
    if (this.item.system.weapon_type === 'melee') {
      ui.notifications.warn('Melee weapons do not use ammunition.');
      return;
    }
    
    // Check if the ammunition is compatible
    if (!this._isAmmunitionCompatible(item, this.item.system)) {
      ui.notifications.warn(`Ammunition "${item.name}" is not compatible with this weapon.`);
      return;
    }
    
    // Check if ammunition has remaining rounds
    if (!item.system.quantity || item.system.quantity <= 0) {
      ui.notifications.warn(`Ammunition "${item.name}" has no remaining rounds.`);
      return;
    }
    
    // Load the ammunition into the weapon
    await this._loadAmmunitionItem(item);
  }
  
  /**
   * Load ammunition item into weapon
   * @param {Item} ammunitionItem   The ammunition item to load
   * @private
   */
  async _loadAmmunitionItem(ammunitionItem) {
    if (!ammunitionItem || ammunitionItem.type !== 'ammunition') {
      ui.notifications.error('Invalid ammunition item.');
      return;
    }
    
    const weaponData = {
      "system.loaded_ammunition": {
        id: ammunitionItem.id,
        name: ammunitionItem.name,
        ammo_type: ammunitionItem.system.ammo_type || 'standard',
        attack_modifier: ammunitionItem.system.attack_modifier || 0,
        damage_modifier: ammunitionItem.system.damage_modifier || 0,
        penetration: ammunitionItem.system.penetration || 0,
        system: ammunitionItem.system
      },
      "system.current_ammo": Math.min(
        this.item.system.magazine_capacity || 30,
        ammunitionItem.system.quantity || 0
      )
    };
    
    await this.item.update(weaponData);
    ui.notifications.info(`Loaded ${ammunitionItem.name} into ${this.item.name}.`);
    this.render(false);
  }
  
  /**
   * Check if ammunition is compatible with weapon
   * @param {Item} ammunitionItem   The ammunition item
   * @param {Object} weaponSystem   The weapon's system data
   * @returns {Boolean}
   * @private
   */
  _isAmmunitionCompatible(ammunitionItem, weaponSystem) {
    // For now, assume all ammunition is compatible with all ranged weapons
    // TODO: Implement proper compatibility checking based on caliber, weapon type, etc.
    if (weaponSystem.weapon_type === 'melee') return false;
    
    // Check if weapon has specific compatible ammunition defined
    if (weaponSystem.compatible_ammo && weaponSystem.compatible_ammo.length > 0) {
      return weaponSystem.compatible_ammo.includes(ammunitionItem.name) ||
             weaponSystem.compatible_ammo.includes(ammunitionItem.system.ammo_type);
    }
    
    // Default: all ammunition compatible with ranged weapons
    return weaponSystem.weapon_type !== 'melee';
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
  
  /* -------------------------------------------- */
  /*  Ammunition Management Methods                */
  /* -------------------------------------------- */
  
  /**
   * Check if ammunition is compatible with this weapon
   * @param {Item} ammunition   The ammunition item to check
   * @param {Object} weaponData The weapon system data
   * @returns {Boolean} Whether the ammunition is compatible
   * @private
   */
  _isAmmunitionCompatible(ammunition, weaponData) {
    // If ammunition has no compatibility restrictions, it's universal
    if (!ammunition.system.compatible_weapons || ammunition.system.compatible_weapons.length === 0) {
      return true;
    }
    
    // Check if weapon name or type matches any compatible weapon entry
    const weaponName = this.item.name.toLowerCase();
    const weaponType = weaponData.weapon_type?.toLowerCase() || "";
    
    return ammunition.system.compatible_weapons.some(compatible => {
      const entry = compatible.toLowerCase();
      return weaponName.includes(entry) || 
             entry.includes(weaponName) ||
             (weaponType && (entry.includes(weaponType) || weaponType.includes(entry)));
    });
  }
  
  /**
   * Load ammunition into the weapon
   * @param {Event} event   The originating click event
   * @private
   */
  async _onLoadAmmo(event) {
    event.preventDefault();
    const ammoId = event.currentTarget.dataset.ammoId;
    
    if (!this.item.actor) {
      ui.notifications.warn('Weapon must be owned by an actor to load ammunition.');
      return;
    }
    
    const ammunition = this.item.actor.items.get(ammoId);
    if (!ammunition) {
      ui.notifications.error('Ammunition item not found.');
      return;
    }
    
    // Check if ammunition has enough rounds
    if (ammunition.system.remaining_rounds <= 0) {
      ui.notifications.warn(`${ammunition.name} has no remaining rounds.`);
      return;
    }
    
    // Store reference to loaded ammunition
    const loadedAmmoData = {
      id: ammunition.id,
      name: ammunition.name,
      ammo_type: ammunition.system.ammo_type,
      attack_modifier: ammunition.system.attack_modifier || 0,
      damage_modifier: ammunition.system.damage_modifier || 0,
      range_modifier: ammunition.system.range_modifier || 0,
      penetration: ammunition.system.penetration || 0
    };
    
    // Update weapon with loaded ammunition data
    await this.item.update({
      'system.loaded_ammunition': loadedAmmoData,
      'system.current_ammo': Math.min(this.item.system.magazine_capacity || 30, ammunition.system.remaining_rounds)
    });
    
    ui.notifications.info(`Loaded ${ammunition.name} into ${this.item.name}.`);
  }
  
  /**
   * Unload ammunition from the weapon
   * @param {Event} event   The originating click event
   * @private
   */
  async _onUnloadAmmo(event) {
    event.preventDefault();
    
    await this.item.update({
      'system.loaded_ammunition': null,
      'system.current_ammo': 0
    });
    
    ui.notifications.info(`Unloaded ammunition from ${this.item.name}.`);
  }
  
  /**
   * Reload weapon to full capacity
   * @param {Event} event   The originating click event
   * @private
   */
  async _onReloadWeapon(event) {
    event.preventDefault();
    
    if (!this.item.system.loaded_ammunition) {
      ui.notifications.warn('No ammunition loaded. Load ammunition first.');
      return;
    }
    
    if (!this.item.actor) {
      ui.notifications.warn('Weapon must be owned by an actor to reload.');
      return;
    }
    
    const ammunition = this.item.actor.items.get(this.item.system.loaded_ammunition.id);
    if (!ammunition) {
      ui.notifications.error('Loaded ammunition item not found in inventory.');
      return;
    }
    
    const magazineCapacity = this.item.system.magazine_capacity || 30;
    const currentAmmo = this.item.system.current_ammo || 0;
    const roundsNeeded = magazineCapacity - currentAmmo;
    
    if (roundsNeeded <= 0) {
      ui.notifications.info(`${this.item.name} is already fully loaded.`);
      return;
    }
    
    const availableRounds = ammunition.system.remaining_rounds;
    if (availableRounds < roundsNeeded) {
      ui.notifications.warn(`Not enough ammunition. Need ${roundsNeeded} rounds, but only ${availableRounds} available.`);
      return;
    }
    
    // Consume ammunition rounds
    await ammunition.update({
      'system.rounds_fired': (ammunition.system.rounds_fired || 0) + roundsNeeded
    });
    
    // Update weapon ammo count
    await this.item.update({
      'system.current_ammo': magazineCapacity
    });
    
    ui.notifications.info(`Reloaded ${this.item.name} with ${roundsNeeded} rounds.`);
  }
  
  /**
   * Fire a single round
   * @param {Event} event   The originating click event
   * @private
   */
  async _onFireSingle(event) {
    event.preventDefault();
    await this._fireRounds(1);
  }
  
  /**
   * Fire a burst (3 rounds)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onFireBurst(event) {
    event.preventDefault();
    await this._fireRounds(3);
  }
  
  /**
   * Fire full auto (10 rounds)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onFireAuto(event) {
    event.preventDefault();
    await this._fireRounds(10);
  }
  
  /**
   * Fire specified number of rounds
   * @param {Number} rounds   Number of rounds to fire
   * @private
   */
  async _fireRounds(rounds) {
    if (!this.item.system.loaded_ammunition) {
      ui.notifications.warn('No ammunition loaded.');
      return;
    }
    
    const currentAmmo = this.item.system.current_ammo || 0;
    if (currentAmmo < rounds) {
      ui.notifications.warn(`Insufficient ammunition. Only ${currentAmmo} rounds in magazine.`);
      return;
    }
    
    // Update weapon ammo count
    await this.item.update({
      'system.current_ammo': currentAmmo - rounds
    });
    
    // Also update the source ammunition item
    if (this.item.actor) {
      const ammunition = this.item.actor.items.get(this.item.system.loaded_ammunition.id);
      if (ammunition) {
        await ammunition.update({
          'system.rounds_fired': (ammunition.system.rounds_fired || 0) + rounds
        });
      }
    }
    
    ui.notifications.info(`Fired ${rounds} round(s) from ${this.item.name}. ${currentAmmo - rounds} rounds remaining.`);
  }
  
  /**
   * Get ammunition modifiers for attacks
   * @returns {Object} Object containing ammunition modifiers
   */
  getAmmunitionModifiers() {
    if (!this.item.system.loaded_ammunition) {
      return {
        attack_modifier: 0,
        damage_modifier: 0,
        range_modifier: 0,
        penetration: 0,
        ammo_type: "standard"
      };
    }
    
    const loadedAmmo = this.item.system.loaded_ammunition;
    return {
      attack_modifier: loadedAmmo.attack_modifier || 0,
      damage_modifier: loadedAmmo.damage_modifier || 0,
      range_modifier: loadedAmmo.range_modifier || 0,
      penetration: loadedAmmo.penetration || 0,
      ammo_type: loadedAmmo.ammo_type || "standard"
    };
  }
}
