/**
 * Add floating combat window toggle button to the combat tracker
 */

// Hook to add floating window button to combat tracker
Hooks.on('renderCombatTracker', (app, html, data) => {
  // Support both jQuery objects and native DOM elements
  const rootElement = html?.get ? html.get(0) : html;
  if (!rootElement) return;
  
  // Find or create a controls area
  let controlsContainer = rootElement.querySelector('.combat-tracker-header, .directory-header, .combat-controls');
  
  if (!controlsContainer) {
    // If no header found, create one
    controlsContainer = document.createElement('div');
    controlsContainer.className = 'bp-combat-header';
    controlsContainer.style.cssText = `
      padding: 8px;
      border-bottom: 1px solid rgba(255, 100, 0, 0.3);
      background: rgba(255, 100, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    rootElement.insertBefore(controlsContainer, rootElement.firstChild);
  }
  
  // Remove existing button if present
  const existingBtn = controlsContainer.querySelector('.bp-float-window-btn');
  if (existingBtn) {
    existingBtn.remove();
  }
  
  // Create floating window toggle button
  const floatButton = document.createElement('button');
  floatButton.className = 'bp-float-window-btn';
  floatButton.title = 'Toggle Floating Combat Window (Ctrl+Shift+C)';
  floatButton.innerHTML = `
    <i class="fas fa-external-link-alt"></i>
    <span>Float</span>
  `;
  
  // Style the button
  Object.assign(floatButton.style, {
    background: 'linear-gradient(135deg, rgba(255, 100, 0, 0.3) 0%, rgba(255, 133, 51, 0.2) 100%)',
    border: '1px solid rgba(255, 100, 0, 0.5)',
    borderRadius: '6px',
    color: '#fff',
    padding: '6px 12px',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.3s ease',
    textShadow: '0 0 8px rgba(255, 100, 0, 0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  });
  
  // Add hover effect
  floatButton.addEventListener('mouseenter', () => {
    floatButton.style.background = 'linear-gradient(135deg, rgba(255, 100, 0, 0.5) 0%, rgba(255, 133, 51, 0.4) 100%)';
    floatButton.style.boxShadow = '0 0 15px rgba(255, 100, 0, 0.6)';
    floatButton.style.transform = 'translateY(-1px)';
  });
  
  floatButton.addEventListener('mouseleave', () => {
    floatButton.style.background = 'linear-gradient(135deg, rgba(255, 100, 0, 0.3) 0%, rgba(255, 133, 51, 0.2) 100%)';
    floatButton.style.boxShadow = 'none';
    floatButton.style.transform = 'none';
  });
  
  // Add click handler - only controls the floating combat window
  floatButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only toggle floating combat window
    if (window.blueplanetFloatingCombat) {
      try {
        await window.blueplanetFloatingCombat.toggle();
        
        // Update button text based on window state
        const span = floatButton.querySelector('span');
        if (span) {
          const isWindowVisible = window.blueplanetFloatingCombat.isVisible;
          span.textContent = isWindowVisible ? 'Close' : 'Float';
          floatButton.title = isWindowVisible ? 'Close Floating Window' : 'Open Floating Combat Window';
        }
        
        console.log('BluePlanet: Toggled floating combat window');
      } catch (error) {
        console.error('BluePlanet: Error toggling floating window:', error);
        ui.notifications.error('Failed to toggle floating window: ' + error.message);
      }
    }
  });
  
  // Add to controls container
  controlsContainer.appendChild(floatButton);
  
  console.log('BluePlanet: Added floating combat window toggle button');
});

// Las funciones de controles draggables han sido removidas
// Este módulo ahora solo maneja el botón flotante para la ventana de combate
