/**
 * Advancement Tracker for Blue Planet Recontact
 * Implements the chip-based advancement system from the manual.
 * 
 * Advancement Costs (from Blue Planet Recontact Player's Guide):
 * - Skill General → Core: 1 chip
 * - Skill Core → Specialty: 2 chips
 * - Increase skill rank: chips = new rank
 * - Increase attribute: 3 chips per point
 * - New skill (General, rank 1): 2 chips
 * - Tier advancement (Everyday → Professional): 5 chips
 * - Tier advancement (Professional → Elite): 10 chips
 */

export const ADVANCEMENT_COSTS = {
  // Skill advancement
  skill: {
    newSkill: 2,               // New general skill at rank 1
    rankIncrease: (newRank) => newRank, // chips = new rank value
    generalToCore: 1,          // Advance level type to Core
    coreToSpecialty: 2         // Advance level type to Specialty
  },
  // Attribute advancement
  attribute: {
    increase: 3                // Per point
  },
  // Tier advancement
  tier: {
    everydayToProfessional: 5,
    professionalToElite: 10
  }
};

export const TIER_LABELS = {
  everyday: "Everyday",
  professional: "Professional",
  elite: "Elite"
};

/**
 * Calculate cost to advance a skill rank
 * @param {number} currentRank - Current rank
 * @param {number} targetRank - Target rank
 * @returns {number} Total chip cost
 */
export function calculateSkillRankCost(currentRank, targetRank) {
  let cost = 0;
  for (let r = currentRank + 1; r <= targetRank; r++) {
    cost += r; // chips = new rank value
  }
  return cost;
}

/**
 * Calculate cost to advance skill level type
 * @param {string} currentLevel - 'general' | 'core' | 'specialty'
 * @param {string} targetLevel - 'general' | 'core' | 'specialty'
 * @returns {number} Chip cost
 */
export function calculateSkillLevelCost(currentLevel, targetLevel) {
  const levels = ['general', 'core', 'specialty'];
  const from = levels.indexOf(currentLevel);
  const to = levels.indexOf(targetLevel);
  if (to <= from) return 0;
  
  let cost = 0;
  if (from === 0 && to >= 1) cost += ADVANCEMENT_COSTS.skill.generalToCore;
  if (from <= 1 && to >= 2) cost += ADVANCEMENT_COSTS.skill.coreToSpecialty;
  return cost;
}

/**
 * Calculate total cost to advance an attribute
 * @param {number} currentValue - Current attribute value
 * @param {number} targetValue - Target attribute value
 * @returns {number} Total chip cost
 */
export function calculateAttributeCost(currentValue, targetValue) {
  const diff = Math.max(0, targetValue - currentValue);
  return diff * ADVANCEMENT_COSTS.attribute.increase;
}

/**
 * Calculate tier advancement cost
 * @param {string} currentTier - 'everyday' | 'professional' | 'elite'
 * @param {string} targetTier - 'everyday' | 'professional' | 'elite'
 * @returns {number} Chip cost
 */
export function calculateTierCost(currentTier, targetTier) {
  let cost = 0;
  if (currentTier === 'everyday' && (targetTier === 'professional' || targetTier === 'elite')) {
    cost += ADVANCEMENT_COSTS.tier.everydayToProfessional;
  }
  if ((currentTier === 'everyday' || currentTier === 'professional') && targetTier === 'elite') {
    cost += ADVANCEMENT_COSTS.tier.professionalToElite;
  }
  return cost;
}

/**
 * Show the Advancement Tracker dialog for an actor
 * @param {Actor} actor - The actor to show advancement for
 */
export async function showAdvancementDialog(actor) {
  if (!actor) {
    ui.notifications.warn('No actor selected for advancement.');
    return;
  }

  const chips = actor.system.advancement?.chips || 0;
  const currentTier = actor.system.tier || 'everyday';
  const skills = actor.system.skills || {};
  const attributes = actor.system.attributes || {};

  // Build skills list
  const skillRows = Object.entries(skills).map(([key, skill]) => {
    const levelType = skill.level_type || 'general';
    const rank = skill.rank || 1;
    const rankUpCost = rank + 1; // cost to go to next rank
    const levelUpCost = levelType === 'general' ? 1 : levelType === 'core' ? 2 : null;
    const levelUpLabel = levelType === 'general' ? 'Core (1 chip)' : levelType === 'core' ? 'Specialty (2 chips)' : 'Max Level';
    
    return `
      <tr>
        <td style="padding:3px 6px;">${skill.label || key}</td>
        <td style="padding:3px 6px; text-align:center;">${rank}</td>
        <td style="padding:3px 6px; text-align:center;">${levelType}</td>
        <td style="padding:3px 6px; text-align:center;">
          <button class="advance-skill-rank" data-skill="${key}" data-current-rank="${rank}" 
            data-cost="${rankUpCost}" style="font-size:10px; padding:2px 6px;" 
            ${chips < rankUpCost ? 'disabled' : ''}>
            Rank +1 (${rankUpCost} chips)
          </button>
        </td>
        <td style="padding:3px 6px; text-align:center;">
          ${levelType !== 'specialty' ? `
            <button class="advance-skill-level" data-skill="${key}" data-current-level="${levelType}"
              data-cost="${levelUpCost}" style="font-size:10px; padding:2px 6px;"
              ${chips < levelUpCost ? 'disabled' : ''}>
              → ${levelUpLabel}
            </button>
          ` : '<em style="color:#888">Max</em>'}
        </td>
      </tr>
    `;
  }).join('');

  // Build attributes list
  const attrRows = Object.entries(attributes).map(([key, attr]) => {
    const val = attr.value || 0;
    const cost = 3; // always 3 chips per point
    return `
      <tr>
        <td style="padding:3px 6px;">${key.charAt(0).toUpperCase() + key.slice(1)}</td>
        <td style="padding:3px 6px; text-align:center;">${val}</td>
        <td style="padding:3px 6px; text-align:center;">
          <button class="advance-attribute" data-attribute="${key}" data-current="${val}"
            data-cost="${cost}" style="font-size:10px; padding:2px 6px;"
            ${chips < cost ? 'disabled' : ''}>
            +1 (${cost} chips)
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Tier advancement
  const tierOrder = ['everyday', 'professional', 'elite'];
  const currentTierIdx = tierOrder.indexOf(currentTier);
  const nextTier = tierOrder[currentTierIdx + 1];
  const tierCost = nextTier ? calculateTierCost(currentTier, nextTier) : 0;

  const content = `
    <div style="color:#ddd; font-family: 'Helvetica Neue', sans-serif;">
      
      <!-- Chip Counter -->
      <div style="background: rgba(23,162,184,0.15); border: 1px solid #17a2b8; border-radius:6px; 
                  padding: 12px 16px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; color:#aaa;">Advancement Chips</div>
          <div style="font-size:28px; font-weight:bold; color:#17a2b8;" id="chip-display">${chips}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button id="chips-minus" style="padding:4px 10px; background:#555; border:1px solid #777; color:#fff; border-radius:4px; cursor:pointer;">−</button>
          <button id="chips-plus" style="padding:4px 10px; background:#555; border:1px solid #777; color:#fff; border-radius:4px; cursor:pointer;">+</button>
        </div>
      </div>

      <!-- Tier -->
      <div style="background:#2a2a2a; border:1px solid #444; border-radius:6px; padding:10px 14px; margin-bottom:12px;">
        <strong>Tier:</strong> <span style="color:#ffc107;">${TIER_LABELS[currentTier]}</span>
        ${nextTier ? `
          <button class="advance-tier" data-target-tier="${nextTier}" data-cost="${tierCost}"
            style="margin- px; font-size:10px; padding:2px 8px; background:#333; border:1px solid #666; color:#ddd; cursor:pointer;"
            ${chips < tierCost ? 'disabled' : ''}>
            → ${TIER_LABELS[nextTier]} (${tierCost} chips)
          </button>
        ` : '<span style="color:#888; margin- px;">(Max Tier)</span>'}
      </div>

      <!-- Skills -->
      <details open style="margin-bottom:10px;">
        <summary style="cursor:pointer; font-weight:bold; margin-bottom:6px; color:#17a2b8;">Skills</summary>
        ${Object.keys(skills).length > 0 ? `
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
              <thead>
                <tr style="border-bottom:1px solid #444; color:#aaa;">
                  <th style="text-align:left; padding:3px 6px;">Skill</th>
                  <th style="padding:3px 6px;">Rank</th>
                  <th style="padding:3px 6px;">Level</th>
                  <th style="padding:3px 6px;">Rank Up</th>
                  <th style="padding:3px 6px;">Level Up</th>
                </tr>
              </thead>
              <tbody>${skillRows}</tbody>
            </table>
          </div>
          <div style="font-size:10px; color:#888; margin- px;">
            New General Skill (rank 1): 2 chips — not shown above; add skill manually.
          </div>
        ` : '<p style="color:#888; font-style:italic;">No skills found.</p>'}
      </details>

      <!-- Attributes -->
      <details style="margin-bottom:10px;">
        <summary style="cursor:pointer; font-weight:bold; margin-bottom:6px; color:#17a2b8;">Attributes (3 chips / point)</summary>
        <table style="width:100%; border-collapse:collapse; font-size:11px;">
          <thead>
            <tr style="border-bottom:1px solid #444; color:#aaa;">
              <th style="text-align:left; padding:3px 6px;">Attribute</th>
              <th style="padding:3px 6px;">Current</th>
              <th style="padding:3px 6px;">Advance</th>
            </tr>
          </thead>
          <tbody>${attrRows}</tbody>
        </table>
      </details>

      <!-- Reference -->
      <details>
        <summary style="cursor:pointer; font-size:11px; color:#888;">Advancement Cost Reference</summary>
        <div style="font-size:10px; color:#aaa; margin- px; padding:8px; background:#1a1a1a; border-radius:4px;">
          <strong>Skills:</strong> New skill (General rank 1): 2 chips | Rank increase: new rank in chips | 
          General → Core: 1 chip | Core → Specialty: 2 chips<br>
          <strong>Attributes:</strong> +1 point: 3 chips<br>
          <strong>Tier:</strong> Everyday → Professional: 5 chips | Professional → Elite: 10 chips
        </div>
      </details>

    </div>
  `;

  const dialog = new Dialog({
    title: `Advancement — ${actor.name}`,
    content: content,
    buttons: {
      close: { label: "Close" }
    },
    default: "close",
    render: (html) => {
      // Chip counter buttons
      html.find('#chips-plus').on('click', async () => {
        const current = actor.system.advancement?.chips || 0;
        await actor.update({ 'system.advancement.chips': current + 1 });
        html.find('#chip-display').text(current + 1);
        ui.notifications.info(`Added 1 chip. Total: ${current + 1}`);
      });
      
      html.find('#chips-minus').on('click', async () => {
        const current = actor.system.advancement?.chips || 0;
        if (current <= 0) return;
        await actor.update({ 'system.advancement.chips': current - 1 });
        html.find('#chip-display').text(current - 1);
        ui.notifications.info(`Removed 1 chip. Total: ${current - 1}`);
      });

      // Skill rank advancement
      html.find('.advance-skill-rank').on('click', async (e) => {
        const btn = $(e.currentTarget);
        const skillKey = btn.data('skill');
        const currentRank = Number(btn.data('current-rank'));
        const cost = Number(btn.data('cost'));
        const chips = actor.system.advancement?.chips || 0;
        
        if (chips < cost) {
          ui.notifications.warn(`Not enough chips! Need ${cost}, have ${chips}.`);
          return;
        }
        
        const newRank = currentRank + 1;
        const updateData = {};
        updateData[`system.skills.${skillKey}.rank`] = newRank;
        updateData['system.advancement.chips'] = chips - cost;
        
        await actor.update(updateData);
        ui.notifications.info(`${actor.system.skills[skillKey]?.label || skillKey} advanced to rank ${newRank}. Spent ${cost} chips.`);
        dialog.close();
        showAdvancementDialog(actor); // Refresh
      });

      // Skill level advancement
      html.find('.advance-skill-level').on('click', async (e) => {
        const btn = $(e.currentTarget);
        const skillKey = btn.data('skill');
        const currentLevel = btn.data('current-level');
        const cost = Number(btn.data('cost'));
        const chips = actor.system.advancement?.chips || 0;
        
        if (chips < cost) {
          ui.notifications.warn(`Not enough chips! Need ${cost}, have ${chips}.`);
          return;
        }
        
        const nextLevel = currentLevel === 'general' ? 'core' : 'specialty';
        const updateData = {};
        updateData[`system.skills.${skillKey}.level_type`] = nextLevel;
        // Also set the old boolean flags for compatibility
        if (nextLevel === 'core') {
          updateData[`system.skills.${skillKey}.core`] = true;
        } else if (nextLevel === 'specialty') {
          updateData[`system.skills.${skillKey}.core`] = true;
          updateData[`system.skills.${skillKey}.specialty`] = true;
        }
        updateData['system.advancement.chips'] = chips - cost;
        
        await actor.update(updateData);
        ui.notifications.info(`${skillKey} advanced to ${nextLevel} level. Spent ${cost} chips.`);
        dialog.close();
        showAdvancementDialog(actor); // Refresh
      });

      // Attribute advancement
      html.find('.advance-attribute').on('click', async (e) => {
        const btn = $(e.currentTarget);
        const attrKey = btn.data('attribute');
        const currentVal = Number(btn.data('current'));
        const cost = Number(btn.data('cost'));
        const chips = actor.system.advancement?.chips || 0;
        
        if (chips < cost) {
          ui.notifications.warn(`Not enough chips! Need ${cost}, have ${chips}.`);
          return;
        }
        
        const updateData = {};
        updateData[`system.attributes.${attrKey}.value`] = currentVal + 1;
        updateData['system.advancement.chips'] = chips - cost;
        
        await actor.update(updateData);
        ui.notifications.info(`${attrKey} increased to ${currentVal + 1}. Spent ${cost} chips.`);
        dialog.close();
        showAdvancementDialog(actor); // Refresh
      });

      // Tier advancement
      html.find('.advance-tier').on('click', async (e) => {
        const btn = $(e.currentTarget);
        const targetTier = btn.data('target-tier');
        const cost = Number(btn.data('cost'));
        const chips = actor.system.advancement?.chips || 0;
        
        if (chips < cost) {
          ui.notifications.warn(`Not enough chips! Need ${cost}, have ${chips}.`);
          return;
        }
        
        await actor.update({
          'system.tier': targetTier,
          'system.advancement.chips': chips - cost
        });
        
        ui.notifications.info(`${actor.name} advanced to ${TIER_LABELS[targetTier]} tier! Spent ${cost} chips.`);
        dialog.close();
        showAdvancementDialog(actor); // Refresh
      });
    }
  }, {
    classes: ['blue-planet-recontact', 'dialog', "bpr-dialog"],
    width: 620,
    height: 'auto',
    resizable: true
  });
  
  dialog.render(true);
}
