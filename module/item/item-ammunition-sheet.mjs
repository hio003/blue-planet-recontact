import { BluePlanetItemSheet } from "./item-sheet.mjs";

/**
 * Ammunition item sheet for Blue Planet Recontact
 * Handles individual ammunition items with quantity tracking, 
 * combat modifiers, and weapon compatibility
 */
export class AmmunitionSheetBPR extends BluePlanetItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "ammunition-sheet"],
      width: 650,
      height: 580,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "overview" }],
      resizable: true
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-ammunition-sheet.hbs`;
  }

  /** @override */
  async getData() {
    // Get the base context from parent
    const context = await super.getData();
    
    // Use the actual item system data, not the potentially undefined context.system
    const actualSystemData = this.item.system || {};
    const systemData = foundry.utils.deepClone(actualSystemData);
    
    // Set default values for ammunition properties
    const defaults = {
      quantity: 1,
      package_size: 50,
      ammo_type: "standard",
      attack_modifier: 0,
      damage_modifier: 0,
      range_modifier: 0,
      penetration: 0,
      weight_per_round: 0.001,
      cost_per_round: 0.1,
      rounds_fired: 0,
      availability: "common",
      legality: "legal",
      compatible_weapons: [],
      description: ""
    };

    // Apply defaults ONLY for missing properties (preserve existing data)
    for (const [key, value] of Object.entries(defaults)) {
      if (systemData[key] === undefined || systemData[key] === null) {
        systemData[key] = value;
      }
    }
    
    // Ensure compatible_weapons is always an array
    if (!Array.isArray(systemData.compatible_weapons)) {
      console.warn('BluePlanet Ammunition: compatible_weapons is not an array, fixing:', systemData.compatible_weapons);
      
      // If it's an object that looks like an array (e.g., {0: 'value'}), convert it
      if (systemData.compatible_weapons && typeof systemData.compatible_weapons === 'object') {
        const objectKeys = Object.keys(systemData.compatible_weapons);
        if (objectKeys.length > 0 && objectKeys.every(key => /^\d+$/.test(key))) {
          // It's an object with numeric keys, convert to array
          systemData.compatible_weapons = Object.values(systemData.compatible_weapons).filter(v => v !== '');
          console.log('BluePlanet Ammunition: Converted object to array:', systemData.compatible_weapons);
          
          // Force save the corrected data immediately
          try {
            await this.item.update({'system.compatible_weapons': systemData.compatible_weapons});
            console.log('BluePlanet Ammunition: Successfully saved corrected compatible_weapons array');
          } catch (error) {
            console.error('BluePlanet Ammunition: Failed to save corrected compatible_weapons:', error);
          }
        } else {
          systemData.compatible_weapons = [];
        }
      } else {
        systemData.compatible_weapons = [];
      }
    }
    
    // Update the context with the processed data
    context.system = systemData;
    
    console.log('BluePlanet Ammunition: Final system data:', systemData);

    // Add ammunition type options
    context.ammoTypeOptions = {
      "standard": "Standard Ball",
      "ap": "Armor Piercing",
      "hollow_point": "Hollow Point", 
      "fmj": "Full Metal Jacket",
      "tracer": "Tracer",
      "incendiary": "Incendiary",
      "explosive": "Explosive",
      "subsonic": "Subsonic",
      "flechette": "Flechette",
      "smart": "Smart Ammunition",
      "emp": "EMP",
      "stun": "Stun/Less-Lethal",
      "gel": "Gel Rounds"
    };

    // Add calculated properties
    context.totalRounds = systemData.quantity * systemData.package_size;
    context.remainingRounds = context.totalRounds - systemData.rounds_fired;
    context.totalWeight = context.totalRounds * systemData.weight_per_round;
    context.totalValue = context.totalRounds * systemData.cost_per_round;

    // Add weapon compatibility helpers
    context.hasCompatibleWeapons = systemData.compatible_weapons && systemData.compatible_weapons.length > 0;
    
    // Get available weapons for modal selection
    context.availableWeapons = await this._getAvailableWeapons();

    return context;
  }

  /** @override */
  activateListeners(html) {
    // CRITICAL: Call parent class listeners first to enable auto-save functionality
    super.activateListeners(html);

    // Don't add event listeners for limited permissions
    if (!this.isEditable) {
      return;
    }
    
    // The parent class handles auto-save for system fields automatically

    // Quantity control buttons
    html.find('.qty-minus').click(this._onDecreaseQuantity.bind(this));
    html.find('.qty-plus').click(this._onIncreaseQuantity.bind(this));

    // Usage tracking buttons
    html.find('[data-action="fire-round"]').click(this._onFireRound.bind(this));
    html.find('[data-action="fire-burst"]').click(this._onFireBurst.bind(this));
    html.find('[data-action="fire-auto"]').click(this._onFireAuto.bind(this));
    html.find('[data-action="fire-custom"]').click(this._onFireCustom.bind(this));
    html.find('[data-action="reset-fired"]').click(this._onResetFired.bind(this));

    // Compatible weapons management - legacy text input
    html.find('.add-text-weapon-btn').click(this._onAddTextWeapon.bind(this));
    html.find('.remove-weapon').click(this._onRemoveWeapon.bind(this));
    html.find('.remove-weapon-item').click(this._onRemoveWeaponItem.bind(this));
    
    // New modal-based weapon selection
    html.find('.select-weapon-modal-btn').click(this._onOpenWeaponSelectionModal.bind(this));

    // Auto-calculate total rounds on quantity/package changes
    html.find('.quantity-input, .package-input').change(this._onQuantityChange.bind(this));
    html.find('.quantity-input, .package-input').on('input', this._onQuantityInput.bind(this));
    
    // Let the parent class handle auto-saving - don't add extra blur listeners
    // that can cause excessive saving and performance issues
    
    // Drag & Drop functionality
    this._setupDragAndDrop(html);
  }

  /* -------------------------------------------- */

  /**
   * Handle decreasing ammunition quantity
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDecreaseQuantity(event) {
    event.preventDefault();
    const currentQty = this.item.system.quantity || 0;
    if (currentQty > 0) {
      await this.item.update({"system.quantity": currentQty - 1});
    }
  }

  /**
   * Handle increasing ammunition quantity
   * @param {Event} event   The originating click event
   * @private
   */
  async _onIncreaseQuantity(event) {
    event.preventDefault();
    const currentQty = this.item.system.quantity || 0;
    await this.item.update({"system.quantity": currentQty + 1});
  }

  /**
   * Handle firing a single round
   * @param {Event} event   The originating click event
   * @private
   */
  async _onFireRound(event) {
    event.preventDefault();
    await this._fireRounds(1);
  }

  /**
   * Handle firing a burst (3 rounds)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onFireBurst(event) {
    event.preventDefault();
    await this._fireRounds(3);
  }

  /**
   * Handle firing full auto (10 rounds)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onFireAuto(event) {
    event.preventDefault();
    await this._fireRounds(10);
  }

  /**
   * Fire specified number of rounds
   * @param {number} rounds   Number of rounds to fire
   * @private
   */
  async _fireRounds(rounds) {
    const systemData = this.item.system;
    const totalRounds = systemData.quantity * systemData.package_size;
    const currentFired = systemData.rounds_fired || 0;
    const remainingRounds = totalRounds - currentFired;

    if (remainingRounds < rounds) {
      ui.notifications.warn(`Insufficient ammunition! Only ${remainingRounds} rounds remaining.`);
      return;
    }

    const newFiredCount = currentFired + rounds;
    console.log(`BluePlanet Ammunition: Firing ${rounds} rounds. Fired count: ${currentFired} -> ${newFiredCount}`);
    
    try {
      await this.item.update({"system.rounds_fired": newFiredCount});
      
      // Update usage display immediately
      this._updateUsageDisplay();
      
      ui.notifications.info(`Fired ${rounds} round(s). ${remainingRounds - rounds} rounds remaining.`);
    } catch (error) {
      console.error('BluePlanet Ammunition: Error firing rounds:', error);
      ui.notifications.error('Failed to update rounds fired: ' + error.message);
    }
  }

  /**
   * Reset the fired rounds counter
   * @param {Event} event   The originating click event
   * @private
   */
  async _onResetFired(event) {
    event.preventDefault();
    
    console.log('BluePlanet Ammunition: Resetting rounds fired counter from', this.item.system.rounds_fired, 'to 0');
    
    try {
      await this.item.update({"system.rounds_fired": 0});
      console.log('BluePlanet Ammunition: Reset successful, new rounds_fired value:', this.item.system.rounds_fired);
      
      // Update usage display immediately
      this._updateUsageDisplay();
      
      ui.notifications.info("Rounds fired counter reset to 0.");
    } catch (error) {
      console.error('BluePlanet Ammunition: Reset failed:', error);
      ui.notifications.error('Failed to reset rounds fired counter: ' + error.message);
    }
  }

  /**
   * Handle adding a compatible weapon (text-based)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddTextWeapon(event) {
    event.preventDefault();
    let compatibleWeapons = this.item.system.compatible_weapons || [];
    
    // Ensure compatibleWeapons is an array
    if (!Array.isArray(compatibleWeapons)) {
      console.warn('BluePlanet Ammunition: compatible_weapons is not an array in _onAddTextWeapon:', compatibleWeapons);
      compatibleWeapons = [];
    }
    
    const weaponsArray = foundry.utils.deepClone(compatibleWeapons);
    weaponsArray.push("");
    await this.item.update({"system.compatible_weapons": weaponsArray});
  }

  /**
   * Handle removing a compatible weapon (text-based)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRemoveWeapon(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    let compatibleWeapons = this.item.system.compatible_weapons || [];
    
    // Ensure compatibleWeapons is an array
    if (!Array.isArray(compatibleWeapons)) {
      console.warn('BluePlanet Ammunition: compatible_weapons is not an array in _onRemoveWeapon:', compatibleWeapons);
      compatibleWeapons = [];
    }
    
    const weaponsArray = foundry.utils.deepClone(compatibleWeapons);
    weaponsArray.splice(index, 1);
    await this.item.update({"system.compatible_weapons": weaponsArray});
  }
  
  /**
   * Handle removing a weapon item reference
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRemoveWeaponItem(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    let compatibleWeapons = this.item.system.compatible_weapons || [];
    
    // Ensure compatibleWeapons is an array
    if (!Array.isArray(compatibleWeapons)) {
      console.warn('BluePlanet Ammunition: compatible_weapons is not an array in _onRemoveWeaponItem:', compatibleWeapons);
      compatibleWeapons = [];
    }
    
    const weaponsArray = foundry.utils.deepClone(compatibleWeapons);
    weaponsArray.splice(index, 1);
    await this.item.update({"system.compatible_weapons": weaponsArray});
  }

  /**
   * Handle quantity or package size changes to update totals
   * @param {Event} event   The originating change event
   * @private
   */
  async _onQuantityChange(event) {
    // Force a re-render to update calculated values
    this.render(false);
  }

  /**
   * Live-update total rounds display while typing
   * @param {Event} event
   * @private
   */
  _onQuantityInput(event) {
    const root = this.element;
    const qty = Number(root.find('.quantity-input').val()) || 0;
    const pack = Number(root.find('.package-input').val()) || 0;
    const total = qty * pack;
    root.find('.total-rounds .total-display').text(total);
    // Also update usage stats if present
    root.find('.usage-value.total').text(total);
    const fired = Number(this.item.system.rounds_fired) || 0;
    const remaining = Math.max(0, total - fired);
    root.find('.usage-value.remaining').text(remaining);
    const percent = total > 0 ? ((fired / total) * 100).toFixed(1) : 0;
    root.find('.usage-value.percent').text(`${percent}%`);
    root.find('.progress-fill').css('width', `${total > 0 ? (fired / total) * 100 : 0}%`);
  }
  
  /**
   * Update the usage tracking display with current values
   * @private
   */
  _updateUsageDisplay() {
    if (!this.element) return;
    
    console.log('BluePlanet Ammunition: Updating usage display');
    const root = this.element;
    const systemData = this.item.system;
    
    const qty = systemData.quantity || 0;
    const pack = systemData.package_size || 0;
    const total = qty * pack;
    const fired = systemData.rounds_fired || 0;
    const remaining = Math.max(0, total - fired);
    const percent = total > 0 ? ((fired / total) * 100).toFixed(1) : 0;
    
    console.log(`BluePlanet Ammunition: Usage stats - Total: ${total}, Fired: ${fired}, Remaining: ${remaining}, Percent: ${percent}%`);
    
    // Update all usage-related elements
    root.find('.usage-value.total').text(total);
    root.find('.usage-value.fired').text(fired);
    root.find('.usage-value.remaining').text(remaining);
    root.find('.usage-value.percent').text(`${percent}%`);
    root.find('.progress-fill').css('width', `${percent}%`);
    
    // Also update total rounds display if present
    root.find('.total-rounds .total-display').text(total);
    
    console.log('BluePlanet Ammunition: Usage display updated');
  }

  /* -------------------------------------------- */

  /**
   * Get ammunition modifiers for use by weapons
   * @returns {Object} Object containing ammunition modifiers
   */
  getAmmunitionModifiers() {
    const systemData = this.item.system;
    return {
      attack_modifier: systemData.attack_modifier || 0,
      damage_modifier: systemData.damage_modifier || 0,
      range_modifier: systemData.range_modifier || 0,
      penetration: systemData.penetration || 0,
      ammo_type: systemData.ammo_type || "standard"
    };
  }

  /**
   * Check if this ammunition is compatible with a given weapon
   * @param {string} weaponName   Name or type of weapon to check
   * @returns {boolean} True if compatible
   */
  isCompatibleWith(weaponName) {
    let compatibleWeapons = this.item.system.compatible_weapons || [];
    
    // Ensure compatibleWeapons is an array
    if (!Array.isArray(compatibleWeapons)) {
      console.warn('BluePlanet Ammunition: compatible_weapons is not an array in isCompatibleWith:', compatibleWeapons);
      return true; // Default to universal compatibility if data is corrupted
    }
    
    // If no specific restrictions, assume universal compatibility
    if (compatibleWeapons.length === 0) return true;
    
    // Check if weapon name matches any of the compatible weapons
    return compatibleWeapons.some(weapon => {
      const weaponRef = typeof weapon === 'string' ? weapon : (weapon.name || '');
      return weaponRef.toLowerCase().includes(weaponName.toLowerCase()) ||
             weaponName.toLowerCase().includes(weaponRef.toLowerCase());
    });
  }

  /**
   * Consume ammunition (used by weapon attacks)
   * @param {number} rounds   Number of rounds to consume
   * @returns {boolean} True if ammunition was consumed successfully
   */
  async consumeAmmunition(rounds = 1) {
    const systemData = this.item.system;
    const totalRounds = systemData.quantity * systemData.package_size;
    const currentFired = systemData.rounds_fired || 0;
    const remainingRounds = totalRounds - currentFired;

    if (remainingRounds < rounds) {
      ui.notifications.error(`Insufficient ammunition! Only ${remainingRounds} rounds remaining.`);
      return false;
    }

    const newFiredCount = currentFired + rounds;
    console.log(`BluePlanet Ammunition: Consuming ${rounds} rounds. Fired count: ${currentFired} -> ${newFiredCount}`);
    
    try {
      await this.item.update({"system.rounds_fired": newFiredCount});
      
      // Update usage display if this sheet is open
      if (this.element) {
        this._updateUsageDisplay();
      }
      
      return true;
    } catch (error) {
      console.error('BluePlanet Ammunition: Error consuming ammunition:', error);
      ui.notifications.error('Failed to consume ammunition: ' + error.message);
      return false;
    }
  }

  /**
   * Get remaining ammunition count
   * @returns {number} Number of rounds remaining
   */
  getRemainingRounds() {
    const systemData = this.item.system;
    const totalRounds = systemData.quantity * systemData.package_size;
    const currentFired = systemData.rounds_fired || 0;
    return Math.max(0, totalRounds - currentFired);
  }
  
  /* -------------------------------------------- */
  /* New Methods for Enhanced Weapon Compatibility */
  /* -------------------------------------------- */
  
  /**
   * Fire a custom number of rounds
   * @param {Event} event   The originating click event
   * @private
   */
  async _onFireCustom(event) {
    event.preventDefault();
    const customInput = this.element.find('.custom-rounds-input');
    const rounds = parseInt(customInput.val()) || 1;
    
    if (rounds <= 0) {
      ui.notifications.warn('Please enter a valid number of rounds to fire.');
      return;
    }
    
    await this._fireRounds(rounds);
    customInput.val(''); // Clear the input after firing
  }
  
  /**
   * Get available weapons from actor inventory and compendiums
   * @returns {Array} Array of available weapon items
   * @private
   */
  async _getAvailableWeapons() {
    const availableWeapons = [];
    
    // Get weapons from current actor if item is owned
    if (this.item.parent && this.item.parent.items) {
      const actorWeapons = this.item.parent.items.filter(item => item.type === 'weapon');
      availableWeapons.push(...actorWeapons);
    }
    
    // Get weapons from world items
    const worldWeapons = game.items.filter(item => item.type === 'weapon');
    availableWeapons.push(...worldWeapons);
    
    // Mark currently compatible weapons as selected
    const compatibleWeapons = this.item.system.compatible_weapons || [];
    
    // Ensure compatibleWeapons is an array
    let weaponsArray;
    if (Array.isArray(compatibleWeapons)) {
      weaponsArray = compatibleWeapons;
    } else {
      console.warn('BluePlanet Ammunition: compatible_weapons is not an array, converting:', compatibleWeapons);
      weaponsArray = [];
    }
    
    return availableWeapons.map(weapon => {
      const isSelected = weaponsArray.some(cw => 
        (cw.id && cw.id === weapon.id) || 
        (typeof cw === 'string' && cw === weapon.name)
      );
      return {
        ...weapon,
        isSelected
      };
    });
  }
  
  /**
   * Setup drag and drop functionality for weapon items
   * @param {jQuery} html   The rendered HTML element
   * @private
   */
  _setupDragAndDrop(html) {
    // Setup drop zone for weapons
    const dropZone = html.find('.weapon-drop-zone')[0];
    if (dropZone) {
      dropZone.addEventListener('dragover', this._onDragOver.bind(this));
      dropZone.addEventListener('drop', this._onDropWeapon.bind(this));
    }
  }
  
  /**
   * Handle drag over events
   * @param {DragEvent} event   The drag event
   * @private
   */
  _onDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-hover');
  }
  
  /**
   * Handle weapon item drop
   * @param {DragEvent} event   The drop event
   * @private
   */
  async _onDropWeapon(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-hover');
    
    let dragData;
    try {
      dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return;
    }
    
    // Only accept weapon items
    if (dragData.type !== 'Item') {
      ui.notifications.warn('Only items can be dropped here.');
      return;
    }
    
    // Get the weapon item to check its type
    const weapon = await fromUuid(dragData.uuid);
    if (!weapon) {
      ui.notifications.error('Could not find the dropped item.');
      return;
    }
    
    if (weapon.type !== 'weapon') {
      ui.notifications.warn('Only weapon items can be dropped here.');
      return;
    }
    
    await this._addWeaponReference(weapon);
  }
  
  /**
   * Add a weapon item reference to compatible weapons
   * @param {Item} weapon   The weapon item to add
   * @private
   */
  async _addWeaponReference(weapon) {
    let compatibleWeapons = this.item.system.compatible_weapons || [];
    
    // Ensure compatibleWeapons is an array
    if (!Array.isArray(compatibleWeapons)) {
      console.warn('BluePlanet Ammunition: compatible_weapons is not an array, resetting to empty array:', compatibleWeapons);
      compatibleWeapons = [];
    }
    
    const weaponsArray = foundry.utils.deepClone(compatibleWeapons);
    
    // Check if weapon is already in the list
    const alreadyExists = weaponsArray.some(cw => 
      (cw.id && cw.id === weapon.id) || 
      (typeof cw === 'string' && cw === weapon.name)
    );
    
    if (alreadyExists) {
      ui.notifications.warn(`${weapon.name} is already in the compatible weapons list.`);
      return;
    }
    
    // Add weapon reference
    weaponsArray.push({
      id: weapon.id,
      name: weapon.name,
      weapon_type: weapon.system.weapon_type,
      uuid: weapon.uuid
    });
    
    await this.item.update({"system.compatible_weapons": weaponsArray});
    ui.notifications.info(`Added ${weapon.name} to compatible weapons.`);
  }
  
  /**
   * Open weapon selection modal
   * @param {Event} event   The originating click event
   * @private
   */
  async _onOpenWeaponSelectionModal(event) {
    event.preventDefault();
    
    const availableWeapons = await this._getAvailableWeapons();
    const templateData = {
      availableWeapons: availableWeapons
    };
    
    // Render the modal template
    const modalContent = await foundry.applications.handlebars.renderTemplate(
      'systems/blue-planet-recontact/templates/item/partials/weapon-selection-modal.hbs',
      templateData
    );
    
    // Create and show the modal
    const modal = $(`<div class="modal-overlay">${modalContent}</div>`);
    $('body').append(modal);
    
    // Setup modal event listeners
    this._setupModalListeners(modal);
    
    // Focus search input
    modal.find('.weapon-search').focus();
  }
  
  /**
   * Setup event listeners for the weapon selection modal
   * @param {jQuery} modal   The modal element
   * @private
   */
  _setupModalListeners(modal) {
    const selectedWeapons = new Set();
    
    // Close modal buttons
    modal.find('.close-modal, .cancel-btn').click(() => {
      modal.remove();
    });
    
    // Search functionality
    modal.find('.weapon-search').on('input', (event) => {
      const searchTerm = event.target.value.toLowerCase();
      this._filterWeapons(modal, searchTerm);
    });
    
    // Type filter
    modal.find('.weapon-type-filter').change((event) => {
      const weaponType = event.target.value;
      this._filterWeaponsByType(modal, weaponType);
    });
    
    // Checkbox selection
    modal.find('input[type="checkbox"]').change((event) => {
      const weaponId = event.target.dataset.weaponId;
      const item = modal.find(`.weapon-selection-item[data-weapon-id="${weaponId}"]`);
      
      if (event.target.checked) {
        selectedWeapons.add(weaponId);
        item.addClass('selected');
      } else {
        selectedWeapons.delete(weaponId);
        item.removeClass('selected');
      }
      
      this._updateSelectionCount(modal, selectedWeapons.size);
    });
    
    // Clear all selection
    modal.find('.clear-btn').click(() => {
      modal.find('input[type="checkbox"]').prop('checked', false).trigger('change');
      selectedWeapons.clear();
      this._updateSelectionCount(modal, 0);
    });
    
    // Confirm selection
    modal.find('.confirm-btn').click(async () => {
      if (selectedWeapons.size === 0) {
        ui.notifications.warn('Please select at least one weapon.');
        return;
      }
      
      await this._addSelectedWeapons(Array.from(selectedWeapons));
      modal.remove();
    });
    
    // Close on background click
    modal.click((event) => {
      if (event.target === modal[0]) {
        modal.remove();
      }
    });
    
    // Initialize selection count
    const initialSelected = modal.find('input[type="checkbox"]:checked').length;
    this._updateSelectionCount(modal, initialSelected);
  }
  
  /**
   * Filter weapons by search term
   * @param {jQuery} modal     The modal element
   * @param {string} searchTerm The search term
   * @private
   */
  _filterWeapons(modal, searchTerm) {
    modal.find('.weapon-selection-item').each((index, element) => {
      const weaponName = $(element).find('h4').text().toLowerCase();
      const weaponType = $(element).find('.weapon-type').text().toLowerCase();
      
      const matches = weaponName.includes(searchTerm) || weaponType.includes(searchTerm);
      $(element).toggle(matches);
    });
  }
  
  /**
   * Filter weapons by type
   * @param {jQuery} modal      The modal element
   * @param {string} weaponType The weapon type to filter by
   * @private
   */
  _filterWeaponsByType(modal, weaponType) {
    modal.find('.weapon-selection-item').each((index, element) => {
      if (!weaponType) {
        $(element).show();
        return;
      }
      
      const itemWeaponType = $(element).find('.weapon-type').text().toLowerCase().replace(' ', '_');
      const matches = itemWeaponType === weaponType;
      $(element).toggle(matches);
    });
  }
  
  /**
   * Update selection count display
   * @param {jQuery} modal The modal element
   * @param {number} count The selection count
   * @private
   */
  _updateSelectionCount(modal, count) {
    modal.find('.selection-count').text(count);
  }
  
  /** @override */
  async _updateObject(event, formData) {
    console.log('BluePlanet Ammunition: _updateObject called with formData:', formData);
    console.log('BluePlanet Ammunition: Current item data before update:', this.item.system);
    console.log('BluePlanet Ammunition: Item ID:', this.item.id);
    console.log('BluePlanet Ammunition: Item UUID:', this.item.uuid);
    
    // Process numeric fields specifically for ammunition
    const numericFields = [
      'system.quantity',
      'system.package_size', 
      'system.attack_modifier',
      'system.damage_modifier',
      'system.range_modifier',
      'system.penetration',
      'system.weight_per_round',
      'system.cost_per_round',
      'system.rounds_fired'
    ];
    
    numericFields.forEach(field => {
      if (formData[field] !== undefined) {
        const numValue = parseFloat(formData[field]) || 0;
        console.log(`BluePlanet Ammunition: Converting ${field}: ${formData[field]} -> ${numValue}`);
        formData[field] = numValue;
      }
    });
    
    console.log('BluePlanet Ammunition: Processed formData:', formData);
    
    try {
      const result = await super._updateObject(event, formData);
      console.log('BluePlanet Ammunition: Update successful! New data:', this.item.system);
      
      // Verify the data was actually saved
      const dataSaved = await this._verifyDataSaved(formData);
      if (dataSaved) {
        console.log('BluePlanet Ammunition: Data verification passed!');
        ui.notifications.info('Ammunition data saved and verified successfully');
      } else {
        console.warn('BluePlanet Ammunition: Data verification failed!');
        ui.notifications.warn('Data may not have been saved correctly - check console for details');
      }
      
      // Don't force re-render here to avoid infinite loops
      // The parent class will handle updating the UI as needed
      
      return result;
    } catch (error) {
      console.error('BluePlanet Ammunition: Update failed:', error);
      ui.notifications.error('Failed to save ammunition data: ' + error.message);
      throw error;
    }
  }

  /**
   * Verify that data was actually saved to the database
   * @param {Object} expectedData The data that should have been saved
   * @private
   */
  async _verifyDataSaved(expectedData) {
    console.log('BluePlanet Ammunition: Verifying data was saved...', expectedData);
    
    // Wait a bit for the database to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Refresh the item from the database
    let refreshedItem;
    try {
      refreshedItem = await this.item.collection.get(this.item.id);
      if (!refreshedItem) {
        console.warn('BluePlanet Ammunition: Could not get refreshed item from collection');
        return false;
      }
    } catch (error) {
      console.error('BluePlanet Ammunition: Error refreshing item:', error);
      return false;
    }
    
    console.log('BluePlanet Ammunition: Current item data after save:', this.item.system);
    console.log('BluePlanet Ammunition: Refreshed item data:', refreshedItem.system);
    
    // Check if expected fields match
    let allMatch = true;
    for (const [key, expectedValue] of Object.entries(expectedData)) {
      if (key.startsWith('system.')) {
        const systemKey = key.substring(7); // Remove 'system.' prefix
        const currentValue = refreshedItem.system[systemKey];
        
        if (currentValue != expectedValue) {
          console.warn(`BluePlanet Ammunition: Data mismatch for ${key}: expected ${expectedValue}, got ${currentValue}`);
          allMatch = false;
        } else {
          console.log(`BluePlanet Ammunition: Data verified for ${key}: ${currentValue}`);
        }
      }
    }
    
    return allMatch;
  }
  
  /**
   * Add selected weapons to compatible weapons list
   * @param {Array} selectedWeaponIds Array of selected weapon IDs
   * @private
   */
  async _addSelectedWeapons(selectedWeaponIds) {
    let compatibleWeapons = this.item.system.compatible_weapons || [];
    
    // Ensure compatibleWeapons is an array
    if (!Array.isArray(compatibleWeapons)) {
      console.warn('BluePlanet Ammunition: compatible_weapons is not an array in _addSelectedWeapons:', compatibleWeapons);
      compatibleWeapons = [];
    }
    
    const weaponsArray = foundry.utils.deepClone(compatibleWeapons);
    let addedCount = 0;
    
    for (const weaponId of selectedWeaponIds) {
      // Find the weapon by ID
      const weapon = game.items.get(weaponId) || 
                    this.item.parent?.items?.get(weaponId);
      
      if (!weapon) continue;
      
      // Check if already exists
      const alreadyExists = weaponsArray.some(cw => 
        (cw.id && cw.id === weapon.id) || 
        (typeof cw === 'string' && cw === weapon.name)
      );
      
      if (!alreadyExists) {
        weaponsArray.push({
          id: weapon.id,
          name: weapon.name,
          weapon_type: weapon.system.weapon_type,
          uuid: weapon.uuid
        });
        addedCount++;
      }
    }
    
    if (addedCount > 0) {
      await this.item.update({"system.compatible_weapons": weaponsArray});
      ui.notifications.info(`Added ${addedCount} weapon(s) to compatible weapons list.`);
    } else {
      ui.notifications.warn('No new weapons were added - they may already be in the list.');
    }
  }
}
