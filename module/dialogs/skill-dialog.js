/**
 * Enhanced Skill Creation/Edit Dialog for Blue Planet Recontact
 * Allows users to create/edit skills with full customization options
 */

export class BluePlanetSkillDialog extends Dialog {
  constructor(actor, skillData = null, options = {}) {
    const isEdit = skillData !== null;
    const title = isEdit ? `Edit Skill: ${skillData.label}` : "Create New Skill";
    
    // Default skill data structure
    const defaultSkillData = {
      id: foundry.utils.randomID(),
      label: "",
      rank: 1,
      level_type: "general",
      aspect: "experiential",
      attribute: "cognition",
      specializations: [],
      description: ""
    };
    
    const skill = isEdit ? foundry.utils.mergeObject(defaultSkillData, skillData) : defaultSkillData;
    
    const content = `
      <form class="blue-planet-skill-dialog">
        <div class="skill-form-grid">
          <!-- Skill Name -->
          <div class="form-group full-width">
            <label for="skill-name"><strong>Skill Name:</strong></label>
            <input type="text" id="skill-name" name="label" value="${skill.label}" placeholder="Enter skill name" required>
          </div>
          
          <!-- Rank -->
          <div class="form-group">
            <label for="skill-rank"><strong>Rank:</strong></label>
            <input type="number" id="skill-rank" name="rank" value="${skill.rank}" min="1" max="6">
          </div>
          
          <!-- Level Type -->
          <div class="form-group">
            <label for="skill-level"><strong>Level:</strong></label>
            <select id="skill-level" name="level_type">
              <option value="general" ${skill.level_type === 'general' ? 'selected' : ''}>General (1d10)</option>
              <option value="core" ${skill.level_type === 'core' ? 'selected' : ''}>Core (2d10kl)</option>
              <option value="specialty" ${skill.level_type === 'specialty' ? 'selected' : ''}>Specialty (3d10kl)</option>
            </select>
          </div>
          
          <!-- Aspect -->
          <div class="form-group">
            <label for="skill-aspect"><strong>Aspect:</strong></label>
            <select id="skill-aspect" name="aspect">
              <option value="origin" ${skill.aspect === 'origin' ? 'selected' : ''}>Origin</option>
              <option value="background" ${skill.aspect === 'background' ? 'selected' : ''}>Background</option>
              <option value="occupation" ${skill.aspect === 'occupation' ? 'selected' : ''}>Occupation</option>
              <option value="experiential" ${skill.aspect === 'experiential' ? 'selected' : ''}>Experiential</option>
            </select>
          </div>
          
          <!-- Primary Attribute -->
          <div class="form-group">
            <label for="skill-attribute"><strong>Primary Attribute:</strong></label>
            <select id="skill-attribute" name="attribute">
              <option value="cognition" ${skill.attribute === 'cognition' ? 'selected' : ''}>Cognition</option>
              <option value="coordination" ${skill.attribute === 'coordination' ? 'selected' : ''}>Coordination</option>
              <option value="physique" ${skill.attribute === 'physique' ? 'selected' : ''}>Physique</option>
              <option value="psyche" ${skill.attribute === 'psyche' ? 'selected' : ''}>Psyche</option>
            </select>
          </div>
          
          <!-- Description -->
          <div class="form-group full-width">
            <label for="skill-description"><strong>Description:</strong></label>
            <textarea id="skill-description" name="description" rows="3" placeholder="Describe how this skill is used and any special notes">${skill.description || ""}</textarea>
          </div>
          
          <!-- Specializations (for Specialty level skills) -->
          <div class="form-group full-width specialization-section" style="display: ${skill.level_type === 'specialty' ? 'block' : 'none'};">
            <label><strong>Specializations:</strong></label>
            <div class="specializations-container">
              <div class="specialization-help">
                <em>Specialty skills can have specific focuses. Add specializations below:</em>
              </div>
              <div id="specializations-list">
                ${skill.specializations.map((spec, index) => `
                  <div class="specialization-item">
                    <input type="text" value="${spec}" placeholder="Specialization name">
                    <button type="button" class="remove-specialization">×</button>
                  </div>
                `).join('')}
              </div>
              <button type="button" id="add-specialization"><i class="fas fa-plus"></i> Add Specialization</button>
            </div>
          </div>
          
          <!-- Aspect Information -->
          <div class="form-group full-width aspect-info">
            <div class="aspect-help">
              <h4>Aspect Descriptions:</h4>
              <ul>
                <li><strong>Origin:</strong> Skills from your character's species, homeworld, or cultural background</li>
                <li><strong>Background:</strong> Skills from your character's upbringing, family, or early life experiences</li>
                <li><strong>Occupation:</strong> Skills learned through your character's profession or career</li>
                <li><strong>Experiential:</strong> Skills gained through life experiences, adventures, or personal interests</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
      
      <style>
        .blue-planet-skill-dialog {
          padding: 10px;
        }
        
        .skill-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          align-items: start;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-group label {
          color: #6bb6ff;
          font-size: 12px;
          font-weight: bold;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          background: rgba(26, 35, 50, 0.8);
          border: 1px solid #4a90e2;
          border-radius: 4px;
          color: #e0e0e0;
          padding: 8px;
          font-size: 12px;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #6bb6ff;
          box-shadow: 0 0 5px rgba(107, 182, 255, 0.3);
        }
        
        .specialization-item {
          display: flex;
          gap: 5px;
          margin-bottom: 5px;
          align-items: center;
        }
        
        .specialization-item input {
          flex: 1;
        }
        
        .remove-specialization {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 3px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .remove-specialization:hover {
          background: #c82333;
        }
        
        #add-specialization {
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          color: white;
          border: 1px solid #6bb6ff;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 11px;
          cursor: pointer;
          margin-top: 5px;
        }
        
        #add-specialization:hover {
          background: linear-gradient(135deg, #5aa0f2 0%, #4a90e2 100%);
        }
        
        .specialization-help {
          color: #b8d4f0;
          font-size: 11px;
          margin-bottom: 8px;
        }
        
        .aspect-help {
          background: rgba(42, 77, 107, 0.3);
          border: 1px solid #4a90e2;
          border-radius: 4px;
          padding: 12px;
          color: #e0e0e0;
          font-size: 11px;
        }
        
        .aspect-help h4 {
          color: #6bb6ff;
          margin: 0 0 8px 0;
          font-size: 12px;
        }
        
        .aspect-help ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .aspect-help li {
          margin-bottom: 4px;
        }
        
        .aspect-help strong {
          color: #40e0d0;
        }
      </style>
    `;

    const buttons = {
      save: {
        label: isEdit ? "Update Skill" : "Create Skill",
        callback: (html) => this._onSaveSkill(html, actor, skill, isEdit),
        icon: '<i class="fas fa-save"></i>'
      },
      cancel: {
        label: "Cancel",
        callback: () => false,
        icon: '<i class="fas fa-times"></i>'
      }
    };

    if (isEdit) {
      buttons.delete = {
        label: "Delete Skill",
        callback: () => this._onDeleteSkill(actor, skill.id),
        icon: '<i class="fas fa-trash"></i>'
      };
    }

    super({
      title: title,
      content: content,
      buttons: buttons,
      default: "save",
      render: (html) => this._activateListeners(html),
      close: () => null
    }, options);

    this.actor = actor;
    this.skillData = skill;
    this.isEdit = isEdit;
  }

  _activateListeners(html) {
    // Handle level type change to show/hide specializations
    html.find('#skill-level').change((event) => {
      const levelType = event.target.value;
      const specializationSection = html.find('.specialization-section');
      if (levelType === 'specialty') {
        specializationSection.show();
      } else {
        specializationSection.hide();
      }
    });

    // Handle adding specializations
    html.find('#add-specialization').click(() => {
      const container = html.find('#specializations-list');
      const newSpec = $(`
        <div class="specialization-item">
          <input type="text" value="" placeholder="Specialization name">
          <button type="button" class="remove-specialization">×</button>
        </div>
      `);
      container.append(newSpec);
      
      // Activate remove button for new item
      newSpec.find('.remove-specialization').click((e) => {
        $(e.target).closest('.specialization-item').remove();
      });
    });

    // Handle removing specializations
    html.find('.remove-specialization').click((e) => {
      $(e.target).closest('.specialization-item').remove();
    });
  }

  async _onSaveSkill(html, actor, skillData, isEdit) {
    const formData = new FormData(html.find('form')[0]);
    const updatedSkill = {
      id: skillData.id,
      label: formData.get('label').trim(),
      rank: parseInt(formData.get('rank')),
      level_type: formData.get('level_type'),
      aspect: formData.get('aspect'),
      attribute: formData.get('attribute'),
      description: formData.get('description').trim(),
      specializations: []
    };

    // Collect specializations
    html.find('.specialization-item input').each((index, input) => {
      const value = $(input).val().trim();
      if (value) {
        updatedSkill.specializations.push(value);
      }
    });

    // Validation
    if (!updatedSkill.label) {
      ui.notifications.warn("Skill name is required!");
      return false;
    }

    // Get current skills
    const currentSkills = foundry.utils.deepClone(actor.system.skills || {});

    // Add or update the skill
    currentSkills[updatedSkill.id] = updatedSkill;

    // Update actor
    try {
      await actor.update({ 'system.skills': currentSkills });
      ui.notifications.info(isEdit ? 
        `Skill "${updatedSkill.label}" updated successfully!` : 
        `Skill "${updatedSkill.label}" created successfully!`);
      return true;
    } catch (error) {
      ui.notifications.error("Failed to save skill. Check console for details.");
      console.error("BluePlanet Skill Dialog: Error saving skill:", error);
      return false;
    }
  }

  async _onDeleteSkill(actor, skillId) {
    const confirm = await Dialog.confirm({
      title: "Delete Skill",
      content: "<p>Are you sure you want to delete this skill? This cannot be undone.</p>",
      yes: () => true,
      no: () => false
    });

    if (!confirm) return false;

    const currentSkills = foundry.utils.deepClone(actor.system.skills || {});
    const skillName = currentSkills[skillId]?.label || "Unknown";
    
    delete currentSkills[skillId];

    try {
      await actor.update({ 'system.skills': currentSkills });
      ui.notifications.info(`Skill "${skillName}" deleted successfully!`);
      return true;
    } catch (error) {
      ui.notifications.error("Failed to delete skill. Check console for details.");
      console.error("BluePlanet Skill Dialog: Error deleting skill:", error);
      return false;
    }
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["blue-planet-recontact", "skill-dialog"],
      width: 600,
      height: "auto",
      resizable: true
    });
  }
}