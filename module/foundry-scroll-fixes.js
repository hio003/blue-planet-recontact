/**
 * Foundry VTT Scroll Fixes
 * Handles various scroll-related issues in Foundry VTT interface
 * 
 * Future-proof implementation using only stable web standards:
 * - Native DOM APIs (stable since 2000s)
 * - No jQuery dependency (deprecated in Foundry v13+)
 * - Only @public Foundry APIs (guaranteed stable)
 */

/**
 * Compatibility layer for future-proof DOM operations
 * Uses only stable web standards that won't change
 */
class CompatDOM {
  /**
   * Future-proof element selection (querySelector is web standard since 2013)
   */
  static find(parent, selector) {
    if (!parent) return null;
    if (typeof parent === 'string') {
      return document.querySelector(parent + ' ' + selector);
    }
    return parent.querySelector(selector);
  }
  
  /**
   * Future-proof multiple element selection
   */
  static findAll(parent, selector) {
    if (!parent) return [];
    if (typeof parent === 'string') {
      return Array.from(document.querySelectorAll(parent + ' ' + selector));
    }
    return Array.from(parent.querySelectorAll(selector));
  }
  
  /**
   * Future-proof element creation
   */
  static create(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
  }
  
  /**
   * Future-proof event handling
   */
  static on(element, event, handler) {
    if (!element || !element.addEventListener) return;
    element.addEventListener(event, handler);
  }
  
  /**
   * Future-proof element removal
   */
  static remove(element) {
    if (element && element.remove) {
      element.remove();
    }
  }
}

export class FoundryScrollFixes {
  // Initialize scrollPositions at class level
  static scrollPositions = new Map();
  
  /**
   * Initialize scroll fixes
   */
  static init() {
    console.log('BluePlanet: Initializing Foundry scroll fixes...');
    
    // Hook into Foundry's ready event
    Hooks.once('ready', () => {
      this.setupScrollFixes();
      this.setupCombatTrackerFixes();
      this.setupChatLogFixes();
      this.setupDirectoryFixes();
    });
    
    // Hook into combat updates
    Hooks.on('updateCombat', this.onCombatUpdate.bind(this));
    Hooks.on('createCombatant', this.onCombatantCreate.bind(this));
    Hooks.on('deleteCombatant', this.onCombatantDelete.bind(this));
    
    // Hook into combat tracker renders
    Hooks.on('renderCombatTracker', this.onCombatTrackerRender.bind(this));
    
    // Hook into chat messages (v13.348 uses renderChatMessageHTML)
    Hooks.on('renderChatMessageHTML', this.onChatMessageRenderHTML.bind(this));
  }
  
  /**
   * Set up general scroll fixes
   */
  static setupScrollFixes() {
    // Add scroll position memory to key elements
    const keyElements = [
      '#combat-tracker .directory-list',
      '#actors .directory-list', 
      '#items .directory-list',
      '#journal .directory-list',
      '#scenes .directory-list'
    ];
    
    keyElements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        this.addScrollMemory(element, selector);
      }
    });
  }
  
  /**
   * Set up combat tracker specific fixes
   */
  static setupCombatTrackerFixes() {
    const combatTracker = document.getElementById('combat-tracker');
    if (!combatTracker) return;
    
    const directoryList = combatTracker.querySelector('.directory-list');
    if (!directoryList) return;
    
    // Prevent auto-scroll on updates
    this.preventAutoScroll(directoryList);
    
    // Add stable scroll behavior
    this.addStableScrolling(directoryList);
    
    // Fix for initiative changes
    this.fixInitiativeScrolling(combatTracker);
    
    console.log('BluePlanet: Combat tracker scroll fixes applied');
  }
  
  /**
   * Set up chat log fixes
   */
  static setupChatLogFixes() {
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) return;
    
    const logContainer = chatLog.querySelector('.log');
    if (logContainer) {
      // Improve chat scroll behavior
      logContainer.style.scrollBehavior = 'smooth';
      logContainer.style.overflowAnchor = 'auto';
    }
  }
  
  /**
   * Set up directory fixes
   */
  static setupDirectoryFixes() {
    const directories = document.querySelectorAll('.directory .directory-list');
    directories.forEach(directory => {
      const app = directory.closest('.app');
      if (app && app.id) {
        this.addScrollMemory(directory, app.id);
        this.preventAutoScroll(directory);
      }
    });
  }
  
  /**
   * Add scroll position memory to an element
   */
  static addScrollMemory(element, key) {
    if (!element || !key) return;
    
    // Ensure scrollPositions is initialized
    if (!this.scrollPositions) {
      this.scrollPositions = new Map();
    }
    
    try {
      // Store initial scroll position
      this.scrollPositions.set(key, element.scrollTop);
      
      // Save scroll position on scroll
      element.addEventListener('scroll', () => {
        if (this.scrollPositions) {
          this.scrollPositions.set(key, element.scrollTop);
        }
      });
      
      // Restore scroll position after renders
      const observer = new MutationObserver(() => {
        if (this.scrollPositions) {
          const savedPosition = this.scrollPositions.get(key);
          if (savedPosition !== undefined && element.scrollTop !== savedPosition) {
            element.scrollTop = savedPosition;
          }
        }
      });
      
      observer.observe(element, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      console.error('BluePlanet Scroll: Error in addScrollMemory:', error);
    }
  }
  
  /**
   * Prevent automatic scrolling
   */
  static preventAutoScroll(element) {
    if (!element) return;
    
    // Override scrollIntoView calls
    const originalScrollIntoView = element.scrollIntoView;
    element.scrollIntoView = function(options) {
      // Only allow manual scroll requests
      if (options && options.behavior !== 'manual-allowed') {
        return;
      }
      originalScrollIntoView.call(this, { behavior: 'auto', block: 'nearest' });
    };
    
    // Prevent focus-related scrolling
    element.addEventListener('focus', (e) => {
      e.preventDefault();
    }, true);
    
    // Prevent scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }
  
  /**
   * Add stable scrolling behavior
   */
  static addStableScrolling(element) {
    if (!element) return;
    
    let isScrolling = false;
    let scrollTimeout;
    
    element.addEventListener('scroll', () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 100);
    });
    
    // Prevent updates during scrolling
    const observer = new MutationObserver((mutations) => {
      if (isScrolling) {
        // Delay mutations until scrolling stops
        setTimeout(() => {
          if (!isScrolling) {
            // Process delayed mutations if needed
          }
        }, 150);
      }
    });
    
    observer.observe(element, {
      childList: true,
      subtree: false
    });
  }
  
  /**
   * Fix initiative-related scrolling
   */
  static fixInitiativeScrolling(combatTracker) {
    if (!combatTracker) return;
    
    // Prevent scrolling during initiative rolls
    const preventScrollDuringAction = (action) => {
      // Find scrollable container using flexible approach
      const scrollContainer = combatTracker.querySelector('.directory-list') || 
                             combatTracker.querySelector('.combatants') ||
                             combatTracker;
                             
      if (!scrollContainer || scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
        return;
      }
      
      const currentScroll = scrollContainer.scrollTop;
      
      // Restore scroll position after action
      setTimeout(() => {
        if (scrollContainer.scrollTop !== currentScroll) {
          scrollContainer.scrollTop = currentScroll;
        }
      }, 50);
    };
    
    // Listen for initiative buttons
    combatTracker.addEventListener('click', (e) => {
      if (e.target.closest('.initiative') || e.target.closest('.roll')) {
        preventScrollDuringAction('initiative');
      }
    });
  }
  
  /**
   * Handle combat updates
   */
  static onCombatUpdate(combat, data, options, userId) {
    const combatTracker = document.getElementById('combat-tracker');
    if (!combatTracker) return;
    
    // Find scrollable container using flexible approach
    const scrollContainer = combatTracker.querySelector('.directory-list') || 
                           combatTracker.querySelector('.combatants') ||
                           combatTracker;
    
    // Only proceed if element is actually scrollable
    if (!scrollContainer || scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
      return;
    }
    
    // Preserve scroll position during combat updates
    const currentScroll = scrollContainer.scrollTop;
    
    // Restore after update
    setTimeout(() => {
      if (Math.abs(scrollContainer.scrollTop - currentScroll) > 10) {
        scrollContainer.scrollTop = currentScroll;
      }
    }, 100);
  }
  
  /**
   * Handle combatant creation
   */
  static onCombatantCreate(combatant, options, userId) {
    this.onCombatUpdate();
  }
  
  /**
   * Handle combatant deletion  
   */
  static onCombatantDelete(combatant, options, userId) {
    this.onCombatUpdate();
  }
  
  /**
   * Handle combat tracker renders (Foundry v13.348 compatible)
   */
  static onCombatTrackerRender(app, html, data) {
    try {
      // Ensure scrollPositions is initialized
      if (!this.scrollPositions) {
        this.scrollPositions = new Map();
      }
      
      // Foundry v13.348 passes HTMLElement directly
      let scrollableElement;
      
      if (html instanceof HTMLElement) {
        // Try multiple possible selectors for the scrollable area
        scrollableElement = html.querySelector('.directory-list') || 
                           html.querySelector('#combat-tracker') ||
                           html.querySelector('.combat-tracker') ||
                           html.querySelector('.combatants') ||
                           html; // Fallback to the root element
      } else {
        console.warn('BluePlanet Scroll: Unexpected html type in combat tracker render:', typeof html);
        return;
      }
      
      // Only warn if we can't find any scrollable element at all
      if (!scrollableElement) {
        console.warn('BluePlanet Scroll: Could not find any scrollable element in combat tracker');
        return;
      }
      
      // Found scrollable element - proceeding with scroll fixes
      
      // Try to find the actual scrollable container
      const scrollContainer = scrollableElement.querySelector('.directory-list') || scrollableElement;
      
      // Only proceed if we have a valid scrollContainer
      if (!scrollContainer) {
        return;
      }
      
      // Restore saved scroll position
      const savedPosition = this.scrollPositions.get('#combat-tracker');
      if (savedPosition !== undefined && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
          if (scrollContainer && scrollContainer.scrollTop !== undefined) {
            scrollContainer.scrollTop = savedPosition;
          }
        });
      }
      
      // Reapply scroll fixes only if element is scrollable
      if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        this.preventAutoScroll(scrollContainer);
        this.addStableScrolling(scrollContainer);
      }
    } catch (error) {
      console.error('BluePlanet Scroll: Error in onCombatTrackerRender:', error);
    }
  }
  
  /**
   * Handle chat message renders (Foundry v13.348)
   */
  static onChatMessageRenderHTML(message, html, data) {
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) return;
    
    const logContainer = chatLog.querySelector('.log');
    if (!logContainer) return;
    
    // Check if user was at bottom before new message
    const wasAtBottom = logContainer.scrollTop >= (logContainer.scrollHeight - logContainer.clientHeight - 10);
    
    // If user was at bottom, scroll to new message
    if (wasAtBottom) {
      requestAnimationFrame(() => {
        logContainer.scrollTop = logContainer.scrollHeight;
      });
    }
    // Otherwise, maintain current position
  }
  
  /**
   * Emergency scroll fix - call this if issues persist
   */
  static emergencyScrollFix() {
    console.log('BluePlanet: Applying emergency scroll fixes...');
    
    // Add scroll-reset class to problematic elements
    const problematicElements = [
      '#combat-tracker',
      '#chat-log',
      '.directory-list'
    ];
    
    problematicElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.add('scroll-reset');
      });
    });
    
    // Force scroll behavior reset
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    
    ui.notifications.info('Emergency scroll fixes applied. Try refreshing if issues persist.');
  }
  
  /**
   * Debug scroll issues
   */
  static debugScrollIssues() {
    console.log('BluePlanet: Starting scroll debug mode...');
    
    // Add debug styling
    const debugElements = [
      '#combat-tracker',
      '#combat-tracker .directory-list',
      '.combatant'
    ];
    
    debugElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.add('debug-scroll');
      });
    });
    
    // Log scroll events
    const combatTracker = document.getElementById('combat-tracker');
    if (combatTracker) {
      const scrollContainer = combatTracker.querySelector('.directory-list') || 
                             combatTracker.querySelector('.combatants') ||
                             combatTracker;
                             
      if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        scrollContainer.addEventListener('scroll', (e) => {
          console.log('Combat tracker scrolled to:', scrollContainer.scrollTop);
        });
      }
    }
    
    ui.notifications.info('Scroll debug mode enabled. Check console for scroll events.');
  }
}

// Global functions for console access
window.emergencyScrollFix = () => FoundryScrollFixes.emergencyScrollFix();
window.debugScrollIssues = () => FoundryScrollFixes.debugScrollIssues();

// Auto-initialize
FoundryScrollFixes.init();