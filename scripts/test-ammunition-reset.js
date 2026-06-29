/**
 * Script de prueba para verificar la funcionalidad de reset en hojas de munición
 * 
 * Ejecutar en la consola de Foundry:
 * 1. Crea un item de munición de prueba
 * 2. Establece algunos rounds_fired 
 * 3. Prueba el reset
 * 4. Verifica que los valores se actualizan correctamente
 */

async function testAmmunitionReset() {
  console.log('🧪 Testing Ammunition Reset Functionality...');
  
  try {
    // 1. Buscar o crear un item de munición de prueba
    let testAmmo = game.items.find(item => item.type === 'ammunition' && item.name.includes('Test'));
    
    if (!testAmmo) {
      console.log('Creating test ammunition item...');
      testAmmo = await Item.create({
        name: 'Test Ammunition',
        type: 'ammunition',
        system: {
          quantity: 2,
          package_size: 30,
          rounds_fired: 0,
          attack_modifier: 1,
          damage_modifier: 2
        }
      });
      console.log('✅ Test ammunition created:', testAmmo.name);
    }
    
    // 2. Establecer algunos rounds fired para probar el reset
    console.log('Setting rounds_fired to 15 for testing...');
    await testAmmo.update({'system.rounds_fired': 15});
    console.log('✅ Rounds fired set to:', testAmmo.system.rounds_fired);
    
    // 3. Abrir la hoja del item
    const sheet = testAmmo.sheet;
    await sheet.render(true);
    console.log('✅ Ammunition sheet opened');
    
    // 4. Simular hacer click en el botón de reset después de un breve delay
    setTimeout(async () => {
      console.log('Simulating reset button click...');
      const resetButton = sheet.element.find('[data-action="reset-fired"]');
      
      if (resetButton.length > 0) {
        console.log('✅ Reset button found, clicking...');
        resetButton.click();
        
        // Verificar después de un delay
        setTimeout(() => {
          const currentFired = testAmmo.system.rounds_fired;
          const displayFired = sheet.element.find('.usage-value.fired').text();
          
          console.log('🔍 Verification Results:');
          console.log('- Current system.rounds_fired:', currentFired);
          console.log('- Display shows fired:', displayFired);
          console.log('- Reset successful:', currentFired == 0 ? '✅' : '❌');
          console.log('- Display updated:', displayFired == '0' ? '✅' : '❌');
          
          if (currentFired == 0 && displayFired == '0') {
            console.log('🎉 TEST PASSED: Reset functionality working correctly!');
          } else {
            console.log('❌ TEST FAILED: Reset functionality not working properly');
            console.log('Debug info:');
            console.log('- Item system data:', testAmmo.system);
            console.log('- Usage tracking elements:', {
              fired: sheet.element.find('.usage-value.fired').text(),
              remaining: sheet.element.find('.usage-value.remaining').text(),
              percent: sheet.element.find('.usage-value.percent').text()
            });
          }
        }, 1000);
        
      } else {
        console.log('❌ Reset button not found in sheet');
        console.log('Available buttons:', sheet.element.find('button[data-action]').map((i, el) => el.dataset.action).get());
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Ejecutar el test
console.log('🧪 Running Ammunition Reset Test...');
testAmmunitionReset();