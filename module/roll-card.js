/**
 * Blue Planet Roll Card Integration Module
 * Manages the roll card UI and integration with Foundry VTT
 */

export class BluePlanetRollCard extends Application {
  constructor(options = {}) {
    super(options);
    this.actor = options.actor || null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "blue-planet-roll-card",
      title: "Blue Planet - Roll Card",
      template: "systems/blue-planet-recontact/templates/roll-card.hbs",
      width: 850,
      height: 600,
      resizable: true,
      classes: ["blue-planet", "roll-card"],
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".content",
          initial: "mechanics"
        }
      ]
    });
  }

  getData() {
    const context = super.getData();
    
    // Add system data
    context.system = {
      diceTypes: this._getDiceTypes(),
      rollMechanics: this._getRollMechanics(),
      actionValueEffects: this._getActionValueEffects(),
      damageTable: this._getDamageTable(),
      strainRules: this._getStrainRules(),
      hardLimits: this._getHardLimits()
    };
    
    // Add character data if actor is available
    if (this.actor) {
      context.actor = this.actor;
      context.characterElements = this._getCharacterElements();
    }
    
    return context;
  }

  _getDiceTypes() {
    return {
      skillSet: {
        general: { dice: "1d10", description: "Use single lowest die result" },
        core: { dice: "2d10", description: "Use single lowest die result" },
        specialty: { dice: "3d10", description: "Use single lowest die result" }
      },
      attribute: {
        dice: "1d10",
        target: "5 + Attribute Rank",
        description: "Raw ability only"
      },
      damage: {
        dice: "3d10",
        target: "Damage Rating",
        description: "Number of successes matters"
      }
    };
  }

  _getRollMechanics() {
    return {
      basicRule: "Roll equal to or lower than target number",
      diceUsed: "Only d10s - Target numbers range 1-10",
      targetFormula: "Target Number = Attribute Rank + Skill Set Rank"
    };
  }

  _getActionValueEffects() {
    return [
      { value: "+5 or better", result: "BENEFIT", effect: "+2 to next relevant test OR narrative benefit", type: "benefit" },
      { value: "0", result: "COMPLICATION", effect: "Success with additional challenge/delay", type: "neutral" },
      { value: "-5 or worse", result: "CONSEQUENCE", effect: "-2 to next relevant test OR narrative penalty", type: "consequence" }
    ];
  }

  _getDamageTable() {
    return [
      { successes: 0, woundLevel: "No Wound", penalty: "No effect", type: "success" },
      { successes: 1, woundLevel: "Minor Wound", penalty: "-1 to all actions", type: "minor" },
      { successes: 2, woundLevel: "Major Wound", penalty: "-2 to all actions + Stun test", type: "major" },
      { successes: 3, woundLevel: "Mortal Wound", penalty: "-3 to all actions + Trauma test", type: "mortal" }
    ];
  }

  _getStrainRules() {
    return {
      beforeRoll: "Spend 1 strain for +2 to target number",
      afterFailedRoll: "Spend 1 strain to reroll",
      rerollSuccess: "Strain spent, action succeeds",
      rerollFailure: "Strain spent + reduce attribute by 1 rank"
    };
  }

  _getHardLimits() {
    return {
      impossible: "Target < 1: Task impossible, no roll",
      automatic: "Target ≥ 10: Automatic success, no roll"
    };
  }

  _getCharacterElements() {
    if (!this.actor) return [];
    
    const elements = [
      { type: "attributes", label: "📊 Attributes", data: this.actor.system.attributes },
      { type: "skills", label: "🛠️ Skill Sets", data: this.actor.system.skills },
      { type: "strain", label: "⚡ Strain Points", data: this.actor.system.strain },
      { type: "wounds", label: "❤️ Wound Track", data: this.actor.system.wounds },
      { type: "tags", label: "🏷️ Tags", data: this.actor.system.tags },
      { type: "ties", label: "🤝 Ties", data: this.actor.system.ties },
      { type: "biomods", label: "🧬 Biomods", data: this.actor.system.biomods }
    ];
    
    return elements;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Roll buttons
    html.find('.roll-skill').click(this._onRollSkill.bind(this));
    html.find('.roll-attribute').click(this._onRollAttribute.bind(this));
    html.find('.roll-damage').click(this._onRollDamage.bind(this));

    // Quick roll buttons
    html.find('.quick-roll').click(this._onQuickRoll.bind(this));

    // Drag and drop functionality
    this._setupDragAndDrop(html);

    // Character element interactions
    html.find('.character-element').click(this._onCharacterElementClick.bind(this));
    html.find('.element-roll').click(this._onElementRoll.bind(this));
  }

  _setupDragAndDrop(html) {
    const dragZone = html.find('.drag-drop-zone')[0];
    const draggables = html.find('.draggable');

    if (!dragZone) return;

    // Setup draggable elements
    draggables.each((i, el) => {
      el.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', el.dataset.item);
        event.dataTransfer.effectAllowed = 'move';
      });
    });

    // Setup drop zone
    dragZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      dragZone.classList.add('drag-over');
    });

    dragZone.addEventListener('dragleave', () => {
      dragZone.classList.remove('drag-over');
    });

    dragZone.addEventListener('drop', (event) => {
      event.preventDefault();
      dragZone.classList.remove('drag-over');
      
      const itemType = event.dataTransfer.getData('text/plain');
      this._addCharacterElement(itemType, dragZone);
    });
  }

  _addCharacterElement(itemType, container) {
    const elementData = this._getCharacterElements().find(el => el.type === itemType);
    if (!elementData) return;

    const itemsContainer = container.querySelector('.character-sheet-items');
    
    // Create new element
    const newElement = document.createElement('div');
    newElement.className = 'character-element';
    newElement.dataset.type = itemType;
    newElement.innerHTML = `
      <span>${elementData.label}</span>
      <button class="element-roll" data-type="${itemType}">Roll</button>
    `;

    // Add remove functionality
    newElement.addEventListener('dblclick', () => {
      newElement.remove();
      this._updateDropZoneVisibility(container);
    });

    itemsContainer.appendChild(newElement);
    this._updateDropZoneVisibility(container);

    // Bind roll functionality
    newElement.querySelector('.element-roll').addEventListener('click', (event) => {
      this._onElementRoll(event);
    });
  }

  _updateDropZoneVisibility(container) {
    const itemsContainer = container.querySelector('.character-sheet-items');
    const instructions = container.querySelector('p');
    
    if (instructions) {
      instructions.style.display = itemsContainer.children.length === 0 ? 'block' : 'none';
    }
  }

  async _onRollSkill(event) {
    event.preventDefault();
    
    if (!this.actor) {
      ui.notifications.warn("No character selected for rolling");
      return;
    }

    // Open skill selection dialog
    const dialog = new Dialog({
      title: "Roll Skill Test",
      content: await this._getSkillDialog(),
      buttons: {
        roll: {
          label: "Roll",
          callback: html => this._executeSkillRoll(html)
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "roll"
    });
    
    dialog.render(true);
  }

  async _onRollAttribute(event) {
    event.preventDefault();
    
    if (!this.actor) {
      ui.notifications.warn("No character selected for rolling");
      return;
    }

    const dialog = new Dialog({
      title: "Roll Attribute Test",
      content: await this._getAttributeDialog(),
      buttons: {
        roll: {
          label: "Roll",
          callback: html => this._executeAttributeRoll(html)
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "roll"
    });
    
    dialog.render(true);
  }

  async _onRollDamage(event) {
    event.preventDefault();

    const dialog = new Dialog({
      title: "Roll Damage Test",
      content: `
        <form>
          <div class="form-group">
            <label>Damage Rating:</label>
            <input type="number" name="damage-rating" value="6" min="1" max="20" />
          </div>
          <div class="form-group">
            <label>Modifiers:</label>
            <input type="number" name="modifiers" value="0" step="1" />
          </div>
        </form>
      `,
      buttons: {
        roll: {
          label: "Roll",
          callback: html => this._executeDamageRoll(html)
        },
        cancel: {
          label: "Cancel"
        }
      },
      default: "roll"
    });
    
    dialog.render(true);
  }

  async _onQuickRoll(event) {
    event.preventDefault();
    const rollType = event.target.dataset.rollType;
    
    switch(rollType) {
      case 'general':
        this._executeQuickRoll('1d10', 'General Skill Test');
        break;
      case 'core':
        this._executeQuickRoll('2d10kl', 'Core Skill Test');
        break;
      case 'specialty':
        this._executeQuickRoll('3d10kl', 'Specialty Skill Test');
        break;
      case 'attribute':
        this._executeQuickRoll('1d10', 'Attribute Test');
        break;
      case 'damage':
        this._executeQuickRoll('3d10', 'Damage Test');
        break;
    }
  }

  _onCharacterElementClick(event) {
    const elementType = event.target.dataset.type;
    const elementData = this._getCharacterElements().find(el => el.type === elementType);
    
    if (elementData) {
      // Display element information
      ui.notifications.info(`${elementData.label}: ${JSON.stringify(elementData.data, null, 2)}`);
    }
  }

  async _onElementRoll(event) {
    const elementType = event.target.dataset.type;
    
    if (!this.actor) {
      ui.notifications.warn("No character available for rolling");
      return;
    }

    switch(elementType) {
      case 'attributes':
        this._onRollAttribute(event);
        break;
      case 'skills':
        this._onRollSkill(event);
        break;
      case 'strain':
        ui.notifications.info("Strain is used to modify other rolls");
        break;
      case 'wounds':
        this._onRollDamage(event);
        break;
      default:
        ui.notifications.info(`${elementType} interaction not yet implemented`);
    }
  }

  async _getSkillDialog() {
    if (!this.actor) return "<p>No character selected</p>";
    
    const skills = Object.keys(this.actor.system.skills);
    const attributes = Object.keys(this.actor.system.attributes);
    
    return `
      <form>
        <div class="form-group">
          <label>Skill:</label>
          <select name="skill">
            ${skills.map(skill => `<option value="${skill}">${skill}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Attribute:</label>
          <select name="attribute">
            ${attributes.map(attr => `<option value="${attr}">${attr}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Modifiers:</label>
          <input type="number" name="modifiers" value="0" step="1" />
        </div>
        <div class="form-group">
          <label>Use Strain:</label>
          <input type="checkbox" name="use-strain" />
        </div>
      </form>
    `;
  }

  async _getAttributeDialog() {
    if (!this.actor) return "<p>No character selected</p>";
    
    const attributes = Object.keys(this.actor.system.attributes);
    
    return `
      <form>
        <div class="form-group">
          <label>Attribute:</label>
          <select name="attribute">
            ${attributes.map(attr => `<option value="${attr}">${attr}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Use Focus Attribute:</label>
          <input type="checkbox" name="use-focus" />
        </div>
        <div class="form-group">
          <label>Modifiers:</label>
          <input type="number" name="modifiers" value="0" step="1" />
        </div>
        <div class="form-group">
          <label>Use Strain:</label>
          <input type="checkbox" name="use-strain" />
        </div>
      </form>
    `;
  }

  async _executeSkillRoll(html) {
    const form = html[0].querySelector("form");
    const skillName = form.skill.value;
    const attributeName = form.attribute.value;
    const modifiers = parseInt(form.modifiers.value) || 0;
    const useStrain = form['use-strain'].checked;

    const options = { modifiers, useStrain };
    
    try {
      await globalThis.blueplanet.rollSkillTest(this.actor, skillName, attributeName, options);
    } catch (error) {
      console.error("Error rolling skill test:", error);
      ui.notifications.error("Failed to roll skill test");
    }
  }

  async _executeAttributeRoll(html) {
    const form = html[0].querySelector("form");
    const attributeName = form.attribute.value;
    const useFocus = form['use-focus'].checked;
    const modifiers = parseInt(form.modifiers.value) || 0;
    const useStrain = form['use-strain'].checked;

    const options = { useFocus, modifiers, useStrain };
    
    try {
      await globalThis.blueplanet.rollAttributeTest(this.actor, attributeName, options);
    } catch (error) {
      console.error("Error rolling attribute test:", error);
      ui.notifications.error("Failed to roll attribute test");
    }
  }

  async _executeDamageRoll(html) {
    const form = html[0].querySelector("form");
    const damageRating = parseInt(form['damage-rating'].value) || 6;
    const modifiers = parseInt(form.modifiers.value) || 0;

    const finalRating = Math.max(1, damageRating + modifiers);
    
    try {
      await globalThis.blueplanet.rollDamageTest(this.actor, finalRating);
    } catch (error) {
      console.error("Error rolling damage test:", error);
      ui.notifications.error("Failed to roll damage test");
    }
  }

  async _executeQuickRoll(formula, label) {
    const roll = new Roll(formula);
    await roll.evaluate();
    
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: label,
      rollMode: game.settings.get("core", "rollMode")
    });
  }

  // Static method to open roll card
  static async show(actor = null) {
    const rollCard = new BluePlanetRollCard({ actor });
    rollCard.render(true);
    return rollCard;
  }
}

// Global function to open roll card
globalThis.showBluePlanetRollCard = function(actor = null) {
  return BluePlanetRollCard.show(actor);
};
