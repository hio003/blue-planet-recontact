/**
 * Handlebars helpers for Blue Planet Recontact
 */

export function registerHandlebarsHelpers() {
  // Register custom Handlebars helpers
  
  // Create a range of numbers for iteration
  Handlebars.registerHelper('range', function(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(i);
    }
    return result;
  });

  // Add two numbers
  Handlebars.registerHelper('add', function(a, b) {
    return (parseInt(a) || 0) + (parseInt(b) || 0);
  });

  // Subtract two numbers
  Handlebars.registerHelper('subtract', function(a, b) {
    return (parseInt(a) || 0) - (parseInt(b) || 0);
  });

  // Multiply two numbers
  Handlebars.registerHelper('multiply', function(a, b) {
    return (parseInt(a) || 0) * (parseInt(b) || 0);
  });

  // Divide two numbers
  Handlebars.registerHelper('divide', function(a, b) {
    return (parseInt(a) || 0) / (parseInt(b) || 1);
  });

  // Greater than or equal
  Handlebars.registerHelper('gte', function(a, b) {
    return (parseInt(a) || 0) >= (parseInt(b) || 0);
  });

  // Less than or equal
  Handlebars.registerHelper('lte', function(a, b) {
    return (parseInt(a) || 0) <= (parseInt(b) || 0);
  });

  // Greater than
  Handlebars.registerHelper('gt', function(a, b) {
    return (parseInt(a) || 0) > (parseInt(b) || 0);
  });

  // Less than
  Handlebars.registerHelper('lt', function(a, b) {
    return (parseInt(a) || 0) < (parseInt(b) || 0);
  });

  // Equal to
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  // Not equal to
  Handlebars.registerHelper('neq', function(a, b) {
    return a !== b;
  });

  // Title case a string
  Handlebars.registerHelper('titleCase', function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });

  // Capitalize a string
  Handlebars.registerHelper('capitalize', function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Lowercase a string
  Handlebars.registerHelper('lowercase', function(str) {
    if (!str) return '';
    return str.toLowerCase();
  });

  // Uppercase a string
  Handlebars.registerHelper('uppercase', function(str) {
    if (!str) return '';
    return str.toUpperCase();
  });

  // Check if a value is empty/null/undefined
  Handlebars.registerHelper('isEmpty', function(value) {
    return !value || value === '' || (Array.isArray(value) && value.length === 0);
  });

  // Check if a value is not empty
  Handlebars.registerHelper('isNotEmpty', function(value) {
    return value && value !== '' && (!Array.isArray(value) || value.length > 0);
  });

  // Get object keys
  Handlebars.registerHelper('keys', function(obj) {
    if (!obj) return [];
    return Object.keys(obj);
  });

  // Get object values
  Handlebars.registerHelper('values', function(obj) {
    if (!obj) return [];
    return Object.values(obj);
  });

  // JSON stringify helper
  Handlebars.registerHelper('json', function(obj) {
    return JSON.stringify(obj);
  });

  // Conditional helper for OR operations
  Handlebars.registerHelper('or', function(a, b, options) {
    if (arguments.length < 3) return a || b;
    return (a || b) ? (options.fn ? options.fn(this) : true) : (options.inverse ? options.inverse(this) : false);
  });

  // Conditional helper for AND operations
  Handlebars.registerHelper('and', function(a, b, options) {
    if (arguments.length < 3) return a && b;
    return (a && b) ? (options.fn ? options.fn(this) : true) : (options.inverse ? options.inverse(this) : false);
  });

  // Format numbers with specific decimal places
  Handlebars.registerHelper('decimal', function(num, places) {
    const number = parseFloat(num) || 0;
    const decimalPlaces = parseInt(places) || 0;
    return number.toFixed(decimalPlaces);
  });

  // Get array length
  Handlebars.registerHelper('length', function(array) {
    if (!Array.isArray(array)) return 0;
    return array.length;
  });

  // Get array item at index
  Handlebars.registerHelper('at', function(array, index) {
    if (!Array.isArray(array)) return null;
    return array[parseInt(index)] || null;
  });

  // Join array with separator
  Handlebars.registerHelper('join', function(array, separator) {
    if (!Array.isArray(array)) return '';
    return array.join(separator || ', ');
  });

  // Blue Planet specific helpers

  // Get strain points based on attribute rank
  Handlebars.registerHelper('strainPoints', function(rank) {
    const r = parseInt(rank) || 0;
    if (r <= 0) return 1;
    if (r <= 2) return 2;
    if (r <= 4) return 3;
    if (r <= 8) return 4;
    if (r <= 12) return 5;
    return 6;
  });

  // Get reputation level text
  Handlebars.registerHelper('reputationLevel', function(level) {
    const l = parseInt(level) || 0;
    if (l < 6) return 'Unknown';
    if (l < 11) return 'Rumored';
    if (l < 16) return 'Notable';
    if (l < 21) return '(In)famous';
    return 'Renowned';
  });

  // Get skill level text and dice
  Handlebars.registerHelper('skillLevel', function(skill) {
    if (!skill) return { level: 'General', dice: '1d10' };
    
    if (skill.specialty) {
      return { level: 'Specialty', dice: '3d10' };
    } else if (skill.core) {
      return { level: 'Core', dice: '2d10' };
    } else {
      return { level: 'General', dice: '1d10' };
    }
  });

  // Calculate wound penalty
  Handlebars.registerHelper('woundPenalty', function(wounds) {
    if (!wounds) return 0;
    const minor = parseInt(wounds.minor) || 0;
    const major = parseInt(wounds.major) || 0;
    const mortal = parseInt(wounds.mortal) || 0;
    return -(minor + (major * 2) + (mortal * 3));
  });

  // Get dice count for skill level
  Handlebars.registerHelper('skillDice', function(skill) {
    if (!skill) return 1;
    if (skill.specialty) return 3;
    if (skill.core) return 2;
    return 1;
  });

  // Format attribute with dual values
  Handlebars.registerHelper('formatAttribute', function(attr, showDual = false) {
    if (!attr) return '0';
    if (showDual && attr.dual !== undefined && attr.dual !== attr.value) {
      return `${attr.value}/${attr.dual}`;
    }
    return attr.value.toString();
  });

  // Check if attribute has dual values
  Handlebars.registerHelper('hasDual', function(attr) {
    return attr && attr.dual !== undefined && attr.dual !== attr.value;
  });

  // Generate pip array for checkboxes
  Handlebars.registerHelper('pips', function(current, max, options) {
    const result = [];
    const curr = parseInt(current) || 0;
    const maximum = parseInt(max) || 0;
    
    for (let i = 1; i <= maximum; i++) {
      result.push({
        value: i,
        checked: i <= curr,
        index: i - 1
      });
    }
    
    return result;
  });

  // Format species name
  Handlebars.registerHelper('formatSpecies', function(species) {
    if (!species) return 'Human';
    return species.charAt(0).toUpperCase() + species.slice(1).toLowerCase();
  });

  // Get tier display name
  Handlebars.registerHelper('formatTier', function(tier) {
    if (!tier) return 'Everyday';
    return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  });

  // Check if item type matches
  Handlebars.registerHelper('isType', function(item, type) {
    return item && item.type === type;
  });

  // Get item rarity color class
  Handlebars.registerHelper('rarityClass', function(rarity) {
    if (!rarity) return 'common';
    return rarity.toLowerCase().replace(/\s+/g, '-');
  });

  // Format currency
  Handlebars.registerHelper('currency', function(amount) {
    const num = parseInt(amount) || 0;
    return num.toLocaleString() + 'cs';
  });

  // Get attribute modifier for display
  Handlebars.registerHelper('attributeModifier', function(value) {
    const val = parseInt(value) || 0;
    return val >= 0 ? `+${val}` : val.toString();
  });

  // Safe array access
  Handlebars.registerHelper('safeGet', function(obj, path, defaultValue = '') {
    if (!obj) return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  });
}
