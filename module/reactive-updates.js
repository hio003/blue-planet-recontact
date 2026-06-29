/**
 * Global Reactive Update System for Blue Planet Recontact
 * Handles real-time updates across all UI elements when items change
 */

/**
 * Initialize the reactive update system
 */
export function initializeReactiveUpdates() {
  console.log('BluePlanet Reactive: Initializing global reactive update system');
  
  // Hook into Foundry's update cycle
  Hooks.on('bluePlanet.weaponUpdated', handleWeaponUpdate);
  
  // Hook into general item updates
  Hooks.on('updateItem', handleItemUpdate);
  
  // Listen for custom weapon field updates
  $(document).on('weaponFieldUpdated', handleWeaponFieldUpdate);
  
  // Setup periodic cache cleaning
  setupCacheCleaning();
  
  console.log('BluePlanet Reactive: Global reactive update system initialized');
}

/**
 * Handle weapon-specific updates
 * @param {Object} data - Update event data
 */
function handleWeaponUpdate(data) {
  console.log('BluePlanet Reactive: Weapon update received', data);
  
  const { weapon, changedProperties, previousValues, currentValues } = data;
  
  // Update all open dialog windows that might reference this weapon
  updateOpenDialogs(weapon, changedProperties);
  
  // Update any character sheets displaying this weapon
  updateCharacterSheetsWithWeapon(weapon);
  
  // Update recent chat messages
  updateRecentChatMessages(weapon, changedProperties);
  
  // Show notification if significant changes occurred
  if (changedProperties.includes('damage') || changedProperties.includes('effective_range')) {
    showUpdateNotification(weapon, changedProperties, currentValues);
  }
}

/**
 * Handle general item updates
 * @param {Item} item - The updated item
 * @param {Object} change - The change data
 * @param {Object} options - Update options
 * @param {string} userId - The user who made the change
 */
function handleItemUpdate(item, change, options, userId) {
  // Only handle weapons for now
  if (item.type !== 'weapon') return;
  
  console.log('BluePlanet Reactive: Item update received for weapon', item.name);
  
  // Force refresh of any open weapon sheets
  refreshOpenItemSheets(item);
  
  // Clear any cached data related to this weapon
  clearWeaponCache(item);
}

/**
 * Handle weapon field updates from the sheet
 * @param {Event} event - The custom event
 * @param {Object} data - Event data
 */
function handleWeaponFieldUpdate(event, data) {
  console.log('BluePlanet Reactive: Weapon field update received', data);
  
  const { weapon, field, value } = data;
  
  // Update any open dialogs immediately
  updateDialogFields(weapon, field, value);
  
  // Show a subtle notification for the update
  showFieldUpdateFeedback(field, value);
}

/**
 * Update open dialogs that reference the weapon
 * @param {Item} weapon - The weapon that was updated
 * @param {Array} changedProperties - Properties that changed
 */
function updateOpenDialogs(weapon, changedProperties) {
  Object.values(ui.windows).forEach(app => {
    // Check if it's a weapon-related dialog
    if (app.title && app.title.includes(weapon.name)) {
      console.log(`BluePlanet Reactive: Updating dialog "${app.title}" for weapon changes`);
      
      // For damage dialogs, update the damage rating display
      if (changedProperties.includes('damage')) {
        const damageElements = app.element?.find('[data-weapon-damage], .damage-rating, #final-damage-rating');
        if (damageElements?.length > 0) {
          damageElements.each(function() {
            const element = $(this);
            const newValue = weapon.system.damage;
            
            // Update the text content
            if (element.text().match(/\d+/)) {
              element.text(element.text().replace(/\d+/, newValue));
            }
            
            // Add visual feedback
            element.addClass('value-updated');
            setTimeout(() => element.removeClass('value-updated'), 1000);
          });
        }
      }
      
      // For range updates
      if (changedProperties.includes('effective_range')) {
        const rangeElements = app.element?.find('[data-weapon-range], .effective-range');
        if (rangeElements?.length > 0) {
          rangeElements.each(function() {
            const element = $(this);
            const newValue = weapon.system.effective_range;
            
            if (element.text().match(/\d+/)) {
              element.text(element.text().replace(/\d+/, `${newValue}`));
            }
            
            element.addClass('value-updated');
            setTimeout(() => element.removeClass('value-updated'), 1000);
          });
        }
      }
    }
  });
}

/**
 * Update character sheets that contain this weapon
 * @param {Item} weapon - The weapon that was updated
 */
function updateCharacterSheetsWithWeapon(weapon) {
  if (!weapon.actor) return;
  
  Object.values(ui.windows).forEach(app => {
    if (app.actor?.id === weapon.actor.id) {
      console.log(`BluePlanet Reactive: Refreshing character sheet for ${weapon.actor.name}`);
      
      // Use a gentle refresh that doesn't reset scroll position
      setTimeout(() => {
        app.render(false);
      }, 100);
    }
  });
}

/**
 * Update recent chat messages that reference this weapon
 * @param {Item} weapon - The weapon that was updated
 * @param {Array} changedProperties - Properties that changed
 */
function updateRecentChatMessages(weapon, changedProperties) {
  const recentMessages = game.messages.contents.slice(-10);
  
  recentMessages.forEach(message => {
    const flags = message.flags?.['blue-planet-recontact'];
    
    if (flags?.weaponName === weapon.name && 
        (flags.rollType === 'weapon-attack' || flags.rollType === 'weapon-damage')) {
      
      console.log(`BluePlanet Reactive: Found related message for ${weapon.name}`);
      
      // Add a subtle update indicator to the message
      addMessageUpdateIndicator(message, weapon, changedProperties);
    }
  });
}

/**
 * Show a notification for weapon updates
 * @param {Item} weapon - The weapon that was updated
 * @param {Array} changedProperties - Properties that changed
 * @param {Object} currentValues - Current values
 */
function showUpdateNotification(weapon, changedProperties, currentValues) {
  const changes = changedProperties.map(prop => {
    switch (prop) {
      case 'damage':
        return `Damage: ${currentValues.damage}`;
      case 'effective_range':
        return `Range: ${currentValues.effective_range}m`;
      case 'magazine_capacity':
        return `Capacity: ${currentValues.magazine_capacity}`;
      case 'current_ammo':
        return `Ammo: ${currentValues.current_ammo}`;
      default:
        return prop;
    }
  }).join(', ');
  
  ui.notifications.info(`${weapon.name} updated: ${changes}`, {
    console: false,
    permanent: false
  });
}

/**
 * Show field update feedback
 * @param {string} field - The field that was updated
 * @param {*} value - The new value
 */
function showFieldUpdateFeedback(field, value) {
  const fieldName = field.replace('system.', '').replace('_', ' ');
  
  // Create a small toast notification
  const toast = $(`
    <div class="field-update-toast" style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(40, 167, 69, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      animation: slideInRight 0.3s ease;
    ">
      <i class="fas fa-check"></i> ${fieldName}: ${value}
    </div>
  `);
  
  $('body').append(toast);
  
  setTimeout(() => {
    toast.fadeOut(300, () => toast.remove());
  }, 2000);
  
  // Add CSS for animation if not exists
  if (!document.getElementById('reactive-toast-styles')) {
    const styles = document.createElement('style');
    styles.id = 'reactive-toast-styles';
    styles.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}

/**
 * Update dialog fields with new values
 * @param {Item} weapon - The weapon
 * @param {string} field - The field name
 * @param {*} value - The new value
 */
function updateDialogFields(weapon, field, value) {
  Object.values(ui.windows).forEach(app => {
    if (app.title && app.title.includes(weapon.name)) {
      const fieldSelector = `input[name="${field}"], [data-field="${field}"]`;
      const elements = app.element?.find(fieldSelector);
      
      if (elements?.length > 0) {
        elements.val(value).trigger('change');
        console.log(`BluePlanet Reactive: Updated field ${field} in dialog`);
      }
    }
  });
}

/**
 * Refresh open item sheets for a specific item
 * @param {Item} item - The item to refresh
 */
function refreshOpenItemSheets(item) {
  Object.values(ui.windows).forEach(app => {
    if (app instanceof foundry.appv1.sheets.ItemSheet && app.item?.id === item.id) {
      console.log(`BluePlanet Reactive: Refreshing item sheet for ${item.name}`);
      
      // Use a delayed render to avoid conflicts
      setTimeout(() => {
        app.render(false);
      }, 50);
    }
  });
}

/**
 * Clear weapon-related caches
 * @param {Item} weapon - The weapon to clear cache for
 */
function clearWeaponCache(weapon) {
  // Clear any cached data that might be stale
  if (weapon.actor) {
    // Force recalculation of derived data
    weapon.actor.prepareData();
  }
  
  // Clear template caches if they exist
  if (globalThis.templateCache) {
    delete globalThis.templateCache[weapon.id];
  }
  
  console.log(`BluePlanet Reactive: Cleared cache for weapon ${weapon.name}`);
}

/**
 * Add update indicator to chat message
 * @param {ChatMessage} message - The message to update
 * @param {Item} weapon - The weapon
 * @param {Array} changedProperties - Changed properties
 */
async function addMessageUpdateIndicator(message, weapon, changedProperties) {
  // Check if we already added an indicator
  const content = message.content || message.flavor || '';
  if (content.includes('weapon-update-indicator')) {
    return;
  }
  
  const updateText = changedProperties.includes('damage') 
    ? `Damage updated to ${weapon.system.damage}` 
    : `Weapon updated`;
  
  const indicator = `
    <div class="weapon-update-indicator" style="
      background: rgba(255, 193, 7, 0.1);
      border-left: 3px solid #ffc107;
      padding: 4px 8px;
      margin: 4px 0;
      font-size: 10px;
      color: #856404;
      border-radius: 0 4px 4px 0;
    ">
      <i class="fas fa-sync-alt"></i> ${updateText}
    </div>
  `;
  
  try {
    await message.update({
      flavor: (message.flavor || '') + indicator
    });
  } catch (error) {
    console.warn('BluePlanet Reactive: Could not update message with indicator:', error);
  }
}

/**
 * Setup periodic cache cleaning
 */
function setupCacheCleaning() {
  // Clean caches every 5 minutes
  setInterval(() => {
    console.log('BluePlanet Reactive: Performing periodic cache cleanup');
    
    // Remove old update indicators from chat
    cleanupOldUpdateIndicators();
    
    // Clear any stale template caches
    if (globalThis.templateCache) {
      const cacheSize = Object.keys(globalThis.templateCache).length;
      if (cacheSize > 100) {
        globalThis.templateCache = {};
        console.log('BluePlanet Reactive: Cleared template cache');
      }
    }
    
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Clean up old update indicators from chat messages
 */
function cleanupOldUpdateIndicators() {
  const messages = game.messages.contents.slice(-50);
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  messages.forEach(message => {
    if (message.timestamp < oneHourAgo && 
        (message.content?.includes('weapon-update-indicator') || 
         message.flavor?.includes('weapon-update-indicator'))) {
      
      // Remove the indicator from old messages
      const cleanFlavor = (message.flavor || '').replace(/<div class="weapon-update-indicator"[^>]*>.*?<\/div>/g, '');
      
      if (cleanFlavor !== message.flavor) {
        message.update({ flavor: cleanFlavor }).catch(() => {
          // Ignore errors for messages we can't update
        });
      }
    }
  });
}

// Add CSS for update effects
Hooks.once('ready', () => {
  if (!document.getElementById('reactive-update-styles')) {
    const styles = document.createElement('style');
    styles.id = 'reactive-update-styles';
    styles.textContent = `
      .value-updated {
        background: rgba(40, 167, 69, 0.2) !important;
        transition: background 0.5s ease;
      }
      
      .weapon-update-indicator {
        animation: slideInLeft 0.3s ease;
      }
      
      @keyframes slideInLeft {
        from {
          transform: translateX(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(styles);
  }
});