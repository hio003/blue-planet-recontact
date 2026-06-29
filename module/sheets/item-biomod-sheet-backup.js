import { BluePlanetItemSheet } from "../item/item-sheet.js";

/**
 * Blue Planet Biomod Item Sheet
 * Extends BluePlanetItemSheet to provide biomod-specific interface with auto-save
 */
export class BluePlanetBiomodSheet extends BluePlanetItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "biomod-sheet"],
      width: 650,
      height: 550,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
      submitOnChange: false,
      closeOnSubmit: false
    });
  }
  
  /**
   * Override parent _onFieldChange to handle biomod effects specially
   * @param {Event} event   The originating change event
   * @private
   */
  async _onFieldChange(event) {
    const element = event.currentTarget;
    const fieldName = element.name;
    
    // Handle effects fields specially
    if (fieldName && fieldName.startsWith('system.effects.')) {
      event.preventDefault();
      const match = fieldName.match(/^system\.effects\.(\d+)\.(\w+)$/);
      if (match) {
        const idx = parseInt(match[1]);
        const key = match[2];
        const value = element.value;
        const effects = foundry.utils.deepClone(this.item.system.effects || []);
        
        // Ensure effect exists
        if (!effects[idx]) {
          effects[idx] = { name: '', summary: '', uuid: null };
        } else if (typeof effects[idx] === 'string') {
          effects[idx] = { name: effects[idx], summary: '', uuid: null };
        }
        
        effects[idx][key] = value;
        
        try {
          await this.item.update({ 'system.effects': effects }, {render: false});
          console.log(`BluePlanet Biomod: Updated effect ${idx}.${key} (no render)`);
        } catch (error) {
          console.error(`BluePlanet Biomod: Error updating effect:`, error);
          ui.notifications.error('Failed to save effect');
        }
        return;
      }
    }
    
    // For all other fields, use the parent class method
    return super._onFieldChange(event);
  }
  
  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-biomod-sheet.hbs`;
  }
  

  /** @override */
  async getData() {
    // Get the base context from parent - call as sync since parent is sync
    const context = super.getData();
    
    // Ensure we have the item and system data
    const itemData = context?.item || this.item;
    if (!itemData) {
      console.error('BluePlanet Biomod: No item data available');
      console.error('Context:', context);
      console.error('This.item:', this.item);
      throw new Error('No item data available for biomod sheet');
    }
    
    console.log('BluePlanet Biomod: itemData:', itemData);
    const systemData = itemData.system || {};

    // Debug: Log current effects state
    console.log('BluePlanet Biomod getData: Raw effects:', systemData.effects);
    
    // Ensure effects is always an array for template (without modifying original)
    const effectsArray = Array.isArray(systemData.effects) ? systemData.effects : [];

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

    // Biomod effects as array for easier template handling
    context.biomodEffects = effectsArray;
    console.log('BluePlanet Biomod getData: Final biomodEffects for template:', context.biomodEffects);

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
    
    // Ensure system data is available in the template
    context.system = systemData;

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

    // Effect management
    html.find('.effect-add').click(this._onAddEffect.bind(this));
    html.find('.effect-delete').click(this._onDeleteEffect.bind(this));

    // Attribute modification controls
    html.find('.attribute-increase').click(this._onAttributeIncrease.bind(this));
    html.find('.attribute-decrease').click(this._onAttributeDecrease.bind(this));
    
    // Special rules management
    html.find('.special-rule-add').click(this._onAddSpecialRule.bind(this));
    html.find('.special-rule-delete').click(this._onDeleteSpecialRule.bind(this));
    
    // Drag & Drop for effects (Feature items -> effects list)
    html.find('.effect-drop-zone, .drop-zone').on('dragover', this._onDragOver.bind(this));
    html.find('.effect-drop-zone, .drop-zone').on('dragleave', this._onDragLeave.bind(this));
    html.find('.effect-drop-zone, .drop-zone').on('drop', this._onEffectDrop.bind(this));
    // Prevent form submission on drag events
    html.find('.effect-drop-zone, .drop-zone').on('dragenter', function(e) { e.preventDefault(); });
    html.find('.effect-drop-zone, .drop-zone').on('dragstart', function(e) { e.preventDefault(); });

    // Bind weapon-style add button too
    html.find('.feature-add-button.effect-add').click(this._onAddEffect.bind(this));
    html.find('.effect-add').click(this._onAddEffect.bind(this));

    // Edit/Link linked feature from effect
    html.find('.effect-edit').click(this._onOpenEffect.bind(this));
    
    // Let the parent class handle auto-saving - don't add extra event listeners
    // that can cause excessive saving and performance issues
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
      
      const effects = [...(this.item.system.effects || [])];
      const name = item.name || 'Unnamed Feature';
      // Build a brief summary from the feature's description (strip HTML, limit length)
      let rawDesc = (item.system?.description || item.data?.data?.description || "");
      try { rawDesc = rawDesc.replace(/<[^>]+>/g, ' '); } catch (_) {}
      const summary = (rawDesc || '').trim().slice(0, 140) + ((rawDesc || '').trim().length > 140 ? '…' : '');
      const uuid = item.uuid || data.uuid || null;
      effects.push({ name, summary, uuid });
      await this.item.update({"system.effects": effects});
      ui.notifications.info(`Added effect from Feature: ${name}`);
      console.log('BluePlanet Biomod: Added effect from dropped feature:', name);
    } catch (error) {
      console.error('BluePlanet Biomod: Error processing drop:', error);
      ui.notifications.error('Failed to add effect from dropped item');
    }
  }

  /**
   * Handle adding a biomod effect
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddEffect(event) {
    event.preventDefault();
    const effects = [...(this.item.system.effects || [])];
    effects.push({ name: "", summary: "" });
    await this.item.update({"system.effects": effects});
    console.log('BluePlanet Biomod: Added new empty effect');
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
    console.log(`BluePlanet Biomod: Deleted effect at index ${index}`);
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
      console.log(`BluePlanet Biomod: Increased ${attribute} to ${currentValue + 1}`);
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
      console.log(`BluePlanet Biomod: Decreased ${attribute} to ${currentValue - 1}`);
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
    console.log('BluePlanet Biomod: Added new special rule');
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
    await this.item.update({"system.special_rules": specialRules}, {render: false});
    console.log(`BluePlanet Biomod: Deleted special rule at index ${index}`);
  }

  /**
   * Submit helper to persist form without closing
   */
  async _onAutoSubmit(event) {
    event.preventDefault();
    try {
      await this.submit({ preventClose: true });
    } catch (e) {
      console.error('BluePlanet Biomod: Auto-submit failed', e);
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
      const uuid = eff.uuid;
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



}
