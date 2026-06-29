/**
 * Opposed Test Dialog for Blue Planet Recontact
 * Allows selecting multiple participants and their skills for opposed tests
 */

import { 
  applyStrainBonus, 
  getStrainStatus,
  determineStrainType 
} from './strain-mechanics-fixed.js';

import { 
  getWoundPenalty, 
  getDiceFormula 
} from './utils.js';


/**
 * Create and show the opposed test dialog
 * @param {Actor} initiatorActor - The actor who initiated the opposed test
 * @param {number} initiatorActionValue - The initiator's action value
 * @param {string} messageId - The original message ID
 * @param {boolean} isGMPrivate - Whether this is a GM private opposed test
 */
export function showOpposedTestDialog(initiatorActor, initiatorActionValue, messageId, isGMPrivate = false) {
  // Respect global force flag (set when responding to GM private roll request)
  const forcedPrivate = globalThis?.BluePlanetAutoBlind?.forcePrivate === true;
  const effectiveIsGMPrivate = isGMPrivate || forcedPrivate;
  console.log('BluePlanet Opposed Test Dialog: Creating dialog', { 
    initiator: initiatorActor?.name, 
    actionValue: initiatorActionValue,
    isGMPrivate: isGMPrivate
  });
  
  // Get all available actors (PCs and NPCs) - include character, cetacean, and npc types
  const availableActors = game.actors.filter(actor => 
    (actor.type === 'character' || actor.type === 'cetacean' || actor.type === 'npc') && actor.id !== initiatorActor.id
  );
  
  // Debug: Log filtered actors info
  console.log('BluePlanet: Available actors debug:', {
    totalGameActors: game.actors.size,
    initiatorActor: initiatorActor?.name,
    initiatorActorId: initiatorActor?.id,
    filteredAvailableActors: availableActors.length,
    availableActorNames: availableActors.map(a => a.name)
  });
  
  // Debug: Check why user character might not be included
  const currentUserCharacter = game.user.character;
  if (currentUserCharacter) {
    console.log('BluePlanet: User character debug:', {
      userCharacterName: currentUserCharacter.name,
      userCharacterId: currentUserCharacter.id,
      userCharacterType: currentUserCharacter.type,
      isUserCharacterInitiator: currentUserCharacter.id === initiatorActor?.id,
      shouldBeIncluded: (currentUserCharacter.type === 'character' || currentUserCharacter.type === 'cetacean' || currentUserCharacter.type === 'npc') && currentUserCharacter.id !== initiatorActor?.id
    });
  }
  
  // Get current user's character for auto-adding (already declared above)
  console.log('BluePlanet: Current user character:', currentUserCharacter?.name || 'none assigned');
  
  // Generate the content HTML
  const content = createOpposedTestDialogContent(initiatorActor, initiatorActionValue, availableActors, effectiveIsGMPrivate);
  
  // Create dialog
  const dialogTitle = effectiveIsGMPrivate ? `GM Private Opposed Test - ${initiatorActor.name}` : `Opposed Test vs ${initiatorActor.name}`;
  
  // Create the dialog
  const dialog = new Dialog({
    title: dialogTitle,
    content: content,
    buttons: {
      execute: {
        icon: '<i class="fas fa-balance-scale"></i>',
        label: "<span style='font-weight: bold;'>Execute Opposed Test</span>",
        callback: (html) => executeOpposedTest(initiatorActor, initiatorActionValue, messageId, html, effectiveIsGMPrivate, currentUserCharacter, effectiveIsGMPrivate)
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "<span style='font-weight: bold;'>Cancel</span>",
        callback: () => {}
      }
    },
    default: "execute",
    render: (html) => {
      console.log('BluePlanet Opposed Test Dialog: Dialog rendered, setting up listeners');
      setupOpposedTestDialogListeners(html, availableActors, currentUserCharacter, effectiveIsGMPrivate);
    },
    close: () => {}
  }, {
    classes: ["blue-planet-recontact", "dialog", "sheet", "opposed-test", "bpr-dialog"],
    width: 850,   
    height: 700,  
    resizable: true,
    minimizable: false });
  
  dialog.render(true);
  return dialog;
}

/**
 * Create the HTML content for opposed test dialog
 */
function createOpposedTestDialogContent(initiatorActor, initiatorActionValue, availableActors, isGMPrivate = false) {
  const actorOptions = availableActors.map(actor => 
    `<option value="${actor.id}">${actor.name}</option>`
  ).join('');

  return `
    <div class="blue-planet-opposed-test-dialog" style="padding-bottom: 2px !important; margin-bottom: 0 !important;">
      <form style="margin-bottom: 2px !important;">
        <div class="form-group">
          <h4>${isGMPrivate ? 'GM Private Roll' : 'Initiator Result'}</h4>
          <div style="background: #2a2a2a; padding: 10px; border-radius: 4px; color: #ddd; font-size: 12px>
            ${isGMPrivate ? 
              `<div><strong>${initiatorActor.name}</strong> - Action Value: <span style="color: #ff9900; font-weight: bold;">HIDDEN</span></div>
               <div style="font-size: 10px; color: #aaa; margin- px;">GM's roll result is private - results will be sent only to GM</div>` :
              `<div><strong>${initiatorActor.name}</strong> - Action Value: <span style="color: #40e0d0; font-weight: bold;">${initiatorActionValue >= 0 ? '+' : ''}${initiatorActionValue}</span></div>`
            }
          </div>
        </div>

        <div class="form-group">
          <h4>Add Participants</h4>
          <div id="participants-list" style="margin-bottom: 10px;">
            <!-- Participant entries will be added here -->
          </div>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: end;">
            <div style="display: flex; flex-direction: column;">
              <label style="font-size: 11px; margin-bottom: 2px;">SELECT PARTICIPANT:</label>
              <select id="actor-select" style="height: 24px;">
                <option value="">Choose an actor...</option>
                ${actorOptions}
              </select>
            </div>
            <button type="button" id="add-participant" style="height: 24px; background: #357abd; color: white; border: none; border-radius: 3px; padding: 0 12px; cursor: pointer;">
              <i class="fas fa-plus"></i> Add
            </button>
          </div>
        </div>

        <div class="form-group">
          <h4>Results Preview</h4>
          <div id="results-preview" style="background: #2a2a2a; padding: 10px; border-radius: 4px; color: #ddd; font-size: 11px;">
            <p style="margin: 0; font-style: italic;">Add participants to see results...</p>
          </div>
        </div>
      </form>
    </div>
  `;
}

/**
 * Setup event listeners for the opposed test dialog
 */
function setupOpposedTestDialogListeners(html, availableActors, currentUserCharacter, isGMPrivate) {
  const participantsList = html.find('#participants-list');
  const resultsPreview = html.find('#results-preview');
  const participants = [];
  
  // Debug: Check auto-add conditions
  console.log('BluePlanet: Auto-add debug info:', {
    currentUserCharacter: currentUserCharacter?.name || 'none',
    availableActorsCount: availableActors.length,
    availableActorsNames: availableActors.map(a => a.name),
    userCharacterInAvailable: currentUserCharacter ? availableActors.some(a => a.id === currentUserCharacter.id) : false,
    isGMPrivate: isGMPrivate
  });
  
  // Auto-add current user's character if they have a character assigned and it's available
  // This works for both public and private opposed tests
  if (currentUserCharacter && availableActors.some(a => a.id === currentUserCharacter.id)) {
    console.log('BluePlanet: Auto-adding current user character:', currentUserCharacter.name, '(isGMPrivate:', isGMPrivate, ')');
    
    // Get all skills for this actor
    const allSkills = getAllActorSkills(currentUserCharacter);
    console.log('BluePlanet: Character skills found:', allSkills.length);
    
    if (allSkills.length > 0) {
      // Add participant
      const participant = {
        actor: currentUserCharacter,
        skills: allSkills,
        selectedSkill: allSkills[0],
        selectedAttribute: allSkills[0].attribute,
        useStrain: false,
        otherBonus: 0
      };
      
      participants.push(participant);
      updateParticipantsList(participantsList, participants);
      updateResultsPreview(resultsPreview, participants);
      console.log('BluePlanet: Character auto-added successfully!');
    } else {
      console.warn('BluePlanet: Character has no skills, cannot auto-add');
    }
  } else {
    console.log('BluePlanet: Auto-add conditions not met - character will not be auto-added');
  }

  // Add participant button
  html.find('#add-participant').click(() => {
    const actorId = html.find('#actor-select').val();
    if (!actorId) {
      ui.notifications.warn('Please select an actor first.');
      return;
    }

    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.error('Actor not found.');
      return;
    }

    // Check if already added
    if (participants.find(p => p.actor.id === actorId)) {
      ui.notifications.warn('This actor is already added.');
      return;
    }

    // Get all skills for this actor
    const allSkills = getAllActorSkills(actor);
    if (allSkills.length === 0) {
      ui.notifications.warn('This actor has no skills.');
      return;
    }

    // Add participant
    const participant = {
      actor: actor,
      skills: allSkills,
      selectedSkill: allSkills[0],
      selectedAttribute: allSkills[0].attribute,
      useStrain: false,
      otherBonus: 0
    };

    participants.push(participant);
    updateParticipantsList(participantsList, participants);
    updateResultsPreview(resultsPreview, participants);

    // Reset selector
    html.find('#actor-select').val('');
  });

  // Remove participant function (will be bound dynamically)
  participantsList.on('click', '.remove-participant', function() {
    const index = $(this).data('index');
    participants.splice(index, 1);
    updateParticipantsList(participantsList, participants);
    updateResultsPreview(resultsPreview, participants);
  });

  // Skill change function (will be bound dynamically)
  participantsList.on('change', '.skill-select', function() {
    const index = $(this).data('index');
    const skillId = $(this).val();
    const participant = participants[index];
    
    participant.selectedSkill = participant.skills.find(s => s.id === skillId) || participant.skills[0];
    participant.selectedAttribute = participant.selectedSkill.attribute;
    
    updateParticipantsList(participantsList, participants);
    updateResultsPreview(resultsPreview, participants);
  });
  
  // Strain checkbox change
  participantsList.on('change', '.use-strain', function() {
    const index = $(this).data('index');
    const participant = participants[index];
    
    participant.useStrain = $(this).is(':checked');
    
    updateParticipantsList(participantsList, participants);
    updateResultsPreview(resultsPreview, participants);
  });
  
  // Other bonus change
  participantsList.on('change input', '.other-bonus', function() {
    const index = $(this).data('index');
    const participant = participants[index];
    
    participant.otherBonus = parseInt($(this).val()) || 0;
    
    updateParticipantsList(participantsList, participants);
    updateResultsPreview(resultsPreview, participants);
  });
}

/**
 * Get all skills from actor
 */
function getAllActorSkills(actor) {
  const allSkills = [];
  const skills = actor.system.skills || {};
  
  for (let [key, skill] of Object.entries(skills)) {
    const skillLabel = skill.label || key;
    
    allSkills.push({
      id: key,
      name: skillLabel,
      rank: skill.rank || 1,
      attribute: skill.attribute || 'cognition',
      level_type: skill.level_type || 'general',
      dice: getDiceFormula(skill.level_type || 'general'),
      aspect: skill.aspect || 'experiential'
    });
  }
  
  // Sort skills alphabetically
  allSkills.sort((a, b) => a.name.localeCompare(b.name));
  return allSkills;
}

/**
 * Update participants list display
 */
function updateParticipantsList(container, participants) {
  console.log('BluePlanet: Updating participants list. Count:', participants.length, 'Container:', container.length);
  let html = '';
  
  participants.forEach((participant, index) => {
    const skillOptions = participant.skills.map(skill => 
      `<option value="${skill.id}" ${skill.id === participant.selectedSkill.id ? 'selected' : ''}>${skill.name} (${skill.rank})</option>`
    ).join('');

    // Get strain status for this participant
    const strainStatus = getStrainStatus(participant.actor);
    const strainType = determineStrainType(participant.selectedAttribute);
    const availableStrain = strainStatus ? strainStatus[strainType].available : 0;
    
    // Calculate current modifiers
    const skillRank = participant.selectedSkill.rank || 1;
    const attributeValue = participant.actor.system.attributes?.[participant.selectedAttribute]?.value || 0;
    const woundPenalty = getWoundPenalty(participant.actor);
    const strainBonus = participant.useStrain ? 2 : 0;
    const otherBonus = participant.otherBonus || 0;
    const baseTarget = skillRank + attributeValue + woundPenalty + strainBonus + otherBonus;

    html += `
      <div class="participant-entry" style="background: #333; padding: 12px; border-radius: 6px; margin-bottom: 8px;">
        <!-- Header with actor info -->
        <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; margin-bottom: 8px;">
          <img src="${participant.actor.img}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" title="${participant.actor.name}">
          <div>
            <div style="font-weight: bold; color: #ddd; margin-bottom: 2px;">${participant.actor.name}</div>
            <select class="skill-select" data-index="${index}" style="width: 100%; height: 20px; font-size: 10px;">
              ${skillOptions}
            </select>
          </div>
          <button type="button" class="remove-participant" data-index="${index}" style="background: #dc3545; color: white; border: none; width: 24px; height: 24px; border-radius: 3px; cursor: pointer;" title="Remove">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Modifiers Section -->
        <div style="background: #2a2a2a; padding: 8px; border-radius: 4px; border: 1px solid #555;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 6px;">
            <!-- Strain Option -->
            <div style="text-align: center;">
              <label style="font-size: 9px; color: #aaa; display: block;">STRAIN +2</label>
              <input type="checkbox" class="use-strain" data-index="${index}" ${participant.useStrain ? 'checked' : ''} ${availableStrain === 0 ? 'disabled' : ''}>
              <div style="font-size: 8px; color: #888;">${strainType}: ${availableStrain}</div>
            </div>
            
            <!-- Other Bonus -->
            <div style="text-align: center;">
              <label style="font-size: 9px; color: #aaa; display: block;">OTHER</label>
              <input type="number" class="other-bonus" data-index="${index}" value="${participant.otherBonus || 0}" min="-5" max="5" style="width: 40px; height: 18px; text-align: center; font-size: 9px;">
            </div>
            
            <!-- Target Number Display -->
            <div style="text-align: center;">
              <label style="font-size: 9px; color: #aaa; display: block;">TARGET</label>
              <div class="target-display" style="font-weight: bold; font-size: 11px; color: #40e0d0;">${baseTarget}</div>
            </div>
          </div>
          
          <!-- Target Number Breakdown -->
          <div style="font-size: 8px; color: #aaa>
            ${skillRank} (skill) + ${attributeValue} (attr) ${woundPenalty < 0 ? `+ ${woundPenalty} (wounds)` : ''} ${strainBonus > 0 ? `+ ${strainBonus} (strain)` : ''} ${otherBonus !== 0 ? `+ ${otherBonus} (other)` : ''} = ${baseTarget}
          </div>
        </div>
      </div>
    `;
  });

  container.html(html);
  console.log('BluePlanet: Participants list HTML updated. New HTML length:', html.length, 'Elements found after update:', container.find('.participant-entry').length);
}

/**
 * Update results preview
 */
function updateResultsPreview(container, participants) {
  if (participants.length === 0) {
    container.html('<p style="margin: 0; font-style: italic;">Add participants to see results...</p>');
    return;
  }

  let html = '<div style="text-align: center; background: #1a3e5c; padding: 8px; border-radius: 4px; margin: 4px 0;"><strong style="color: #6bb6ff;">Ready to roll:</strong></div>';
  html += '<div style="margin- px;">';
  
  participants.forEach((participant, index) => {
    // Calculate target number with all bonuses
    const skillRank = participant.selectedSkill.rank || 1;
    const attributeValue = participant.actor.system.attributes?.[participant.selectedAttribute]?.value || 0;
    const woundPenalty = getWoundPenalty(participant.actor);
    const strainBonus = participant.useStrain ? 2 : 0;
    const otherBonus = participant.otherBonus || 0;
    const finalTarget = skillRank + attributeValue + woundPenalty + strainBonus + otherBonus;
    
    html += `<div style="margin-bottom: 6px; background: #2a2a2a; padding: 6px; border-radius: 3px;">`;
    html += `<div style="display: flex; justify-content: space-between; align-items: center;">`;
    html += `<div><strong style="color: #ddd;">${participant.actor.name}</strong></div>`;
    html += `<div style="font-weight: bold; color: #40e0d0;">Target: ${finalTarget}</div>`;
    html += `</div>`;
    html += `<div style="font-size: 10px; color: #aaa; margin- px;">`;
    html += `${participant.selectedSkill.name} (${participant.selectedSkill.dice})`;
    if (strainBonus > 0) html += ` + ${strainBonus} strain`;
    if (otherBonus !== 0) html += ` + ${otherBonus} other`;
    html += `</div>`;
    html += `</div>`;
  });

  html += '</div>';
  container.html(html);
}

/**
 * Execute the opposed test
 */
async function executeOpposedTest(initiatorActor, initiatorActionValue, messageId, html, isGMPrivate = false) {
  // If a global force flag is present, it takes precedence
  const forcedPrivate = globalThis?.BluePlanetAutoBlind?.forcePrivate === true;
  const finalIsGMPrivate = isGMPrivate || forcedPrivate;
  console.log('BluePlanet Opposed Test Dialog: Executing opposed test - DEBUG:');
  console.log('  - Initiator Actor:', initiatorActor?.name);
  console.log('  - Initiator Action Value:', initiatorActionValue);
  console.log('  - Message ID:', messageId);
  console.log('  - isGMPrivate:', isGMPrivate, '(type:', typeof isGMPrivate, ')');
  console.log('  - Current rollMode:', game.settings.get('core', 'rollMode'));
  
  // Collect participant data from the HTML form
  const participantElements = html.find('.participant-entry');
  console.log('BluePlanet: Execute opposed test - searching for participant elements. Found:', participantElements.length);
  
  if (participantElements.length === 0) {
    console.warn('BluePlanet: No participant elements found in HTML!');
    console.log('BluePlanet: Full HTML content:', html.html());
    ui.notifications.warn('Please add at least one participant.');
    return;
  }

  // Collect participant data and execute rolls
  const results = [];
  
  // Add initiator result first (handle hidden case for GM private rolls)
  results.push({
    actor: initiatorActor,
    actionValue: initiatorActionValue === 'hidden' ? 0 : initiatorActionValue,
    isInitiator: true,
    skillUsed: 'GM Private Roll',
    rollResult: 'Hidden',
    isHidden: initiatorActionValue === 'hidden'
  });

  // Process each participant
  for (let i = 0; i < participantElements.length; i++) {
    const element = $(participantElements[i]);
    const skillSelect = element.find('.skill-select');
    const skillId = skillSelect.val();
    
    // Get participant data from form elements
    const actorName = element.find('img').attr('title');
    const actor = game.actors.find(a => a.name === actorName);
    const useStrain = element.find('.use-strain').is(':checked');
    const otherBonus = parseInt(element.find('.other-bonus').val()) || 0;
    
    if (!actor) continue;
    
    // Get skill info
    const allSkills = getAllActorSkills(actor);
    const selectedSkill = allSkills.find(s => s.id === skillId) || allSkills[0];
    
    // Calculate target number with all bonuses
    const attributes = actor.system?.attributes || {};
    const attributeValue = attributes[selectedSkill.attribute]?.value || 0;
    const skillRank = selectedSkill.rank || 1;
    const woundPenalty = getWoundPenalty(actor);
    let targetNumber = skillRank + attributeValue + woundPenalty + otherBonus;
    
    // Apply strain if requested
    if (useStrain) {
      const strainType = determineStrainType(selectedSkill.attribute);
      const strainApplied = await applyStrainBonus(actor, strainType);
      if (strainApplied) {
        targetNumber += 2;
        console.log(`BluePlanet: Applied ${strainType} strain to ${actor.name} for +2 bonus`);
      } else {
        ui.notifications.warn(`Failed to apply ${strainType} strain for ${actor.name}`);
      }
    }
    
    // Make the roll
    const roll = new Roll(selectedSkill.dice);
    await roll.evaluate();
    
    const actionValue = targetNumber - roll.total;
    
    results.push({
      actor: actor,
      actionValue: actionValue,
      isInitiator: false,
      skillUsed: selectedSkill.name,
      rollResult: roll.total,
      baseTarget: targetNumber,
      usedStrain: useStrain,
      otherBonus: otherBonus
    });
  }

  // Determine winners based on whether this is a GM private test
  let winners;
  
  if (isGMPrivate) {
    // For GM private tests, the GM gets the real results privately
    // But we still need to sort to determine actual winners for the GM's message
    results.sort((a, b) => b.actionValue - a.actionValue);
    const highestActionValue = results[0].actionValue;
    winners = results.filter(r => r.actionValue === highestActionValue);
  } else {
    // Normal opposed test - sort by action value and determine winners
    results.sort((a, b) => b.actionValue - a.actionValue);
    const highestActionValue = results[0].actionValue;
    winners = results.filter(r => r.actionValue === highestActionValue);
  }
  
  // If the test is private and the user is not GM, delegate message creation to a GM via socket
  if (finalIsGMPrivate && !game.user.isGM) {
    try {
      const payload = {
        type: 'gm-create-opposed-results',
        originalMessageId: messageId,
        isGMPrivate: true,
        // Serialize results minimally to avoid circular structures
        results: results.map(r => ({
          actorId: r.actor.id,
          actionValue: r.actionValue,
          isInitiator: !!r.isInitiator,
          skillUsed: r.skillUsed,
          rollResult: r.rollResult,
          baseTarget: r.baseTarget,
          usedStrain: r.usedStrain,
          otherBonus: r.otherBonus,
          isHidden: r.isHidden || false
        }))
      };
      if (game.socket) {
        game.socket.emit('system.blue-planet-recontact', payload);
      }
    } catch (err) {
      console.error('BluePlanet: Failed to emit GM creation for opposed results:', err);
    }
  } else {
    // Create opposed test results message (private to GM if isGMPrivate is true)
    await createOpposedTestResultsMessage(results, winners, messageId, finalIsGMPrivate);
  }
  
  // If this is a GM private test, always send a public notification to all players
  // Clear force flag after processing to avoid affecting unrelated rolls
  if (forcedPrivate && globalThis?.BluePlanetAutoBlind) {
    globalThis.BluePlanetAutoBlind.forcePrivate = false;
  }
}

/**
 * Create opposed test results message with visual table
 */
export async function createOpposedTestResultsMessage(results, winners, originalMessageId, isGMPrivate = false) {
  let flavorText = `<h3><i class="fas fa-balance-scale"></i> OPPOSED TEST RESULTS</h3>`;
  
  // Remove custom private notice - let Foundry handle the privacy display
  
  // Create visual results table
  flavorText += `<div style="background: #2a2a2a; border-radius: 6px; padding: 12px; margin: 8px 0;">`;
  
  results.forEach((result, index) => {
    const isWinner = winners.includes(result);
    const borderColor = isWinner ? '#28a745' : '#dc3545';
    const backgroundColor = isWinner ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
    const statusIcon = isWinner ? '🏆' : '❌';
    const statusText = isWinner ? 'WINNER' : 'DEFEATED';
    const statusColor = isWinner ? '#28a745' : '#dc3545';
    
    flavorText += `<div style="display: flex; align-items: center; padding: 8px; margin-bottom: 6px; border: 2px solid ${borderColor}; border-radius: 4px; background: ${backgroundColor};">`;
    
    // Actor image
    flavorText += `<img src="${result.actor.img}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 2px solid ${borderColor};" title="${result.actor.name}">`;
    
    // Actor info and results
    flavorText += `<div style="flex: 1;">`;
    flavorText += `<div style="font-weight: bold; color: #ddd; margin-bottom: 2px;">${result.actor.name} ${statusIcon}</div>`;
    
    if (result.isInitiator) {
      if (result.isHidden) {
        flavorText += `<div style="font-size: 10px; color: #aaa;">GM Private Roll - Results Hidden</div>`;
      } else {
        flavorText += `<div style="font-size: 10px; color: #aaa;">Initiator - ${result.skillUsed}</div>`;
      }
    } else {
      flavorText += `<div style="font-size: 10px; color: #aaa;">${result.skillUsed} - Roll: ${result.rollResult}, Target: ${result.baseTarget}</div>`;
    }
    
    flavorText += `</div>`;
    
    // Action Value and Status
    flavorText += `<div style="text-align: right;">`;
    
    if (result.isHidden && !isGMPrivate) {
      // For hidden results in player view, show as hidden
      flavorText += `<div style="font-weight: bold; font-size: 14px; color: #ff9900;">AV: HIDDEN</div>`;
      flavorText += `<div style="font-size: 10px; font-weight: bold; color: #666;">UNKNOWN</div>`;
    } else {
      // Normal display for non-hidden results or GM view
      flavorText += `<div style="font-weight: bold; font-size: 14px; color: #40e0d0;">AV: ${result.actionValue >= 0 ? '+' : ''}${result.actionValue}</div>`;
      flavorText += `<div style="font-size: 10px; font-weight: bold; color: ${statusColor};">${statusText}</div>`;
    }
    
    flavorText += `</div>`;
    
    flavorText += `</div>`;
  });
  
  flavorText += `</div>`;
  
  // Add explanation
  flavorText += `<div style="background: rgba(255, 153, 0, 0.1); border: 1px solid #ff9900; border-radius: 4px; padding: 8px; margin: 8px 0;">`;
  flavorText += `<p style="color: #ff9900; font-weight: bold; margin: 0 0 4px 0;"><i class="fas fa-info-circle"></i> OPPOSED TEST RULES</p>`;
  flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• Winner: Highest Action Value (even if negative)</p>`;
  
  if (winners.length > 1) {
    flavorText += `<p style="color: black; font-size: 10px; margin: 2px 0;">• <strong>TIE:</strong> ${winners.length} participants tied - contest continues or stalemate</p>`;
  }
  
  // Add benefits/consequences
  const hasExceptionalWinner = winners.some(w => w.actionValue >= 5);
  const hasCriticalLoser = results.some(r => !winners.includes(r) && r.actionValue <= -5);
  
  if (hasExceptionalWinner) {
    flavorText += `<p style="color: #28a745; font-size: 10px; margin: 2px 0;">🎯 Winner(s) with AV +5 earn bonus or narrative advantage</p>`;
  }
  
  if (hasCriticalLoser) {
    flavorText += `<p style="color: #dc3545; font-size: 10px; margin: 2px 0;">💥 Loser(s) with AV -5 suffer penalty or narrative consequence</p>`;
  }
  
  flavorText += `</div>`;
  
  // Create message
  const messageData = {
    speaker: ChatMessage.getSpeaker(),
    flavor: flavorText,
    flags: {
      "blue-planet-recontact": {
        rollType: 'opposed-test-results',
        winners: winners.map(w => ({ actorId: w.actor.id, actionValue: w.actionValue })),
        participants: results.length,
        originalMessageId: originalMessageId,
        isGMPrivate: isGMPrivate
      }
    }
  };
  
  // Configure privacy settings - make GM private opposed tests truly private
  if (isGMPrivate) {
    console.log('BluePlanet: GM Private - Configuring whisper+blind for opposed test results');
    // Whisper only to GMs and make it blind so the player (author) cannot see it
    try {
      const gmUsers = game.users.filter(u => u.isGM);
      const whisperRecipientIds = gmUsers.map(u => u.id);
      messageData.whisper = whisperRecipientIds;
      messageData.blind = true;
      // Remove rollMode to avoid conflicts; privacy is controlled by whisper+blind
      delete messageData.rollMode;
      console.log('BluePlanet: GM Private - Whisper recipient IDs (GMs):', whisperRecipientIds);
    } catch (e) {
      console.warn('BluePlanet: GM Private - Failed to configure whisper recipients, falling back to blindroll');
      messageData.rollMode = 'blindroll';
    }
  } else {
    messageData.rollMode = game.settings.get('core', 'rollMode');
    console.log('BluePlanet: Public message - Using rollMode:', messageData.rollMode);
  }
  
  return await foundry.documents.ChatMessage.create(messageData);
}


// Export the main function
export default showOpposedTestDialog;
