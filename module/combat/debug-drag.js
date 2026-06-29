/**
 * Debug helpers for drag functionality
 * Add visual indicators and console logs to help debug drag issues
 */

// Global debug function
window.debugBluePlanetDrag = function() {
  console.log('🔍 BluePlanet Drag Debug - Starting diagnostics');
  
  // Find floating combat window
  const floatingWindow = document.querySelector('.bp-floating-combat-window');
  if (floatingWindow) {
    console.log('✅ Found floating combat window:', floatingWindow);
    floatingWindow.classList.add('debug');
    
    // Check if it has drag listeners
    console.log('   - Cursor style:', window.getComputedStyle(floatingWindow).cursor);
    console.log('   - Position:', window.getComputedStyle(floatingWindow).position);
    console.log('   - Z-index:', window.getComputedStyle(floatingWindow).zIndex);
    
    // Check controls inside
    const controls = floatingWindow.querySelector('.bp-combat-controls');
    if (controls) {
      console.log('✅ Found combat controls in window:', controls);
      console.log('   - Flex direction:', window.getComputedStyle(controls).flexDirection);
      
      const buttons = controls.querySelectorAll('.bp-control-btn');
      console.log(`   - Found ${buttons.length} control buttons`);
      buttons.forEach((btn, i) => {
        console.log(`     Button ${i + 1}: "${btn.textContent.trim()}"`);
      });
    }
  } else {
    console.log('❌ No floating combat window found');
  }
  
  // Find floating controls
  const floatingControls = document.querySelector('#bp-floating-combat-controls, .bp-floating-controls');
  if (floatingControls) {
    console.log('✅ Found floating controls:', floatingControls);
    floatingControls.classList.add('debug');
    
    console.log('   - Cursor style:', window.getComputedStyle(floatingControls).cursor);
    console.log('   - Position:', window.getComputedStyle(floatingControls).position);
    console.log('   - Left:', window.getComputedStyle(floatingControls).left);
    console.log('   - Bottom:', window.getComputedStyle(floatingControls).bottom);
  } else {
    console.log('❌ No floating controls found');
  }
  
  // Test if combat tab is active
  const combatTab = document.querySelector('#sidebar-tabs a[data-tab="combat"]');
  if (combatTab) {
    const isActive = combatTab.classList.contains('active');
    console.log(`📍 Combat tab ${isActive ? 'IS' : 'is NOT'} active`);
  }
  
  // Show instructions
  console.log(`
🎮 Debug Mode Active!
- Draggable elements now have colored borders
- Try dragging the floating window and controls
- Check console for drag events
- Call debugBluePlanetDrag() again to refresh
  `);
};

// Auto-run debug when window loads (only if in development)
if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
  setTimeout(() => {
    console.log('🔧 BluePlanet Debug: Auto-running drag diagnostics in 2 seconds...');
    setTimeout(window.debugBluePlanetDrag, 2000);
  }, 1000);
}