/**
 * Blue Planet Strain Mechanics System
 * Implements the strain rules as described in the Blue Planet RPG
 */

/**
 * Apply strain for a +2 bonus to target number (pre-roll)
 * @param {Actor} actor - The actor using strain
 * @param {string} strainType - 'mental' or 'physical'
 * @param {number} amount - Amount of strain to spend (default 1)
 * @returns {boolean} - Whether strain was successfully applied
 */
export async function applyStrainBonus(actor, strainType, amount = 1) {
  if (!actor.system.strain || !actor.system.strain[strainType]) {
    ui.notifications.warn(`Invalid strain type: ${strainType}`);
    return false;
  }
  
  const currentStrain = actor.system.strain[strainType].value || 0;
  const maxStrain = actor.system.strain[strainType].max || (strainType === 'mental' ? 4 : 6);
  const availableStrain = maxStrain - currentStrain;
  
  if (availableStrain < amount) {
    ui.notifications.warn(`Insufficient ${strainType} strain! Available: ${availableStrain}, Required: ${amount}`);
    return false;
  }
  
  // Apply strain
  const newStrainValue = Math.min(currentStrain + amount, maxStrain);
  await actor.update({[`system.strain.${strainType}.value`]: newStrainValue});
  
  // Update actor sheet pips if it exists
  const actorSheet = Object.values(ui.windows).find(w => w.actor?.id === actor.id);
  if (actorSheet && actorSheet._updatePipClasses) {
    actorSheet._updatePipClasses('strain', strainType, newStrainValue);
  }
  
  ui.notifications.info(`Spent ${amount} ${strainType} strain for +${amount * 2} bonus to target number`);
  console.log(`BluePlanet Strain: Applied ${amount} ${strainType} strain to ${actor.name}`);
  
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
  const maxStrain = actor.system.strain[strainType].max || (strainType === 'mental' ? 4 : 6);
  const availableStrain = maxStrain - currentStrain;
  
  if (availableStrain < 1) {
    ui.notifications.warn(`No ${strainType} strain available for reroll!`);
    return null;
  }
  
  // Show confirmation dialog
  const confirmed = await Dialog.confirm({
    title: \"Strain Reroll\",\n    content: `\n      <div class=\"blue-planet-strain-dialog\">\n        <p><strong>Spend 1 ${strainType} strain to reroll?</strong></p>\n        <p><em>Warning:</em> If the reroll also fails, you will lose 1 ${strainType === 'mental' ? 'Psyche' : 'Physique'} temporarily until recovery.</p>\n        <p><strong>Available ${strainType} strain:</strong> ${availableStrain}</p>\n      </div>\n    `,\n    yes: () => true,\n    no: () => false\n  });\n  \n  if (!confirmed) return null;\n  \n  // Apply strain cost\n  const newStrainValue = Math.min(currentStrain + 1, maxStrain);\n  await actor.update({[`system.strain.${strainType}.value`]: newStrainValue});\n  \n  // Update actor sheet pips if it exists\n  const actorSheet = Object.values(ui.windows).find(w => w.actor?.id === actor.id);\n  if (actorSheet && actorSheet._updatePipClasses) {\n    actorSheet._updatePipClasses('strain', strainType, newStrainValue);\n  }\n  \n  // Make the reroll\n  const reroll = new Roll(rollFormula);\n  await reroll.evaluate();\n  \n  const rerollSuccess = reroll.total <= rollData.targetNumber;\n  const rerollActionValue = rollData.targetNumber - reroll.total;\n  \n  console.log(`BluePlanet Strain: Reroll attempt - Original: ${originalRoll.total}, Reroll: ${reroll.total}, Success: ${rerollSuccess}`);\n  \n  if (rerollSuccess) {\n    // Reroll succeeded - strain spent but no attribute loss\n    ui.notifications.info(`Strain reroll succeeded! Action Value: ${rerollActionValue}`);\n    \n    return {\n      success: true,\n      roll: reroll,\n      actionValue: rerollActionValue,\n      strainSpent: 1,\n      attributeLost: false\n    };\n  } else {\n    // Reroll failed - strain spent AND attribute reduced\n    const attributeName = strainType === 'mental' ? 'psyche' : 'physique';\n    const attributeReduction = await applyAttributeReduction(actor, attributeName, 1);\n    \n    ui.notifications.warn(`Strain reroll failed! Lost 1 ${attributeName} temporarily (${attributeReduction.newValue}). Action Value: ${rerollActionValue}`);\n    \n    return {\n      success: false,\n      roll: reroll,\n      actionValue: rerollActionValue,\n      strainSpent: 1,\n      attributeLost: true,\n      attributeReduction: attributeReduction\n    };\n  }\n}\n\n/**\n * Apply temporary attribute reduction due to failed strain reroll\n * @param {Actor} actor - The actor to affect\n * @param {string} attributeName - The attribute to reduce ('psyche' or 'physique')\n * @param {number} reduction - Amount to reduce (default 1)\n * @returns {Object} - Information about the reduction applied\n */\nexport async function applyAttributeReduction(actor, attributeName, reduction = 1) {\n  if (!actor.system.attributes || !actor.system.attributes[attributeName]) {\n    console.error(`Invalid attribute: ${attributeName}`);\n    return null;\n  }\n  \n  const attribute = actor.system.attributes[attributeName];\n  const currentValue = attribute.value || 0;\n  const newValue = Math.max(0, currentValue - reduction);\n  \n  // Apply the reduction\n  await actor.update({[`system.attributes.${attributeName}.value`]: newValue});\n  \n  // Track the reduction for recovery\n  const flags = actor.flags['blue-planet-recontact'] || {};\n  const strainDamage = flags.strainDamage || {};\n  \n  if (!strainDamage[attributeName]) {\n    strainDamage[attributeName] = {\n      originalValue: currentValue,\n      totalReduction: 0\n    };\n  }\n  \n  strainDamage[attributeName].totalReduction += reduction;\n  \n  await actor.update({\n    'flags.blue-planet-recontact.strainDamage': strainDamage\n  });\n  \n  console.log(`BluePlanet Strain: Applied ${reduction} ${attributeName} reduction to ${actor.name} (${currentValue} → ${newValue})`);\n  \n  return {\n    attributeName,\n    oldValue: currentValue,\n    newValue: newValue,\n    reduction: reduction,\n    totalReduction: strainDamage[attributeName].totalReduction\n  };\n}\n\n/**\n * Recover strain and/or attribute damage through rest\n * @param {Actor} actor - The actor to recover\n * @param {Object} options - Recovery options\n * @returns {Object} - Information about what was recovered\n */\nexport async function recoverFromStrain(actor, options = {}) {\n  const {\n    recoverStrain = true,\n    recoverAttributes = true,\n    strainAmount = 'full',\n    attributeAmount = 'full',\n    requiresRest = true\n  } = options;\n  \n  const recoveryResults = {\n    strainRecovered: { mental: 0, physical: 0 },\n    attributesRecovered: {},\n    message: ''\n  };\n  \n  // Strain recovery\n  if (recoverStrain && actor.system.strain) {\n    for (const strainType of ['mental', 'physical']) {\n      const current = actor.system.strain[strainType]?.value || 0;\n      if (current > 0) {\n        const maxStrain = actor.system.strain[strainType].max || (strainType === 'mental' ? 4 : 6);\n        let recovered = 0;\n        \n        if (strainAmount === 'full') {\n          recovered = current; // Recover all\n        } else if (typeof strainAmount === 'number') {\n          recovered = Math.min(current, strainAmount);\n        }\n        \n        const newValue = current - recovered;\n        await actor.update({[`system.strain.${strainType}.value`]: newValue});\n        \n        recoveryResults.strainRecovered[strainType] = recovered;\n        \n        // Update actor sheet pips if it exists\n        const actorSheet = Object.values(ui.windows).find(w => w.actor?.id === actor.id);\n        if (actorSheet && actorSheet._updatePipClasses) {\n          actorSheet._updatePipClasses('strain', strainType, newValue);\n        }\n      }\n    }\n  }\n  \n  // Attribute damage recovery\n  if (recoverAttributes) {\n    const flags = actor.flags['blue-planet-recontact'] || {};\n    const strainDamage = flags.strainDamage || {};\n    \n    for (const [attributeName, damageInfo] of Object.entries(strainDamage)) {\n      if (damageInfo.totalReduction > 0) {\n        let recovered = 0;\n        \n        if (attributeAmount === 'full') {\n          recovered = damageInfo.totalReduction;\n        } else if (typeof attributeAmount === 'number') {\n          recovered = Math.min(damageInfo.totalReduction, attributeAmount);\n        }\n        \n        const currentValue = actor.system.attributes[attributeName]?.value || 0;\n        const newValue = currentValue + recovered;\n        \n        await actor.update({[`system.attributes.${attributeName}.value`]: newValue});\n        \n        // Update tracking\n        const newTotalReduction = damageInfo.totalReduction - recovered;\n        if (newTotalReduction <= 0) {\n          // Fully recovered, remove tracking\n          delete strainDamage[attributeName];\n        } else {\n          strainDamage[attributeName].totalReduction = newTotalReduction;\n        }\n        \n        recoveryResults.attributesRecovered[attributeName] = {\n          recovered: recovered,\n          newValue: newValue\n        };\n      }\n    }\n    \n    // Update flags\n    await actor.update({\n      'flags.blue-planet-recontact.strainDamage': strainDamage\n    });\n  }\n  \n  // Generate recovery message\n  const messages = [];\n  \n  if (recoveryResults.strainRecovered.mental > 0) {\n    messages.push(`${recoveryResults.strainRecovered.mental} mental strain`);\n  }\n  if (recoveryResults.strainRecovered.physical > 0) {\n    messages.push(`${recoveryResults.strainRecovered.physical} physical strain`);\n  }\n  \n  for (const [attr, info] of Object.entries(recoveryResults.attributesRecovered)) {\n    if (info.recovered > 0) {\n      messages.push(`${info.recovered} ${attr.charAt(0).toUpperCase() + attr.slice(1)} (now ${info.newValue})`);\n    }\n  }\n  \n  recoveryResults.message = messages.length > 0 \n    ? `Recovered: ${messages.join(', ')}`\n    : 'No strain or attribute damage to recover';\n  \n  ui.notifications.info(recoveryResults.message);\n  console.log(`BluePlanet Strain: ${actor.name} recovery:`, recoveryResults);\n  \n  return recoveryResults;\n}\n\n/**\n * Get the current strain status for an actor\n * @param {Actor} actor - The actor to check\n * @returns {Object} - Current strain and attribute damage status\n */\nexport function getStrainStatus(actor) {\n  const strain = actor.system.strain || {};\n  const flags = actor.flags['blue-planet-recontact'] || {};\n  const strainDamage = flags.strainDamage || {};\n  \n  return {\n    mental: {\n      current: strain.mental?.value || 0,\n      max: strain.mental?.max || 4,\n      available: (strain.mental?.max || 4) - (strain.mental?.value || 0)\n    },\n    physical: {\n      current: strain.physical?.value || 0,\n      max: strain.physical?.max || 6,\n      available: (strain.physical?.max || 6) - (strain.physical?.value || 0)\n    },\n    attributeDamage: strainDamage\n  };\n}\n\n/**\n * Determine appropriate strain type based on test type\n * @param {string} testType - Type of test ('attribute', 'skill')\n * @param {string} attributeName - Primary attribute for the test\n * @param {Object} rollData - Additional roll data\n * @returns {string} - Recommended strain type ('mental' or 'physical')\n */\nexport function determineStrainType(testType, attributeName, rollData = {}) {\n  // Mental tasks: cognition, psyche-based tests\n  if (['cognition', 'psyche'].includes(attributeName?.toLowerCase())) {\n    return 'mental';\n  }\n  \n  // Physical tasks: coordination, physique-based tests\n  if (['coordination', 'physique'].includes(attributeName?.toLowerCase())) {\n    return 'physical';\n  }\n  \n  // For skill tests, try to determine from skill category or description\n  if (testType === 'skill' && rollData.skillName) {\n    const skillName = rollData.skillName.toLowerCase();\n    \n    // Common mental skills\n    const mentalSkills = ['academics', 'computers', 'investigation', 'language', 'medicine', 'sciences', 'technical'];\n    if (mentalSkills.some(skill => skillName.includes(skill))) {\n      return 'mental';\n    }\n    \n    // Common physical skills\n    const physicalSkills = ['athletics', 'brawl', 'drive', 'firearms', 'larceny', 'pilot', 'stealth', 'survival'];\n    if (physicalSkills.some(skill => skillName.includes(skill))) {\n      return 'physical';\n    }\n  }\n  \n  // Default to mental if uncertain\n  return 'mental';\n}"