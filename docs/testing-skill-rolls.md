# Testing Skill Roll Dialog

## Setup

1. Create a new actor (character)
2. Add a skill item to the character
3. Configure the skill with different level types

## Test Cases

### Test 1: General Level Skill (1d10)
1. Open a skill sheet
2. Set "Current Level" to "General (1d10)"
3. Set rank to any value (e.g., 3)
4. Set primary attribute (e.g., Cognition)
5. Click "Roll Skill" button
6. **Expected**: Dialog opens with dice formula "1d10"

### Test 2: Core Level Skill (2d10 keep lowest)
1. Open a skill sheet
2. Set "Current Level" to "Core (2d10, keep lowest)"
3. Set rank to any value (e.g., 4)
4. Set primary attribute (e.g., Coordination)
5. Click "Roll Skill" button
6. **Expected**: Dialog opens with dice formula "2d10kl"

### Test 3: Specialty Level Skill (3d10 keep lowest)
1. Open a skill sheet
2. Set "Current Level" to "Specialty (3d10, keep lowest)"
3. Set rank to any value (e.g., 5)
4. Set primary attribute (e.g., Physique)
5. Click "Roll Skill" button
6. **Expected**: Dialog opens with dice formula "3d10kl"

## Debugging

Check the browser console for debug messages:
- Look for "BluePlanet Skill Roll - [SkillName]:" messages
- Verify Level Type, Dice Formula, and Attribute are correct
- Check "Rolling with formula:" messages during actual rolls

## Expected Dialog Features

When the roll dialog opens, you should see:

1. **Header Section**:
   - Skill name and level type
   - Base calculation (attribute + skill rank)
   - Dice formula with level indicator

2. **Attribute & Focus Section**:
   - Dropdown to select different attributes
   - Option to use focus attributes if available

3. **Strain Section**:
   - Mental strain spending (max 4)
   - Physical strain spending (max 6)

4. **Equipment & Biomods Section**:
   - Checkboxes for items with bonuses
   - Automatic calculation of available bonuses

5. **Situational Modifiers**:
   - Difficulty dropdown
   - Environmental modifier input
   - Other modifiers input

6. **Roll Options**:
   - Push roll checkbox
   - Target number input

## Troubleshooting

If dice formulas are not working correctly:

1. Check browser console for error messages
2. Verify skill `system.level_type` is set correctly
3. Ensure skill is owned by an actor
4. Check that the roll dialog is imported correctly

## Chat Output

After rolling, the chat should show:
- Dice formula used (1d10, 2d10kl, or 3d10kl)
- Level type indicator
- Roll result with individual dice shown for multi-die rolls
- Success/failure determination
- Action Value calculation
