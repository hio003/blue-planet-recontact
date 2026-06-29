/**
 * Blue Planet Strain Mechanics System
 * Implements the strain rules as described in the Blue Planet RPG
 */

/**
 * Calculate maximum strain points based on attribute value
 * According to the official table:
 * 1-2: 2 points, 3-4: 3 points, 5-8: 4 points, 9-12: 5 points, 12+: 6 points
 * @param {number} attributeValue - The Psyche or Physique attribute value
 * @returns {number} - Maximum strain points
 */
export function calculateMaxStrain(attributeValue) {
  if (attributeValue <= 2) return 2;
  if (attributeValue <= 4) return 3;
  if (attributeValue <= 8) return 4;
  if (attributeValue <= 12) return 5;
  return 6; // 12+
}

/**
 * Determine if a test is mental or physical based on the attribute used
 * @param {string} attributeName - The attribute being used for the test
 * @returns {string} - 'mental' or 'physical'
 */
export function determineStrainType(attributeName) {
  // Mental attributes in Blue Planet Recontact
  const mentalAttributes = ['psyche', 'cognition'];
  // Physical attributes in Blue Planet Recontact
  const physicalAttributes = ['physique', 'coordination'];
  
  if (mentalAttributes.includes(attributeName.toLowerCase())) {
    return 'mental';
  } else if (physicalAttributes.includes(attributeName.toLowerCase())) {
    return 'physical';
  } else {
    // Default fallback to mental for unknown attributes
    return 'mental';
  }
}

/**
 * Apply strain for a +2 bonus to target number (pre-roll)
 * According to Blue Planet rules: spend 1 strain point for +2 target number bonus
 * Only one point may be spent per test
 * @param {Actor} actor - The actor using strain
 * @param {string} strainType - 'mental' or 'physical'
 * @returns {boolean} - Whether strain was successfully applied
 */
export async function applyStrainBonus(actor, strainType) {
  if (!actor.system.strain || !actor.system.strain[strainType]) {
    ui.notifications.warn(`Invalid strain type: ${strainType}`);
    return false;
  }
  
  const currentStrain = actor.system.strain[strainType].value || 0;
  // Calculate max strain based on attribute value
  const attributeName = strainType === 'mental' ? 'psyche' : 'physique';
  const attributeValue = actor.system.attributes?.[attributeName]?.value || 0;
  const maxStrain = calculateMaxStrain(attributeValue);
  const availableStrain = maxStrain - currentStrain;
  
  if (availableStrain < 1) {
    ui.notifications.warn(`Insufficient ${strainType} strain! Available: ${availableStrain}, Required: 1`);
    return false;
  }
  
  // Apply exactly 1 strain for +2 bonus (Blue Planet rules)
  const newStrainValue = Math.min(currentStrain + 1, maxStrain);
  await actor.update({[`system.strain.${strainType}.value`]: newStrainValue});
  
  // Update actor sheet pips if it exists
  const actorSheet = Object.values(ui.windows).find(w => w.actor?.id === actor.id);
  if (actorSheet && actorSheet._updatePipClasses) {
    actorSheet._updatePipClasses('strain', strainType, newStrainValue);
  }
  
  ui.notifications.info(`Spent 1 ${strainType} strain for +2 bonus to target number`);
  console.log(`BluePlanet Strain: Applied 1 ${strainType} strain to ${actor.name} for +2 target bonus`);
  
  return true;
}

/**
 * Attempt a reroll using strain (post-failure)
 * @param {Actor} actor - The actor attempting reroll
 * @param {string} strainType - 'mental' or 'physical' 
 * @param {Roll} originalRoll - The failed roll
 * @param {Object} rollData - Original roll data (target number, etc.)
 * @param {string} rollFormula - The dice formula to reroll
 * @returns {Object} - Result of the reroll attempt
 */
export async function attemptStrainReroll(actor, strainType, originalRoll, rollData, rollFormula) {
  if (!actor.system.strain || !actor.system.strain[strainType]) {
    ui.notifications.warn(`Invalid strain type: ${strainType}`);
    return null;
  }
  
  const currentStrain = actor.system.strain[strainType].value || 0;
  // Calculate max strain based on attribute value
  const attributeName = strainType === 'mental' ? 'psyche' : 'physique';
  const attributeValue = actor.system.attributes?.[attributeName]?.value || 0;
  const maxStrain = calculateMaxStrain(attributeValue);
  const availableStrain = maxStrain - currentStrain;
  
  if (availableStrain < 1) {
    ui.notifications.warn(`No ${strainType} strain available for reroll!`);
    return null;
  }
  
  // Show confirmation dialog
  const confirmed = await Dialog.confirm({
    title: "Strain Reroll",
    content: `
      <div class="blue-planet-strain-dialog">
        <p><strong>Spend 1 ${strainType} strain to reroll?</strong></p>
        <p><em>Warning:</em> If the reroll also fails, you will lose 1 ${strainType === 'mental' ? 'Psyche' : 'Physique'} temporarily until recovery.</p>
        <p><strong>Available ${strainType} strain:</strong> ${availableStrain}</p>
      </div>
    `,
    yes: () => true,
    no: () => false
  });
  
  if (!confirmed) return null;
  
  // Apply strain cost
  const newStrainValue = Math.min(currentStrain + 1, maxStrain);
  await actor.update({[`system.strain.${strainType}.value`]: newStrainValue});
  
  // Update actor sheet pips if it exists
  const actorSheet = Object.values(ui.windows).find(w => w.actor?.id === actor.id);
  if (actorSheet && actorSheet._updatePipClasses) {
    actorSheet._updatePipClasses('strain', strainType, newStrainValue);
  }
  
  // Make the reroll
  const reroll = new Roll(rollFormula);
  await reroll.evaluate();
  
  const rerollSuccess = reroll.total <= rollData.targetNumber;
  const rerollActionValue = rollData.targetNumber - reroll.total;
  
  console.log(`BluePlanet Strain: Reroll attempt - Original: ${originalRoll.total}, Reroll: ${reroll.total}, Success: ${rerollSuccess}`);
  
  if (rerollSuccess) {
    // Reroll succeeded - strain spent but no attribute loss
    ui.notifications.info(`Strain reroll succeeded! Action Value: ${rerollActionValue}`);
    
    return {
      success: true,
      roll: reroll,
      actionValue: rerollActionValue,
      targetNumber: rollData.targetNumber,
      strainSpent: 1,
      attributeLost: false
    };
  } else {
    // Reroll failed - strain spent AND attribute reduced
    const attributeName = strainType === 'mental' ? 'psyche' : 'physique';
    const attributeReduction = await applyAttributeReduction(actor, attributeName, 1);
    
    ui.notifications.warn(`Strain reroll failed! Lost 1 ${attributeName} temporarily (${attributeReduction.newValue}). Action Value: ${rerollActionValue}`);
    
    return {
      success: false,
      roll: reroll,
      actionValue: rerollActionValue,
      targetNumber: rollData.targetNumber,
      strainSpent: 1,
      attributeLost: true,
      attributeReduction: attributeReduction
    };
  }
}

/**
 * Apply temporary attribute reduction due to failed strain reroll
 * @param {Actor} actor - The actor to affect
 * @param {string} attributeName - The attribute to reduce ('psyche' or 'physique')
 * @param {number} reduction - Amount to reduce (default 1)
 * @returns {Object} - Information about the reduction applied
 */
export async function applyAttributeReduction(actor, attributeName, reduction = 1) {
  if (!actor.system.attributes || !actor.system.attributes[attributeName]) {
    console.error(`Invalid attribute: ${attributeName}`);
    return null;
  }
  
  const attribute = actor.system.attributes[attributeName];
  const currentValue = attribute.value || 0;
  const newValue = Math.max(0, currentValue - reduction);
  
  // Apply the reduction
  await actor.update({[`system.attributes.${attributeName}.value`]: newValue});
  
  // Track the reduction for recovery
  const flags = actor.flags['blue-planet-recontact'] || {};
  const strainDamage = flags.strainDamage || {};
  
  if (!strainDamage[attributeName]) {
    strainDamage[attributeName] = {
      originalValue: currentValue,
      totalReduction: 0
    };
  }
  
  strainDamage[attributeName].totalReduction += reduction;
  
  await actor.update({
    'flags.blue-planet-recontact.strainDamage': strainDamage
  });
  
  console.log(`BluePlanet Strain: Applied ${reduction} ${attributeName} reduction to ${actor.name} (${currentValue} → ${newValue})`);
  
  return {
    attributeName,
    oldValue: currentValue,
    newValue: newValue,
    reduction: reduction,
    totalReduction: strainDamage[attributeName].totalReduction
  };
}

/**
 * Update actor's maximum strain values based on current Psyche/Physique
 * Should be called when attributes change
 * @param {Actor} actor - The actor to update
 * @returns {Promise<boolean>} - Whether any updates were made
 */
export async function updateMaxStrainValues(actor) {
  const psycheValue = actor.system.attributes?.psyche?.value || 0;
  const physiqueValue = actor.system.attributes?.physique?.value || 0;
  
  const newMaxMental = calculateMaxStrain(psycheValue);
  const newMaxPhysical = calculateMaxStrain(physiqueValue);
  
  // Check if current max values are different
  const currentMaxMental = actor.system.strain?.mental?.max || 0;
  const currentMaxPhysical = actor.system.strain?.physical?.max || 0;
  
  if (newMaxMental !== currentMaxMental || newMaxPhysical !== currentMaxPhysical) {
    // Update max values
    const updateData = {
      'system.strain.mental.max': newMaxMental,
      'system.strain.physical.max': newMaxPhysical
    };
    
    // Ensure current values don't exceed new maximums
    const currentMental = actor.system.strain?.mental?.value || 0;
    const currentPhysical = actor.system.strain?.physical?.value || 0;
    
    if (currentMental > newMaxMental) {
      updateData['system.strain.mental.value'] = newMaxMental;
    }
    if (currentPhysical > newMaxPhysical) {
      updateData['system.strain.physical.value'] = newMaxPhysical;
    }
    
    await actor.update(updateData);
    
    console.log(`BluePlanet Strain: Updated max strain for ${actor.name} - Mental: ${newMaxMental}, Physical: ${newMaxPhysical}`);
    return true;
  }
  
  return false;
}

/**
 * Recover strain and/or attribute damage through rest
 * @param {Actor} actor - The actor to recover
 * @param {Object} options - Recovery options
 * @returns {Object} - Information about what was recovered
 */
export async function recoverFromStrain(actor, options = {}) {
  const {
    recoverStrain = true,
    recoverAttributes = true,
    recoverWounds = false,
    strainAmount = 'standard', // 'standard' = 2, 'full' = all
    attributeAmount = 'full', // 'standard' = partial, 'full' = all
    woundAmount = { minor: 0, major: 0, mortal: 0 }
  } = options;
  
  const recoveryResults = {
    strainRecovered: { mental: 0, physical: 0 },
    attributesRecovered: {},
    woundsRecovered: { minor: 0, major: 0, mortal: 0 },
    message: ''
  };
  
  // Strain recovery
  if (recoverStrain && actor.system.strain) {
    for (const strainType of ['mental', 'physical']) {
      const current = actor.system.strain[strainType]?.value || 0;
      if (current > 0) {
        const maxStrain = actor.system.strain[strainType].max || (strainType === 'mental' ? 4 : 6);
        let recovered = 0;
        
        if (strainAmount === 'full') {
          recovered = current; // Recover all
        } else if (typeof strainAmount === 'number') {
          recovered = Math.min(current, strainAmount);
        }
        
        const newValue = current - recovered;
        await actor.update({[`system.strain.${strainType}.value`]: newValue});
        
        recoveryResults.strainRecovered[strainType] = recovered;
        
        // Update actor sheet pips if it exists
        const actorSheet = Object.values(ui.windows).find(w => w.actor?.id === actor.id);
        if (actorSheet && actorSheet._updatePipClasses) {
          actorSheet._updatePipClasses('strain', strainType, newValue);
        }
      }
    }
  }
  
  // Attribute damage recovery
  if (recoverAttributes) {
    const flags = actor.flags['blue-planet-recontact'] || {};
    const strainDamage = flags.strainDamage || {};
    
    for (const [attributeName, damageInfo] of Object.entries(strainDamage)) {
      if (damageInfo.totalReduction > 0) {
        let recovered = 0;
        
        if (attributeAmount === 'full') {
          recovered = damageInfo.totalReduction;
        } else if (typeof attributeAmount === 'number') {
          recovered = Math.min(damageInfo.totalReduction, attributeAmount);
        }
        
        const currentValue = actor.system.attributes[attributeName]?.value || 0;
        const newValue = currentValue + recovered;
        
        await actor.update({[`system.attributes.${attributeName}.value`]: newValue});
        
        // Update tracking
        const newTotalReduction = damageInfo.totalReduction - recovered;
        if (newTotalReduction <= 0) {
          // Fully recovered, remove tracking
          delete strainDamage[attributeName];
        } else {
          strainDamage[attributeName].totalReduction = newTotalReduction;
        }
        
        recoveryResults.attributesRecovered[attributeName] = {
          recovered: recovered,
          newValue: newValue
        };
      }
    }
    
    // Update flags
    await actor.update({
      'flags.blue-planet-recontact.strainDamage': strainDamage
    });
  }
  
  // Wound recovery
  if (recoverWounds && actor.system.wounds) {
    const updates = {};
    const currentWounds = actor.system.wounds;
    
    // Recover minor wounds
    if (woundAmount.minor > 0 && currentWounds.minor > 0) {
      const recovered = Math.min(currentWounds.minor, woundAmount.minor);
      updates['system.wounds.minor'] = Math.max(0, currentWounds.minor - recovered);
      recoveryResults.woundsRecovered.minor = recovered;
    }
    
    // Recover major wounds
    if (woundAmount.major > 0 && currentWounds.major > 0) {
      const recovered = Math.min(currentWounds.major, woundAmount.major);
      updates['system.wounds.major'] = Math.max(0, currentWounds.major - recovered);
      recoveryResults.woundsRecovered.major = recovered;
    }
    
    // Recover mortal wounds
    if (woundAmount.mortal > 0 && currentWounds.mortal > 0) {
      const recovered = Math.min(currentWounds.mortal, woundAmount.mortal);
      updates['system.wounds.mortal'] = Math.max(0, currentWounds.mortal - recovered);
      recoveryResults.woundsRecovered.mortal = recovered;
    }
    
    // Apply wound updates if any
    if (Object.keys(updates).length > 0) {
      await actor.update(updates);
      
      // Update actor sheet wound pips if sheet is open
      const actorSheet = Object.values(ui.windows).find(w => w.actor?.id === actor.id);
      if (actorSheet && actorSheet._updatePipClasses) {
        if (recoveryResults.woundsRecovered.minor > 0) {
          actorSheet._updatePipClasses('wound', 'minor', updates['system.wounds.minor']);
        }
        if (recoveryResults.woundsRecovered.major > 0) {
          actorSheet._updatePipClasses('wound', 'major', updates['system.wounds.major']);
        }
        if (recoveryResults.woundsRecovered.mortal > 0) {
          actorSheet._updatePipClasses('wound', 'mortal', updates['system.wounds.mortal']);
        }
      }
    }
  }
  
  // Generate recovery message
  const messages = [];
  
  if (recoveryResults.strainRecovered.mental > 0) {
    messages.push(`${recoveryResults.strainRecovered.mental} mental strain`);
  }
  if (recoveryResults.strainRecovered.physical > 0) {
    messages.push(`${recoveryResults.strainRecovered.physical} physical strain`);
  }
  
  for (const [attr, info] of Object.entries(recoveryResults.attributesRecovered)) {
    if (info.recovered > 0) {
      messages.push(`${info.recovered} ${attr.charAt(0).toUpperCase() + attr.slice(1)} (now ${info.newValue})`);
    }
  }
  
  // Add wound recovery messages
  if (recoveryResults.woundsRecovered.minor > 0) {
    messages.push(`${recoveryResults.woundsRecovered.minor} minor wound${recoveryResults.woundsRecovered.minor > 1 ? 's' : ''}`);
  }
  if (recoveryResults.woundsRecovered.major > 0) {
    messages.push(`${recoveryResults.woundsRecovered.major} major wound${recoveryResults.woundsRecovered.major > 1 ? 's' : ''}`);
  }
  if (recoveryResults.woundsRecovered.mortal > 0) {
    messages.push(`${recoveryResults.woundsRecovered.mortal} mortal wound${recoveryResults.woundsRecovered.mortal > 1 ? 's' : ''}`);
  }
  
  recoveryResults.message = messages.length > 0 
    ? `Recovered: ${messages.join(', ')}`
    : 'No strain, attribute damage, or wounds to recover';
  
  ui.notifications.info(recoveryResults.message);
  console.log(`BluePlanet Strain: ${actor.name} recovery:`, recoveryResults);
  
  return recoveryResults;
}

/**
 * Get the current strain status for an actor
 * @param {Actor} actor - The actor to check
 * @returns {Object} - Current strain and attribute damage status
 */
export function getStrainStatus(actor) {
  if (!actor.system.strain) {
    console.warn('Actor has no strain system');
    return null;
  }

  // Calculate max strain based on current attribute values
  const psycheValue = actor.system.attributes?.psyche?.value || 0;
  const physiqueValue = actor.system.attributes?.physique?.value || 0;
  
  const maxMentalStrain = calculateMaxStrain(psycheValue);
  const maxPhysicalStrain = calculateMaxStrain(physiqueValue);
  
  const currentMentalStrain = actor.system.strain.mental?.value || 0;
  const currentPhysicalStrain = actor.system.strain.physical?.value || 0;
  
  const flags = actor.flags['blue-planet-recontact'] || {};
  const strainDamage = flags.strainDamage || {};
  
  return {
    mental: {
      current: currentMentalStrain,
      max: maxMentalStrain,
      available: maxMentalStrain - currentMentalStrain,
      attributeValue: psycheValue
    },
    physical: {
      current: currentPhysicalStrain,
      max: maxPhysicalStrain,
      available: maxPhysicalStrain - currentPhysicalStrain,
      attributeValue: physiqueValue
    },
    attributeDamage: strainDamage
  };
}

