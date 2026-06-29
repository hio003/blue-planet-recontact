/**
 * Blue Planet Sensor Item Sheet
 * Extends ItemSheet to provide sensor-specific interface
 */
export class BluePlanetSensorSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "sensor-sheet"],
      width: 520,
      height: 450,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-sensor-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = context.item;
    const systemData = itemData.system;

    // Add sensor type-specific data
    context.sensorTypeOptions = {
      "visual": "Visual Sensors",
      "infrared": "Infrared Sensors",
      "night_vision": "Night Vision",
      "telescopic": "Telescopic Vision",
      "radar": "Radar", 
      "sonar": "Sonar",
      "lidar": "Lidar",
      "motion": "Motion Detection",
      "audio": "Audio Sensors",
      "chemical": "Chemical Sensors",
      "radiation": "Radiation Sensors",
      "magnetic": "Magnetic Sensors",
      "thermal": "Thermal Sensors",
      "pressure": "Pressure Sensors"
    };

    context.resolutionOptions = {
      "low": "Low Resolution",
      "standard": "Standard Resolution",
      "high": "High Resolution",
      "ultra": "Ultra High Resolution"
    };

    context.powerConsumptionOptions = {
      "none": "No Power Required",
      "minimal": "Minimal",
      "low": "Low",
      "standard": "Standard",
      "high": "High",
      "extreme": "Extreme"
    };

    context.dataProcessingOptions = {
      "passive": "Passive",
      "active": "Active Processing", 
      "intelligent": "Intelligent Analysis",
      "predictive": "Predictive Analysis"
    };

    context.interfaceTypeOptions = {
      "analog": "Analog Output",
      "digital": "Digital Interface",
      "neural": "Neural Interface",
      "wireless": "Wireless Communication",
      "hardwired": "Hardwired Connection"
    };

    context.dimensionsOptions = {
      "micro": "Micro",
      "pocket": "Pocket",
      "handheld": "Handheld",
      "portable": "Portable",
      "mobile": "Mobile",
      "industrial": "Industrial"
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

    // Environmental conditions as array for easier template handling
    context.environmentalConditions = Array.isArray(systemData.environmental_conditions) ? systemData.environmental_conditions : [];
    
    // Special features as array for easier template handling
    context.specialFeatures = Array.isArray(systemData.special_features) ? systemData.special_features : [];

    // Predefined environmental conditions
    context.predefinedConditions = [
      "Underwater",
      "High Pressure", 
      "Vacuum/Space",
      "Extreme Heat",
      "Extreme Cold",
      "High Radiation",
      "Corrosive Environment",
      "Low Light",
      "Complete Darkness",
      "Electromagnetic Interference"
    ];

    // Predefined special features
    context.predefinedFeatures = [
      "Multi-spectrum Analysis",
      "Real-time Processing",
      "Data Recording",
      "Remote Access",
      "Autonomous Operation",
      "Self-Calibrating",
      "Threat Detection",
      "Target Tracking",
      "Environmental Adaptation"
    ];

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Environmental conditions management
    html.find('.condition-add').click(this._onAddCondition.bind(this));
    html.find('.condition-delete').click(this._onDeleteCondition.bind(this));
    
    // Special features management
    html.find('.feature-add').click(this._onAddFeature.bind(this));
    html.find('.feature-delete').click(this._onDeleteFeature.bind(this));
    
    // Auto-save functionality for all input fields
    html.find('input[name^="system."], select[name^="system."], textarea[name^="system."]').change(this._onFieldChange.bind(this));
    html.find('input[name="name"]').change(this._onNameChange.bind(this));
  }

  /**
   * Handle adding an environmental condition
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddCondition(event) {
    event.preventDefault();
    const conditions = [...(this.item.system.environmental_conditions || [])];
    conditions.push("");
    await this.item.update({"system.environmental_conditions": conditions});
  }

  /**
   * Handle deleting an environmental condition
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteCondition(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const conditions = [...(this.item.system.environmental_conditions || [])];
    conditions.splice(index, 1);
    await this.item.update({"system.environmental_conditions": conditions});
  }
  
  /**
   * Handle adding a special feature
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddFeature(event) {
    event.preventDefault();
    const features = [...(this.item.system.special_features || [])];
    features.push("");
    await this.item.update({"system.special_features": features});
  }

  /**
   * Handle deleting a special feature
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteFeature(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const features = [...(this.item.system.special_features || [])];
    features.splice(index, 1);
    await this.item.update({"system.special_features": features});
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
    if (fieldName === 'system.range') {
      value = Math.max(0, value);
    } else if (fieldName === 'system.weight') {
      value = Math.max(0, value);
    } else if (fieldName === 'system.cost') {
      value = Math.max(0, value);
    }
    
    console.log(`BluePlanet Sensor: Updating ${fieldName} to:`, value);
    
    try {
      await this.item.update({[fieldName]: value}, {render: false});
      console.log(`BluePlanet Sensor: Successfully updated ${fieldName} (no render)`);
    } catch (error) {
      console.error(`BluePlanet Sensor: Error updating ${fieldName}:`, error);
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
    
    console.log('BluePlanet Sensor: Updating name to:', value);
    
    try {
      await this.item.update({name: value}, {render: false});
      console.log('BluePlanet Sensor: Successfully updated name (no render)');
    } catch (error) {
      console.error('BluePlanet Sensor: Error updating name:', error);
      ui.notifications.error('Failed to save sensor name');
    }
  }
}