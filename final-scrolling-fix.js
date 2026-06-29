// FINAL SCROLLING FIX - Force chat messages to scroll properly
// Copy and paste into browser console (F12)

console.log('=== FINAL SCROLLING FIX ===');

function finalScrollingFix() {
  const chatElement = document.getElementById('chat');
  const chatScroll = chatElement?.querySelector('.chat-scroll');
  const chatForm = chatElement?.querySelector('.chat-form');
  
  if (!chatElement || !chatScroll || !chatForm) {
    console.log('Missing chat elements');
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
      
      if (typeof ui !== 'undefined' && ui.notifications) {
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
          
          if (typeof ui !== 'undefined' && ui.notifications) {
            ui.notifications.info('✅ Chat scrolling fixed with constrained height!');
          }
        }
      }, 100);
    }
  }, 200);
  
  console.log('Final scrolling fix applied');
  return true;
}

// Add test messages to verify scrolling
function addManyTestMessages() {
  if (typeof game === 'undefined' || !game.user) {
    console.log('Game not ready for test messages');
    return;
  }
  
  console.log('Adding many test messages...');
  
  for (let i = 1; i <= 15; i++) {
    setTimeout(() => {
      ChatMessage.create({
        content: `Test message ${i} - Lorem ipsum dolor sit amet, consectetur adipiscing elit. This message should scroll properly above the fixed form at the bottom.`,
        speaker: {alias: 'Test User'}
      });
    }, i * 150);
  }
  
  console.log('Test messages will appear over the next few seconds...');
}

// Run the fix
finalScrollingFix();

// Make functions available
window.finalScrollingFix = finalScrollingFix;
window.addManyTestMessages = addManyTestMessages;

console.log('Available functions:');
console.log('- finalScrollingFix() - Apply the scrolling fix');
console.log('- addManyTestMessages() - Add 15 test messages to test scrolling');
console.log('=== FINAL FIX COMPLETE ===');