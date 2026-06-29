/**
 * Test utilities for Blue Planet chat scrolling
 * Run these commands in the browser console to test the chat scrolling improvements
 */

// Test the chat scrolling utility directly
export function testChatScroll() {
  const { scrollChatToBottom, smartScrollChatToBottom, delayedScrollChatToBottom } = 
    await import('./chat-utils.js');
  
  console.log('Testing chat scroll utilities...');
  
  // Test basic scroll
  const result1 = scrollChatToBottom();
  console.log('Basic scroll result:', result1);
  
  // Test smart scroll
  const result2 = smartScrollChatToBottom();
  console.log('Smart scroll result:', result2);
  
  // Test delayed scroll
  delayedScrollChatToBottom(100, false);
  console.log('Delayed scroll initiated');
  
  return {
    basicScroll: result1,
    smartScroll: result2,
    delayedScroll: 'initiated'
  };
}

// Test with a sample roll message
export async function testRollMessage() {
  if (!game.user.character) {
    console.warn('No character selected for testing');
    return;
  }
  
  const actor = game.user.character;
  
  try {
    // Create a test roll message
    const roll = new Roll('1d10');
    await roll.evaluate();
    
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: actor}),
      flavor: 'Test Roll - Chat Scroll Verification',
      rollMode: game.settings.get('core', 'rollMode')
    });
    
    console.log('Test roll message created - check if chat scrolled appropriately');
    return true;
  } catch (error) {
    console.error('Error creating test roll:', error);
    return false;
  }
}

// Global function for easy console access
globalThis.testBluePlanetChatScroll = testChatScroll;
globalThis.testBluePlanetRollMessage = testRollMessage;
