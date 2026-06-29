/**
 * Blue Planet 3e: Recontact System
 * A Foundry VTT system for Blue Planet Third Edition
 */

// Import modules
import { BluePlanetActor } from "./actor/actor.js";
import { BluePlanetActorSheet } from "./actor/actor-sheet.js";
import { BluePlanetCetaceanSheet } from "./actor/cetacean-sheet.js";
import { BluePlanetNPCSheet } from "./actor/npc-sheet.js";
import { BluePlanetCreatureSheet } from "./actor/creature-sheet.js";
import { BluePlanetItem } from "./item/item.js";
import { BluePlanetItemSheet } from "./item/item-sheet.js";
import { BluePlanetWeaponSheet } from "./sheets/item-weapon-sheet.js";
import { BluePlanetEquipmentSheet } from "./sheets/item-equipment-sheet.js";
import { BluePlanetBiomodSheet } from "./sheets/item-biomod-sheet.js";
import { BluePlanetCyberwareSheet } from "./sheets/item-cyberware-sheet.js";
import { BluePlanetSkillSheet } from "./sheets/item-skill-sheet.js";
import { AmmunitionSheetBPR } from "./item/item-ammunition-sheet.mjs";
import { showWeaponDamageDialog } from "./weapon-damage-dialog.js";
import { initializeReactiveUpdates } from "./reactive-updates.js";
import { getWoundPenalty, getWoundSummary, applyWoundToTarget, showWoundConfirmationDialog } from "./wound-application.js";
import { AmmunitionBPR } from "./item/item-ammunition.mjs";
import { BluePlanetSensorSheet } from "./sheets/item-sensor-sheet.js";
import { BluePlanetFeatureSheet } from "./sheets/item-feature-sheet.js";
import { BluePlanetRollCard } from "./roll-card.js";
import { BluePlanetVehicleSheet } from "./actor/vehicle-sheet.js";
import { BluePlanetRemoteSheet } from "./actor/remote-sheet.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { registerHandlebarsHelpers } from "./helpers.js";
// Note: chat-utils import removed as automatic scrolling is disabled
import "./chat-layout-fixer.js";
import "./combat/initiative.js";
import { FoundryScrollFixes } from "./foundry-scroll-fixes.js";
import "./combat/combat-tracker-ui.js";
import "./combat/floating-combat-window.js";
// Floating encounter controls removed - using draggable tab controls instead
import "./combat/floating-window-button.js";
import "./combat/debug-drag.js";
// New modules
import { registerSpeciesMechanicsHooks } from "./species-mechanics.js";
import { showAdvancementDialog } from "./advancement-tracker.js";
import { registerEcholocationHooks, showEcholocationInfo } from "./cetacean-echolocation.js";
import { registerDialogThemeHooks } from "./bp-dialog-hooks.js";

// Initialize system
Hooks.once('init', async function() {

  game.blueplanet = {
    BluePlanetActor,
    BluePlanetItem,
    BluePlanetRollCard,
    AmmunitionBPR,
    rollItemMacro: rollItemMacro,
    showRollCard: BluePlanetRollCard.show,
    addBasicCombatSkills: addBasicCombatSkills,
    applyWoundToTarget: applyWoundToTarget,
    showWoundConfirmationDialog: showWoundConfirmationDialog,
    getWoundPenalty: getWoundPenalty,
    getWoundSummary: getWoundSummary,
    showAdvancementDialog: showAdvancementDialog,
    showEcholocationInfo: showEcholocationInfo,
    // Test function for debugging wound application
    testWoundApplication: async function() {
      console.log('BluePlanet: Testing wound application system...');
      
      // Get current targets
      const targets = Array.from(game.user.targets);
      if (targets.length === 0) {
        ui.notifications.warn('Please target a token first');
        return false;
      }
      
      const target = targets[0];
      const actor = target.actor;
      
      // Get controlled tokens (potential attackers)
      const controlled = canvas.tokens.controlled;
      const attacker = controlled.length > 0 ? controlled[0].actor : null;
      
      console.log('BluePlanet Test: Test scenario:', {
        targetTokenName: target.name,
        targetActorName: actor?.name,
        targetActorId: actor?.id,
        attackerTokenName: controlled[0]?.name,
        attackerActorName: attacker?.name,
        attackerActorId: attacker?.id,
        isSameActor: actor?.id === attacker?.id,
        hasWounds: !!actor?.system?.wounds,
        currentWounds: actor?.system?.wounds
      });
      
      if (!actor) {
        ui.notifications.error('Target token has no associated actor');
        return false;
      }
      
      if (actor?.id === attacker?.id) {
        ui.notifications.warn('Target and attacker are the same! This should NOT happen in real combat.');
        console.warn('BluePlanet Test: Same actor detected - this explains the self-inflicted wounds bug!');
      }
      
      // Test applying a minor wound
      try {
        const result = await applyWoundToTarget(actor, 'Minor Wound', {
          weaponName: 'Test Weapon',
          damageRating: 10,
          successes: 1,
          attackerName: attacker?.name || 'Test Attacker'
        });
        
        console.log('BluePlanet Test: Wound application result:', result);
        if (result) {
          ui.notifications.info(`Successfully applied test minor wound to ${actor.name}`);
        } else {
          ui.notifications.error(`Failed to apply test wound to ${actor.name}`);
        }
        return result;
      } catch (error) {
        console.error('BluePlanet Test: Error applying wound:', error);
        ui.notifications.error('Error during wound application test');
        return false;
      }
    }
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = BluePlanetActor;
  CONFIG.Item.documentClass = BluePlanetItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  
  // Register Character sheet
  Actors.registerSheet("blue-planet-recontact", BluePlanetActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "Blue Planet Character Sheet (Popout)"
  });
  
  // Register Cetacean sheet
  Actors.registerSheet("blue-planet-recontact", BluePlanetCetaceanSheet, {
    types: ["cetacean"],
    makeDefault: true,
    label: "Blue Planet Cetacean Sheet (Popout)"
  });
  
  // Register NPC sheet
  Actors.registerSheet("blue-planet-recontact", BluePlanetNPCSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "Blue Planet NPC Sheet (Popout)"
  });
  
  // Register Creature sheet
  Actors.registerSheet("blue-planet-recontact", BluePlanetCreatureSheet, {
    types: ["creature"],
    makeDefault: true,
    label: "Blue Planet Creature Sheet"
  });

  // Register Vehicle sheet
  Actors.registerSheet("blue-planet-recontact", BluePlanetVehicleSheet, {
    types: ["vehicle"],
    makeDefault: true,
    label: "Blue Planet Vehicle Sheet"
  });

  // Register Remote sheet
  Actors.registerSheet("blue-planet-recontact", BluePlanetRemoteSheet, {
    types: ["remote"],
    makeDefault: true,
    label: "Blue Planet Remote / CICADA Sheet"
  });

  Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  
  // Register specific item sheets for different types
  Items.registerSheet("blue-planet-recontact", BluePlanetWeaponSheet, {
    types: ["weapon"],
    makeDefault: true
  });
  Items.registerSheet("blue-planet-recontact", BluePlanetEquipmentSheet, {
    types: ["equipment"],
    makeDefault: true
  });
  Items.registerSheet("blue-planet-recontact", BluePlanetBiomodSheet, {
    types: ["biomod"],
    makeDefault: true
  });
  Items.registerSheet("blue-planet-recontact", BluePlanetCyberwareSheet, {
    types: ["cyberware"],
    makeDefault: true
  });
  
  // Register skill sheet
  Items.registerSheet("blue-planet-recontact", BluePlanetSkillSheet, {
    types: ["skill"],
    makeDefault: true
  });
  
  
  // Register ammunition sheet
  Items.registerSheet("blue-planet-recontact", AmmunitionSheetBPR, {
    types: ["ammunition"],
    makeDefault: true
  });
  
  // Register sensor sheet
  Items.registerSheet("blue-planet-recontact", BluePlanetSensorSheet, {
    types: ["sensor"],
    makeDefault: true
  });
  
  // Register feature sheet
  Items.registerSheet("blue-planet-recontact", BluePlanetFeatureSheet, {
    types: ["feature"],
    makeDefault: true
  });
  
  // Register generic item sheet for other types
  Items.registerSheet("blue-planet-recontact", BluePlanetItemSheet, {
    types: ["species"],
    makeDefault: true
  });

  // Register Handlebars helpers
  registerHandlebarsHelpers();
  
  // Register species mechanics hooks (auto-apply species modifiers on drop)
  registerSpeciesMechanicsHooks();
  
  // Register cetacean echolocation mechanics
  registerEcholocationHooks();

  // Register dialog theme hooks — aplica el esquema visual BP a todos los diálogos
  registerDialogThemeHooks();

  // Registrar setting de tema de fichas
  game.settings.register('blue-planet-recontact', 'defaultSheetTheme', {
    name: 'Default Sheet Theme',
    hint: 'Default visual theme for all Blue Planet character sheets.',
    scope: 'client',
    config: true,
    type: String,
    choices: {
      'blue-planet': 'Blue Planet (Oceanic)',
      'dark':        'Dark Theme'
    },
    default: 'blue-planet'
  });
  
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
  
  // Initialize damage roll button functionality globally with targeting support
  $(document).on('click', '.damage-roll-button', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = $(this);
    const weaponId = button.data('weapon-id');
    const actorId = button.data('actor-id');
    const calledShotBonus = parseInt(button.data('called-shot-bonus')) || 0;
    
    console.log('BluePlanet: Damage roll button clicked - Weapon:', weaponId, 'Actor:', actorId, 'Called Shot Bonus:', calledShotBonus);
    
    // Get actor and weapon
    const actor = game.actors.get(actorId);
    const weapon = actor?.items?.get(weaponId);
    
    if (!actor || !weapon) {
      ui.notifications.warn('Actor or weapon not found for damage roll.');
      return;
    }
    
    // Use the new enhanced damage dialog with automatic targeting
    try {
      showWeaponDamageDialog(actor, weapon, { calledShotBonus: calledShotBonus });
      console.log('BluePlanet: Enhanced damage dialog opened with targeting support');
    } catch (error) {
      console.error('BluePlanet: Error opening enhanced damage dialog:', error);
      // Fallback to old method if the new dialog fails
      try {
        await weapon.rollWeaponDamage(weapon.system, { calledShotBonus: calledShotBonus });
        console.log('BluePlanet: Fallback damage roll executed successfully');
      } catch (fallbackError) {
        console.error('BluePlanet: Fallback damage roll also failed:', fallbackError);
        ui.notifications.error('Error executing damage roll. Check console for details.');
      }
    }
  });
  
  console.log('BluePlanet: Global damage accordion and roll button handlers initialized');
  
  // Initialize the reactive update system
  initializeReactiveUpdates();
  
  // Set up global event listener for opposed test buttons (for all users)
  // Global state for auto-blind handling on clients
  if (!globalThis.BluePlanetAutoBlind) {
    globalThis.BluePlanetAutoBlind = {
      active: false,
      prevRollMode: null
    };
  }

  console.log('BluePlanet: Setting up global opposed test listener...');
  $(document).on('click.blueplanetOpposedTest', '.opposed-test-btn', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('BluePlanet: Opposed test button clicked!');
    
    const button = $(this);
    const actorId = button.data('actor-id');
    const actionValue = button.data('action-value');
    const gmPrivateRaw = button.data('gm-private');
    const isGMPrivate = gmPrivateRaw === true || gmPrivateRaw === 'true';
    
    // Get message ID from the chat message element
    const messageElement = button.closest('.chat-message');
    const messageId = messageElement.length > 0 ? messageElement[0].dataset.messageId : null;
    
    console.log('BluePlanet: Opposed Test button clicked - DEBUG DATA:');
    console.log('  - Actor ID:', actorId);
    console.log('  - Action Value:', actionValue);
    console.log('  - GM Private Raw:', gmPrivateRaw, '(type:', typeof gmPrivateRaw, ')');
    console.log('  - GM Private Processed:', isGMPrivate);
    console.log('  - Message ID:', messageId);
    console.log('  - Button HTML:', button[0].outerHTML);
    
    const targetActor = game.actors.get(actorId);
    if (!targetActor) {
      ui.notifications.error("Actor not found!");
      return;
    }
    
    // AUTO-CONVERT TO BLIND GM ROLL: Only when this is a GM roll request (not regular opposed tests)
    let originalRollMode = null;
    let rollModeChanged = false;
    
    // Only treat as GM roll request when flags explicitly mark it as such and it was private
    const messageFlags = game.messages.get(messageId)?.flags?.['blue-planet-recontact'];
    const isGMRollRequest = messageFlags?.rollType === 'gm-opposed-test-request' && messageFlags?.isGMPrivateOpposedTest === true;
    
    if (!game.user.isGM && isGMRollRequest) {
      // Store original roll mode and change to blindroll
      originalRollMode = game.settings.get('core', 'rollMode');
      await game.settings.set('core', 'rollMode', 'blindroll');
      rollModeChanged = true;

      // Persist client-side state to restore later on reveal
      globalThis.BluePlanetAutoBlind.active = true;
      globalThis.BluePlanetAutoBlind.prevRollMode = originalRollMode;

      // Try to reflect the change in the chat UI roll mode selector if present
      try {
        const rollModeSelect = ui?.chat?.element?.find('select[name="rollMode"]');
        if (rollModeSelect && rollModeSelect.length) {
          rollModeSelect.val('blindroll').trigger('change');
        }
        // Alternative UI (older/newer Foundry versions) — try generic select
        else {
          const genericSelect = $('select[name="rollMode"]');
          if (genericSelect && genericSelect.length) {
            genericSelect.val('blindroll').trigger('change');
          }
        }
      } catch (uiErr) {
        console.warn('BluePlanet: Could not update roll mode UI select:', uiErr);
      }
      
      console.log('BluePlanet: GM Private Roll Request detected - Auto-converting to blind GM roll');
      console.log('  - Message flags GM request:', isGMRollRequest);
      console.log('  - Original roll mode:', originalRollMode);
      console.log('  - New roll mode: blindroll');
      
      // Show notification to player
      ui.notifications.info('GM roll request automatically converted to blind roll for privacy.', { permanent: false });
    }
    
    // Import and show opposed test dialog
    try {
      const { showOpposedTestDialog } = await import('./opposed-test-dialog.js');
      
      // Always treat as GM private when roll mode was changed
      const effectiveGMPrivate = rollModeChanged ? true : isGMPrivate;
      
      await showOpposedTestDialog(targetActor, actionValue, messageId, effectiveGMPrivate);
      
    } catch (error) {
      console.error('Error opening opposed test dialog:', error);
      ui.notifications.error('Error opening opposed test dialog. Check console for details.');
    } finally {
      // Do not immediately restore here — we will restore on GM reveal signal or public results.
      // Add a long-timeout fallback in case no reveal arrives to avoid leaving players stuck in blindroll.
      if (rollModeChanged && originalRollMode !== null) {
        setTimeout(async () => {
          if (globalThis.BluePlanetAutoBlind.active) {
            try {
              await game.settings.set('core', 'rollMode', originalRollMode);
              // Try to reflect in UI
              const rollModeSelect = ui?.chat?.element?.find('select[name="rollMode"]');
              if (rollModeSelect && rollModeSelect.length) {
                rollModeSelect.val(originalRollMode).trigger('change');
              } else {
                const genericSelect = $('select[name="rollMode"]');
                if (genericSelect && genericSelect.length) genericSelect.val(originalRollMode).trigger('change');
              }
              console.log('BluePlanet: Fallback — Roll mode restored to:', originalRollMode);
            } catch (restoreErr) {
              console.warn('BluePlanet: Fallback restore failed:', restoreErr);
            }
            globalThis.BluePlanetAutoBlind.active = false;
            globalThis.BluePlanetAutoBlind.prevRollMode = null;
            globalThis.BluePlanetAutoBlind.forcePrivate = false;
          }
        }, 30000);
      }
    }
  });
  
  console.log('BluePlanet: Global opposed test listener set up for user:', game.user?.name || 'unknown');

  // Listen for GM reveal socket to restore players' roll mode and UI
  try {
    if (game.socket) {
      game.socket.on('system.blue-planet-recontact', async (payload) => {
        if (!payload || typeof payload !== 'object') return;

        // GM handles creating the private opposed results so players don't even see a stub
        if (payload.type === 'gm-create-opposed-results' && game.user.isGM) {
          try {
            const { createOpposedTestResultsMessage } = await import('./opposed-test-dialog.js');
            const resultsRaw = Array.isArray(payload.results) ? payload.results : [];
            // Rehydrate actors for display
            const results = resultsRaw.map(r => {
              const actor = game.actors.get(r.actorId);
              return {
                actor,
                actionValue: r.actionValue,
                isInitiator: r.isInitiator,
                skillUsed: r.skillUsed,
                rollResult: r.rollResult,
                baseTarget: r.baseTarget,
                usedStrain: r.usedStrain,
                otherBonus: r.otherBonus,
                isHidden: r.isHidden
              };
            }).filter(r => !!r.actor);
            // Compute winners on GM side
            results.sort((a, b) => b.actionValue - a.actionValue);
            const highestAV = results[0]?.actionValue ?? 0;
            const winners = results.filter(r => r.actionValue === highestAV);
            await createOpposedTestResultsMessage(results, winners, payload.originalMessageId, true);
          } catch (err) {
            console.error('BluePlanet: GM failed to create opposed results message:', err);
          }
          return; // Do not run further handlers
        }

        if (payload.type === 'reveal-opposed-test') {
          // Only players that auto-switched should restore
          if (globalThis.BluePlanetAutoBlind.active && globalThis.BluePlanetAutoBlind.prevRollMode) {
            const prev = globalThis.BluePlanetAutoBlind.prevRollMode;
            try {
              await game.settings.set('core', 'rollMode', prev);
              // Reflect in UI
              const rollModeSelect = ui?.chat?.element?.find('select[name="rollMode"]');
              if (rollModeSelect && rollModeSelect.length) {
                rollModeSelect.val(prev).trigger('change');
              } else {
                const genericSelect = $('select[name="rollMode"]');
                if (genericSelect && genericSelect.length) genericSelect.val(prev).trigger('change');
              }
              console.log('BluePlanet: Restored roll mode due to GM reveal:', prev);
            } catch (err) {
              console.warn('BluePlanet: Failed to restore roll mode on GM reveal:', err);
            }
            globalThis.BluePlanetAutoBlind.active = false;
            globalThis.BluePlanetAutoBlind.prevRollMode = null;
            globalThis.BluePlanetAutoBlind.forcePrivate = false;
          }
        }
      });
    }
  } catch (sockErr) {
    console.warn('BluePlanet: Could not attach socket listener for GM reveal:', sockErr);
  }

  // React to chat messages to (1) auto-switch to blind on GM roll request, and
  // (2) restore on public opposed results message as a safety net
  Hooks.on('createChatMessage', async (message) => {
    try {
      const flags = message?.flags?.['blue-planet-recontact'];
      const rollType = flags?.rollType;
      const isGMRollRequest = rollType === 'gm-opposed-test-request' && flags?.isGMPrivateOpposedTest === true;
      const isOpposedResults = rollType === 'opposed-test-results';
      const isGMPrivate = !!flags?.isGMPrivate;
      const isVisibleToPlayers = !message.blind && (!message.whisper || message.whisper.length === 0);

      // 1) On GM roll request: immediately auto-press Blind GM Roll for players
      if (isGMRollRequest && !game.user.isGM) {
        try {
          const current = game.settings.get('core', 'rollMode');
          if (!globalThis.BluePlanetAutoBlind.active) {
            globalThis.BluePlanetAutoBlind.active = true;
            globalThis.BluePlanetAutoBlind.prevRollMode = current;
          }
          // Force opposed results to be private for this request lifecycle
          globalThis.BluePlanetAutoBlind.forcePrivate = true;
          await game.settings.set('core', 'rollMode', 'blindroll');

          // Reflect in UI (as if pressing the Blind GM Roll button)
          const rollModeSelect = ui?.chat?.element?.find('select[name="rollMode"]');
          if (rollModeSelect && rollModeSelect.length) {
            rollModeSelect.val('blindroll').trigger('change');
          } else {
            const genericSelect = $('select[name="rollMode"]');
            if (genericSelect && genericSelect.length) genericSelect.val('blindroll').trigger('change');
          }

          // Attempt to toggle any quick-control button that Foundry might render
          // (best-effort; not all versions have a clickable blind button)
          try {
            const blindBtn = $("a[data-roll-mode='blindroll'], button[data-roll-mode='blindroll']").first();
            if (blindBtn && blindBtn.length) blindBtn.trigger('click');
          } catch (uiToggleErr) {
            // Non-fatal
          }

          console.log('BluePlanet: Auto-switched to Blind GM Roll due to GM roll request.');
          ui.notifications?.info('Opposed Test: Auto-switched to Blind GM Roll (GM request).');
        } catch (autoErr) {
          console.warn('BluePlanet: Failed to auto-switch to Blind GM Roll on GM request:', autoErr);
        }
      }

      // 2) On public opposed results (safety net restore)
      if (isOpposedResults && isVisibleToPlayers && !isGMPrivate) {
        if (globalThis.BluePlanetAutoBlind.active && globalThis.BluePlanetAutoBlind.prevRollMode) {
          const prev = globalThis.BluePlanetAutoBlind.prevRollMode;
          await game.settings.set('core', 'rollMode', prev);
          const rollModeSelect = ui?.chat?.element?.find('select[name="rollMode"]');
          if (rollModeSelect && rollModeSelect.length) {
            rollModeSelect.val(prev).trigger('change');
          } else {
            const genericSelect = $('select[name="rollMode"]');
            if (genericSelect && genericSelect.length) genericSelect.val(prev).trigger('change');
          }
          console.log('BluePlanet: Restored roll mode due to public opposed results message:', prev);
          globalThis.BluePlanetAutoBlind.active = false;
          globalThis.BluePlanetAutoBlind.prevRollMode = null;
          globalThis.BluePlanetAutoBlind.forcePrivate = false;
        }
      }
    } catch (hookErr) {
      console.warn('BluePlanet: createChatMessage hook handler failed:', hookErr);
    }
  });
  
  // Set up global event listener for make public buttons (for GMs only)
  console.log('BluePlanet: Setting up global make-public listener...');
  $(document).on('click.blueplanetMakePublic', '.make-public-btn', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('BluePlanet: Make public button clicked!');
    
    // Only allow GMs to use this
    if (!game.user.isGM) {
      ui.notifications.warn('Only GMs can make results public.');
      return;
    }
    
    const button = $(this);
    const messageId = button.data('message-id');
    
    console.log('Make public button clicked:', { messageId });
    
    if (!messageId) {
      ui.notifications.error('Message ID not found!');
      return;
    }
    
    // Import and call the make public function
    try {
      const { makeOpposedTestResultsPublic } = await import('./opposed-test-dialog.js');
      await makeOpposedTestResultsPublic(messageId);

      // Broadcast reveal so all clients can restore their roll mode if they auto-switched
      try {
        if (game.socket) {
          game.socket.emit('system.blue-planet-recontact', {
            type: 'reveal-opposed-test',
            messageId
          });
        }
      } catch (sockErr) {
        console.warn('BluePlanet: Failed to emit reveal-opposed-test socket message:', sockErr);
      }
    } catch (error) {
      console.error('Error making results public:', error);
      ui.notifications.error('Error making results public. Check console for details.');
    }
  });
  
  console.log('BluePlanet: Global make-public listener set up for user:', game.user?.name || 'unknown');
  
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
          // Random initial position to avoid overlap + Math.random() * 200 + Math.random() * 300
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
              height: 700 + Math.random() * 300 + Math.random() * 200,
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
              height: 700 + Math.random() * 300 + Math.random() * 200,
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
          },
          {
            name: "advancement",
            title: "Advancement Tracker",
            icon: "fas fa-arrow-up",
            button: true,
            onClick: () => {
              const controlled = canvas.tokens.controlled;
              const actor = controlled.length > 0 ? controlled[0].actor : game.user.character;
              if (!actor) { ui.notifications.warn('Select a token first.'); return; }
              showAdvancementDialog(actor);
            }
          },
          {
            name: "echolocation",
            title: "Cetacean Echolocation Info",
            icon: "fas fa-wave-square",
            button: true,
            onClick: () => {
              const controlled = canvas.tokens.controlled;
              const actor = controlled.length > 0 ? controlled[0].actor : null;
              if (!actor) { ui.notifications.warn('Select a cetacean token first.'); return; }
              if (actor.type !== 'cetacean') { ui.notifications.warn('Echolocation is only available for cetacean actors.'); return; }
              showEcholocationInfo(actor);
            }
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
      classes: ["blue-planet-dialog", "bpr-dialog"],
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
      classes: ["blue-planet-dialog", "bpr-dialog"],
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
                roll.dice[0].results.forEach(result => {
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
      classes: ["blue-planet-dialog", "bpr-dialog"],
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
  roll.dice[0].results.forEach(result => {
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
  },
  
  /**
   * Get wound penalty for an actor
   * @param {Actor} actor - The actor
   * @returns {number} Total wound penalty
   */
  getWoundPenalty: getWoundPenalty,
  
  /**
   * Get wound summary for an actor
   * @param {Actor} actor - The actor
   * @returns {Object} Wound summary object
   */
  getWoundSummary: getWoundSummary
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

/**
 * Add basic combat skills to the selected actor
 * @param {Actor} actor - The actor to add skills to (optional, uses selected token if not provided)
 */
function addBasicCombatSkills(actor = null) {
  // Get actor from selected token if not provided
  if (!actor) {
    const tokens = canvas.tokens?.controlled;
    if (!tokens || tokens.length === 0) {
      ui.notifications.warn('Please select a token or provide an actor');
      return;
    }
    actor = tokens[0].actor;
  }
  
  if (!actor) {
    ui.notifications.warn('No valid actor found');
    return;
  }
  
  // Define basic combat skills
  const basicCombatSkills = {
    'firearms': {
      label: 'Firearms',
      rank: 1,
      attribute: 'coordination',
      level_type: 'general',
      aspect: 'experiential'
    },
    'melee': {
      label: 'Melee',
      rank: 1,
      attribute: 'coordination',
      level_type: 'general',
      aspect: 'experiential'
    },
    'brawling': {
      label: 'Brawling',
      rank: 1,
      attribute: 'coordination',
      level_type: 'general',
      aspect: 'experiential'
    },
    'athletics': {
      label: 'Athletics',
      rank: 1,
      attribute: 'coordination',
      level_type: 'general',
      aspect: 'experiential'
    }
  };
  
  // Get current skills or initialize empty object
  const currentSkills = actor.system.skills || {};
  
  // Add skills that don't already exist
  let addedSkills = 0;
  for (const [key, skill] of Object.entries(basicCombatSkills)) {
    if (!currentSkills[key]) {
      currentSkills[key] = skill;
      addedSkills++;
    }
  }
  
  // Update the actor
  if (addedSkills > 0) {
    actor.update({ 'system.skills': currentSkills });
    ui.notifications.info(`Added ${addedSkills} basic combat skills to ${actor.name}`);
    console.log(`BluePlanet: Added basic combat skills:`, basicCombatSkills);
  } else {
    ui.notifications.info(`${actor.name} already has all basic combat skills`);
  }
}
