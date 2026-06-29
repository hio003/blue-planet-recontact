/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 */
export const preloadHandlebarsTemplates = async function() {
  return foundry.applications.handlebars.loadTemplates([
    // Actor partials
    "systems/blue-planet-recontact/templates/actor/parts/actor-attributes.hbs",
    "systems/blue-planet-recontact/templates/actor/parts/actor-skills.hbs",
    "systems/blue-planet-recontact/templates/actor/parts/actor-items.hbs",
    "systems/blue-planet-recontact/templates/actor/parts/actor-wounds.hbs",
    "systems/blue-planet-recontact/templates/actor/parts/creature-biology.html",
    
    // Actor profile popout
    "systems/blue-planet-recontact/templates/actor/actor-profile.hbs",
    
    // Item sheets
    "systems/blue-planet-recontact/templates/item/item-skill-sheet.hbs",
    
    // Vehicle & Remote sheets
    "systems/blue-planet-recontact/templates/actor/actor-vehicle-sheet.hbs",
    "systems/blue-planet-recontact/templates/actor/actor-remote-sheet.hbs",
    
    // Roll card template
    "systems/blue-planet-recontact/templates/roll-card.hbs",
    
    // Chat partials (these may need to be created as .hbs files if they don't exist)
    "systems/blue-planet-recontact/templates/chat/skill-roll.hbs",
    "systems/blue-planet-recontact/templates/chat/attribute-roll.hbs",
    "systems/blue-planet-recontact/templates/chat/damage-roll.hbs",
    "systems/blue-planet-recontact/templates/chat/item-roll.hbs",
  ]);
};
