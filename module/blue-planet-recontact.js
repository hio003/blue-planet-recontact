/**
 * Blue Planet 3e: Recontact System
 * A Foundry VTT system for Blue Planet Third Edition
 */

// Import modules
import { BluePlanetActor } from "./actor/actor.js";
import { BluePlanetActorSheet } from "./actor/actor-sheet.js";
import { BluePlanetCreatureSheet } from "./actor/creature-sheet.js";
import { BluePlanetItem } from "./item/item.js";
import { BluePlanetItemSheet } from "./item/item-sheet.js";
import { BluePlanetWeaponSheet } from "./sheets/item-weapon-sheet.js";
import { BluePlanetEquipmentSheet } from "./sheets/item-equipment-sheet.js";
import { BluePlanetBiomodSheet } from "./sheets/item-biomod-sheet.js";
import { BluePlanetSkillSheet } from "./sheets/item-skill-sheet.js";
import { BluePlanetAmmoTypeSheet } from "./sheets/item-ammo_type-sheet.js";
import { BluePlanetSensorSheet } from "./sheets/item-sensor-sheet.js";
import { BluePlanetFeatureSheet } from "./sheets/item-feature-sheet.js";
import { BluePlanetRollCard } from "./roll-card.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { registerHandlebarsHelpers } from "./helpers.js";
// Note: chat-utils import removed as automatic scrolling is disabled
import "./chat-layout-fixer.js";

// Initialize system
Hooks.once('init', async function() {

  game.blueplanet = {
    BluePlanetActor,
    BluePlanetItem,
    BluePlanetRollCard,
    rollItemMacro: rollItemMacro,
    showRollCard: BluePlanetRollCard.show
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = BluePlanetActor;
  CONFIG.Item.documentClass = BluePlanetItem;

  // Register sheet application classes
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("blue-planet-recontact", BluePlanetActorSheet, {
    types: ["character", "npc", "cetacean"],
    makeDefault: true,
    label: "Blue Planet Character Sheet (Popout)"
  });
  foundry.documents.collections.Actors.registerSheet("blue-planet-recontact", BluePlanetCreatureSheet, {
    types: ["creature"],
    makeDefault: true
  });

  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  
  // Register specific item sheets for different types
  foundry.documents.collections.Items.registerSheet("blue-planet-recontact", BluePlanetWeaponSheet, {
    types: ["weapon"],
    makeDefault: true
  });
  foundry.documents.collections.Items.registerSheet("blue-planet-recontact", BluePlanetEquipmentSheet, {
    types: ["equipment"],
    makeDefault: true
  });
  foundry.documents.collections.Items.registerSheet("blue-planet-recontact", BluePlanetBiomodSheet, {
    types: ["biomod"],
    makeDefault: true
  });
  
  // Register skill sheet
  foundry.documents.collections.Items.registerSheet("blue-planet-recontact", BluePlanetSkillSheet, {
    types: ["skill"],
    makeDefault: true
  });
  
  // Register ammo type sheet
  foundry.documents.collections.Items.registerSheet("blue-planet-recontact", BluePlanetAmmoTypeSheet, {
    types: ["ammo_type"],
    makeDefault: true
  });
  
  // Register sensor sheet
  foundry.documents.collections.Items.registerSheet("blue-planet-recontact", BluePlanetSensorSheet, {
    types: ["sensor"],
    makeDefault: true
  });
  
  // Register feature sheet
  foundry.documents.collections.Items.registerSheet("blue-planet-recontact", BluePlanetFeatureSheet, {
    types: ["feature"],
    makeDefault: true
  });
  
  // Register generic item sheet for other types
  foundry.documents.collections.Items.registerSheet("blue-planet-recontact", BluePlanetItemSheet, {
    types: ["species"],
    makeDefault: true
  });

  // Register Handlebars helpers
  registerHandlebarsHelpers();
  
  // Preload Handlebars templates
  return preloadHandlebarsTemplates();
});

// Function declarations for scene controls

// Setup system
Hooks.once("ready", async function() {
  // Inject CSS to force dialog sizing immediately
  const forceDialogCSS = document.createElement('style');
  forceDialogCSS.id = 'blue-planet-force-dialog-size';
  forceDialogCSS.textContent = `
    /* Force Blue Planet dialog sizing */
    .blue-planet-recontact.sheet.dialog,
    .dialog.blue-planet-recontact.sheet,
    .window-app.dialog.blue-planet-recontact.sheet {
      width: 330px !important;
      height: 300px !important;
      max-width: 330px !important;
      max-height: 300px !important;
      min-width: 330px !important;
      min-height: 300px !important;
      resize: none !important;
    }
  `;
  document.head.appendChild(forceDialogCSS);
  console.log('Blue Planet: Injected force dialog CSS');
  
  // The chat layout fixer will handle this automatically via chat-layout-fixer.js
  // No need for duplicate code here
  
  // Chat layout is handled automatically by chat-layout-fixer.js
  
  // Initialize damage accordion functionality globally
  $(document).on('click', '.damage-accordion-header', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const header = $(this);
    const arrow = header.find('.accordion-arrow');
    const targetId = header.data('target');
    
    // Find content within the same parent container
    let content = $(`#${targetId}`);
    
    // If not found by ID, look in the same accordion container
    if (content.length === 0) {
      const accordionContainer = header.parent();
      content = accordionContainer.find('.damage-accordion-content').first();
    }
    
    console.log('BluePlanet: Accordion clicked - Target:', targetId);
    console.log('BluePlanet: Content found:', content.length, 'visible:', content.is(':visible'));
    
    if (content.length === 0) {
      console.warn('BluePlanet: No accordion content found for:', targetId);
      return;
    }
    
    // Toggle visibility with animation
    if (content.is(':visible')) {
      // Close accordion
      content.slideUp(200);
      arrow.css('transform', 'rotate(0deg)');
      console.log('BluePlanet: Accordion closed');
    } else {
      // Open accordion  
      content.slideDown(200);
      arrow.css('transform', 'rotate(90deg)');
      console.log('BluePlanet: Accordion opened');
    }
  });
  
  // Initialize damage roll button functionality globally
  $(document).on('click', '.damage-roll-button', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = $(this);
    const weaponId = button.data('weapon-id');
    const actorId = button.data('actor-id');
    
    console.log('BluePlanet: Damage roll button clicked - Weapon:', weaponId, 'Actor:', actorId);
    
    // Get actor and weapon
    const actor = game.actors.get(actorId);
    const weapon = actor?.items?.get(weaponId);
    
    if (!actor || !weapon) {
      ui.notifications.warn('Actor or weapon not found for damage roll.');
      return;
    }
    
    // Call the weapon damage roll method directly
    try {
      await weapon.rollWeaponDamage(weapon.system);
      console.log('BluePlanet: Damage roll executed successfully');
    } catch (error) {
      console.error('BluePlanet: Error executing damage roll:', error);
      ui.notifications.error('Error executing damage roll. Check console for details.');
    }
  });
  
  console.log('BluePlanet: Global damage accordion and roll button handlers initialized');
  
  // Notify users about the new scene controls
  ui.notifications.info('Blue Planet: Roll tools moved to Scene Controls! Look for the water icon (🌊) in the toolbar.', { permanent: false });
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
  
  // Auto-open character sheet when a new actor is created
  Hooks.on("createActor", (actor, options, userId) => {
    // Only auto-open for the user who created the actor
    if (userId === game.user.id) {
      // Small delay to ensure the actor is fully created before opening sheet
      setTimeout(() => {
        // Force independent popout window with flexible positioning
        actor.sheet.render(true, {
          popOut: true,
          editable: true,
          // Random initial position to avoid overlap
          top: 80 + Math.random() * 200,
          left: 200 + Math.random() * 300
        });
        console.log(`Blue Planet: Auto-opened character sheet for ${actor.name} in independent window`);
      }, 100);
    }
  });
  
  // Force all Blue Planet actor sheets to open as independent popout windows
  Hooks.on("preRenderActorSheet", (app, html, data) => {
    // Ensure the sheet always renders as an independent popout window
    if (app.constructor.name === "BluePlanetActorSheet") {
      app.options.popOut = true;
      app.options.resizable = true;
      app.options.minimizable = true;
      app.options.renderContext = "popout";
      app.options.renderMode = "popout";
      
      // Set default position if not already set, but allow dragging
      if (!app.options.top) app.options.top = 80 + Math.random() * 200;
      if (!app.options.left) app.options.left = 200 + Math.random() * 300;
    }
  });
  
  // Intercept sidebar sheet renders and redirect to popout
  Hooks.on("renderActorSheet", (app, html, data) => {
    try {
      // Check if this is a Blue Planet sheet trying to render in sidebar
      if (app.constructor.name === "BluePlanetActorSheet") {
        // Ensure html is a jQuery object
        const $html = html.jquery ? html : $(html);
        const isInSidebar = $html.closest('#sidebar').length > 0;
        
        if (isInSidebar) {
          // Close the sidebar version immediately
          app.close();
          
          // Open as proper popout window with random positioning
          setTimeout(() => {
            const popoutApp = new BluePlanetActorSheet(app.actor, {
              popOut: true,
              width: 900,
              height: 700,
              left: 200 + Math.random() * 300,
              top: 80 + Math.random() * 200,
              resizable: true,
              minimizable: true
            });
            popoutApp.render(true);
          }, 100);
        }
      }
    } catch (error) {
      console.warn('Blue Planet: Error in renderActorSheet hook:', error);
    }
  });
  
  // Override actor double-click to always open popout for Blue Planet actors
  Hooks.on("renderActorDirectory", (app, html, data) => {
    try {
      // Ensure html is a jQuery object
      const $html = html.jquery ? html : $(html);
      
      // Find all Blue Planet actors in the directory
      $html.find('.document').each(function() {
        const li = $(this);
        const actorId = li.data('document-id');
        const actor = game.actors.get(actorId);
        
        if (actor && actor.system) {
          // Override double-click behavior
          li.off('dblclick').on('dblclick', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Create new popout window with random positioning
            const sheet = new BluePlanetActorSheet(actor, {
              popOut: true,
              width: 900,
              height: 700,
              left: 200 + Math.random() * 300,
              top: 80 + Math.random() * 200,
              resizable: true,
              minimizable: true
            });
            sheet.render(true);
          });
        }
      });
    } catch (error) {
      console.warn('Blue Planet: Error in renderActorDirectory hook:', error);
    }
  });
  
  // Note: Automatic chat scrolling disabled to allow natural chat behavior
  // Messages will now scroll naturally like standard Foundry chat messages
  
  // Register enhanced Blue Planet scene controls
  Hooks.on("getSceneControlButtons", (controls) => {
    try {
      // Ensure controls is an array
      if (!Array.isArray(controls)) {
        console.warn('Blue Planet: controls parameter is not an array:', typeof controls);
        return;
      }
      
      // Add Blue Planet control group
      const bluePlanetControls = {
        name: "blueplanet",
        title: "Blue Planet Tools", 
        icon: "fas fa-water",
        layer: "blueplanet",
        tools: [
          {
            name: "roll-card",
            title: "Open Blue Planet Roll Card",
            icon: "fas fa-dice-d10", 
            button: true,
            onClick: () => {
              const controlled = canvas.tokens.controlled;
              const actor = controlled.length > 0 ? controlled[0].actor : null;
              if (globalThis.BluePlanetRollCard) {
                BluePlanetRollCard.show(actor);
              } else {
                ui.notifications.warn('Roll card not available');
              }
            }
          },
          {
            name: "quick-skill-roll",
            title: "Quick Skill Test",
            icon: "fas fa-dice",
            button: true,
            onClick: () => window.openQuickSkillDialog()
          },
          {
            name: "quick-attribute-roll", 
            title: "Quick Attribute Test",
            icon: "fas fa-dice-d6",
            button: true,
            onClick: () => window.openQuickAttributeDialog()
          },
          {
            name: "quick-damage-roll",
            title: "Quick Damage Test", 
            icon: "fas fa-heart-broken",
            button: true,
            onClick: () => window.openQuickDamageDialog()
          },
          {
            name: "general-roll",
            title: "General Roll (1d10)",
            icon: "fas fa-dice-one",
            button: true,
            onClick: () => window.executeQuickRoll('1d10', 'General Roll')
          },
          {
            name: "core-roll",
            title: "Core Roll (2d10, keep lowest)",
            icon: "fas fa-dice-two", 
            button: true,
            onClick: () => window.executeQuickRoll('2d10kl', 'Core Skill Roll')
          },
          {
            name: "specialty-roll",
            title: "Specialty Roll (3d10, keep lowest)",
            icon: "fas fa-dice-three",
            button: true,
            onClick: () => window.executeQuickRoll('3d10kl', 'Specialty Skill Roll')
          }
        ]
      };
      
      controls.push(bluePlanetControls);
      console.log('Blue Planet: Scene controls added successfully');
    } catch (error) {
      console.error('Blue Planet: Error adding scene controls:', error);
    }
  });
  
  // Scene control helper functions
  window.openQuickSkillDialog = function() {
    const controlled = canvas.tokens.controlled;
    const actor = controlled.length > 0 ? controlled[0].actor : game.user.character;
    
    if (!actor) {
      ui.notifications.warn('No character selected. Please select a token or assign a character.');
      return;
    }
    
    const skills = Object.keys(actor.system.skills || {});
    const attributes = Object.keys(actor.system.attributes || {});
    
    if (skills.length === 0) {
      ui.notifications.warn('Selected character has no skills.');
      return;
    }
    
    const content = `
      <form>
        <div class="form-group">
          <label>Character:</label>
          <p><strong>${actor.name}</strong></p>
        </div>
        <div class="form-group">
          <label>Skill:</label>
          <select name="skill">
            ${skills.map(skill => `<option value="${skill}">${skill}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Attribute:</label>
          <select name="attribute">
            ${attributes.map(attr => `<option value="${attr}">${attr.charAt(0).toUpperCase() + attr.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Modifiers:</label>
          <input type="number" name="modifiers" value="0" step="1" />
        </div>
      </form>
    `;
    
    new Dialog({
      title: "Blue Planet - Quick Skill Test",
      content: content,
      buttons: {
        roll: {
          label: "<i class='fas fa-dice'></i> Roll",
          callback: html => {
            const form = html[0].querySelector("form");
            const skillName = form.skill.value;
            const attributeName = form.attribute.value;
            const modifiers = parseInt(form.modifiers.value) || 0;
            
            if (globalThis.blueplanet?.rollSkillTest) {
              globalThis.blueplanet.rollSkillTest(actor, skillName, attributeName, { modifiers });
            } else if (actor.rollSkill) {
              actor.rollSkill(skillName, attributeName, { modifiers });
            } else {
              ui.notifications.error("Roll system not available");
            }
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "roll"
    }, { 
      width: 400,
      classes: ["blue-planet-dialog"],
      resizable: true
    }).render(true);
  };
  
  window.openQuickAttributeDialog = function() {
    const controlled = canvas.tokens.controlled;
    const actor = controlled.length > 0 ? controlled[0].actor : game.user.character;
    
    if (!actor) {
      ui.notifications.warn('No character selected. Please select a token or assign a character.');
      return;
    }
    
    const attributes = Object.keys(actor.system.attributes || {});
    
    const content = `
      <form>
        <div class="form-group">
          <label>Character:</label>
          <p><strong>${actor.name}</strong></p>
        </div>
        <div class="form-group">
          <label>Attribute:</label>
          <select name="attribute">
            ${attributes.map(attr => `<option value="${attr}">${attr.charAt(0).toUpperCase() + attr.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Use Focus:</label>
          <input type="checkbox" name="use-focus" />
          <small>+1 to attribute value</small>
        </div>
        <div class="form-group">
          <label>Modifiers:</label>
          <input type="number" name="modifiers" value="0" step="1" />
        </div>
      </form>
    `;
    
    new Dialog({
      title: "Blue Planet - Quick Attribute Test",
      content: content,
      buttons: {
        roll: {
          label: "<i class='fas fa-dice-d6'></i> Roll",
          callback: html => {
            const form = html[0].querySelector("form");
            const attributeName = form.attribute.value;
            const useFocus = form['use-focus'].checked;
            const modifiers = parseInt(form.modifiers.value) || 0;
            
            if (globalThis.blueplanet?.rollAttributeTest) {
              globalThis.blueplanet.rollAttributeTest(actor, attributeName, { useFocus, modifiers });
            } else if (actor.rollAttribute) {
              actor.rollAttribute(attributeName, { useFocus, modifiers });
            } else {
              ui.notifications.error("Roll system not available");
            }
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "roll"
    }, { 
      width: 400,
      classes: ["blue-planet-dialog"],
      resizable: true
    }).render(true);
  };
  
  window.openQuickDamageDialog = function() {
    const controlled = canvas.tokens.controlled;
    const actor = controlled.length > 0 ? controlled[0].actor : game.user.character;
    
    const content = `
      <form>
        <div class="form-group">
          <label>Damage Rating:</label>
          <input type="number" name="damage-rating" value="6" min="1" max="20" />
        </div>
        <div class="form-group">
          <label>Modifiers:</label>
          <input type="number" name="modifiers" value="0" step="1" />
        </div>
        <div class="form-group">
          <label>Description:</label>
          <input type="text" name="description" placeholder="Weapon or attack type" />
        </div>
      </form>
    `;
    
    new Dialog({
      title: "Blue Planet - Quick Damage Test",
      content: content,
      buttons: {
        roll: {
          label: "<i class='fas fa-heart-broken'></i> Roll",
          callback: html => {
            const form = html[0].querySelector("form");
            const damageRating = parseInt(form['damage-rating'].value) || 6;
            const modifiers = parseInt(form.modifiers.value) || 0;
            const description = form.description.value || 'Damage Test';
            const finalRating = Math.max(1, damageRating + modifiers);
            
            if (globalThis.blueplanet?.rollDamageTest) {
              globalThis.blueplanet.rollDamageTest(actor, finalRating, { description });
            } else if (actor && actor.rollDamage) {
              actor.rollDamage(finalRating, { description });
            } else {
              // Fallback direct roll
              const roll = new Roll('3d10');
              roll.evaluate().then(() => {
                let successes = 0;
                roll.terms[0].results.forEach(result => {
                  if (result.result <= finalRating) successes++;
                });
                
                let woundLevel = "No Wound";
                if (successes === 1) woundLevel = "Minor Wound";
                else if (successes === 2) woundLevel = "Major Wound";
                else if (successes === 3) woundLevel = "Mortal Wound";
                
                roll.toMessage({
                  speaker: ChatMessage.getSpeaker({actor: actor}),
                  flavor: `${description} - Rating ${finalRating} - ${woundLevel}`,
                  rollMode: game.settings.get("core", "rollMode")
                });
              });
            }
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "roll"
    }, { 
      width: 400,
      classes: ["blue-planet-dialog"],
      resizable: true
    }).render(true);
  };
  
  window.executeQuickRoll = function(formula, label) {
    const controlled = canvas.tokens.controlled;
    const actor = controlled.length > 0 ? controlled[0].actor : game.user.character;
    
    const roll = new Roll(formula);
    roll.evaluate().then(() => {
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({actor: actor}),
        flavor: label,
        rollMode: game.settings.get("core", "rollMode")
      });
    });
  };
});

// Chat layout fixes are now handled by chat-layout-fixer.js module

// Add any global helper functions
globalThis.blueplanet = {
  
  /**
   * Roll a skill test
   * @param {Object} actor - The actor making the roll
   * @param {string} skillName - Name of the skill being rolled
   * @param {string} attributeName - Name of the attribute being used
   * @param {Object} options - Additional roll options
   */
  rollSkillTest: async function(actor, skillName, attributeName, options = {}) {
    const skill = actor.system.skills[skillName];
    const attribute = actor.system.attributes[attributeName];
    
    if (!skill || !attribute) {
      ui.notifications.warn("Invalid skill or attribute specified");
      return;
    }

    const skillLevel = skill.specialty ? 3 : (skill.core ? 2 : 1);
    const targetNumber = skill.rank + attribute.value;
    
    const roll = new Roll(`{${skillLevel}d10}kl`, actor.getRollData());
    
    // Execute the roll
    await roll.evaluate();
    
    const success = roll.total <= targetNumber;
    const actionValue = success ? (targetNumber - roll.total) : (targetNumber - roll.total);
    
    // Create chat message
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: `${skillName} Test (${attributeName})`,
      rollMode: game.settings.get("core", "rollMode")
    });
    
    return {roll, success, actionValue, targetNumber};
  },

  /**
   * Roll an attribute test
   * @param {Object} actor - The actor making the roll
   * @param {string} attributeName - Name of the attribute being tested
   * @param {Object} options - Additional roll options
   */
  rollAttributeTest: async function(actor, attributeName, options = {}) {
    const attribute = actor.system.attributes[attributeName];
    
    if (!attribute) {
      ui.notifications.warn("Invalid attribute specified");
      return;
    }

    const targetNumber = 5 + attribute.value;
    
    const roll = new Roll("1d10", actor.getRollData());
    
    // Execute the roll
    await roll.evaluate();
    
    const success = roll.total <= targetNumber;
    const actionValue = success ? (targetNumber - roll.total) : (targetNumber - roll.total);
    
    // Create chat message
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Test`,
      rollMode: game.settings.get("core", "rollMode")
    });
    
    return {roll, success, actionValue, targetNumber};
  },

  /**
   * Roll a damage test
   * @param {Object} actor - The actor making the roll (optional)
   * @param {number} damageRating - The damage rating to test against
   * @param {Object} options - Additional roll options
   */
  rollDamageTest: async function(actor, damageRating, options = {}) {
    const roll = new Roll("3d10", actor?.getRollData() || {});
    
    // Execute the roll
    await roll.evaluate();
    
  // Count successes
  let successes = 0;
  roll.terms[0].results.forEach(result => {
    if (result.result <= damageRating) successes++;
  });
    
    let woundLevel = "No Wound";
    if (successes === 1) woundLevel = "Minor Wound";
    else if (successes === 2) woundLevel = "Major Wound";  
    else if (successes === 3) woundLevel = "Mortal Wound";
    
    // Create chat message
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: `Damage Test (Rating ${damageRating}) - ${woundLevel}`,
      rollMode: game.settings.get("core", "rollMode")
    });
    
    return {roll, successes, woundLevel, damageRating};
  }
};

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!data.uuid) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = await fromUuid(data.uuid);

  // Create the macro command
  const command = `game.blueplanet.rollItemMacro("${item.name}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "blue-planet-recontact.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.get(speaker.token);
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}
