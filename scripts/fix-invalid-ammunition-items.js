/**
 * Script to fix invalid ammunition items in Foundry VTT
 * 
 * Run this in the Foundry VTT console (F12 -> Console) to fix any items
 * that have invalid types like "ammo_type" instead of "ammunition"
 * 
 * Usage:
 * 1. Open Foundry VTT
 * 2. Press F12 to open Developer Tools
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to execute
 */

(async function fixInvalidAmmunitionItems() {
    console.log("Blue Planet: Starting invalid ammunition item fix...");
    
    // Find all items with invalid types
    let invalidItems = [];
    
    // Check all items in the game
    for (let item of game.items) {
        if (item.type === "ammo_type" || item.type === "ammo" || !["weapon", "equipment", "biomod", "skill", "feature", "species", "ammunition"].includes(item.type)) {
            // Check if this looks like an ammunition item based on its data
            if (item.type === "ammo_type" || item.type === "ammo" || 
                (item.system && (item.system.ammo_type || item.system.attack_bonus !== undefined || item.system.damage_bonus !== undefined))) {
                invalidItems.push(item);
            }
        }
    }
    
    // Also check items in actors
    for (let actor of game.actors) {
        for (let item of actor.items) {
            if (item.type === "ammo_type" || item.type === "ammo" || !["weapon", "equipment", "biomod", "skill", "feature", "species", "ammunition"].includes(item.type)) {
                // Check if this looks like an ammunition item based on its data
                if (item.type === "ammo_type" || item.type === "ammo" || 
                    (item.system && (item.system.ammo_type || item.system.attack_bonus !== undefined || item.system.damage_bonus !== undefined))) {
                    invalidItems.push(item);
                }
            }
        }
    }
    
    console.log(`Blue Planet: Found ${invalidItems.length} invalid ammunition items to fix`);
    
    // Fix each invalid item
    for (let item of invalidItems) {
        console.log(`Blue Planet: Fixing item "${item.name}" (ID: ${item.id}) - Current type: ${item.type}`);
        
        try {
            // Prepare the update data
            let updateData = {
                type: "ammunition"
            };
            
            // If system data is missing ammunition-specific fields, add defaults
            if (!item.system.ammo_type) {
                updateData["system.ammo_type"] = "standard";
            }
            if (!item.system.quantity) {
                updateData["system.quantity"] = 1;
            }
            if (item.system.attack_bonus === undefined) {
                updateData["system.attack_bonus"] = 0;
            }
            if (item.system.damage_bonus === undefined) {
                updateData["system.damage_bonus"] = 0;
            }
            if (item.system.penetration_bonus === undefined) {
                updateData["system.penetration_bonus"] = 0;
            }
            
            // Update the item
            await item.update(updateData);
            
            console.log(`Blue Planet: Successfully fixed item "${item.name}"`);
            
        } catch (error) {
            console.error(`Blue Planet: Failed to fix item "${item.name}":`, error);
            
            // If update fails, try to delete and recreate
            try {
                console.log(`Blue Planet: Attempting to recreate item "${item.name}"`);
                
                const itemData = {
                    name: item.name,
                    type: "ammunition",
                    system: {
                        ammo_type: item.system.ammo_type || "standard",
                        quantity: item.system.quantity || 1,
                        attack_bonus: item.system.attack_bonus || 0,
                        damage_bonus: item.system.damage_bonus || 0,
                        penetration_bonus: item.system.penetration_bonus || 0,
                        description: item.system.description || "",
                        notes: item.system.notes || ""
                    }
                };
                
                // Create new item
                let newItem;
                if (item.parent) {
                    // Item belongs to an actor
                    newItem = await item.parent.createEmbeddedDocuments("Item", [itemData]);
                } else {
                    // Item is in the items directory
                    newItem = await Item.create(itemData);
                }
                
                // Delete the old item
                await item.delete();
                
                console.log(`Blue Planet: Successfully recreated item "${item.name}"`);
                
            } catch (recreateError) {
                console.error(`Blue Planet: Failed to recreate item "${item.name}":`, recreateError);
                ui.notifications.error(`Failed to fix ammunition item "${item.name}". Please delete it manually and create a new one.`);
            }
        }
    }
    
    if (invalidItems.length > 0) {
        ui.notifications.info(`Blue Planet: Fixed ${invalidItems.length} invalid ammunition items. Please refresh your browser (F5) to see the changes.`);
        console.log("Blue Planet: Invalid ammunition item fix completed. Please refresh your browser (F5).");
    } else {
        ui.notifications.info("Blue Planet: No invalid ammunition items found.");
        console.log("Blue Planet: No invalid ammunition items found.");
    }
})();

// Alternative simpler approach - just delete invalid items
/*
(async function deleteInvalidItems() {
    console.log("Blue Planet: Deleting invalid items...");
    
    // Find and delete items with invalid types
    for (let item of game.items) {
        if (item.type === "ammo_type" || item.type === "ammo") {
            console.log(`Blue Planet: Deleting invalid item "${item.name}" (type: ${item.type})`);
            await item.delete();
        }
    }
    
    for (let actor of game.actors) {
        for (let item of actor.items) {
            if (item.type === "ammo_type" || item.type === "ammo") {
                console.log(`Blue Planet: Deleting invalid item "${item.name}" from actor "${actor.name}" (type: ${item.type})`);
                await item.delete();
            }
        }
    }
    
    ui.notifications.info("Blue Planet: Deleted invalid items. Please refresh your browser (F5).");
})();
*/