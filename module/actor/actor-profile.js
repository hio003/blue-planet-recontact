/**
 * Actor Profile Popout for Blue Planet Recontact
 * A dedicated window for viewing and editing character profile information
 * @extends {FormApplication}
 */
export class BluePlanetActorProfile extends FormApplication {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "sheet", "actor-profile", "popout"],
      template: "systems/blue-planet-recontact/templates/actor/actor-profile.hbs",
      width: 500,
      height: 650,
      title: "Character Profile",
      resizable: true,
      closeOnSubmit: false,
      submitOnChange: true,
      tabs: [{navSelector: ".profile-tabs", contentSelector: ".profile-content", initial: "identity"}]
    });
  }

  /** @override */
  get title() {
    return `${this.actor.name} - Profile`;
  }

  /** @override */
  get id() {
    return `actor-profile-${this.actor.id}`;
  }

  /**
   * Get the actor associated with this profile
   */
  get actor() {
    return this.object;
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    
    // Get actor data
    const actor = this.actor;
    context.actor = actor;
    context.system = actor.system;
    context.isOwner = actor.isOwner;
    context.isEditable = this.isEditable;
    
    // Prepare profile data
    context.profile = actor.system.profile || {};
    context.features = actor.system.features || {};
    context.advancement = actor.system.advancement || {};
    
    // Calculate age difference for display
    if (context.features.age) {
      const apparent = context.features.age.apparent || 0;
      const actual = context.features.age.actual || 0;
      context.ageDifference = actual !== apparent ? actual - apparent : 0;
    }
    
    // Format reputation level
    const repLevel = context.profile.reputation?.level || 0;
    if (repLevel < 6) context.reputationText = "Unknown";
    else if (repLevel < 11) context.reputationText = "Rumored";
    else if (repLevel < 16) context.reputationText = "Notable";
    else if (repLevel < 21) context.reputationText = "(In)famous";
    else context.reputationText = "Renowned";
    
    // Get species information
    context.speciesText = context.system.species || "Human";
    
    // Get tier information
    context.tierText = context.system.tier ? 
      context.system.tier.charAt(0).toUpperCase() + context.system.tier.slice(1) : 
      "Everyday";
    
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Handle image upload for portrait
    html.find('.profile-image').click(this._onEditImage.bind(this));
    
    // Handle reputation pips
    html.find('.reputation-pip').click(this._onReputationChange.bind(this));
    
    // Handle CHIPS pips  
    html.find('.chips-pip').click(this._onChipsChange.bind(this));
    
    // Handle species selection
    html.find('.species-select').change(this._onSpeciesChange.bind(this));
    
    // Handle tier selection
    html.find('.tier-select').change(this._onTierChange.bind(this));

    // Make the profile draggable by the header
    const header = html.find('.window-header')[0];
    if (header) {
      header.style.cursor = 'move';
    }
  }

  /**
   * Handle editing the actor's image
   * @param {Event} event - The originating click event
   * @private
   */
  async _onEditImage(event) {
    event.preventDefault();
    const current = this.actor.img;
    
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: (path) => {
        this.actor.update({img: path});
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  }

  /**
   * Handle reputation level changes
   * @param {Event} event - The originating click event
   * @private
   */
  async _onReputationChange(event) {
    event.preventDefault();
    const pip = event.currentTarget;
    const level = parseInt(pip.dataset.level);
    const currentLevel = this.actor.system.profile?.reputation?.level || 0;
    
    // Toggle behavior: if clicking the current level, reduce by 1, otherwise set to clicked level
    const newLevel = (level === currentLevel) ? Math.max(0, level - 1) : level;
    
    await this.actor.update({
      "system.profile.reputation.level": newLevel
    });
  }

  /**
   * Handle CHIPS changes
   * @param {Event} event - The originating click event
   * @private
   */
  async _onChipsChange(event) {
    event.preventDefault();
    const pip = event.currentTarget;
    const level = parseInt(pip.dataset.level);
    const currentLevel = this.actor.system.advancement?.chips || 0;
    
    // Toggle behavior: if clicking the current level, reduce by 1, otherwise set to clicked level
    const newLevel = (level === currentLevel) ? Math.max(0, level - 1) : level;
    
    await this.actor.update({
      "system.advancement.chips": newLevel
    });
  }

  /**
   * Handle species changes
   * @param {Event} event - The originating change event
   * @private
   */
  async _onSpeciesChange(event) {
    event.preventDefault();
    const species = event.target.value;
    
    await this.actor.update({
      "system.species": species
    });
  }

  /**
   * Handle tier changes
   * @param {Event} event - The originating change event
   * @private
   */
  async _onTierChange(event) {
    event.preventDefault();
    const tier = event.target.value;
    
    await this.actor.update({
      "system.tier": tier
    });
  }

  /** @override */
  async _updateObject(event, formData) {
    // Handle form submission
    return this.actor.update(formData);
  }

  /** @override */
  setPosition(options = {}) {
    // Ensure the popout stays within screen bounds
    const position = super.setPosition(options);
    
    // Add some offset from the main sheet if it exists
    const mainSheet = this.actor.sheet;
    if (mainSheet && mainSheet.rendered) {
      const sheetPos = mainSheet.position;
      position.left = sheetPos.left + sheetPos.width + 10;
      position.top = sheetPos.top;
    }
    
    return position;
  }

  /**
   * Static method to open or focus an existing profile window
   * @param {Actor} actor - The actor whose profile to show
   * @returns {BluePlanetActorProfile} The profile application
   */
  static async showProfile(actor) {
    // Check if a profile window is already open for this actor
    const existingProfile = Object.values(ui.windows).find(
      app => app instanceof BluePlanetActorProfile && app.actor.id === actor.id
    );
    
    if (existingProfile) {
      existingProfile.bringToTop();
      return existingProfile;
    }
    
    // Create new profile window
    const profile = new BluePlanetActorProfile(actor);
    return profile.render(true);
  }
}
