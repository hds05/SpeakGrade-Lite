/**
 * LIVE CONVERSATION TESTING UTILITIES
 * 
 * Helper functions for testing the live conversation system during development.
 * These functions can be called from the browser console for manual testing.
 */

import liveConversationManager from './liveConversationManager';

// Make functions available globally for console testing
declare global {
  interface Window {
    liveConversationTest: {
      reset: () => void;
      simulateGames: (count: number) => void;
      checkStatus: () => void;
      unlockAll: () => void;
      showState: () => void;
    };
  }
}

/**
 * Reset the live conversation system to initial state
 */
export const resetLiveConversationSystem = (): void => {
  liveConversationManager.resetLiveConversationState();
  console.log('🔄 Live conversation system reset to initial state');
  console.log('📝 English Guide Bot should now be unlocked for first use');
};

/**
 * Simulate completing multiple regular games
 */
export const simulateRegularGames = (count: number): void => {
  console.log(`🎮 Simulating ${count} regular game completions...`);
  
  const fakeGameNames = [
    'Interview Room',
    'Weekly Check with Manager', 
    'Parking Ticket Encounter',
    'Outlet Customer Service',
    'Emergency 911 Dispatcher',
    'Spacecraft Simulation'
  ];
  
  for (let i = 0; i < count; i++) {
    const gameName = fakeGameNames[i % fakeGameNames.length];
    liveConversationManager.recordRegularGameCompletion(gameName);
    console.log(`✅ Completed: ${gameName} (${i + 1}/${count})`);
  }
  
  const state = liveConversationManager.getLiveConversationState();
  console.log(`🎯 Total games played: ${state.regularGamesPlayed}`);
  console.log(`🔓 Live levels unlocked: ${state.liveLevelsUnlocked.join(', ') || 'None'}`);
};

/**
 * Check current status of all live conversation levels
 */
export const checkLiveConversationStatus = (): void => {
  console.log('📊 Live Conversation Status Report:');
  console.log('================================');
  
  const state = liveConversationManager.getLiveConversationState();
  console.log(`🎮 Regular games played: ${state.regularGamesPlayed}/6`);
  console.log(`📈 Progress: ${liveConversationManager.getUnlockProgress().toFixed(1)}%`);
  console.log(`⏳ Games until unlock: ${liveConversationManager.getGamesUntilUnlock()}`);
  console.log(`🔓 Currently unlocked: ${state.liveLevelsUnlocked.join(', ') || 'None'}`);
  
  // Check status of each level
  liveConversationManager.LIVE_CONVERSATION_CONFIG.LIVE_CONVERSATION_LEVELS.forEach(levelName => {
    const status = liveConversationManager.getLiveConversationStatus(levelName);
    console.log(`\n📋 ${levelName}:`);
    console.log(`   Status: ${status.isUnlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}`);
    console.log(`   Usage count: ${status.usageCount}`);
    if (status.lastUnlock) {
      console.log(`   Last unlocked: ${new Date(status.lastUnlock).toLocaleString()}`);
    }
  });
};

/**
 * Force unlock all live conversation levels (for testing)
 */
export const forceUnlockAll = (): void => {
  console.log('🔓 Force unlocking all live conversation levels...');
  
  const state = liveConversationManager.getLiveConversationState();
  const newState = {
    ...state,
    liveLevelsUnlocked: [...liveConversationManager.LIVE_CONVERSATION_CONFIG.LIVE_CONVERSATION_LEVELS],
    lastUnlockTimestamp: new Date().toISOString(),
    regularGamesPlayed: 0
  };
  
  liveConversationManager.saveLiveConversationState(newState);
  console.log('✅ All live conversation levels are now unlocked');
};

/**
 * Show detailed system state for debugging
 */
export const showSystemState = (): void => {
  const state = liveConversationManager.getLiveConversationState();
  console.log('🔍 Detailed System State:');
  console.log('========================');
  console.log(JSON.stringify(state, null, 2));
  
  console.log('\n📊 Configuration:');
  console.log(JSON.stringify(liveConversationManager.LIVE_CONVERSATION_CONFIG, null, 2));
};

/**
 * Initialize testing utilities on window object for console access
 */
if (typeof window !== 'undefined') {
  window.liveConversationTest = {
    reset: resetLiveConversationSystem,
    simulateGames: simulateRegularGames,
    checkStatus: checkLiveConversationStatus,
    unlockAll: forceUnlockAll,
    showState: showSystemState
  };
  
  console.log('🧪 Live Conversation Test Utils loaded!');
  console.log('📝 Available commands:');
  console.log('   liveConversationTest.reset() - Reset to initial state');
  console.log('   liveConversationTest.simulateGames(6) - Simulate completing games');
  console.log('   liveConversationTest.checkStatus() - Check current status');
  console.log('   liveConversationTest.unlockAll() - Force unlock all levels');
  console.log('   liveConversationTest.showState() - Show detailed state');
}

export default {
  resetLiveConversationSystem,
  simulateRegularGames,
  checkLiveConversationStatus,
  forceUnlockAll,
  showSystemState
};
