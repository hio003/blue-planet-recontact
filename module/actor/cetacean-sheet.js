/**
 * Extended Actor Sheet for Cetacean characters
 * Uses the same functionality as BluePlanetActorSheet but with cetacean-specific template
 */

import { BluePlanetActorSheet } from "./actor-sheet.js";

/**
 * Extend the basic BluePlanetActorSheet for Cetaceans
 * @extends {BluePlanetActorSheet}
 */
export class BluePlanetCetaceanSheet extends BluePlanetActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "actor", "cetacean"],
      template: "systems/blue-planet-recontact/templates/actor/actor-cetacean-sheet.hbs",
      width: 900,
      height: 700,
      resizable: true,
      minimizable: true,
      dragHandle: ".window-header",
      popOut: true,
      top: 100,
      left: 300,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities"}],
      dragDrop: [
        {dragSelector: ".item-list .item", dropSelector: null},
        {dragSelector: ".biomod-list .item", dropSelector: ".biomods-section"},
        {dragSelector: ".cyberware-list .item", dropSelector: ".cyberware-section"}
      ]
    });
  }

  /** @override */
  get template() {
    return "systems/blue-planet-recontact/templates/actor/actor-cetacean-sheet.hbs";
  }

  /** @override */
  async render(force = false, options = {}) {
    options.popOut = true;
    const result = await super.render(force, options);

    // Apply theme class
    if (this.element?.[0]) {
      const globalTheme = game.settings.get('blue-planet-recontact', 'defaultSheetTheme') ?? 'blue-planet';
      const theme = this.actor.getFlag('blue-planet-recontact', 'sheetTheme') ?? globalTheme;
      const el = this.element[0];
      el.classList.remove('bpr-theme-blue-planet', 'bpr-theme-dark');
      el.classList.add(`bpr-theme-${theme}`);
    }

    if (this._pipStates && this._pipStates.size > 0) {
      setTimeout(() => {
        this._restoreAllPipStates();
      }, 50);
    }
    return result;
  }

  /** @override */
  async getData(options) {
    // Get the base data
    const context = await super.getData(options);

    // Add cetacean-specific data preparation
    this._prepareCetaceanData(context);

    // Initialize pip states
    this._initializePipStates();

    return context;
  }

  /**
   * Prepare cetacean-specific data
   * @param {Object} context The actor context to prepare.
   */
  _prepareCetaceanData(context) {
    // Add cetacean species options
    context.cetaceanSpecies = [
      { value: "beluga", label: "Beluga Whale" },
      { value: "bottlenose", label: "Bottlenose Dolphin" },
      { value: "common", label: "Common Dolphin" },
      { value: "orca", label: "Orca" },
      { value: "pilot", label: "Pilot Whale" },
      { value: "sperm", label: "Sperm Whale" }
    ];

    // Prepare cetacean-specific abilities and stats
    context.echolocationBonus = context.system.echolocation ? 4 : 0;
    context.hasEcholocation = !!context.system.echolocation;

    // Format diving capabilities
    if (context.system.diving) {
      context.divingDisplay = `${context.system.diving.depth || 0}m / ${context.system.diving.duration || 0}min`;
    }

    // Cetacean size categories
    context.cetaceanSizes = [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
      { value: 'huge', label: 'Huge' }
    ];

    // Common cetacean skills
    context.cetaceanCommonSkills = [
      'Awareness', 'Athletics', 'Stealth', 'Survival', 'Investigate'
    ];
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Cetacean-specific listeners
    html.find('.cetacean-quick-setup').click(this._onCetaceanQuickSetup.bind(this));
    html.find('.cetacean-toggle-echolocation').click(this._onToggleEcholocation.bind(this));
    html.find('.add-common-skill').click(this._onAddCommonSkill.bind(this));

    setTimeout(() => {
      this._restoreAllPipStates();
    }, 100);
  }

  async _onCetaceanQuickSetup(event) {
    event.preventDefault();
    const size = event.currentTarget.dataset.size || 'medium';

    const setups = {
      small: { attributes: { awareness: { value: 2 }, coordination: { value: 2 }, physique: { value: 1 } } },
      medium: { attributes: { awareness: { value: 2 }, coordination: { value: 2 }, physique: { value: 2 } } },
      large: { attributes: { awareness: { value: 1 }, coordination: { value: 2 }, physique: { value: 3 } } },
      huge: { attributes: { awareness: { value: 1 }, coordination: { value: 1 }, physique: { value: 4 } } }
    };

    await this.actor.update({'system.attributes': setups[size].attributes});
    this.render(false);
    ui.notifications.info(`Cetacean configured as ${size}.`);
  }

  async _onToggleEcholocation(event) {
    event.preventDefault();
    const current = !!this.actor.system.echolocation;
    await this.actor.update({'system.echolocation': !current});
    this.render(false);
  }

  async _onAddCommonSkill(event) {
    event.preventDefault();
    const skillName = event.currentTarget.dataset.skill;
    if (!skillName) return;
    const skills = foundry.utils.deepClone(this.actor.system.skills || {});
    const skillId = skillName.toLowerCase();
    if (skills[skillId]) {
      ui.notifications.warn(`${skillName} already exists.`);
      return;
    }
    skills[skillId] = { label: skillName, rank: 1, level_type: 'general', attribute: 'awareness', aspect: 'experiential' };
    await this.actor.update({'system.skills': skills});
    ui.notifications.info(`Added ${skillName} skill.`);
  }
}