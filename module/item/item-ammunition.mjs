/**
 * Structure for the Ammunition item type in Blue Planet Recontact
 * @extends {Item} The base Item entity
 */
export class AmmunitionBPR extends Item {
  
  /**
   * Augment the basic Item data model with additional properties
   * @override
   */
  prepareData() {
    super.prepareData();
    
    // Get the Item's data
    const systemData = this.system;
    
    // Set defaults for ammunition properties if not already defined
    if (!systemData.quantity) systemData.quantity = 1;
    if (!systemData.package_size) systemData.package_size = 50;
    if (!systemData.rounds_fired) systemData.rounds_fired = 0;
    if (!systemData.compatible_weapons) systemData.compatible_weapons = [];
    
    // Calculate derived properties
    systemData.total_rounds = systemData.quantity * systemData.package_size;
    systemData.remaining_rounds = Math.max(0, systemData.total_rounds - systemData.rounds_fired);
    
    // Calculate total weight if per-round weight is defined
    if (systemData.weight_per_round) {
      systemData.total_weight = systemData.total_rounds * systemData.weight_per_round;
    }
    
    // Calculate total value if per-round cost is defined
    if (systemData.cost_per_round) {
      systemData.total_value = systemData.total_rounds * systemData.cost_per_round;
    }
  }

  /**
   * Check if this ammunition is compatible with a given weapon
   * @param {Object} weapon   The weapon item to check against
   * @returns {Boolean} Whether the ammunition is compatible
   */
  isCompatibleWithWeapon(weapon) {
    // If no specific restrictions, assume universal compatibility
    if (!this.system.compatible_weapons || this.system.compatible_weapons.length === 0) {
      return true;
    }
    
    // Get the weapon name and type
    const weaponName = weapon.name.toLowerCase();
    const weaponType = weapon.system?.weapon_type?.toLowerCase() || "";
    
    // Check if any compatible weapon entry matches weapon name or type
    return this.system.compatible_weapons.some(compatible => {
      const entry = compatible.toLowerCase();
      return weaponName.includes(entry) || 
             entry.includes(weaponName) ||
             (weaponType && (entry.includes(weaponType) || weaponType.includes(entry)));
    });
  }

  /**
   * Consume ammunition (used by weapon attacks)
   * @param {Number} rounds   Number of rounds to consume
   * @returns {Boolean} True if ammunition was consumed successfully
   */
  async consumeAmmunition(rounds = 1) {
    const totalRounds = this.system.quantity * this.system.package_size;
    const currentFired = this.system.rounds_fired || 0;
    const remainingRounds = totalRounds - currentFired;
    
    if (remainingRounds < rounds) {
      ui.notifications.warn(`Insufficient ammunition in ${this.name}! Only ${remainingRounds} rounds remaining.`);
      return false;
    }
    
    await this.update({"system.rounds_fired": currentFired + rounds});
    return true;
  }
  
  /**
   * Get the remaining ammunition count
   * @returns {Number} Number of rounds remaining
   */
  getRemainingRounds() {
    const totalRounds = this.system.quantity * this.system.package_size;
    const currentFired = this.system.rounds_fired || 0;
    return Math.max(0, totalRounds - currentFired);
  }
  
  /**
   * Get ammunition modifiers for use by weapons
   * @returns {Object} Object containing ammunition modifiers
   */
  getModifiers() {
    return {
      attack_modifier: this.system.attack_modifier || 0,
      damage_modifier: this.system.damage_modifier || 0,
      range_modifier: this.system.range_modifier || 0,
      penetration: this.system.penetration || 0,
      ammo_type: this.system.ammo_type || "standard"
    };
  }
}