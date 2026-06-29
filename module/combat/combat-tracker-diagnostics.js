/**
 * Combat Tracker Diagnostics
 * Script para analizar la estructura real del HTML del combat tracker
 */

export class CombatTrackerDiagnostics {
  
  static analyze() {
    console.log('🔍 BluePlanet: Analyzing Combat Tracker Structure');
    
    // Find all potential combat tracker elements
    const combatElements = [
      document.querySelector('#combat-tracker'),
      document.querySelector('#combat'),
      document.querySelector('.combat-tracker'),
      document.querySelector('section.sidebar-tab[data-tab="combat"]'),
      document.querySelector('.app.sidebar-tab[data-tab="combat"]')
    ].filter(el => el !== null);
    
    console.log(`Found ${combatElements.length} potential combat tracker elements:`);
    
    combatElements.forEach((element, index) => {
      console.log(`\n--- Combat Element ${index + 1} ---`);
      console.log('Element:', element);
      console.log('Classes:', element.className);
      console.log('ID:', element.id);
      console.log('TagName:', element.tagName);
      
      // Analyze structure
      this.analyzeStructure(element, 0, 3);
    });
    
    // Find all elements with 'combat' in their class or ID
    const allCombatRelated = document.querySelectorAll('*[class*="combat"], *[id*="combat"]');
    console.log(`\n🎯 Found ${allCombatRelated.length} elements with 'combat' in class or ID:`);
    
    allCombatRelated.forEach((element, index) => {
      if (index < 10) { // Limit output
        console.log(`${index + 1}. ${element.tagName}#${element.id}.${element.className}`);
      }
    });
    
    // Check for combat controls
    const controlsElements = [
      document.querySelector('.combat-controls'),
      document.querySelector('#combat-controls'),
      document.querySelector('[data-control]'),
      ...document.querySelectorAll('*[class*="control"]')
    ].filter(el => el !== null);
    
    console.log(`\n🎮 Found ${controlsElements.length} potential control elements:`);
    controlsElements.forEach((element, index) => {
      if (index < 5) {
        console.log(`${index + 1}. ${element.tagName}#${element.id}.${element.className}`);
      }
    });
  }
  
  static analyzeStructure(element, depth, maxDepth) {
    if (depth >= maxDepth) return;
    
    const indent = '  '.repeat(depth);
    console.log(`${indent}├─ ${element.tagName}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.replace(/\s+/g, '.') : ''}`);
    
    // Look for important children
    const children = Array.from(element.children);
    children.forEach(child => {
      if (depth < maxDepth - 1) {
        this.analyzeStructure(child, depth + 1, maxDepth);
      }
    });
  }
  
  static getComputedStyles(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.log(`❌ Element not found: ${selector}`);
      return;
    }
    
    const styles = window.getComputedStyle(element);
    console.log(`\n🎨 Computed styles for ${selector}:`);
    console.log(`Position: ${styles.position}`);
    console.log(`Display: ${styles.display}`);
    console.log(`Flex Direction: ${styles.flexDirection}`);
    console.log(`Overflow: ${styles.overflow}`);
    console.log(`Height: ${styles.height}`);
    console.log(`Max Height: ${styles.maxHeight}`);
    console.log(`Z-Index: ${styles.zIndex}`);
    console.log(`Transform: ${styles.transform}`);
  }
  
  static testFixedPositioning() {
    console.log('\n🧪 Testing fixed positioning...');
    
    // Try to find and modify controls
    const controlsSelectors = [
      '.combat-controls',
      '#combat .combat-controls',
      '.sidebar-tab[data-tab="combat"] .combat-controls',
      '.combat-tracker .combat-controls'
    ];
    
    let foundControls = false;
    
    controlsSelectors.forEach(selector => {
      const controls = document.querySelector(selector);
      if (controls) {
        console.log(`✅ Found controls with selector: ${selector}`);
        console.log('Current styles:', {
          position: controls.style.position,
          bottom: controls.style.bottom,
          right: controls.style.right,
          zIndex: controls.style.zIndex
        });
        
        // Test applying fixed positioning
        controls.style.position = 'fixed';
        controls.style.bottom = '20px';
        controls.style.right = '20px';
        controls.style.zIndex = '9999';
        controls.style.backgroundColor = '#ff6400';
        controls.style.border = '2px solid #ff8533';
        
        console.log('Applied test styles to controls');
        foundControls = true;
      }
    });
    
    if (!foundControls) {
      console.log('❌ No controls found with any selector');
    }
  }
}

// Hook to run diagnostics when combat tracker renders
Hooks.on('renderCombatTracker', (app, html, data) => {
  console.log('🔍 BluePlanet: Combat Tracker rendered, running diagnostics...');
  
  setTimeout(() => {
    CombatTrackerDiagnostics.analyze();
    CombatTrackerDiagnostics.getComputedStyles('#combat-tracker');
    CombatTrackerDiagnostics.getComputedStyles('.combat-controls');
  }, 100);
});

// Global function for manual diagnostics
window.debugCombatTracker = () => {
  CombatTrackerDiagnostics.analyze();
  CombatTrackerDiagnostics.testFixedPositioning();
};