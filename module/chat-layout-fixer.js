/**
 * Chat Layout Fixer for Blue Planet System
 * Fixes the chat layout to prevent input field and dice tray movement
 */

let isLayoutFixed = false;
let retryCount = 0;
const MAX_RETRIES = 10; // Maximum number of retries to prevent infinite loop
let chatScrollFixEnabled = false; // Track if the permanent fix is enabled

/**
 * Apply layout fixes to the chat interface
 */
export function fixChatLayout() {
  if (isLayoutFixed) return;
  
  const chatElement = document.getElementById('chat');
  // Foundry v13+ no longer uses #chat-log; prefer .chat-scroll inside #chat
  let chatLog = document.getElementById('chat-log');
  if (!chatLog && chatElement) chatLog = chatElement.querySelector('.chat-scroll');
  
  if (!chatElement || !chatLog) {
    retryCount++;
    if (retryCount <= MAX_RETRIES) {
      console.warn(`Chat elements not found, retrying in 1 second... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(fixChatLayout, 1000);
    } else {
      console.warn('Chat layout fixer: Maximum retries reached, stopping attempts. Chat elements may not be available.');
    }
    return;
  }
  
  try {
    // Apply CSS classes and inline styles to fix layout
    applyChatLayoutFixes(chatElement, chatLog);
    
    // Set up observers to maintain layout
    setupLayoutObservers(chatElement, chatLog);
    
    isLayoutFixed = true;
    retryCount = 0; // Reset retry count on successful fix
    console.log('Blue Planet: Chat layout fixed successfully');
    
    // Notify user that layout is fixed
    if (typeof ui !== 'undefined' && ui.notifications) {
      ui.notifications.info('Blue Planet: Chat layout optimized - Input field will now stay in place!');
    }
    
  } catch (error) {
    console.error('Error fixing chat layout:', error);
  }
}

/**
 * Apply minimal layout fixes - just pin form to bottom, let messages scroll
 */
function applyChatLayoutFixes(chatElement, chatLog) {
  // Only act when Chat tab is active
  if (!chatElement.classList.contains('active')) return;

  // Ensure the container can host an absolutely positioned form
  chatElement.style.display = 'flex';
  chatElement.style.flexDirection = 'column';
  chatElement.style.height = '100%';
  chatElement.style.position = 'relative';
  
  // Make the scroll area scrollable (chatLog may be #chat-log or .chat-scroll)
  chatLog.style.flex = '1';
  chatLog.style.overflowY = 'auto';
  chatLog.style.overflowX = 'hidden';
  chatLog.style.minHeight = '0';
  
  // Pin chat form to the bottom-right using absolute positioning
  const chatForm = document.querySelector('#chat .chat-form, #chat-form');
  if (chatForm) {
    // Force form to be visible and properly sized
    chatForm.style.display = 'block';
    chatForm.style.visibility = 'visible';
    chatForm.style.opacity = '1';
    chatForm.style.height = 'auto';
    chatForm.style.minHeight = '60px';
    chatForm.style.maxHeight = 'none';
    
    // Position the form
    chatForm.style.flexShrink = '0';
    chatForm.style.flexGrow = '0';
    chatForm.style.position = 'absolute';
    chatForm.style.bottom = '0';
    chatForm.style.left = '0';
    chatForm.style.right = '0';
    chatForm.style.width = '100%';
    chatForm.style.backgroundColor = 'var(--color-bg)';
    chatForm.style.zIndex = '100';
    chatForm.style.borderTop = '1px solid var(--color-border-light)';
    chatForm.style.padding = '8px';
    chatForm.style.boxSizing = 'border-box';
    
    // Force all child elements to be visible
    const formChildren = chatForm.querySelectorAll('*');
    formChildren.forEach(child => {
      if (child.style.display === 'none') child.style.display = 'block';
      child.style.visibility = 'visible';
      child.style.opacity = '1';
    });
    
    // Fix textarea specifically
    const textarea = chatForm.querySelector('textarea, input[type="text"]');
    if (textarea) {
      textarea.style.display = 'block';
      textarea.style.width = '100%';
      textarea.style.minHeight = '32px';
      textarea.style.visibility = 'visible';
      textarea.style.opacity = '1';
    }
    
    // Add Fix Chat Scrolling icon button to chat controls if it doesn't exist
    const chatControls = document.querySelector('#chat-controls');
    if (chatControls && !chatControls.querySelector('.bp-fix-scroll-btn')) {
      addFixScrollIconButton(chatControls);
    }
    
    // Wait for form to render, then set proper padding
    setTimeout(() => {
      const formHeight = chatForm.offsetHeight;
      if (formHeight > 0) {
        chatLog.style.paddingBottom = `${formHeight + 10}px`;
      } else {
        chatLog.style.paddingBottom = '80px'; // fallback
      }
    }, 100);
  }
  
  // Fix dice tray (only if it's inside chat)
  const diceTray = document.querySelector('#chat .dice-tray');
  if (diceTray) {
    diceTray.style.flexShrink = '0';
    diceTray.style.flexGrow = '0';
    diceTray.style.position = 'relative';
    diceTray.style.zIndex = '98';
  }
  
  // Fix chat controls
  const chatControls = document.querySelector('#chat #chat-controls, #chat .chat-controls');
  if (chatControls) {
    chatControls.style.flexShrink = '0';
    chatControls.style.flexGrow = '0';
    chatControls.style.position = 'relative';
    chatControls.style.zIndex = '99';
  }
  
  console.log('Blue Planet: Chat form fixed to bottom-right, messages scroll above it');
  
  // Apply persistent chat scroll fix if enabled
  if (chatScrollFixEnabled) {
    setTimeout(() => {
      executeManualScrollingFix(false); // false = don't show notifications repeatedly
    }, 500);
  }
}

/**
 * Initialize persistent chat scroll fix setting
 */
function initializePersistentChatFix() {
  // Only initialize if game.settings is available
  if (typeof game === 'undefined' || !game.settings) {
    console.log('Blue Planet: Game settings not ready, will retry persistent chat fix initialization');
    return false;
  }
  
  // Register the setting if it doesn't exist
  try {
    game.settings.register('blue-planet-recontact', 'chatScrollFixEnabled', {
      name: 'Persistent Chat Scroll Fix',
      hint: 'Keep chat scroll fix permanently enabled',
      scope: 'client',
      config: false, // Hidden setting
      type: Boolean,
      default: false
    });
  } catch (error) {
    // Setting already registered, that's fine
  }
  
  // Load the setting
  chatScrollFixEnabled = game.settings.get('blue-planet-recontact', 'chatScrollFixEnabled');
  
  if (chatScrollFixEnabled) {
    console.log('Blue Planet: Persistent chat scroll fix is ENABLED - will auto-apply');
  } else {
    console.log('Blue Planet: Persistent chat scroll fix is disabled');
  }
  
  return true;
}

/**
 * Save the chat scroll fix state to settings
 */
function saveChatScrollFixState(enabled) {
  chatScrollFixEnabled = enabled;
  try {
    game.settings.set('blue-planet-recontact', 'chatScrollFixEnabled', enabled);
    console.log(`Blue Planet: Chat scroll fix persistence ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (typeof ui !== 'undefined' && ui.notifications) {
      ui.notifications.info(`Blue Planet: Chat scroll fix will ${enabled ? 'automatically apply' : 'not auto-apply'} in future sessions.`);
    }
  } catch (error) {
    console.warn('Blue Planet: Could not save chat scroll fix setting:', error);
  }
}

/**
 * Find the actual messages container using various selectors
 */
function findMessagesContainer(chatLog) {
  const selectors = [
    'ol.chat-messages',
    '.chat-message-list', 
    '.messages',
    '.chat-messages'
  ];
  
  for (const selector of selectors) {
    const container = chatLog.querySelector(selector);
    if (container) {
      return container;
    }
  }
  
  return null;
}

/**
 * Set up mutation observers to maintain layout when DOM changes
 */
function setupLayoutObservers(chatElement, chatLog) {
  // Observer for chat structure changes
  const chatObserver = new MutationObserver((mutations) => {
    let needsRefix = false;
    
    mutations.forEach((mutation) => {
      // Check if new nodes were added to chat
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a chat form or dice tray
            if (node.matches && (
              node.matches('#chat-form, .chat-form, .dice-tray') ||
              node.querySelector('#chat-form, .chat-form, .dice-tray')
            )) {
              needsRefix = true;
            }
          }
        });
      }
    });
    
    if (needsRefix) {
      setTimeout(() => applyChatLayoutFixes(chatElement, chatLog), 100);
    }
  });
  
  // Observe chat element for structure changes
  chatObserver.observe(chatElement, {
    childList: true,
    subtree: true
  });
  
  // Store observer reference for cleanup
  chatElement._blueplanetChatObserver = chatObserver;
}

/**
 * Reset and reapply layout fixes
 */
export function resetChatLayout() {
  isLayoutFixed = false;
  retryCount = 0; // Reset retry count when resetting layout
  
  // Clean up existing observer
  const chatElement = document.getElementById('chat');
  if (chatElement && chatElement._blueplanetChatObserver) {
    chatElement._blueplanetChatObserver.disconnect();
    delete chatElement._blueplanetChatObserver;
  }
  
  // Reapply fixes
  setTimeout(fixChatLayout, 100);
}

/**
 * Initialize chat layout fixes when DOM is ready
 */
export function initializeChatLayoutFixer() {
  // Try to fix layout immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(fixChatLayout, 500);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(fixChatLayout, 500);
    });
  }
  
  // Also try when Foundry is ready
  if (typeof Hooks !== 'undefined') {
    Hooks.once('ready', () => {
      setTimeout(fixChatLayout, 1000);
    });
    
    // Reapply when chat is rendered
    Hooks.on('renderChatLog', () => {
      setTimeout(() => resetChatLayout(), 100);
    });
  }
}

/**
 * Test the chat layout fix
 */
export function testChatLayoutFix() {
  console.log('Testing Blue Planet chat layout fix...');
  
  const chatElement = document.getElementById('chat');
  let chatLog = document.getElementById('chat-log') || chatElement?.querySelector('.chat-scroll');
  const messagesContainer = findMessagesContainer(chatLog);
  const chatForm = document.querySelector('#chat-form, #chat .chat-form');
  
  const results = {
    chatElement: {
      found: !!chatElement,
      display: chatElement?.style.display,
      flexDirection: chatElement?.style.flexDirection,
      height: chatElement?.style.height
    },
    chatLog: {
      found: !!chatLog,
      flex: chatLog?.style.flex,
      display: chatLog?.style.display,
      overflow: chatLog?.style.overflow
    },
    messagesContainer: {
      found: !!messagesContainer,
      selector: messagesContainer ? getElementSelector(messagesContainer) : null,
      overflowY: messagesContainer?.style.overflowY,
      flex: messagesContainer?.style.flex,
      scrollHeight: messagesContainer?.scrollHeight,
      clientHeight: messagesContainer?.clientHeight
    },
    chatForm: {
      found: !!chatForm,
      position: chatForm?.style.position,
      flexShrink: chatForm?.style.flexShrink
    },
    isLayoutFixed
  };
  
  console.table(results);
  
  if (!isLayoutFixed) {
    console.log('Layout not fixed yet, attempting fix...');
    fixChatLayout();
    setTimeout(() => testChatLayoutFix(), 500);
  }
  
  return results;
}

/**
 * Get a CSS selector for an element
 */
function getElementSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.className) {
    const classes = Array.from(element.classList).join('.');
    return `.${classes}`;
  }
  return element.tagName.toLowerCase();
}

/**
 * Force reset and reapply layout
 */
export function forceChatLayoutReset() {
  console.log('Force resetting Blue Planet chat layout...');
  isLayoutFixed = false;
  retryCount = 0; // Reset retry count on forced reset
  
  const chatElement = document.getElementById('chat');
  if (chatElement && chatElement._blueplanetChatObserver) {
    chatElement._blueplanetChatObserver.disconnect();
    delete chatElement._blueplanetChatObserver;
  }
  
  // Clear any existing styles
  const elementsToReset = [
    '#chat',
    '#chat-log', 
    '#chat .chat-scroll',
    '#chat-log ol.chat-messages',
    '#chat-log .chat-message-list',
    '#chat-log .messages',
    '#chat-log .chat-messages',
    '#chat-form',
    '#chat .chat-form',
    '.dice-tray'
  ];
  
  elementsToReset.forEach(selector => {
    const element = document.querySelector(selector);
    if (element) {
      // Remove our applied styles
      const stylesToRemove = ['display', 'flexDirection', 'height', 'maxHeight', 'flex', 'minHeight', 'overflow', 'overflowY', 'overflowX', 'scrollBehavior', 'maxHeight', 'flexShrink', 'position', 'zIndex', 'marginTop'];
      stylesToRemove.forEach(style => {
        element.style.removeProperty(style);
      });
    }
  });
  
  // Reapply fixes
  setTimeout(fixChatLayout, 200);
}

/**
 * Create and add Fix Chat Scrolling icon button to chat controls
 */
function addFixScrollIconButton(chatControls) {
  console.log('Blue Planet: Adding Fix Chat Scrolling icon button to chat controls');
  
  // Check if button already exists to prevent duplicates
  if (chatControls.querySelector('.bp-fix-scroll-btn')) {
    console.log('Blue Planet: Fix Chat Scroll button already exists, skipping creation');
    return;
  }
  
  // Create Fix Scrolling icon button
  const fixScrollBtn = document.createElement('button');
  fixScrollBtn.type = 'button';
  fixScrollBtn.className = 'bp-fix-scroll-btn';
  fixScrollBtn.innerHTML = '🔀';
  fixScrollBtn.title = 'Fix Chat Scroll - Click to toggle persistent chat scroll fix';
  fixScrollBtn.style.cssText = `
    background: transparent;
    color: var(--color-text-light-primary);
    border: 1px solid var(--color-border-light);
    padding: 4px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin-left: 4px;
  `;
  
  // Add hover effects to match Foundry's chat controls style
  fixScrollBtn.addEventListener('mouseenter', () => {
    fixScrollBtn.style.background = 'var(--color-bg-option)';
    fixScrollBtn.style.borderColor = 'var(--color-border-highlight)';
    fixScrollBtn.style.transform = 'translateY(-1px)';
  });
  
  fixScrollBtn.addEventListener('mouseleave', () => {
    fixScrollBtn.style.background = 'transparent';
    fixScrollBtn.style.borderColor = 'var(--color-border-light)';
    fixScrollBtn.style.transform = 'translateY(0)';
  });
  
  // Add click handler
  fixScrollBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    executeManualScrollingFix();
  });
  
  try {
    // Find the Self Roll button and insert Fix Chat Scroll button after it
    const selfRollButton = chatControls.querySelector('[data-action="rollSelf"], .self-roll, [title*="Self Roll"], [aria-label*="Self Roll"]');
    
    if (selfRollButton) {
      // Use insertAdjacentElement which is safer and more reliable
      selfRollButton.insertAdjacentElement('afterend', fixScrollBtn);
      console.log('Blue Planet: Fix Chat Scroll button added after Self Roll button');
    } else {
      // Fallback: just append to chat controls if Self Roll not found
      chatControls.appendChild(fixScrollBtn);
      console.log('Blue Planet: Self Roll button not found, Fix Chat Scroll button added to end of chat controls');
      
      // Debug: Log what buttons are actually in chat controls
      const allButtons = chatControls.querySelectorAll('button, a');
      console.log('Blue Planet: Available buttons in chat-controls:', Array.from(allButtons).map(btn => ({
        tag: btn.tagName,
        class: btn.className,
        title: btn.title,
        'aria-label': btn.getAttribute('aria-label'),
        'data-action': btn.getAttribute('data-action')
      })));
    }
  } catch (error) {
    console.warn('Blue Planet: Error positioning Fix Chat Scroll button, using fallback:', error);
    // Safe fallback - just append to the end
    try {
      chatControls.appendChild(fixScrollBtn);
      console.log('Blue Planet: Fix Chat Scroll button added using fallback method');
    } catch (fallbackError) {
      console.error('Blue Planet: Failed to add Fix Chat Scroll button even with fallback:', fallbackError);
      return;
    }
  }
  
  // Initialize persistence setting and update button appearance
  setTimeout(() => {
    if (typeof game !== 'undefined' && game.settings) {
      initializePersistentChatFix();
      updateFixScrollButtonAppearance(chatScrollFixEnabled);
    }
  }, 1000);
  
  console.log('Blue Planet: Fix Chat Scrolling icon button added successfully to chat controls');
}

/**
 * Update the Fix Chat Scroll button appearance based on persistence state
 */
function updateFixScrollButtonAppearance(enabled) {
  const fixScrollBtn = document.querySelector('.bp-fix-scroll-btn');
  if (!fixScrollBtn) return;
  
  if (enabled) {
    // Enabled state - more prominent styling
    fixScrollBtn.style.background = 'var(--color-bg-option)';
    fixScrollBtn.style.borderColor = 'var(--color-border-highlight)';
    fixScrollBtn.style.color = 'var(--color-text-highlight)';
    fixScrollBtn.title = 'Chat Scroll Fix ENABLED (persistent) - Click to disable';
  } else {
    // Disabled state - default styling
    fixScrollBtn.style.background = 'transparent';
    fixScrollBtn.style.borderColor = 'var(--color-border-light)';
    fixScrollBtn.style.color = 'var(--color-text-light-primary)';
    fixScrollBtn.title = 'Chat Scroll Fix disabled - Click to enable persistent fix';
  }
}

/**
 * Execute the manual final scrolling fix with optional persistence toggle
 */
function executeManualScrollingFix(showNotifications = true, togglePersistence = true) {
  console.log('=== FINAL SCROLLING FIX ===');
  
  const chatElement = document.getElementById('chat');
  const chatScroll = chatElement?.querySelector('.chat-scroll');
  const chatForm = chatElement?.querySelector('.chat-form');
  
  if (!chatElement || !chatScroll || !chatForm) {
    console.log('Missing chat elements');
    ui.notifications.error('Chat elements not found!');
    return false;
  }
  
  console.log('Applying final scrolling fix...');
  
  // Get the sidebar height to calculate available space
  const sidebar = chatElement.closest('#sidebar');
  const sidebarHeight = sidebar ? sidebar.offsetHeight : window.innerHeight;
  console.log('Sidebar height:', sidebarHeight);
  
  // Calculate form height
  const formHeight = chatForm.offsetHeight || 80;
  console.log('Form height:', formHeight);
  
  // Calculate available height for messages (with buffer for other UI elements)
  const availableHeight = sidebarHeight - formHeight - 50; // 50px buffer for tabs, etc.
  console.log('Available height for messages:', availableHeight);
  
  // 1. Constrain the main chat container height
  chatElement.style.display = 'flex';
  chatElement.style.flexDirection = 'column';
  chatElement.style.height = '100%';
  chatElement.style.maxHeight = `${sidebarHeight}px`;
  chatElement.style.position = 'relative';
  chatElement.style.overflow = 'hidden';
  
  // 2. CRUCIAL: Set explicit height constraints on the scroll container
  chatScroll.style.flex = '1';
  chatScroll.style.overflowY = 'auto';
  chatScroll.style.overflowX = 'hidden';
  chatScroll.style.height = `${availableHeight}px`; // KEY: explicit height
  chatScroll.style.maxHeight = `${availableHeight}px`; // KEY: max height constraint
  chatScroll.style.minHeight = '200px'; // Ensure minimum scrollable area
  
  // 3. Ensure the form is properly positioned
  chatForm.style.position = 'absolute';
  chatForm.style.bottom = '0';
  chatForm.style.left = '0';
  chatForm.style.right = '0';
  chatForm.style.width = '100%';
  chatForm.style.height = 'auto';
  chatForm.style.minHeight = '60px';
  chatForm.style.display = 'block';
  chatForm.style.visibility = 'visible';
  chatForm.style.opacity = '1';
  chatForm.style.backgroundColor = 'var(--color-bg)';
  chatForm.style.borderTop = '1px solid var(--color-border-light)';
  chatForm.style.zIndex = '100';
  chatForm.style.padding = '8px';
  chatForm.style.boxSizing = 'border-box';
  
  // 4. Remove any padding from scroll container (form is absolutely positioned)
  chatScroll.style.paddingBottom = '10px'; // Minimal padding
  
  // 5. Force the inner chat-log to grow naturally
  const chatLog = chatScroll.querySelector('ol, ul, .chat-messages, .messages');
  if (chatLog) {
    chatLog.style.height = 'auto';
    chatLog.style.maxHeight = 'none';
    chatLog.style.overflow = 'visible';
    console.log('Found and configured inner chat log');
  }
  
  // 6. Test the scrolling after a brief delay
  setTimeout(() => {
    console.log('Testing scroll behavior:');
    console.log('- Scroll container height:', chatScroll.offsetHeight);
    console.log('- Scroll container scroll height:', chatScroll.scrollHeight);
    console.log('- Can scroll?', chatScroll.scrollHeight > chatScroll.clientHeight);
    
    if (chatScroll.scrollHeight > chatScroll.clientHeight) {
      // Scroll to bottom to test
      chatScroll.scrollTop = chatScroll.scrollHeight;
      console.log('✅ Scrolling is now working! Scrolled to bottom.');
      
      if (showNotifications && typeof ui !== 'undefined' && ui.notifications) {
        ui.notifications.info('✅ Chat scrolling fixed! Messages should now scroll properly.');
      }
    } else {
      console.log('⚠️ Still no scrollable content. Try adding more messages.');
      
      // If still no scroll, try an even smaller height
      const smallerHeight = Math.min(300, availableHeight);
      chatScroll.style.height = `${smallerHeight}px`;
      chatScroll.style.maxHeight = `${smallerHeight}px`;
      console.log(`Applied smaller height: ${smallerHeight}px`);
      
      setTimeout(() => {
        console.log('After smaller height - Can scroll?', chatScroll.scrollHeight > chatScroll.clientHeight);
        if (chatScroll.scrollHeight > chatScroll.clientHeight) {
          chatScroll.scrollTop = chatScroll.scrollHeight;
          console.log('✅ Scrolling working with smaller height!');
          
          if (showNotifications && typeof ui !== 'undefined' && ui.notifications) {
            ui.notifications.info('✅ Chat scrolling fixed with constrained height!');
          }
        }
      }, 100);
    }
  }, 200);
  
  // Toggle persistence if requested (when clicked by user)
  if (togglePersistence) {
    const newState = !chatScrollFixEnabled;
    saveChatScrollFixState(newState);
    
    // Update button appearance
    updateFixScrollButtonAppearance(newState);
  }
  
  console.log('Final scrolling fix applied');
  console.log('=== FINAL FIX COMPLETE ===');
  return true;
}

/**
 * Add test messages to verify scrolling behavior
 */
export function addManyTestMessages() {
  if (typeof game === 'undefined' || !game.user) {
    console.log('Blue Planet Chat: Game not ready for test messages');
    return;
  }
  
  console.log('Blue Planet Chat: Adding many test messages...');
  
  for (let i = 1; i <= 15; i++) {
    setTimeout(() => {
      ChatMessage.create({
        content: `Test message ${i} - Lorem ipsum dolor sit amet, consectetur adipiscing elit. This message should scroll properly above the fixed form at the bottom.`,
        speaker: {alias: 'Blue Planet Test User'}
      });
    }, i * 150);
  }
  
  console.log('Blue Planet Chat: Test messages will appear over the next few seconds...');
  
  if (typeof ui !== 'undefined' && ui.notifications) {
    ui.notifications.info('Blue Planet: Adding 15 test messages to verify chat scrolling...');
  }
}

// Global functions for console access
globalThis.testBluePlanetChatLayout = testChatLayoutFix;
globalThis.resetBluePlanetChatLayout = forceChatLayoutReset;
globalThis.addManyTestMessages = addManyTestMessages;
globalThis.executeManualScrollingFix = executeManualScrollingFix;

// Auto-initialize if this module is loaded
initializeChatLayoutFixer();
