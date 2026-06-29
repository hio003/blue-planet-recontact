/**
 * Blue Planet Biomod Item Sheet
 * Extends ItemSheet to provide biomod-specific interface
 */
export class BluePlanetBiomodSheet extends foundry.appv1.sheets.ItemSheet {

  constructor(...args) {
    super(...args);
    this._effectsCache = null;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "biomod-sheet"],
      width: 650,
      height: 550,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: ".drop-zone, .no-features, .features-display-area" }]
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

    // Ensure system data is available in the template
    context.system = systemData;

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

    // Get effects from the actual item data, with cache fallback
    let itemEffects = this.item.system.effects;
    
    // If effects is empty but we have cached effects, use cache
    if ((!itemEffects || !Array.isArray(itemEffects) || itemEffects.length === 0) && 
        this._effectsCache && Array.isArray(this._effectsCache) && this._effectsCache.length > 0) {
      console.log('BluePlanet Biomod: Using cached effects:', this._effectsCache);
      itemEffects = this._effectsCache;
      // Try to restore to the item
      this.item.updateSource({'system.effects': this._effectsCache});
    }
    
    console.log('BluePlanet Biomod: Raw item effects from this.item.system.effects:', itemEffects);
    console.log('BluePlanet Biomod: Raw item effects type:', typeof itemEffects);
    console.log('BluePlanet Biomod: Effects cache:', this._effectsCache);
    
    // Convert effects to array if needed, but don't modify the original systemData
    let effectsForTemplate;
    if (!itemEffects) {
      console.log('BluePlanet Biomod: Effects was undefined, using empty array for template');
      effectsForTemplate = [];
    } else if (!Array.isArray(itemEffects)) {
      console.log('BluePlanet Biomod: Effects was not an array, converting to array for template');
      console.log('BluePlanet Biomod: Original effects value:', itemEffects);
      console.log('BluePlanet Biomod: Original effects type:', typeof itemEffects);
      
      // Convert object with numeric indices to array
      if (typeof itemEffects === 'object' && itemEffects !== null) {
        effectsForTemplate = Object.values(itemEffects).filter(item => item != null);
        console.log('BluePlanet Biomod: Converted to array:', effectsForTemplate);
      } else {
        console.log('BluePlanet Biomod: Could not convert, using empty array');
        effectsForTemplate = [];
      }
    } else {
      effectsForTemplate = itemEffects;
    }
    
    // Biomod effects as array for easier template handling
    context.biomodEffects = effectsForTemplate;
    
    console.log('BluePlanet Biomod: Current effects:', context.biomodEffects);

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
    if (systemData.type === 'cybernetic') {
      context.installationWarnings.push("Requires surgical installation");
    }
    if (systemData.type === 'genetic') {
      context.installationWarnings.push("Requires genetic therapy");
    }
    if (systemData.type === 'experimental') {
      context.installationWarnings.push("Experimental - side effects unknown");
    }

    // Special rules as array for easier template handling
    context.specialRules = Array.isArray(systemData.special_rules) ? systemData.special_rules : [];

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    console.log('BluePlanet Biomod: activateListeners called');

    // Effect management
    const effectAddButtons = html.find('.effect-add');
    console.log('BluePlanet Biomod: Found', effectAddButtons.length, 'effect-add buttons');
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
    console.log('BluePlanet Biomod: Found', dropZones.length, 'drop zones');
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
   * Handle adding a biomod effect - creates new Feature item
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddEffect(event) {
    event.preventDefault();
    console.log('BluePlanet Biomod: _onAddEffect called - creating new Feature');
    
    // Create a new Feature item
    const featureData = {
      name: "New Biomod Feature",
      type: "feature",
      system: {
        category: "technology", 
        feature_type: "enhancement",
        bonus_type: "none",
        description: "Describe the biomod feature's appearance and function.",
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
        
        // Automatically add this feature to the biomod's effects
        let currentEffects = this.item.system.effects;
        if (!Array.isArray(currentEffects)) {
          console.log('BluePlanet Biomod: effects is not an array in _onAddEffect');
          console.log('BluePlanet Biomod: current effects type:', typeof currentEffects);
          console.log('BluePlanet Biomod: current effects value:', currentEffects);
          
          if (typeof currentEffects === 'object' && currentEffects !== null) {
            // Convert object to array
            currentEffects = Object.values(currentEffects).filter(item => item != null);
            console.log('BluePlanet Biomod: converted to array:', currentEffects);
          } else {
            console.log('BluePlanet Biomod: initializing as empty array');
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
        
        console.log('BluePlanet Biomod: Adding effect:', newEffect);
        console.log('BluePlanet Biomod: Current effects before update:', this.item.system.effects);
        console.log('BluePlanet Biomod: New effects array:', effects);
        
        console.log('BluePlanet Biomod: About to update with effects:', effects);
        
        // Cache effects before update
        this._effectsCache = [...effects];
        console.log('BluePlanet Biomod: Cached effects:', this._effectsCache);
        
        // Use both updateSource and update to ensure persistence
        this.item.updateSource({"system.effects": effects});
        const updateResult = await this.item.update({"system.effects": effects});
        console.log('BluePlanet Biomod: Update result:', updateResult);
        
        // Double-check using Foundry utilities
        const persistedEffects = foundry.utils.getProperty(this.item, 'system.effects');
        console.log('BluePlanet Biomod: Persisted effects via getProperty:', persistedEffects);
        console.log('BluePlanet Biomod: Persisted effects type:', typeof persistedEffects);
        console.log('BluePlanet Biomod: Persisted effects is array:', Array.isArray(persistedEffects));
        
        // If it's still not an array, force it using setProperty
        if (!Array.isArray(persistedEffects)) {
          console.log('BluePlanet Biomod: Forcing effects to be array using setProperty');
          await foundry.utils.setProperty(this.item, 'system.effects', effects);
          await this.item.update({'system.effects': effects});
        }
        
        console.log('BluePlanet Biomod: After update, this.item.system.effects:', this.item.system.effects);
        console.log('BluePlanet Biomod: Type after update:', typeof this.item.system.effects);
        console.log('BluePlanet Biomod: IsArray after update:', Array.isArray(this.item.system.effects));
        
        // Use soft re-render to avoid losing data
        this.render(false);
      }
    } catch (error) {
      console.error('BluePlanet Biomod: Error creating feature:', error);
      ui.notifications.error("Failed to create new feature. Check console for details.");
    }
  }

  /**
   * Handle deleting a biomod effect
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteEffect(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    console.log('BluePlanet Biomod: Deleting effect at index:', index);
    
    let currentEffects = this.item.system.effects;
    if (!Array.isArray(currentEffects)) {
      console.log('BluePlanet Biomod: effects is not an array in _onDeleteEffect');
      console.log('BluePlanet Biomod: current effects type:', typeof currentEffects);
      console.log('BluePlanet Biomod: current effects value:', currentEffects);
      
      if (typeof currentEffects === 'object' && currentEffects !== null) {
        // Convert object to array
        currentEffects = Object.values(currentEffects).filter(item => item != null);
        console.log('BluePlanet Biomod: converted to array:', currentEffects);
      } else {
        console.log('BluePlanet Biomod: initializing as empty array');
        currentEffects = [];
      }
    }
    
    const effects = [...currentEffects];
    effects.splice(index, 1);
    console.log('BluePlanet Biomod: Updated effects array:', effects);
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
    const currentValue = parseInt(this.item.system.attributes?.[attribute]) || 0;
    
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
    const currentValue = parseInt(this.item.system.attributes?.[attribute]) || 0;
    
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
   * Handle dropping a Feature item to add as an effect line
   * @param {Event} event   The originating drop event
   * @private
   */
  async _onEffectDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).removeClass('drag-over');
    console.log('BluePlanet Biomod: _onEffectDrop called');

    try {
      const data = JSON.parse(event.originalEvent?.dataTransfer?.getData('text/plain') || '{}');
      // Foundry usually provides a uuid for dropped entities
      let dropped;
      if (data.uuid) {
        dropped = await fromUuid(data.uuid);
      } else if (data?.type === 'Item' && data.data) {
        // Fallback if the whole data blob is present
        dropped = new Item(data.data, {temporary: true});
      }
      
      if (!dropped || dropped.documentName !== 'Item') {
        ui.notifications.warn('Drop a Feature item to add as an effect');
        return;
      }
      
      const item = dropped;
      if (item.type !== 'feature') {
        ui.notifications.warn('Only Feature items can be dropped here');
        return;
      }
      
      let currentEffects = this.item.system.effects;
      if (!Array.isArray(currentEffects)) {
        console.log('BluePlanet Biomod: effects is not an array in _onEffectDrop');
        console.log('BluePlanet Biomod: current effects type:', typeof currentEffects);
        console.log('BluePlanet Biomod: current effects value:', currentEffects);
        
        if (typeof currentEffects === 'object' && currentEffects !== null) {
          // Convert object to array
          currentEffects = Object.values(currentEffects).filter(item => item != null);
          console.log('BluePlanet Biomod: converted to array:', currentEffects);
        } else {
          console.log('BluePlanet Biomod: initializing as empty array');
          currentEffects = [];
        }
      }
      
      const effects = [...currentEffects];
      const name = item.name || 'Unnamed Feature';
      // Build a brief summary from the feature's description (strip HTML, limit length)
      let rawDesc = (item.system?.description || item.data?.data?.description || "");
      try { rawDesc = rawDesc.replace(/<[^>]+>/g, ' '); } catch (_) {}
      const summary = (rawDesc || '').trim().slice(0, 140) + ((rawDesc || '').trim().length > 140 ? '…' : '');
      const linkedItemUuid = item.uuid || data.uuid || null;
      effects.push({ name, summary, linkedItemUuid });
      
      console.log('BluePlanet Biomod: Adding dropped effect:', { name, summary, linkedItemUuid });
      console.log('BluePlanet Biomod: Updated effects array:', effects);
      
      console.log('BluePlanet Biomod: About to update with effects (drop):', effects);
      
      // Cache effects before update
      this._effectsCache = [...effects];
      console.log('BluePlanet Biomod: Cached effects (drop):', this._effectsCache);
      
      // Use both updateSource and update to ensure persistence
      this.item.updateSource({"system.effects": effects});
      const updateResult = await this.item.update({"system.effects": effects});
      console.log('BluePlanet Biomod: Update result (drop):', updateResult);
      
      // Double-check using Foundry utilities
      const persistedEffects = foundry.utils.getProperty(this.item, 'system.effects');
      console.log('BluePlanet Biomod: Persisted effects via getProperty (drop):', persistedEffects);
      console.log('BluePlanet Biomod: Persisted effects type (drop):', typeof persistedEffects);
      console.log('BluePlanet Biomod: Persisted effects is array (drop):', Array.isArray(persistedEffects));
      
      // If it's still not an array, force it using setProperty
      if (!Array.isArray(persistedEffects)) {
        console.log('BluePlanet Biomod: Forcing effects to be array using setProperty (drop)');
        await foundry.utils.setProperty(this.item, 'system.effects', effects);
        await this.item.update({'system.effects': effects});
      }
      
      console.log('BluePlanet Biomod: After update (drop), this.item.system.effects:', this.item.system.effects);
      console.log('BluePlanet Biomod: Type after update (drop):', typeof this.item.system.effects);
      console.log('BluePlanet Biomod: IsArray after update (drop):', Array.isArray(this.item.system.effects));
      
      // Use soft re-render to avoid losing data
      this.render(false);
      
      ui.notifications.info(`Added effect from Feature: ${name}`);
    } catch (error) {
      console.error('BluePlanet Biomod: Error processing drop:', error);
      ui.notifications.error('Failed to add effect from dropped item');
    }
  }

  /**
   * Open a linked Feature from an effect row (if uuid present)
   * @param {Event} event
   * @private
   */
  async _onOpenEffect(event) {
    event.preventDefault();
    try {
      const index = parseInt(event.currentTarget.dataset.index);
      const effects = this.item.system.effects || [];
      const eff = effects[index] || {};
      const uuid = eff.linkedItemUuid || eff.uuid; // Support both formats for backwards compatibility
      if (!uuid) {
        ui.notifications.warn('This effect has no linked Feature');
        return;
      }
      const doc = await fromUuid(uuid);
      if (!doc || doc.documentName !== 'Item') {
        ui.notifications.warn('Linked Feature not found');
        return;
      }
      doc.sheet?.render(true);
    } catch (error) {
      console.error('BluePlanet Biomod: Error opening linked feature:', error);
      ui.notifications.error('Failed to open linked Feature');
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
    if (fieldName === 'system.cost') {
      value = Math.max(0, value);
    } else if (fieldName.startsWith('system.attributes.')) {
      value = parseInt(value) || 0;
      value = Math.max(-3, Math.min(5, value));
    } else if (fieldName === 'system.durability') {
      value = parseInt(value) || 0;
      value = Math.max(-10, Math.min(10, value));
    }
    
    try {
      // Handle effects fields specially - TEMPORARILY DISABLED TO DEBUG
      if (fieldName.startsWith('system.effects.')) {
        console.log(`BluePlanet Biomod: SKIPPING effects field update for ${fieldName} to prevent conflicts`);
        return; // Skip effects field updates for now
      } else {
        // Regular field update
        await this.item.update({[fieldName]: value}, {render: false});
        console.log(`BluePlanet Biomod: Updated ${fieldName} (no render)`);
      }
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
    
    try {
      await this.item.update({name: value}, {render: false});
      console.log('BluePlanet Biomod: Successfully updated name (no render)');
    } catch (error) {
      console.error('BluePlanet Biomod: Error updating name:', error);
      ui.notifications.error('Failed to save biomod name');
    }
  }
}