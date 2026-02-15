/**
 * Blue Planet Generic Item Sheet
 * Extends ItemSheet to provide a basic interface for skills, features, and species
 */
export class BluePlanetItemSheet extends foundry.appv1.sheets.ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "item", "item-sheet"],
      width: 520,
      height: 400,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  /** @override */
  get template() {
    return `systems/blue-planet-recontact/templates/item/item-generic-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    const itemData = context.item;
    const systemData = itemData.system;

    // Add common options
    context.availabilityOptions = {
      "common": "Common",
      "uncommon": "Uncommon",
      "rare": "Rare",
      "restricted": "Restricted",
      "military": "Military"
    };

    context.legalityOptions = {
      "legal": "Legal",
      "restricted": "Restricted",
      "controlled": "Controlled",
      "illegal": "Illegal"
    };

    // Add item-type specific data
    switch (itemData.type) {
      case 'skill':
        context.skillCategories = {
          "origin": "Origin",
          "education": "Education",
          "profession": "Profession",
          "specialty": "Specialty"
        };
        break;
      
      case 'feature':
        context.featureTypes = {
          "trait": "Character Trait",
          "advantage": "Advantage",
          "disadvantage": "Disadvantage",
          "quirk": "Quirk"
        };
        break;
      
      case 'species':
        context.sizeCategories = {
          "tiny": "Tiny",
          "small": "Small", 
          "medium": "Medium",
          "large": "Large",
          "huge": "Huge"
        };
        break;
    }

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Handle skill rank changes for skills
    if (this.item.type === 'skill') {
      html.find('.skill-rank').change(this._onSkillRankChange.bind(this));
    }

    // Handle species attribute changes
    if (this.item.type === 'species') {
      html.find('.species-attribute').change(this._onSpeciesAttributeChange.bind(this));
    }
    
    // Auto-save functionality for all input fields
    html.find('input[name^="system."], select[name^="system."], textarea[name^="system."]').change(this._onFieldChange.bind(this));
    html.find('input[name="name"]').change(this._onNameChange.bind(this));
  }

  /**
   * Handle skill rank changes
   * @param {Event} event The originating change event
   * @private
   */
  async _onSkillRankChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const rank = parseInt(element.value);
    
    // Clamp rank to valid range
    const clampedRank = Math.max(1, Math.min(10, rank));
    if (clampedRank !== rank) {
      element.value = clampedRank;
    }
    
    await this.item.update({"system.rank": clampedRank});
  }

  /**
   * Handle species attribute changes
   * @param {Event} event The originating change event
   * @private
   */
  async _onSpeciesAttributeChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const attribute = element.dataset.attribute;
    const value = parseInt(element.value);
    
    // Clamp attribute to valid range
    const clampedValue = Math.max(-2, Math.min(3, value));
    if (clampedValue !== value) {
      element.value = clampedValue;
    }
    
    await this.item.update({[`system.attributes.${attribute}`]: clampedValue});
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
    
    console.log(`BluePlanet Item (${this.item.type}): Updating ${fieldName} to:`, value);
    console.log(`BluePlanet Item: Current system data:`, this.item.system);
    
    try {
      const updateData = {[fieldName]: value};
      console.log(`BluePlanet Item: Update data:`, updateData);
      
      // For features, render after important field changes to show updates immediately
      const shouldRender = this.item.type === 'feature' && 
                          (fieldName === 'system.type' || fieldName === 'system.effect' || fieldName === 'system.description');
      
      await this.item.update(updateData, {render: shouldRender});
      
      console.log(`BluePlanet Item: Successfully updated ${fieldName} (no render)`);
      console.log(`BluePlanet Item: New system data:`, this.item.system);
      
      // Show success notification for features to confirm saving
      if (this.item.type === 'feature') {
        ui.notifications.info(`Feature ${fieldName.replace('system.', '')} saved successfully`);
      }
    } catch (error) {
      console.error(`BluePlanet Item: Error updating ${fieldName}:`, error);
      ui.notifications.error(`Failed to save ${fieldName}: ${error.message}`);
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
    
    console.log('BluePlanet Item: Updating name to:', value);
    
    try {
      await this.item.update({name: value}, {render: false});
      console.log('BluePlanet Item: Successfully updated name (no render)');
    } catch (error) {
      console.error('BluePlanet Item: Error updating name:', error);
      ui.notifications.error('Failed to save item name');
    }
  }
  
  /** @override */
  async _updateObject(event, formData) {
    console.log(`BluePlanet Item (${this.item.type}): _updateObject called with formData:`, formData);
    
    // Process form data for features
    if (this.item.type === 'feature') {
      // Ensure feature type is properly handled
      if (formData['system.type'] !== undefined) {
        console.log(`BluePlanet Item: Processing feature type: ${formData['system.type']}`);
      }
      
      // Ensure effect field is properly handled
      if (formData['system.effect'] !== undefined) {
        console.log(`BluePlanet Item: Processing feature effect: ${formData['system.effect']}`);
      }
    }
    
    // Convert numeric fields
    if (formData['system.cost'] !== undefined) {
      formData['system.cost'] = parseFloat(formData['system.cost']) || 0;
      formData['system.cost'] = Math.max(0, formData['system.cost']);
    }
    
    console.log(`BluePlanet Item: Processed formData:`, formData);
    console.log(`BluePlanet Item: About to save ${this.item.type} data...`);
    
    // Use the standard Foundry update process
    const result = await super._updateObject(event, formData);
    
    console.log(`BluePlanet Item: ${this.item.type} data saved successfully!`);
    ui.notifications.info(`${this.item.type.charAt(0).toUpperCase() + this.item.type.slice(1)} saved successfully`);
    
    return result;
  }
  
  /** @override */
  async close(options={}) {
    // Force save any pending changes before closing
    console.log(`BluePlanet Item (${this.item.type}): Sheet closing, forcing save...`);
    
    try {
      const form = this.form;
      if (form) {
        const formData = new FormDataExtended(form).object;
        console.log(`BluePlanet Item: Final formData before close:`, formData);
        
        // Process and save the form data
        await this._updateObject(null, formData);
        console.log(`BluePlanet Item: Successfully saved before closing`);
      }
    } catch (error) {
      console.error(`BluePlanet Item: Error saving before close:`, error);
      ui.notifications.warn(`Some ${this.item.type} data may not have been saved`);
    }
    
    return super.close(options);
  }
}
