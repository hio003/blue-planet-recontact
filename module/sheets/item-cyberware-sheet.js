/**
 * Blue Planet Cyberware Item Sheet
 * Extends ItemSheet to provide cyberware-specific interface
 */
export class BluePlanetCyberwareSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "cyberware-sheet"],
      width: 650,
      height: 550,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: ".drop-zone, .no-features, .features-display-area" }]
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-cyberware-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = context.item;
    const systemData = itemData.system;

    // Ensure system data is available in the template
    context.system = systemData;

    // Add cyberware-specific data
    context.cyberwareTypes = {
      "implant": "Neural Implant",
      "prosthetic": "Prosthetic Limb",
      "enhancement": "Physical Enhancement",
      "interface": "Neural Interface",
      "augmentation": "Sensory Augmentation",
      "combat": "Combat System",
      "medical": "Medical System",
      "experimental": "Experimental Technology"
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

    // Cyberware-specific options
    context.dimensionsOptions = {
      "micro": "Micro (chip-scale)",
      "pocket": "Pocket (small device)", 
      "handheld": "Handheld (prosthetic)",
      "portable": "Portable (external unit)",
      "mobile": "Mobile (full system)"
    };

    context.predefinedInstallationTimes = [
      "2 hours",
      "4 hours",
      "8 hours",
      "1 day",
      "2 days",
      "3 days",
      "1 week",
      "2 weeks"
    ];

    context.predefinedRecoveryTimes = [
      "1 hour",
      "2 hours",
      "4 hours",
      "8 hours",
      "1 day",
      "2 days",
      "1 week",
      "2 weeks"
    ];

    context.predefinedEffects = [
      "Enhanced Vision (Thermal, X-ray, Telescopic)",
      "Enhanced Hearing (Directional, frequency analysis)", 
      "Neural Interface (Direct computer connection)",
      "Enhanced Reflexes (+1 to Initiative)",
      "Subdermal Armor (Natural armor bonus)",
      "Enhanced Strength (+1 to Physique tests)",
      "Enhanced Coordination (+1 to Coordination tests)",
      "Data Storage (External memory access)",
      "Communication Array (Radio, cellular, satellite)",
      "Environmental Sensors (Chemical, radiation detection)",
      "Targeting System (+1 to weapon attacks)",
      "Medical Monitor (Health status display)"
    ];

    // Initialize attributes with defaults if not set
    if (!systemData.attributes) {
      systemData.attributes = {};
    }
    // Ensure all attributes have at least a 0 value
    ['cognition', 'psyche', 'coordination', 'physique'].forEach(attr => {
      if (systemData.attributes[attr] === undefined || systemData.attributes[attr] === null) {
        systemData.attributes[attr] = 0;
      }
    });
    
    // Pass the attributes directly to context for the template
    context.attributes = systemData.attributes;
    
    // Attribute bonus calculation
    context.totalAttributeBonus = Object.values(systemData.attributes).reduce((sum, value) => sum + (parseInt(value) || 0), 0);

    // Get effects from the actual item data, not from systemData reference
    let itemEffects = this.item.system.effects;
    console.log('BluePlanet Cyberware: Raw item effects from this.item.system.effects:', itemEffects);
    console.log('BluePlanet Cyberware: Raw item effects type:', typeof itemEffects);
    
    // Convert effects to array if needed, but don't modify the original systemData
    let effectsForTemplate;
    if (!itemEffects) {
      console.log('BluePlanet Cyberware: Effects was undefined, using empty array for template');
      effectsForTemplate = [];
    } else if (!Array.isArray(itemEffects)) {
      console.log('BluePlanet Cyberware: Effects was not an array, converting to array for template');
      console.log('BluePlanet Cyberware: Original effects value:', itemEffects);
      console.log('BluePlanet Cyberware: Original effects type:', typeof itemEffects);
      
      // Convert object with numeric indices to array
      if (typeof itemEffects === 'object' && itemEffects !== null) {
        effectsForTemplate = Object.values(itemEffects).filter(item => item != null);
        console.log('BluePlanet Cyberware: Converted to array:', effectsForTemplate);
      } else {
        console.log('BluePlanet Cyberware: Could not convert, using empty array');
        effectsForTemplate = [];
      }
    } else {
      effectsForTemplate = itemEffects;
    }
    
    // Cyberware effects as array for easier template handling
    context.cyberwareEffects = effectsForTemplate;
    
    console.log('BluePlanet Cyberware: Current effects:', context.cyberwareEffects);

    // Display attribute bonuses in a readable format
    context.attributeBonuses = [];
    for (const [attr, bonus] of Object.entries(systemData.attributes)) {
      const intBonus = parseInt(bonus) || 0;
      if (intBonus !== 0) {
        context.attributeBonuses.push({
          name: attr.charAt(0).toUpperCase() + attr.slice(1),
          value: intBonus > 0 ? `+${intBonus}` : `${intBonus}`
        });
      }
    }

    // Installation requirements/warnings
    context.installationWarnings = [];
    if (systemData.type === 'combat') {
      context.installationWarnings.push("Requires licensed technician");
    }
    if (systemData.type === 'neural' || systemData.type === 'interface') {
      context.installationWarnings.push("Requires neural surgery");
    }
    if (systemData.type === 'experimental') {
      context.installationWarnings.push("Experimental - stability unknown");
    }

    // Special rules as array for easier template handling
    context.specialRules = Array.isArray(systemData.special_rules) ? systemData.special_rules : [];

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    console.log('BluePlanet Cyberware: activateListeners called');

    // Effect management
    const effectAddButtons = html.find('.effect-add');
    console.log('BluePlanet Cyberware: Found', effectAddButtons.length, 'effect-add buttons');
    effectAddButtons.click(this._onAddEffect.bind(this));
    html.find('.effect-delete').click(this._onDeleteEffect.bind(this));

    // Attribute modification controls
    html.find('.attribute-increase').click(this._onAttributeIncrease.bind(this));
    html.find('.attribute-decrease').click(this._onAttributeDecrease.bind(this));
    
    // Special rules management
    html.find('.special-rule-add').click(this._onAddSpecialRule.bind(this));
    html.find('.special-rule-delete').click(this._onDeleteSpecialRule.bind(this));
    
    // Effect drop zone functionality - match template HTML classes
    const dropZones = html.find('.drop-zone, .no-features, .features-display-area');
    console.log('BluePlanet Cyberware: Found', dropZones.length, 'drop zones');
    dropZones.on('dragover', this._onDragOver.bind(this));
    dropZones.on('dragleave', this._onDragLeave.bind(this));
    dropZones.on('drop', this._onEffectDrop.bind(this));
    
    // Prevent form submission on drag events
    html.find('.drop-zone, .no-features, .features-display-area').on('dragenter', function(e) { e.preventDefault(); });
    html.find('.drop-zone, .no-features, .features-display-area').on('dragstart', function(e) { e.preventDefault(); });

    // Edit/Link linked feature from effect
    html.find('.effect-edit').click(this._onOpenEffect.bind(this));
    
    // Feature expand/collapse functionality
    html.find('.feature-expand-btn').click(this._onToggleFeatureDetails.bind(this));
    
    // Auto-save functionality for all input fields
    html.find('input[name^="system."], select[name^="system."], textarea[name^="system."]').change(this._onFieldChange.bind(this));
    html.find('input[name="name"]').change(this._onNameChange.bind(this));
  }

  /**
   * Handle adding a cyberware effect - creates new Feature item
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddEffect(event) {
    event.preventDefault();
    console.log('BluePlanet Cyberware: _onAddEffect called - creating new Feature');
    
    // Create a new Feature item
    const featureData = {
      name: "New Cyberware Feature",
      type: "feature",
      system: {
        category: "technology",
        feature_type: "enhancement",
        bonus_type: "none",
        description: "Describe the cyberware feature's appearance and function.",
        effect: "Describe the mechanical game effect of this feature.",
        game_rules: "Provide detailed rules for how this feature works in gameplay."
      }
    };
    
    try {
      // Create the feature item in the world
      const featureItem = await foundry.documents.Item.create(featureData);
      
      // Open the feature sheet for editing
      if (featureItem) {
        featureItem.sheet.render(true);
        
        // Automatically add this feature to the cyberware's effects
        let currentEffects = this.item.system.effects;
        if (!Array.isArray(currentEffects)) {
          console.log('BluePlanet Cyberware: effects is not an array in _onAddEffect');
          console.log('BluePlanet Cyberware: current effects type:', typeof currentEffects);
          console.log('BluePlanet Cyberware: current effects value:', currentEffects);
          
          if (typeof currentEffects === 'object' && currentEffects !== null) {
            // Convert object to array
            currentEffects = Object.values(currentEffects).filter(item => item != null);
            console.log('BluePlanet Cyberware: converted to array:', currentEffects);
          } else {
            console.log('BluePlanet Cyberware: initializing as empty array');
            currentEffects = [];
          }
        }
        
        const effects = [...currentEffects];
        const newEffect = { 
          name: featureItem.name, 
          summary: featureItem.system.description || "New feature",
          linkedItemUuid: featureItem.uuid
        };
        effects.push(newEffect);
        
        console.log('BluePlanet Cyberware: Adding effect:', newEffect);
        console.log('BluePlanet Cyberware: Current effects before update:', this.item.system.effects);
        console.log('BluePlanet Cyberware: New effects array:', effects);
        
        console.log('BluePlanet Cyberware: About to update with effects:', effects);
        const updateResult = await this.item.update({"system.effects": effects});
        console.log('BluePlanet Cyberware: Update result:', updateResult);
        console.log('BluePlanet Cyberware: After update, this.item.system.effects:', this.item.system.effects);
        console.log('BluePlanet Cyberware: Type after update:', typeof this.item.system.effects);
        console.log('BluePlanet Cyberware: IsArray after update:', Array.isArray(this.item.system.effects));
        
        // Force a re-render to ensure the UI updates
        this.render(false);
      }
    } catch (error) {
      console.error('BluePlanet Cyberware: Error creating feature:', error);
      ui.notifications.error("Failed to create new feature. Check console for details.");
    }
  }

  /**
   * Handle deleting a cyberware effect
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteEffect(event) {
    event.preventDefault();
    const li = event.currentTarget.closest('.feature-item-compact');
    const effectIndex = parseInt(event.currentTarget.dataset.index);
    console.log('BluePlanet Cyberware: Deleting effect at index:', effectIndex);
    
    let currentEffects = this.item.system.effects;
    if (!Array.isArray(currentEffects)) {
      console.log('BluePlanet Cyberware: effects is not an array in _onDeleteEffect');
      console.log('BluePlanet Cyberware: current effects type:', typeof currentEffects);
      console.log('BluePlanet Cyberware: current effects value:', currentEffects);
      
      if (typeof currentEffects === 'object' && currentEffects !== null) {
        // Convert object to array
        currentEffects = Object.values(currentEffects).filter(item => item != null);
        console.log('BluePlanet Cyberware: converted to array:', currentEffects);
      } else {
        console.log('BluePlanet Cyberware: initializing as empty array');
        currentEffects = [];
      }
    }
    
    const effects = [...currentEffects];
    effects.splice(effectIndex, 1);
    console.log('BluePlanet Cyberware: Updated effects array:', effects);
    await this.item.update({"system.effects": effects});
  }

  /**
   * Handle increasing attribute bonuses
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttributeIncrease(event) {
    event.preventDefault();
    const attribute = event.currentTarget.dataset.attribute;
    const currentValue = parseInt(this.item.system.attributes[attribute]) || 0;
    const newValue = Math.min(currentValue + 1, 5); // Cap at +5
    await this.item.update({[`system.attributes.${attribute}`]: newValue});
  }

  /**
   * Handle decreasing attribute bonuses
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttributeDecrease(event) {
    event.preventDefault();
    const attribute = event.currentTarget.dataset.attribute;
    const currentValue = parseInt(this.item.system.attributes[attribute]) || 0;
    const newValue = Math.max(currentValue - 1, -5); // Floor at -5
    await this.item.update({[`system.attributes.${attribute}`]: newValue});
  }

  /**
   * Handle adding special rules
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddSpecialRule(event) {
    event.preventDefault();
    const rules = [...(this.item.system.special_rules || [])];
    rules.push("");
    await this.item.update({"system.special_rules": rules});
  }

  /**
   * Handle deleting special rules
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteSpecialRule(event) {
    event.preventDefault();
    const li = event.currentTarget.closest('.special-rule-item');
    const ruleIndex = parseInt(li.dataset.index);
    const rules = [...(this.item.system.special_rules || [])];
    rules.splice(ruleIndex, 1);
    await this.item.update({"system.special_rules": rules});
  }

  /**
   * Handle field changes for auto-save
   * @param {Event} event   The originating change event
   * @private
   */
  async _onFieldChange(event) {
    const name = event.target.name;
    const value = event.target.value;
    await this.item.update({[name]: value});
  }

  /**
   * Handle name field changes
   * @param {Event} event   The originating change event
   * @private
   */
  async _onNameChange(event) {
    const name = event.target.value;
    await this.item.update({name: name});
  }

  /**
   * Handle drag over events for drop zones
   * @param {Event} event   The originating dragover event
   * @private
   */
  _onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
  }

  /**
   * Handle drag leave events for drop zones
   * @param {Event} event   The originating dragleave event
   * @private
   */
  _onDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
  }

  /**
   * Handle dropping effects on drop zones
   * @param {Event} event   The originating drop event
   * @private
   */
  async _onEffectDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
    
    console.log('BluePlanet Cyberware: _onEffectDrop called');
    
    try {
      const dataTransfer = event.dataTransfer || event.originalEvent?.dataTransfer;
      if (!dataTransfer) {
        console.error('BluePlanet Cyberware: No dataTransfer object available');
        ui.notifications.error('Invalid drag and drop data');
        return;
      }
      
      const data = JSON.parse(dataTransfer.getData('text/plain') || '{}');
      console.log('BluePlanet Cyberware: Drop data:', data);
      
      // Handle different data formats
      let item;
      if (data.uuid) {
        item = await fromUuid(data.uuid);
      } else if (data.type === 'Item' && data.data) {
        // Fallback if the whole data blob is present
        item = new Item(data.data, {temporary: true});
      }
      
      console.log('BluePlanet Cyberware: Dropped item:', item);
      
      if (!item || item.documentName !== 'Item') {
        ui.notifications.warn('Drop a Feature item to add as an effect');
        return;
      }
      
      if (item.type === 'feature') {
        // Debug logging for effects state
        console.log('BluePlanet Cyberware: this.item.system:', this.item.system);
        console.log('BluePlanet Cyberware: this.item.system.effects:', this.item.system.effects);
        console.log('BluePlanet Cyberware: Type of effects:', typeof this.item.system.effects);
        
        // Ensure effects is always an array
        let currentEffects = this.item.system.effects;
        if (!Array.isArray(currentEffects)) {
          console.log('BluePlanet Cyberware: effects is not an array in _onEffectDrop');
          console.log('BluePlanet Cyberware: current effects type:', typeof currentEffects);
          console.log('BluePlanet Cyberware: current effects value:', currentEffects);
          
          if (typeof currentEffects === 'object' && currentEffects !== null) {
            // Convert object to array
            currentEffects = Object.values(currentEffects).filter(item => item != null);
            console.log('BluePlanet Cyberware: converted to array:', currentEffects);
          } else {
            console.log('BluePlanet Cyberware: initializing as empty array');
            currentEffects = [];
          }
        }
        
        const effects = [...currentEffects];
        const newEffect = { 
          name: item.name, 
          summary: item.system.description || item.system.effect || "Feature effect",
          linkedItemUuid: item.uuid
        };
        effects.push(newEffect);
        
        console.log('BluePlanet Cyberware: Adding dropped effect:', newEffect);
        console.log('BluePlanet Cyberware: Updated effects:', effects);
        
          console.log('BluePlanet Cyberware: About to update with effects (drop):', effects);
          const updateResult = await this.item.update({"system.effects": effects});
          console.log('BluePlanet Cyberware: Update result (drop):', updateResult);
          console.log('BluePlanet Cyberware: After update (drop), this.item.system.effects:', this.item.system.effects);
          console.log('BluePlanet Cyberware: Type after update (drop):', typeof this.item.system.effects);
          console.log('BluePlanet Cyberware: IsArray after update (drop):', Array.isArray(this.item.system.effects));
          
          // Force re-render
          this.render(false);
          
          ui.notifications.info(`Added feature: ${item.name}`);
      } else {
        ui.notifications.warn('Only Feature items can be dropped here');
      }
    } catch (error) {
      console.error('BluePlanet Cyberware: Error handling drop:', error);
      ui.notifications.error('Failed to add dropped feature');
    }
  }

  /**
   * Handle opening linked effects
   * @param {Event} event   The originating click event
   * @private
   */
  async _onOpenEffect(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const effects = this.item.system.effects || [];
    const effect = effects[index] || {};
    
    if (effect && effect.linkedItemUuid) {
      try {
        const linkedItem = await fromUuid(effect.linkedItemUuid);
        if (linkedItem) {
          linkedItem.sheet.render(true);
        } else {
          ui.notifications.warn('Linked Feature not found');
        }
      } catch (error) {
        console.error('BluePlanet Cyberware: Error opening linked effect:', error);
        ui.notifications.error('Failed to open linked Feature');
      }
    } else {
      ui.notifications.warn('This effect has no linked Feature');
    }
  }

  /**
   * Toggle feature details visibility
   * @param {Event} event   The originating click event
   * @private
   */
  _onToggleFeatureDetails(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const featureItem = button.closest('.feature-item-compact');
    const detailsSection = featureItem.querySelector('.feature-details-section');
    const icon = button.querySelector('i');
    
    if (detailsSection.style.display === 'none') {
      detailsSection.style.display = 'block';
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-up');
    } else {
      detailsSection.style.display = 'none';
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    }
  }
}