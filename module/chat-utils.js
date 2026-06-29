/**
 * Chat utility functions for Blue Planet system
 */

/**
 * Scrolls only the chat message container to the bottom, preserving input field position
 * This provides a better UX by keeping the chat input and other UI elements stable
 */
export function scrollChatToBottom() {
  // Try to find the specific chat message container first
  const selectors = [
    '#chat-log ol.chat-messages',
    '#chat-log .chat-message-list',
    '#chat-log .messages', 
    '#chat-log .chat-messages',
    '#chat-log' // Last fallback
  ];
  
  for (const selector of selectors) {
    const chatContainer = document.querySelector(selector);
    if (chatContainer) {
      // Check if this container actually has scrollable content
      if (chatContainer.scrollHeight > chatContainer.clientHeight) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Enhanced chat scroll that tries to be more intelligent about what to scroll
 * Checks if the user has manually scrolled up and avoids auto-scrolling in that case
 */
export function smartScrollChatToBottom(force = false) {
  const selectors = [
    '#chat-log ol.chat-messages',
    '#chat-log .chat-message-list',
    '#chat-log .messages',
    '#chat-log .chat-messages',
    '#chat-log' // Last fallback
  ];
  
  for (const selector of selectors) {
    const chatContainer = document.querySelector(selector);
    if (chatContainer && chatContainer.scrollHeight > chatContainer.clientHeight) {
      
      // Check if user has scrolled up manually (unless forced)
      if (!force) {
        const isAtBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 50;
        if (!isAtBottom) {
          // User has scrolled up, don't auto-scroll
          return false;
        }
      }
      
      // Scroll to bottom
      chatContainer.scrollTop = chatContainer.scrollHeight;
      return true;
    }
  }
  
  return false;
}

/**
 * Delayed chat scroll with better container detection
 * Uses a timeout to ensure the message has been rendered before scrolling
 */
export function delayedScrollChatToBottom(delay = 100, smart = true) {
  setTimeout(() => {
    if (smart) {
      smartScrollChatToBottom();
    } else {
      scrollChatToBottom();
    }
  }, delay);
}
