// Note: chat-utils import removed as automatic scrolling is disabled

/**
 * Import the enhanced roll message function from actor.js
 * This ensures consistent roll messaging across all sheet types
 */
import { createBluePlanetRollMessage } from "./actor.js";

/**
 * Extend the basic ActorSheet for Blue Planet creatures
 * @extends {foundry.appv1.sheets.ActorSheet}
 */
export class BluePlanetCreatureSheet extends foundry.appv1.sheets.ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "actor", "creature"],
      template: "systems/blue-planet-recontact/templates/actor/actor-creature-sheet.hbs",
      width: 800,
      height: 650,
      resizable: true,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "biology"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  get template() {
    return "systems/blue-planet-recontact/templates/actor/actor-creature-sheet.hbs";
  }

  /** @override */
  async getData(options) {
    // Retrieve the data structure from the base sheet.
    const context = super.getData(options);

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare creature-specific data
    this._prepareCreatureData(context);

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = this.actor.effects.map(e => foundry.utils.deepClone(e));

    return context;
  }

  /**
   * Organize and prepare creature-specific data
   *
   * @param {Object} context The actor context to prepare.
   */
  _prepareCreatureData(context) {
    // Handle creature attributes
    if (context.system.attributes) {
      for (let [key, attribute] of Object.entries(context.system.attributes)) {
        // Ensure attribute exists and is an object before setting properties
        if (attribute && typeof attribute === 'object') {
          attribute.label = key.charAt(0).toUpperCase() + key.slice(1);
        }
      }
    }

    // Prepare threat level options
    context.threatLevels = [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ];

    // Prepare resource value options
    context.resourceValues = [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ];

    // Format size display
    if (context.system.biology) {
      const bio = context.system.biology;
      if (bio.size) {
        bio.sizeDisplay = `${bio.size.length || 0}m / ${bio.size.mass || 0}kg`;
      }
    }

    // Prepare attack information
    if (context.system.attack) {
      const attack = context.system.attack;
      
      // Determine if creature has venom
      context.hasVenom = attack.venom && (attack.venom.effect || attack.venom.damage > 0);
      
      // Format attack display
      if (attack.type && attack.damage) {
        context.attackDisplay = `${attack.type} (Damage ${attack.damage})`;
      }
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Attribute rolls
    html.find('.attribute-roll').click(this._onAttributeRoll.bind(this));

    // Attack rolls
    html.find('.attack-roll').click(this._onAttackRoll.bind(this));

    // Damage rolls
    html.find('.damage-roll').click(this._onDamageRoll.bind(this));
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[${dataset.label}]` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Handle attribute rolls for creatures
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttributeRoll(event) {
    event.preventDefault();
    const attributeName = event.currentTarget.dataset.attribute;
    
    // Creatures use simplified attribute tests
    const attribute = this.actor.system.attributes[attributeName];
    
    if (!attribute) {
      ui.notifications.warn(`Invalid attribute: ${attributeName}`);
      return null;
    }

    // Base target number for creature attribute tests is 5 + attribute
    const targetNumber = 5 + attribute.value;
    
    const roll = new Roll("1d10", this.actor.getRollData());
    await roll.evaluate();
    
    const success = roll.total <= targetNumber;
    const actionValue = targetNumber - roll.total;
    
    // Create enhanced roll message
    const rollData = { success, actionValue, targetNumber };
    const rollOptions = {
      flavor: `${this.actor.name} - ${attributeName.titleCase()} Test`,
      rollMode: game.settings.get("core", "rollMode")
    };
    
    await createBluePlanetRollMessage(roll, rollData, this.actor, "attribute", rollOptions);
    
    return { roll, success, actionValue, targetNumber };
  }

  /**
   * Handle attack rolls for creatures
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAttackRoll(event) {
    event.preventDefault();
    
    const attack = this.actor.system.attack;
    if (!attack || !attack.damage) {
      ui.notifications.warn("This creature has no defined attack");
      return null;
    }

    // Roll damage test directly
    return this._onDamageRoll(event, attack.damage);
  }

  /**
   * Handle damage rolls
   * @param {Event} event   The originating click event
   * @param {number} damageRating   Optional damage rating override
   * @private
   */
  async _onDamageRoll(event, damageRating = null) {
    event.preventDefault();
    
    const rating = damageRating || parseInt(event.currentTarget.dataset.damage) || this.actor.system.attack?.damage || 0;
    
    if (rating <= 0) {
      ui.notifications.warn("No damage rating specified");
      return null;
    }

    const roll = new Roll("3d10", this.actor.getRollData());
    await roll.evaluate();
    
    // Count successes (dice that roll <= damage rating)
    let successes = 0;
    for (const die of roll.dice[0].results) {
      if (die.result <= rating) successes++;
    }
    
    let woundLevel = "No Effect";
    if (successes === 1) woundLevel = "Minor Wound";
    else if (successes === 2) woundLevel = "Major Wound";
    else if (successes === 3) woundLevel = "Mortal Wound";

    // Add venom information if present
    let venomInfo = "";
    const attack = this.actor.system.attack;
    if (attack?.venom && (attack.venom.effect || attack.venom.damage > 0)) {
      venomInfo = `<br><em style="color: #8b0000">🐍 Venom: ${attack.venom.effect || "Toxic"} (${attack.venom.onset || "Immediate"}, Damage ${attack.venom.damage || 0})</em>`;
    }
    
    // Create enhanced roll message
    const rollData = {
      successes: successes,
      woundLevel: woundLevel,
      damageRating: rating,
      success: successes > 0,
      actionValue: null,
      targetNumber: rating
    };
    
    const rollOptions = {
      flavor: `${this.actor.name} Attack${venomInfo}`,
      rollMode: game.settings.get("core", "rollMode")
    };
    
    await createBluePlanetRollMessage(roll, rollData, this.actor, "damage", rollOptions);
    
    return { roll, successes, woundLevel, damageRating: rating };
  }
}
