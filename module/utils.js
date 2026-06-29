/**
 * Blue Planet Recontact - Shared Utilities
 * Common functions used across multiple modules to avoid duplication
 */

/**
 * Get wound penalty for an actor
 * @param {Actor} actor - The actor to check
 * @returns {number} - Total wound penalty (negative number)
 */
export function getWoundPenalty(actor) {
  if (!actor?.system?.wounds) return 0;
  
  const minor = actor.system.wounds.minor || 0;
  const major = actor.system.wounds.major || 0;
  const mortal = actor.system.wounds.mortal || 0;
  
  return -(minor + (major * 2) + (mortal * 3));
}

/**
 * Get dice formula for skill level type
 * @param {string} levelType - The skill level type
 * @returns {string} - Dice formula
 */
export function getDiceFormula(levelType) {
  switch (levelType) {
    case 'specialty': return '3d10kl';
    case 'core': return '2d10kl';
    default: return '1d10';
  }
}

/**
 * Get level label for skill level type
 * @param {string} levelType - The skill level type
 * @returns {string} - The level label
 */
export function getLevelLabel(levelType) {
  switch (levelType) {
    case 'specialty': return 'Specialty';
    case 'core': return 'Core';
    default: return 'General';
  }
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Calculate skill level based on rank
 * @param {number} rank - Skill rank
 * @returns {Object} - Object containing level type, dice formula, and target modifier
 */
export function calculateSkillLevel(rank) {
  if (rank >= 5) {
    return {
      level: 'specialty',
      dice: '3d10kl',
      targetModifier: rank
    };
  } else if (rank >= 3) {
    return {
      level: 'core', 
      dice: '2d10kl',
      targetModifier: rank
    };
  } else {
    return {
      level: 'general',
      dice: '1d10',
      targetModifier: rank
    };
  }
}