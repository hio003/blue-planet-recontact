/**
 * Blue Planet Recontact Initiative System
 * Implements initiative tests as described in the rules:
 * - Opposed attribute rolls against Coordination or Cognition
 * - Action values determine order (highest first)
 * - Formula: base(5) + attribute_rank + 1d10 - roll_result = action_value
 * - New tests each round
 * 
 * Future-proof implementation:
 * - Uses only @public Foundry APIs (guaranteed stable)
 * - Native DOM APIs (web standards since 2000s)
 * - No deprecated dependencies
 * - InitiativeDOM compatibility layer for cross-version DOM manipulation
 * - Supports both jQuery objects and native HTMLElements
 * - Resilient to future Foundry UI framework changes
 */

/**
 * Future-proof DOM utilities for initiative system
 * Uses only stable web standards
 */
class InitiativeDOM {
  static findElement(parent, selector) {
    if (!parent) return null;
    return parent.querySelector ? parent.querySelector(selector) : null;
  }
  
  static findElements(parent, selector) {
    if (!parent) return [];
    return parent.querySelectorAll ? Array.from(parent.querySelectorAll(selector)) : [];
  }
  
  static createElement(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.id) element.id = options.id;
    if (options.title) element.title = options.title;
    if (options.innerHTML) element.innerHTML = options.innerHTML;
    if (options.dataset) {
      Object.entries(options.dataset).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }
    return element;
  }
  
  static addEvent(element, event, handler) {
    if (element && element.addEventListener) {
      element.addEventListener(event, handler);
    }
  }
  
  static removeElements(parent, selector) {
    const elements = this.findElements(parent, selector);
    elements.forEach(el => el.remove());
  }
}

export class BluePlanetInitiative {
  
  /**
   * Calculate initiative for an actor using Blue Planet rules
   * @param {Actor} actor - The actor to calculate initiative for
   * @param {string} attribute - Either 'coordination' or 'cognition'
   * @param {string} focus - Optional focus attribute name
   * @returns {Promise<Object>} Initiative test results
   */
  static async rollInitiative(actor, attribute = 'coordination', focus = null) {
    try {
      // Get the attribute data with creature fallback logic
      let attributeData = actor.system.attributes?.[attribute];
      let originalAttribute = attribute;
      
      // Special handling for creatures that may not have all standard attributes
      if (!attributeData && actor.type === 'creature') {
        console.log(`BluePlanet Initiative: Creature ${actor.name} doesn't have ${attribute}, trying fallback attributes`);
        
        // Fallback hierarchy for creatures based on creature_base template
        const creatureAttributeFallbacks = {
          'coordination': ['coordination', 'awareness', 'physique'],
          'cognition': ['awareness', 'coordination', 'physique'],
          'awareness': ['awareness', 'coordination', 'physique'],
          'physique': ['physique', 'coordination', 'awareness']
        };
        
        const fallbacks = creatureAttributeFallbacks[attribute] || ['coordination', 'awareness', 'physique'];
        
        for (const fallbackAttr of fallbacks) {
          const fallbackData = actor.system.attributes?.[fallbackAttr];
          if (fallbackData !== undefined && fallbackData !== null) {
            attributeData = fallbackData;
            attribute = fallbackAttr; // Update attribute name for display
            console.log(`BluePlanet Initiative: Using fallback attribute ${fallbackAttr} for creature ${actor.name}`);
            break;
          }
        }
      }
      
      // Final check - if still no attribute found
      if (!attributeData && attributeData !== 0) {
        // For creatures, provide a default minimal attribute
        if (actor.type === 'creature') {
          console.warn(`BluePlanet Initiative: Creature ${actor.name} has no usable attributes, using default value of 1`);
          attributeData = { value: 1 };
          attribute = 'default';
        } else {
          throw new Error(`Actor ${actor.name} does not have attribute ${originalAttribute}`);
        }
      }

      let attributeRank = 0;
      let attributeName = attribute.charAt(0).toUpperCase() + attribute.slice(1);
      
      // Handle different attribute structures
      console.log(`BluePlanet Initiative: Processing ${attribute} for ${actor.name} (${actor.type}):`, attributeData);
      
      if (typeof attributeData === 'number') {
        // Simple number value (creatures)
        attributeRank = attributeData;
        console.log(`BluePlanet Initiative: Using simple number value: ${attributeRank}`);
      } else if (attributeData.value !== undefined) {
        // Standard object with value property (characters)
        attributeRank = attributeData.value || 0;
        console.log(`BluePlanet Initiative: Using .value property: ${attributeRank}`);
      } else if (attributeData.general !== undefined) {
        // Dual attribute for creatures (use general coordination for initiative)
        attributeRank = attributeData.general || 0;
        attributeName = `${attributeName} (General)`;
        console.log(`BluePlanet Initiative: Using .general property: ${attributeRank}`);
      } else {
        // Fallback to 0 if no valid value found
        attributeRank = 0;
        console.warn(`BluePlanet Initiative: No valid attribute value found for ${attribute} on ${actor.name}, using 0`);
      }
      
      // Check for focus attribute
      if (focus && attributeData.focus && attributeData.focus[focus]) {
        attributeRank = attributeData.focus[focus].value || attributeRank;
        attributeName = `${attributeName} (${attributeData.focus[focus].name || focus})`;
      }

      // Blue Planet initiative formula: base(5) + attribute_rank + bonuses
      let targetNumber = 5 + attributeRank;
      
      // Apply initiative bonuses from active biomods/equipment (e.g., Neural Jack)
      const mech = actor.system?.calculated?.mechanics || {};
      if (mech.initiativeBonus) targetNumber += mech.initiativeBonus;
      
      // Roll 1d10
      const roll = new Roll('1d10');
      await roll.evaluate();
      const rollResult = roll.total;
      
      // Calculate action value: target_number - roll_result + random_decimal_for_tiebreaking
      // Add random number (01-99) as decimal to avoid ties (e.g., actionValue.42)
      const baseActionValue = targetNumber - rollResult;
      const randomDecimal = Math.floor(Math.random() * 99) + 1; // Random number 1-99
      const formattedDecimal = randomDecimal.toString().padStart(2, '0'); // Ensure 2 digits (01-99)
      const actionValue = parseFloat(`${baseActionValue}.${formattedDecimal}`);
      
      // Create chat message for the initiative roll
      const flavor = `Initiative Test - ${attributeName} (Target: ${targetNumber})`;
      
      const messageData = {
        speaker: ChatMessage.getSpeaker({actor: actor}),
        flavor: `<strong>${flavor}</strong>`,
        content: `
          <div class="blue-planet-initiative-roll">
            <div class="roll-header">
              <h3><strong>${flavor}</strong></h3>
            </div>
            <div class="roll-details">
              <div class="attribute-info">
                <strong>Attribute:</strong> ${attributeName} (${attributeRank})
              </div>
              <div class="target-number">
                <strong>Target Number:</strong> ${targetNumber} (Base 5 + ${attributeRank})
              </div>
              <div class="roll-result">
                <strong>Roll:</strong> ${rollResult}
              </div>
              <div class="action-value">
                <strong>Action Value:</strong> ${actionValue} (${baseActionValue}.${formattedDecimal})
              </div>
              <div class="tie-breaker">
                <em>Tie-breaker: .${formattedDecimal} (random)</em>
              </div>
            </div>
          </div>
        `,
        rolls: [roll],
        rollMode: game.settings.get("core", "rollMode")
      };

      await foundry.documents.ChatMessage.create(messageData);

      return {
        actor: actor,
        roll: roll,
        rollResult: rollResult,
        targetNumber: targetNumber,
        actionValue: actionValue,
        attribute: attribute,
        focus: focus,
        attributeName: attributeName
      };

    } catch (error) {
      console.error('BluePlanet Initiative Error:', error);
      ui.notifications.error(`Failed to roll initiative for ${actor.name}: ${error.message}`);
      return null;
    }
  }

  /**
   * Show initiative selection dialog for an actor
   * @param {Actor} actor - The actor to roll initiative for
   * @returns {Promise<Object>} Initiative results or null if cancelled
   */
  static async showInitiativeDialog(actor) {
    return new Promise((resolve) => {
      // Get available attributes and focus options
      const coordination = actor.system.attributes?.coordination;
      const cognition = actor.system.attributes?.cognition;
      
      let focusOptions = '';
      if (coordination?.focus) {
        if (coordination.focus.primary?.name) {
          focusOptions += `<option value="coordination_primary">${coordination.focus.primary.name} (${coordination.focus.primary.value})</option>`;
        }
        if (coordination.focus.secondary?.name) {
          focusOptions += `<option value="coordination_secondary">${coordination.focus.secondary.name} (${coordination.focus.secondary.value})</option>`;
        }
      }
      if (cognition?.focus) {
        if (cognition.focus.primary?.name) {
          focusOptions += `<option value="cognition_primary">${cognition.focus.primary.name} (${cognition.focus.primary.value})</option>`;
        }
        if (cognition.focus.secondary?.name) {
          focusOptions += `<option value="cognition_secondary">${cognition.focus.secondary.name} (${cognition.focus.secondary.value})</option>`;
        }
      }

      const dialog = new Dialog({
        title: `Initiative Test - ${actor.name}`,
        content: `
          <div class="blue-planet-initiative-dialog">
            <p><strong>Choose attribute for initiative test:</strong></p>
            <p><em>Use Coordination for reflexes/physical response, Cognition for awareness/mental processing.</em></p>
            
            <div class="form-group">
              <label for="initiative-attribute">Attribute:</label>
              <select id="initiative-attribute" name="attribute">
                <option value="coordination">Coordination (${coordination?.value || 0})</option>
                <option value="cognition">Cognition (${cognition?.value || 0})</option>
                ${focusOptions}
              </select>
            </div>

            <div class="initiative-preview">
              <p><strong>Target Number:</strong> <span id="target-preview">5 + ${coordination?.value || 0} = ${5 + (coordination?.value || 0)}</span></p>
              <p><em>Action Value = Target Number - 1d10 roll</em></p>
            </div>
          </div>
        `,
        buttons: {
          roll: {
            label: "Roll Initiative",
            callback: async (html) => {
              // Use compatibility layer to get the selected value
              const rootElement = html?.get ? html.get(0) : html;
              const attributeSelect = InitiativeDOM.findElement(rootElement, '#initiative-attribute');
              const selectedValue = attributeSelect ? attributeSelect.value : 'coordination';
              
              let attribute, focus = null;
              
              if (selectedValue.includes('_')) {
                // Focus attribute selected
                const parts = selectedValue.split('_');
                attribute = parts[0];
                focus = parts[1];
              } else {
                // Base attribute selected
                attribute = selectedValue;
              }

              const result = await BluePlanetInitiative.rollInitiative(actor, attribute, focus);
              resolve(result);
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "roll",
        render: (html) => {
          // Update preview when selection changes using compatibility layer
          const rootElement = html?.get ? html.get(0) : html;
          if (!rootElement) return;
          
          const attributeSelect = InitiativeDOM.findElement(rootElement, '#initiative-attribute');
          if (!attributeSelect) return;
          
          InitiativeDOM.addEvent(attributeSelect, 'change', function() {
            const selectedValue = this.value;
            let targetNumber = 5;
            
            if (selectedValue === 'coordination') {
              targetNumber += coordination?.value || 0;
            } else if (selectedValue === 'cognition') {
              targetNumber += cognition?.value || 0;
            } else if (selectedValue.includes('_')) {
              const parts = selectedValue.split('_');
              const attr = parts[0];
              const focusType = parts[1];
              
              if (attr === 'coordination' && coordination?.focus?.[focusType]) {
                targetNumber += coordination.focus[focusType].value || 0;
              } else if (attr === 'cognition' && cognition?.focus?.[focusType]) {
                targetNumber += cognition.focus[focusType].value || 0;
              }
            }
            
            const targetPreview = InitiativeDOM.findElement(rootElement, '#target-preview');
            if (targetPreview) {
              targetPreview.textContent = `5 + attribute = ${targetNumber}`;
            }
          });
        }
      });

      dialog.render(true);
    });
  }

  /**
   * Roll initiative for all combatants in a combat
   * @param {Combat} combat - The combat encounter
   * @returns {Promise<void>}
   */
  static async rollInitiativeForAll(combat) {
    if (!combat) {
      ui.notifications.warn("No active combat found");
      return;
    }

    try {
      console.log('BluePlanet: Rolling initiative for all combatants in combat:', combat.id);
      
      const promises = [];
      
      for (const combatant of combat.combatants) {
        if (combatant.actor) {
          // For NPCs and creatures, use automatic coordination-based initiative
          // For PCs, could show dialog or use default
          const isPC = combatant.actor.type === 'character';
          const isNPC = combatant.actor.type === 'npc';
          const isCreature = combatant.actor.type === 'creature';
          const isCetacean = combatant.actor.type === 'cetacean';
          
          if (isPC && game.user.isGM === false && combatant.actor.isOwner) {
            // Player-controlled character - show dialog
            promises.push(
              this.showInitiativeDialog(combatant.actor)
                .then(result => {
                  if (result) {
                    console.log(`BluePlanet: Setting initiative ${result.actionValue} for PC ${combatant.actor.name}`);
                    return combatant.update({ initiative: result.actionValue });
                  }
                })
                .catch(error => {
                  console.error(`BluePlanet: Error rolling initiative for PC ${combatant.actor.name}:`, error);
                })
            );
          } else {
            // NPC/Creature/Cetacean or GM rolling - determine best attribute
            let initiativeAttribute = 'coordination';
            let actorTypeLabel = 'Actor';
            
            if (isNPC) {
              actorTypeLabel = 'NPC';
              initiativeAttribute = 'coordination'; // NPCs typically use coordination
            } else if (isCreature) {
              actorTypeLabel = 'Creature';
              // Creatures: try coordination first, then fall back to available attributes
              const attrs = combatant.actor.system.attributes || {};
              console.log(`BluePlanet Initiative: Available creature attributes:`, Object.keys(attrs));
              
              if (attrs.coordination !== undefined) {
                initiativeAttribute = 'coordination';
              } else if (attrs.awareness !== undefined) {
                initiativeAttribute = 'awareness';
              } else if (attrs.cognition !== undefined) {
                initiativeAttribute = 'cognition';
              } else {
                // Use the first available attribute as fallback
                const availableAttrs = Object.keys(attrs);
                if (availableAttrs.length > 0) {
                  initiativeAttribute = availableAttrs[0];
                  console.log(`BluePlanet Initiative: Using fallback attribute '${initiativeAttribute}' for creature ${combatant.actor.name}`);
                } else {
                  console.error(`BluePlanet Initiative: Creature ${combatant.actor.name} has no attributes defined`);
                  continue; // Skip this combatant
                }
              }
            } else if (isCetacean) {
              actorTypeLabel = 'Cetacean';
              // Cetaceans often have high cognition for echolocation/awareness
              const cognition = combatant.actor.system.attributes?.cognition?.value || 0;
              const coordination = combatant.actor.system.attributes?.coordination?.value || 0;
              
              // Use the higher attribute
              initiativeAttribute = cognition >= coordination ? 'cognition' : 'coordination';
            }
            
            promises.push(
              this.rollInitiative(combatant.actor, initiativeAttribute)
                .then(result => {
                  if (result) {
                    console.log(`BluePlanet: Setting initiative ${result.actionValue} for ${actorTypeLabel} ${combatant.actor.name}`);
                    return combatant.update({ initiative: result.actionValue });
                  }
                })
                .catch(error => {
                  console.error(`BluePlanet: Error rolling initiative for ${actorTypeLabel} ${combatant.actor.name}:`, error);
                })
            );
          }
        } else {
          console.warn(`BluePlanet: Combatant ${combatant.name || combatant.id} has no actor`);
        }
      }

      await Promise.allSettled(promises);
      
      // Sort combatants by action value (highest first)
      console.log('BluePlanet: Setting up turn order');
      await combat.setupTurns();
      
      ui.notifications.info(`Initiative rolled for ${combat.combatants.size} combatants`);
      
    } catch (error) {
      console.error('BluePlanet: Error in rollInitiativeForAll:', error);
      ui.notifications.error('Failed to roll initiative for all combatants');
    }
  }

  /**
   * Roll initiative for a single combatant
   * @param {Combat} combat - The combat encounter
   * @param {string} combatantId - The ID of the specific combatant
   * @returns {Promise<void>}
   */
  static async rollInitiativeForCombatant(combat, combatantId) {
    const combatant = combat.combatants.get(combatantId);
    if (!combatant || !combatant.actor) {
      ui.notifications.warn("Combatant not found or has no actor");
      return;
    }

    const isPC = combatant.actor.type === 'character';
    const isNPC = combatant.actor.type === 'npc';
    const isCreature = combatant.actor.type === 'creature';
    const isCetacean = combatant.actor.type === 'cetacean';
    
    if (isPC && !game.user.isGM && combatant.actor.isOwner) {
      // Player-controlled character - show dialog
      const result = await this.showInitiativeDialog(combatant.actor);
      if (result) {
        await combatant.update({ initiative: result.actionValue });
        await combat.setupTurns();
      }
    } else {
      // NPC/Creature/Cetacean or GM rolling - determine best attribute
      let initiativeAttribute = 'coordination';
      
      if (isCreature) {
        // Creatures: try coordination first, then fall back to available attributes
        const attrs = combatant.actor.system.attributes || {};
        console.log(`BluePlanet Initiative: Available individual creature attributes:`, Object.keys(attrs));
        
        if (attrs.coordination !== undefined) {
          initiativeAttribute = 'coordination';
        } else if (attrs.awareness !== undefined) {
          initiativeAttribute = 'awareness';
        } else if (attrs.cognition !== undefined) {
          initiativeAttribute = 'cognition';
        } else {
          // Use the first available attribute as fallback
          const availableAttrs = Object.keys(attrs);
          if (availableAttrs.length > 0) {
            initiativeAttribute = availableAttrs[0];
            console.log(`BluePlanet Initiative: Using fallback attribute '${initiativeAttribute}' for individual creature ${combatant.actor.name}`);
          } else {
            ui.notifications.error(`Creature ${combatant.actor.name} has no attributes defined for initiative`);
            return;
          }
        }
      } else if (isCetacean) {
        // Cetaceans often have high cognition for echolocation/awareness
        const cognition = combatant.actor.system.attributes?.cognition?.value || 0;
        const coordination = combatant.actor.system.attributes?.coordination?.value || 0;
        
        // Use the higher attribute
        initiativeAttribute = cognition >= coordination ? 'cognition' : 'coordination';
      }
      
      const result = await this.rollInitiative(combatant.actor, initiativeAttribute);
      if (result) {
        await combatant.update({ initiative: result.actionValue });
        await combat.setupTurns();
      }
    }
  }
}

/**
 * Hook to customize Foundry's combat system for Blue Planet
 */
Hooks.on('preCreateCombat', (combat, data, options, userId) => {
  // Ensure Blue Planet initiative is used
  console.log('BluePlanet: Combat created, initiative system active');
});

/**
 * Override Foundry's default rollInitiative to prevent conflicts
 */
Hooks.on('ready', () => {
  // Override the Combat class rollInitiative method
  const originalRollInitiative = Combat.prototype.rollInitiative;
  
  Combat.prototype.rollInitiative = async function(ids, options = {}) {
    // Always use Blue Planet initiative for this system
    console.log('BluePlanet: Intercepting rollInitiative call, using Blue Planet system');
    
    // Show notification to user about the different system
    if (game.user.isGM) {
      ui.notifications.info('Using Blue Planet initiative system - choose attributes for each character');
    }
    
    return BluePlanetInitiative.rollInitiativeForAll(this);
  };
  
  console.log('BluePlanet: Combat system overridden to use Blue Planet initiative');
  
  // Configure combat system for Blue Planet
  if (CONFIG.Combat) {
    CONFIG.Combat.initiative = {
      formula: null,
      decimals: 2  // Allow 2 decimal places for random tie-breaking (01-99)
    };
    
    // Set default initiative attribute for each actor type
    CONFIG.Combat.initiativeAttribute = 'coordination';
    
    // Custom initiative attribute mapping for different actor types
    CONFIG.BluePlanet = CONFIG.BluePlanet || {};
    CONFIG.BluePlanet.initiativeAttributes = {
      character: 'coordination',    // Characters can choose, but default to coordination
      npc: 'coordination',         // NPCs use coordination
      creature: 'coordination',    // Creatures use coordination 
      cetacean: 'cognition'        // Cetaceans use cognition (echolocation/awareness)
    };
    
    console.log('BluePlanet: Initiative attribute configuration set:', CONFIG.BluePlanet.initiativeAttributes);
  }
});

/**
 * Hook to handle combat turn changes
 */
Hooks.on('combatTurn', (combat, updateData, options, userId) => {
  const currentCombatant = combat.combatant;
  if (currentCombatant) {
    console.log(`BluePlanet: Turn - ${currentCombatant.name} (Action Value: ${currentCombatant.initiative})`);
  }
});

/**
 * Hook to handle round changes - re-roll initiative each round
 */
Hooks.on('combatRound', async (combat, updateData, options, userId) => {
  if (!game.user.isGM) return;
  
  // Skip if it's the first round (initiative already rolled)
  if (combat.round <= 1) return;
  
  // Show dialog asking if GM wants to re-roll initiative
  const rerollInitiative = await Dialog.confirm({
    title: "New Round - Re-roll Initiative?",
    content: `
      <p><strong>Round ${combat.round}</strong></p>
      <p>Blue Planet rules call for new initiative tests each action round.</p>
      <p>Would you like to re-roll initiative for all combatants?</p>
    `,
    yes: () => true,
    no: () => false,
    defaultYes: true
  });
  
  if (rerollInitiative) {
    ui.notifications.info(`Rolling new initiative for Round ${combat.round}`);
    await BluePlanetInitiative.rollInitiativeForAll(combat);
  }
});

/**
 * Add Blue Planet initiative button to combat tracker
 * Uses future-proof DOM compatibility layer
 */
Hooks.on('renderCombatTracker', (app, html, data) => {
  if (!game.user.isGM) return;
  
  try {
    console.log('BluePlanet: renderCombatTracker hook triggered with InitiativeDOM compatibility layer');
    
    // Support both jQuery objects and native HTMLElement
    const rootElement = html?.get ? html.get(0) : html;
    if (!rootElement) {
      console.warn('BluePlanet Initiative: Could not access root element:', typeof html);
      return;
    }
    
    // Find header using compatibility layer
    const header = InitiativeDOM.findElement(rootElement, '.combat-tracker-header');
    if (!header) {
      console.warn('BluePlanet Initiative: Combat tracker header not found');
      return;
    }
    
    // Remove existing BP buttons to avoid duplicates
    InitiativeDOM.removeElements(rootElement, '#bp-roll-initiative, #bp-new-round-initiative');
    
    // Create main initiative button
    const button = InitiativeDOM.createElement('a', {
      className: 'combat-control',
      id: 'bp-roll-initiative',
      title: 'Roll Blue Planet Initiative (Current Round)',
      innerHTML: `
        <i class="fas fa-dice-d10"></i>
        <span>BP Initiative</span>
      `
    });
    
    // Add to controls container or header
    const controlsContainer = InitiativeDOM.findElement(header, '.combat-controls');
    const targetContainer = controlsContainer || header;
    targetContainer.appendChild(button);
    
    // Add event listener using compatibility layer
    InitiativeDOM.addEvent(button, 'click', async (event) => {
      event.preventDefault();
      const combat = game.combat;
      if (combat) {
        console.log('BluePlanet Initiative: Rolling initiative for all combatants (future-proof)');
        await BluePlanetInitiative.rollInitiativeForAll(combat);
      }
    });
    
    // Add "New Round Initiative" button if in active combat
    if (data.combat && data.combat.round > 0) {
      const newRoundButton = InitiativeDOM.createElement('a', {
        className: 'combat-control',
        id: 'bp-new-round-initiative',
        title: 'Roll Initiative for New Round',
        innerHTML: `
          <i class="fas fa-sync-alt"></i>
          <span>New Round</span>
        `
      });
      
      targetContainer.appendChild(newRoundButton);
      
      InitiativeDOM.addEvent(newRoundButton, 'click', async (event) => {
        event.preventDefault();
        const combat = game.combat;
        if (combat) {
          console.log('BluePlanet Initiative: Advancing to new round with initiative re-roll');
          // Advance round and roll new initiative
          await combat.nextRound();
          // The combatRound hook will handle the initiative re-roll
        }
      });
    }
    
    // Add individual initiative buttons to each combatant using compatibility layer
    const combatants = InitiativeDOM.findElements(rootElement, '.combatant');
    combatants.forEach((element) => {
      const combatantId = element.dataset?.combatantId;
      
      if (!combatantId) {
        console.debug('BluePlanet Initiative: Skipping combatant element without ID');
        return;
      }
      
      // Remove existing individual button to avoid duplicates
      InitiativeDOM.removeElements(element, '.bp-individual-initiative');
      
      // Create initiative button using compatibility layer
      const initiativeBtn = InitiativeDOM.createElement('a', {
        className: 'combatant-control bp-individual-initiative',
        title: 'Roll Initiative for this combatant',
        innerHTML: '<i class="fas fa-dice-d10"></i>',
        dataset: {
          combatantId: combatantId
        }
      });
      
      // Add to token name or combatant element
      const tokenName = InitiativeDOM.findElement(element, '.token-name');
      const targetElement = tokenName || element;
      targetElement.appendChild(initiativeBtn);
      
      // Add event listener using compatibility layer
      InitiativeDOM.addEvent(initiativeBtn, 'click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const combat = game.combat;
        if (combat) {
          console.log(`BluePlanet Initiative: Rolling individual initiative for combatant ${combatantId}`);
          await BluePlanetInitiative.rollInitiativeForCombatant(combat, combatantId);
        }
      });
    });
    
  } catch (error) {
    console.error('BluePlanet Initiative: Error in renderCombatTracker hook:', error);
    // Log additional debugging info for troubleshooting
    console.error('BluePlanet Initiative: Debug info - html type:', typeof html);
    console.error('BluePlanet Initiative: Debug info - data:', data);
  }
});
