/**
 * Blue Planet Combat Tracker UI Enhancements
 * Provides fixed controls and improved scrolling behavior
 */

export class CombatTrackerUI {
  
  /**
   * Initialize combat tracker UI enhancements
   */
  static init() {
    console.log('BluePlanet: Initializing Combat Tracker UI enhancements');
    
    // Hook into combat tracker render to apply enhancements
    Hooks.on('renderCombatTracker', this.enhanceCombatTracker.bind(this));
    
    // Hook into combat updates to maintain scroll position
    Hooks.on('updateCombat', this.preserveScrollPosition.bind(this));
  }
  
  /**
   * Check if we're currently in the combat encounters tab
   * @returns {boolean}
   */
  static isInCombatTab() {
    // Check if sidebar is on combat tab
    const sidebar = document.querySelector('#sidebar');
    if (!sidebar) return false;
    
    const combatTab = sidebar.querySelector('.sidebar-tab[data-tab="combat"]');
    if (!combatTab) return false;
    
    // Check if combat tab is active
    const isActive = combatTab.classList.contains('active') || 
                     sidebar.classList.contains('combat') ||
                     document.querySelector('#sidebar-tabs a[data-tab="combat"].active') !== null;
    
    console.log('BluePlanet: Combat tab active:', isActive);
    return isActive;
  }
  
  /**
   * Enhance the combat tracker with fixed controls and improved layout
   * Only applies to combat encounters tab
   * @param {CombatTracker} app - The combat tracker application
   * @param {HTMLElement} html - The HTML element
   * @param {Object} data - Combat tracker data
   */
  static enhanceCombatTracker(app, html, data) {
    try {
      console.log('BluePlanet: Enhancing combat tracker UI');
      
      // Support both jQuery objects and native DOM elements
      const rootElement = html?.get ? html.get(0) : html;
      if (!rootElement) return;
      
      // Check if we're in the combat encounters tab
      const isInCombatTab = this.isInCombatTab();
      if (!isInCombatTab) {
        console.log('BluePlanet: Not in combat tab, skipping controls creation');
        return;
      }
      
      // Physical approach: move controls to fixed position
      this.createFixedControls(rootElement, data);
      
      // Apply scroll position preservation
      this.applyScrollPreservation(rootElement);
      
      // Enhance individual combatant elements
      this.enhanceCombatantElements(rootElement);
      
    } catch (error) {
      console.error('BluePlanet: Error enhancing combat tracker:', error);
    }
  }
  
  /**
   * Apply scroll position preservation to the combat tracker
   * @param {HTMLElement} rootElement - Root combat tracker element
   */
  static applyScrollPreservation(rootElement) {
    const combatantsList = rootElement.querySelector('.combat-tracker-list, .combatant-list');
    if (!combatantsList) return;
    
    // Store the current scroll position
    const scrollKey = 'bp-combat-scroll-position';
    const savedScrollPosition = sessionStorage.getItem(scrollKey) || 0;
    
    // Restore scroll position
    if (savedScrollPosition > 0) {
      combatantsList.scrollTop = parseInt(savedScrollPosition);
    }
    
    // Save scroll position on scroll
    combatantsList.addEventListener('scroll', function() {
      sessionStorage.setItem(scrollKey, this.scrollTop);
    });
  }
  
  /**
   * Enhance individual combatant elements
   * @param {HTMLElement} rootElement - Root combat tracker element
   */
  static enhanceCombatantElements(rootElement) {
    const combatants = rootElement.querySelectorAll('.combatant');
    
    combatants.forEach((combatant, index) => {
      // Add hover effects and accessibility improvements
      combatant.setAttribute('tabindex', '0');
      combatant.setAttribute('role', 'listitem');
      
      // Add keyboard navigation
      combatant.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          combatant.click();
        }
      });
      
      // Improve initiative button positioning
      const initiativeButton = combatant.querySelector('.bp-individual-initiative');
      if (initiativeButton) {
        // Ensure button doesn't interfere with text selection
        initiativeButton.addEventListener('mousedown', (e) => e.stopPropagation());
      }
    });
  }
  
  /**
   * Preserve scroll position during combat updates
   * @param {Combat} combat - Combat document
   * @param {Object} change - Change data
   * @param {Object} options - Update options
   */
  static preserveScrollPosition(combat, change, options) {
    // Only preserve scroll for the current user
    if (!game.user.isGM && options.userId !== game.user.id) return;
    
    // Find the combat tracker
    const combatTracker = document.getElementById('combat-tracker');
    if (!combatTracker) return;
    
    const combatantsList = combatTracker.querySelector('.combat-tracker-list, .combatant-list');
    if (!combatantsList) return;
    
    // Store current scroll position for restoration
    const currentScroll = combatantsList.scrollTop;
    
    // Schedule scroll restoration for next frame
    requestAnimationFrame(() => {
      if (combatantsList.scrollTop !== currentScroll) {
        combatantsList.scrollTop = currentScroll;
      }
    });
  }
  
  /**
   * Create fixed controls by physically moving them out of the normal flow
   * DISABLED - We want to use encounter controls instead
   * @param {HTMLElement} rootElement - Root combat tracker element
   * @param {Object} data - Combat tracker data
   */
  static createFixedControls(rootElement, data) {
    console.log('BluePlanet: createFixedControls called but DISABLED - using encounter controls instead');
    return; // EARLY RETURN - don't create floating controls
    // Find the controls container
    const controlsSelectors = [
      '.combat-controls',
      '.combat-tracker-controls',
      '.directory-controls',
      '.directory-footer'
    ];
    
    let controlsContainer = null;
    for (const selector of controlsSelectors) {
      controlsContainer = rootElement.querySelector(selector);
      if (controlsContainer) {
        console.log(`BluePlanet: Found controls with selector: ${selector}`);
        break;
      }
    }
    
    if (!controlsContainer) {
      console.warn('BluePlanet: No controls container found');
      return;
    }
    
    // Clean up any existing floating controls
    this.cleanup();
    
    // Clone the controls for floating version
    const floatingControls = controlsContainer.cloneNode(true);
    floatingControls.classList.add('bp-floating-controls');
    floatingControls.id = 'bp-floating-combat-controls';
    
    // Apply fixed positioning styles directly
    Object.assign(floatingControls.style, {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: 'auto',
      zIndex: '9999',
      backgroundColor: 'var(--color-bg-primary, #1a1a1a)',
      border: '2px solid var(--color-border-highlight, #ff6400)',
      borderRadius: '8px',
      padding: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'row',
      gap: '8px',
      minWidth: '200px',
      maxWidth: '600px',
      height: 'auto',
      transform: 'none',
      top: 'auto',
      margin: '0',
      width: 'auto',
      height: 'auto'
    });
    
    // Add combat info if available
    if (data.combat) {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'bp-combat-info';
      infoDiv.style.cssText = `
        background: var(--color-bg-secondary, #2a2a2a);
        border: 1px solid var(--color-border-dark, #666);
        padding: 6px;
        border-radius: 4px;
        text-align: center;
        font-size: 11px;
        color: var(--color-text-secondary, #ccc);
        margin-bottom: 8px;
      `;
      infoDiv.textContent = `Round ${data.combat.round || 0} | Turn ${data.combat.turn || 0}`;
      floatingControls.insertBefore(infoDiv, floatingControls.firstChild);
    }
    
    // Hide original controls
    controlsContainer.style.display = 'none';
    
    // Add to body (outside of sidebar constraints)
    document.body.appendChild(floatingControls);
    
    // Make controls draggable
    this.makeDraggable(floatingControls);
    
    // Re-bind event listeners
    this.rebindControlEvents(floatingControls, controlsContainer);
    
    console.log('BluePlanet: Created fixed floating controls with drag support');
    
    return floatingControls;
  }
  
  /**
   * Rebind event listeners for floating controls
   * @param {HTMLElement} floatingControls - Floating controls element
   * @param {HTMLElement} originalControls - Original controls element
   */
  static rebindControlEvents(floatingControls, originalControls) {
    // Find all clickable elements in both containers
    const floatingButtons = floatingControls.querySelectorAll('a, button, [data-control]');
    const originalButtons = originalControls.querySelectorAll('a, button, [data-control]');
    
    // Copy event listeners by simulating clicks on original buttons
    floatingButtons.forEach((floatingButton, index) => {
      const originalButton = originalButtons[index];
      if (originalButton) {
        floatingButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          // Temporarily show original controls to trigger event
          originalControls.style.display = 'block';
          originalButton.click();
          originalControls.style.display = 'none';
        });
      }
    });
  }
  
  /**
   * Make an element draggable
   * @param {HTMLElement} element - Element to make draggable
   */
  static makeDraggable(element) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    console.log('BluePlanet: Making element draggable:', element);
    
    // Add cursor style and visual feedback
    element.style.cursor = 'move';
    element.style.userSelect = 'none';
    element.style.position = 'fixed';
    
    const startDrag = (e) => {
      // Only allow dragging on background areas, not buttons
      if (e.target.tagName === 'BUTTON' || 
          e.target.closest('button') || 
          e.target.classList.contains('combat-control')) {
        console.log('BluePlanet: Not dragging - clicked on button:', e.target);
        return;
      }
      
      console.log('BluePlanet: Starting drag on controls');
      isDragging = true;
      const rect = element.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      
      element.style.cursor = 'grabbing';
      element.style.zIndex = '10001';
      element.style.transform = 'scale(1.05)';
      
      e.preventDefault();
      e.stopPropagation();
    };
    
    const doDrag = (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      // Keep element within viewport bounds
      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      
      const boundedX = Math.max(0, Math.min(x, maxX));
      const boundedY = Math.max(0, Math.min(y, maxY));
      
      element.style.left = `${boundedX}px`;
      element.style.top = `${boundedY}px`;
      element.style.bottom = 'auto';
      element.style.right = 'auto';
      
      console.log('BluePlanet: Dragging controls to:', boundedX, boundedY);
    };
    
    const endDrag = () => {
      if (isDragging) {
        console.log('BluePlanet: Ending controls drag');
        isDragging = false;
        element.style.cursor = 'move';
        element.style.zIndex = '9999';
        element.style.transform = 'scale(1)';
      }
    };
    
    // Add event listeners
    element.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Visual feedback for draggable element
    element.addEventListener('mouseenter', () => {
      if (!isDragging) {
        element.style.boxShadow = '0 0 20px rgba(255, 100, 0, 0.6)';
      }
    });
    
    element.addEventListener('mouseleave', () => {
      if (!isDragging) {
        element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
      }
    });
  }
  
  /**
   * Create a floating controls panel (legacy method)
   * @param {HTMLElement} controlsContainer - Original controls container
   * @returns {HTMLElement} - Floating controls panel
   */
  static createFloatingControls(controlsContainer) {
    // This method is now replaced by createFixedControls
    return this.createFixedControls(controlsContainer.closest('.combat-tracker, #combat, .sidebar-tab[data-tab="combat"]'), {});
  }
  
  /**
   * Cleanup floating controls when combat tracker is closed
   */
  static cleanup() {
    const floatingControls = document.querySelectorAll('.bp-floating-controls, #bp-floating-combat-controls');
    floatingControls.forEach(control => {
      console.log('BluePlanet: Removing floating control:', control);
      control.remove();
    });
    
    // Also restore any hidden original controls
    const hiddenControls = document.querySelectorAll('.combat-controls[style*="display: none"]');
    hiddenControls.forEach(control => {
      control.style.display = '';
    });
  }
}

// Hook to clean up on window close
Hooks.on('closeCombatTracker', () => {
  CombatTrackerUI.cleanup();
});

// Initialize when ready
Hooks.once('ready', () => {
  CombatTrackerUI.init();
});