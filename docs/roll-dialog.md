# Blue Planet Roll Dialog

## Overview
The Blue Planet Roll Dialog provides a comprehensive interface for making skill rolls in the Blue Planet Recontact system. It includes all the mechanics from the Blue Planet rules including attribute selection, focus attributes, strain spending, equipment bonuses, and situational modifiers.

## Features

### Attribute & Focus Selection
- Choose between the four primary attributes (Cognition, Psyche, Coordination, Physique)
- Option to use focus attributes instead of primary attributes
- Dynamically updates focus options based on selected attribute

### Strain System
- **Mental Strain**: Spend 1-4 points for roll bonuses (maximum limited by current strain)
- **Physical Strain**: Spend 1-6 points for roll bonuses (maximum limited by current strain)
- Automatically updates character's strain values when spent

### Equipment & Biomods
- Automatically detects equipment, weapons, and biomods with bonuses
- Checkboxes for each item with applicable bonuses
- Only shows items that have non-zero bonus values

### Situational Modifiers
- **Difficulty**: Predefined difficulty levels (Easy to Legendary)
- **Environmental**: Custom environmental modifiers (-10 to +10)
- **Other**: Additional situational modifiers

### Roll Options
- **Push the Roll**: Option for rerolls with complication risks
- **Target Number**: Customizable target number (default 10)

### Result Calculation
The dialog calculates results using Blue Planet mechanics:
- **Exceptional Success**: Action Value 5+ (roll result 5+ below target)
- **Success**: Action Value 1-4 (roll result 1-4 below target)
- **Complication**: Action Value 0 (roll result equals target)
- **Failure**: Action Value -1 to -4 (roll result 1-4 above target)
- **Critical Failure**: Action Value -5 or worse (roll result 5+ above target)

## Usage

### From Skill Sheets
1. Open any skill item sheet
2. Click the "Roll Skill" button in the header
3. Configure options in the dialog
4. Click "Roll" to execute

### Programmatic Usage
```javascript
import { BluePlanetRollDialog } from './roll-dialog.js';

const rollData = {
  label: "Swimming",
  type: "skill",
  skillName: "Swimming", 
  skillRank: 3,
  attribute: "physique",
  attributeValue: 4,
  dice: "1d10",
  targetNumber: 10
};

const dialog = new BluePlanetRollDialog(actor, rollData);
dialog.render(true);
```

## Integration

### CSS Styling
The dialog uses custom CSS classes defined in `styles/roll-dialog.css` for Blue Planet theming.

### Character Sheet Integration  
The dialog automatically reads character data including:
- Current attribute values
- Focus attribute names and values
- Current strain levels (mental/physical)
- Equipment items with bonuses
- Biomod items with bonuses

### Chat Output
Roll results are sent to chat with:
- Detailed breakdown of modifiers
- Color-coded success/failure indication
- Action Value calculation
- Mechanical consequences for exceptional/critical results

## File Structure
- `module/roll-dialog.js` - Main dialog class
- `styles/roll-dialog.css` - Dialog styling
- `module/sheets/item-skill-sheet.js` - Skill sheet integration
- `docs/roll-dialog.md` - This documentation

## Dependencies
- Foundry VTT v11+
- Blue Planet Recontact system
- Character must have properly configured attributes and strain values
