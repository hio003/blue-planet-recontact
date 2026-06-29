/**
 * Chat Scroll Fix for Blue Planet Recontact
 * Foundry VTT v13 compatible
 *
 * Fixes the chat panel so that:
 * - .chat-scroll fills the available height and scrolls properly
 * - .chat-form stays pinned at the bottom
 * - Adjusts automatically on sidebar resize
 */

let _resizeObserver = null;
let _applied = false;

/**
 * Calculate and apply heights based on the current sidebar dimensions.
 * This is the SINGLE source of truth for the layout.
 */
function applyScrollFix() {
  const chatTab  = document.getElementById('chat');
  if (!chatTab || !chatTab.classList.contains('active')) return;

  const chatScroll = chatTab.querySelector('.chat-scroll');
  const chatForm   = chatTab.querySelector('.chat-form');

  if (!chatScroll || !chatForm) return;

  // -- container --
  chatTab.style.display        = 'flex';
  chatTab.style.flexDirection  = 'column';
  chatTab.style.height         = '100%';
  chatTab.style.overflow       = 'hidden';
  chatTab.style.position       = 'relative';

  // -- measure --
  const sidebar      = chatTab.closest('#sidebar') || chatTab.parentElement;
  const sidebarH     = sidebar ? sidebar.clientHeight : window.innerHeight;
  const formH        = chatForm.offsetHeight || 76;

  // Tabs row at top of sidebar (~38px); add 10px safety buffer
  const tabsH        = 48;
  const availableH   = Math.max(200, sidebarH - formH - tabsH);

  // -- scroll area --
  chatScroll.style.flex         = '1 1 auto';
  chatScroll.style.height       = availableH + 'px';
  chatScroll.style.maxHeight    = availableH + 'px';
  chatScroll.style.minHeight    = '200px';
  chatScroll.style.overflowY    = 'auto';
  chatScroll.style.overflowX    = 'hidden';
  chatScroll.style.paddingBottom= '8px';

  // Inner messages list must NOT have its own overflow or height constraint
  const messagesList = chatScroll.querySelector('ol.chat-messages, .chat-messages, ol, ul');
  if (messagesList) {
    messagesList.style.overflow  = 'visible';
    messagesList.style.height    = 'auto';
    messagesList.style.maxHeight = 'none';
  }

  // -- form pinned at absolute bottom --
  chatForm.style.position        = 'absolute';
  chatForm.style.bottom          = '0';
  chatForm.style.left            = '0';
  chatForm.style.right           = '0';
  chatForm.style.width           = '100%';
  chatForm.style.height          = 'auto';
  chatForm.style.minHeight       = '60px';
  chatForm.style.display         = 'block';
  chatForm.style.visibility      = 'visible';
  chatForm.style.opacity         = '1';
  chatForm.style.zIndex          = '100';
  chatForm.style.backgroundColor = 'var(--color-bg, #1a1a1a)';
  chatForm.style.borderTop       = '1px solid var(--color-border-light, #444)';
  chatForm.style.padding         = '8px';
  chatForm.style.boxSizing       = 'border-box';

  // Dice tray (if present)
  const diceTray = chatTab.querySelector('.dice-tray');
  if (diceTray) {
    diceTray.style.flexShrink = '0';
    diceTray.style.position   = 'relative';
    diceTray.style.zIndex     = '99';
  }

  // Chat controls row
  const chatControls = chatTab.querySelector('#chat-controls, .chat-controls');
  if (chatControls) {
    chatControls.style.flexShrink = '0';
    chatControls.style.position   = 'relative';
    chatControls.style.zIndex     = '99';
  }
}

/**
 * Scroll the messages area to the bottom.
 */
function scrollToBottom() {
  const chatTab    = document.getElementById('chat');
  const chatScroll = chatTab?.querySelector('.chat-scroll');
  if (chatScroll) {
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }
}

/**
 * One-time setup: attach ResizeObserver so the layout stays correct
 * when the user resizes the sidebar.
 */
function attachResizeObserver() {
  if (_resizeObserver) return;

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  _resizeObserver = new ResizeObserver(() => {
    applyScrollFix();
  });
  _resizeObserver.observe(sidebar);
}

/**
 * Main entry point — called when the module file is imported.
 */
export function initializeChatLayoutFixer() {
  // Apply immediately if DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => { applyScrollFix(); attachResizeObserver(); }, 400);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => { applyScrollFix(); attachResizeObserver(); }, 400);
    });
  }

  if (typeof Hooks === 'undefined') return;

  // Re-apply whenever Foundry renders the chat tab
  Hooks.on('renderChatLog', () => {
    setTimeout(() => { applyScrollFix(); scrollToBottom(); }, 150);
  });

  // Re-apply on sidebar tab switch (user clicks the chat tab)
  Hooks.on('changeSidebarTab', (app) => {
    if (app?.tabName === 'chat' || app?.id === 'chat') {
      setTimeout(() => { applyScrollFix(); scrollToBottom(); }, 150);
    }
  });

  // Scroll to bottom after each new message
  Hooks.on('createChatMessage', () => {
    setTimeout(scrollToBottom, 100);
  });

  Hooks.once('ready', () => {
    setTimeout(() => {
      applyScrollFix();
      attachResizeObserver();
      scrollToBottom();
      _applied = true;
      console.log('Blue Planet: Chat scroll fix applied (Foundry v13).');
    }, 800);
  });

  // Expose helpers on globalThis for console debugging
  globalThis.bprFixChatScroll  = applyScrollFix;
  globalThis.bprScrollToBottom = scrollToBottom;
}

// Auto-run when the module is imported
initializeChatLayoutFixer();
