# How to Populate Blue Planet Recontact Compendiums

The system includes seed scripts that populate all compendiums with game content.
Each script can be run independently as a GM Script Macro.

## Quick Method — One at a time

1. Open **Macros** → **New Macro** → type: **Script**
2. Open the file `systems/blue-planet-recontact/scripts/SCRIPTNAME.js`
3. Paste the full contents into the macro
4. Run as GM

## Available Seeders

| Script | Compendium | Content |
|--------|-----------|---------|
| `seed-weapons-compendium.js` | `weapons` | 20 weapons: melee, pistols, rifles, shotguns, support, underwater |
| `seed-ammunition-compendium.js` | `ammunition` | 30 ammo types: all calibers, flechettes, gel, grenades |
| `seed-cyberware-compendium.js` | `cyberware` | 12 hardware implants: NI, combat, prosthetics, utilities |
| `seed-sensors-compendium.js` | `sensors` | 15 sensor systems: optical, sonar, radar, chemical, biometric |
| `seed-features-compendium.js` | `features` | 18 features: training packages, backgrounds, special abilities |
| `seed-biomods-compendium.js` | `biomods` | Wetware biomodifications (Player's Guide) |
| `seed-species-compendium.js` | `species` | Playable species templates |
| `seed-creatures-compendium.js` | `creatures` | 12 Poseidon fauna from the Biosurvey |
| `populate-vehicle-remote-compendiums.js` | `vehicles` / `remotes` | Poseidon vehicles and remotes |

## Notes

- All scripts are idempotent — running them twice skips existing entries
- Scripts require GM permissions
- Compendiums are locked after seeding (unlock to edit)
