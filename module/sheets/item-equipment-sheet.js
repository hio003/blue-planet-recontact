/**
 * Blue Planet Equipment Item Sheet
 * Extends ItemSheet to provide equipment-specific interface
 */
export class BluePlanetEquipmentSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "equipment-sheet"],
      width: 550,
      height: 450,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: ".sensor-drop-zone, .feature-drop-zone" }]
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-equipment-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = context.item;
    const systemData = itemData.system;

    // Ensure system data is available in the template
    context.system = systemData;

    // Add equipment-specific data
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

    // New equipment-specific options from PDF
    context.dimensionsOptions = {
      "micro": "Micro",
      "pocket": "Pocket",
      "handheld": "Handheld",
      "portable": "Portable",
      "mobile": "Mobile",
      "industrial": "Industrial"
    };

    context.powerTypeOptions = {
      "external": "External",
      "integrated": "Integrated", 
      "kinetic": "Kinetic",
      "physiological": "Physiological",
      "rechargeable": "Rechargeable"
    };

    context.interfacingOptions = {
      "cold": "Cold (No digital controls)",
      "warm": "Warm (Digital access, voice interactive)",
      "hot": "Hot (Neural interface capable)",
      "flat": "Flat (No remote/independent operation)",
      "smart": "Smart (Interactive, autonomous functions)",
      "gi": "GI (General Intelligence, sapient-level)"
    };

    context.predefinedSensors = [
      "Visual Sensors",
      "Infrared Sensors",
      "Night Vision",
      "Telescopic Vision",
      "Radar", 
      "Sonar",
      "Lidar",
      "Motion Detection",
      "Audio Sensors",
      "Chemical Sensors",
      "Radiation Sensors"
    ];

    context.predefinedFeatures = [
      "Concealable",
      "Hardened",
      "Sealed",
      "Responsive Materials",
      "Manipulators",
      "Sensors",
      "Smart",
      "Hot Interfacing",
      "Autonomous Operation"
    ];

    // Equipment categories
    context.equipmentCategories = {
      "armor": "Armor & Protection",
      "tools": "Tools & Utilities",
      "electronics": "Electronics",
      "medical": "Medical Equipment",
      "diving": "Diving & Aquatic",
      "survival": "Survival Gear",
      "clothing": "Clothing & Textiles",
      "consumable": "Consumables",
      "other": "Other"
    };

    // Calculate total weight (weight per item × quantity)
    context.totalWeight = (systemData.weight || 0) * (systemData.quantity || 1);

    // Durability status
    if (systemData.durability > 0) {
      const durabilityPercent = Math.round((systemData.durability / systemData.max_durability || 1) * 100);
      context.durabilityStatus = {
        percent: durabilityPercent,
        label: durabilityPercent > 75 ? "Excellent" : 
               durabilityPercent > 50 ? "Good" :
               durabilityPercent > 25 ? "Worn" : "Damaged"
      };
    } else {
      context.durabilityStatus = { percent: 0, label: "Broken" };
    }

    // Equipment features as array for easier template handling
    context.equipmentFeatures = Array.isArray(systemData.features) ? systemData.features : [];

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Feature management
    html.find('.feature-add').click(this._onAddFeature.bind(this));
    html.find('.feature-delete').click(this._onDeleteFeature.bind(this));

    // Durability controls
    html.find('.durability-repair').click(this._onRepairDurability.bind(this));
    html.find('.durability-damage').click(this._onDamageDurability.bind(this));
    
    // Sensor management
    html.find('.sensor-add').click(this._onAddSensor.bind(this));
    html.find('.sensor-delete').click(this._onDeleteSensor.bind(this));
    
    // Sensor drop zone functionality
    html.find('.sensor-drop-zone').on('dragover', this._onDragOver.bind(this));
    html.find('.sensor-drop-zone').on('dragleave', this._onDragLeave.bind(this));
    html.find('.sensor-drop-zone').on('drop', this._onSensorDrop.bind(this));
    
    // Feature drop zone functionality
    html.find('.feature-drop-zone').on('dragover', this._onDragOver.bind(this));
    html.find('.feature-drop-zone').on('dragleave', this._onDragLeave.bind(this));
    html.find('.feature-drop-zone').on('drop', this._onFeatureDrop.bind(this));
    
    // Prevent form submission on drag events
    html.find('.sensor-drop-zone, .feature-drop-zone').on('dragenter', function(e) { e.preventDefault(); });
    html.find('.sensor-drop-zone, .feature-drop-zone').on('dragstart', function(e) { e.preventDefault(); });
    
    // Auto-save functionality for all input fields
    html.find('input[name^="system."], select[name^="system."], textarea[name^="system."]').change(this._onFieldChange.bind(this));
    html.find('input[name="name"]').change(this._onNameChange.bind(this));
  }

  /**
   * Handle adding an equipment feature
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
   * Handle deleting an equipment feature
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
   * Handle repairing durability
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRepairDurability(event) {
    event.preventDefault();
    const currentDurability = this.item.system.durability || 0;
    const maxDurability = this.item.system.max_durability || 10;
    
    if (currentDurability < maxDurability) {
      await this.item.update({"system.durability": Math.min(maxDurability, currentDurability + 1)});
    }
  }

  /**
   * Handle damaging durability
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDamageDurability(event) {
    event.preventDefault();
    const currentDurability = this.item.system.durability || 0;
    
    if (currentDurability > 0) {
      await this.item.update({"system.durability": currentDurability - 1});
    }
  }
  
  /**
   * Handle adding a sensor
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddSensor(event) {
    event.preventDefault();
    const sensors = [...(this.item.system.sensors || [])];
    sensors.push("");
    await this.item.update({"system.sensors": sensors});
  }

  /**
   * Handle deleting a sensor
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteSensor(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const sensors = [...(this.item.system.sensors || [])];
    sensors.splice(index, 1);
    await this.item.update({"system.sensors": sensors});
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
    
    // Special validation for specific fields
    if (fieldName === 'system.quantity') {
      value = Math.max(0, Math.floor(value));
    } else if (fieldName === 'system.weight') {
      value = Math.max(0, value);
    } else if (fieldName === 'system.cost') {
      value = Math.max(0, value);
    } else if (fieldName === 'system.durability' || fieldName === 'system.max_durability') {
      value = Math.max(0, Math.floor(value));
    }
    
    console.log(`BluePlanet Equipment: Updating ${fieldName} to:`, value);
    
    try {
      await this.item.update({[fieldName]: value}, {render: false});
      console.log(`BluePlanet Equipment: Successfully updated ${fieldName} (no render)`);
    } catch (error) {
      console.error(`BluePlanet Equipment: Error updating ${fieldName}:`, error);
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
    
    console.log('BluePlanet Equipment: Updating name to:', value);
    
    try {
      await this.item.update({name: value}, {render: false});
      console.log('BluePlanet Equipment: Successfully updated name (no render)');
    } catch (error) {
      console.error('BluePlanet Equipment: Error updating name:', error);
      ui.notifications.error('Failed to save equipment name');
    }
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
   * Handle drop on sensor drop zone
   * @param {Event} event   The originating drop event
   * @private
   */
  async _onSensorDrop(event) {
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
    if (!item || item.type !== 'sensor') {
      ui.notifications.warn('Only sensor items can be dropped here.');
      return;
    }
    
    // Add the sensor name to the equipment's sensors array
    const sensors = [...(this.item.system.sensors || [])];
    const sensorName = item.name;
    
    // Check if sensor already exists
    if (sensors.includes(sensorName)) {
      ui.notifications.warn(`Sensor "${sensorName}" is already added to this equipment.`);
      return;
    }
    
    sensors.push(sensorName);
    await this.item.update({"system.sensors": sensors});
    ui.notifications.info(`Added sensor "${sensorName}" to ${this.item.name}.`);
  }
  
  /**
   * Handle drop on feature drop zone
   * @param {Event} event   The originating drop event
   * @private
   */
  async _onFeatureDrop(event) {
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
    if (!item || item.type !== 'feature') {
      ui.notifications.warn('Only feature items can be dropped here.');
      return;
    }
    
    // Check if feature is technology type
    if (item.system.category !== 'technology') {
      ui.notifications.warn('Only technology features can be added to equipment.');
      return;
    }
    
    // Add the feature name to the equipment's features array
    const features = [...(this.item.system.features || [])];
    const featureName = item.name;
    
    // Check if feature already exists
    if (features.includes(featureName)) {
      ui.notifications.warn(`Feature "${featureName}" is already added to this equipment.`);
      return;
    }
    
    features.push(featureName);
    await this.item.update({"system.features": features});
    ui.notifications.info(`Added feature "${featureName}" to ${this.item.name}.`);
  }
}
