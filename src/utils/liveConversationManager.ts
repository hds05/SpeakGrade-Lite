/**
 * LIVE CONVERSATION LOCKING SYSTEM
 * 
 * This module manages special "live conversation" levels that require users to play
 * a certain number of regular levels before being unlocked for one session.
 * 
 * Key Features:
 * - Tracks regular level completions
 * - Unlocks live conversation levels after threshold is met
 * - Locks live conversation levels again after one use
 * - Provides clear UI feedback about unlock status
 */

interface LiveConversationState {
  regularGamesPlayed: number;          // How many regular games have been completed
  liveLevelsUnlocked: string[];        // Which live levels are currently unlocked
  lastUnlockTimestamp: string | null;  // When was the last unlock
  usageHistory: LiveConversationUsage[];
}

interface LiveConversationUsage {
  levelId: string;
  usedAt: string;
  gamesPlayedToUnlock: number;
}

interface ComponentItem {
  id: number;
  title: string;
  description: string;
  image: string;
  path?: string;
  isLocked?: boolean;
  requiredScore?: number;
  tags?: string[];
  isLiveConversation?: boolean;  // New property for live conversation levels
}

// LIVE CONVERSATION CONFIGURATION
export const LIVE_CONVERSATION_CONFIG = {
  GAMES_REQUIRED_TO_UNLOCK: 6,           // Games needed to unlock a live conversation
  LIVE_CONVERSATION_LEVELS: [            // List of live conversation level titles
    "English Guide Bot"
  ],
  STORAGE_KEY: 'speakGrade_liveConversation'
};

/**
 * Get current live conversation state from localStorage
 */
export const getLiveConversationState = (): LiveConversationState => {
  try {
    const stored = localStorage.getItem(LIVE_CONVERSATION_CONFIG.STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading live conversation state:', error);
  }
  
  return {
    regularGamesPlayed: 0,
    liveLevelsUnlocked: [],
    lastUnlockTimestamp: null,
    usageHistory: []
  };
};

/**
 * Save live conversation state to localStorage
 */
export const saveLiveConversationState = (state: LiveConversationState): void => {
  try {
    localStorage.setItem(LIVE_CONVERSATION_CONFIG.STORAGE_KEY, JSON.stringify(state));
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('liveConversationUpdated', { 
      detail: state 
    }));
  } catch (error) {
    console.error('Error saving live conversation state:', error);
  }
};

/**
 * Check if a level is a live conversation level
 */
export const isLiveConversationLevel = (levelTitle: string): boolean => {
  return LIVE_CONVERSATION_CONFIG.LIVE_CONVERSATION_LEVELS.includes(levelTitle);
};

/**
 * Check if a live conversation level is currently unlocked
 */
export const isLiveConversationUnlocked = (levelTitle: string): boolean => {
  const state = getLiveConversationState();
  return state.liveLevelsUnlocked.includes(levelTitle);
};

/**
 * Record a regular game completion (not live conversation)
 * This increments the counter toward unlocking live conversations
 */
export const recordRegularGameCompletion = (levelTitle: string): LiveConversationState => {
  // Don't count live conversation levels as regular games
  if (isLiveConversationLevel(levelTitle)) {
    return getLiveConversationState();
  }

  const state = getLiveConversationState();
  const newState: LiveConversationState = {
    ...state,
    regularGamesPlayed: state.regularGamesPlayed + 1
  };

  // Check if we should unlock live conversations
  if (newState.regularGamesPlayed >= LIVE_CONVERSATION_CONFIG.GAMES_REQUIRED_TO_UNLOCK) {
    newState.liveLevelsUnlocked = [...LIVE_CONVERSATION_CONFIG.LIVE_CONVERSATION_LEVELS];
    newState.lastUnlockTimestamp = new Date().toISOString();
    newState.regularGamesPlayed = 0; // Reset counter
  }

  saveLiveConversationState(newState);
  return newState;
};

/**
 * Record a live conversation level usage
 * This locks the level again until next unlock
 */
export const recordLiveConversationUsage = (levelTitle: string): LiveConversationState => {
  if (!isLiveConversationLevel(levelTitle)) {
    return getLiveConversationState();
  }

  const state = getLiveConversationState();
  const newState: LiveConversationState = {
    ...state,
    liveLevelsUnlocked: state.liveLevelsUnlocked.filter(level => level !== levelTitle),
    usageHistory: [
      ...state.usageHistory,
      {
        levelId: levelTitle,
        usedAt: new Date().toISOString(),
        gamesPlayedToUnlock: LIVE_CONVERSATION_CONFIG.GAMES_REQUIRED_TO_UNLOCK
      }
    ]
  };

  saveLiveConversationState(newState);
  return newState;
};

/**
 * Get games remaining until next unlock
 */
export const getGamesUntilUnlock = (): number => {
  const state = getLiveConversationState();
  return Math.max(0, LIVE_CONVERSATION_CONFIG.GAMES_REQUIRED_TO_UNLOCK - state.regularGamesPlayed);
};

/**
 * Get progress toward next unlock as percentage
 */
export const getUnlockProgress = (): number => {
  const state = getLiveConversationState();
  return Math.min(100, (state.regularGamesPlayed / LIVE_CONVERSATION_CONFIG.GAMES_REQUIRED_TO_UNLOCK) * 100);
};

/**
 * Check if any live conversation levels are currently available
 */
export const hasAvailableLiveConversations = (): boolean => {
  const state = getLiveConversationState();
  return state.liveLevelsUnlocked.length > 0;
};

/**
 * Get live conversation status for UI display
 */
export const getLiveConversationStatus = (levelTitle: string) => {
  if (!isLiveConversationLevel(levelTitle)) {
    return { isLiveConversation: false };
  }

  const state = getLiveConversationState();
  const isUnlocked = state.liveLevelsUnlocked.includes(levelTitle);
  const gamesUntilUnlock = getGamesUntilUnlock();
  const progress = getUnlockProgress();

  return {
    isLiveConversation: true,
    isUnlocked,
    gamesUntilUnlock,
    progress,
    gamesPlayed: state.regularGamesPlayed,
    gamesRequired: LIVE_CONVERSATION_CONFIG.GAMES_REQUIRED_TO_UNLOCK,
    lastUnlock: state.lastUnlockTimestamp,
    usageCount: state.usageHistory.filter(usage => usage.levelId === levelTitle).length
  };
};

/**
 * Reset live conversation state (for testing/debugging)
 */
export const resetLiveConversationState = (): void => {
  const initialState: LiveConversationState = {
    regularGamesPlayed: 0,
    liveLevelsUnlocked: [],
    lastUnlockTimestamp: null,
    usageHistory: []
  };
  
  saveLiveConversationState(initialState);
};

/**
 * Initialize live conversation system with first-time unlock for English Guide Bot
 */
export const initializeLiveConversationSystem = (): LiveConversationState => {
  let state = getLiveConversationState();
  
  // If this is the first time, unlock English Guide Bot initially
  if (state.usageHistory.length === 0 && state.liveLevelsUnlocked.length === 0) {
    state = {
      ...state,
      liveLevelsUnlocked: ["English Guide Bot"],
      lastUnlockTimestamp: new Date().toISOString()
    };
    saveLiveConversationState(state);
  }
  
  return state;
};

/**
 * Filter components list based on live conversation availability
 */
export const filterLiveConversationComponents = (
  componentsList: ComponentItem[]
): ComponentItem[] => {
  return componentsList.map(item => {
    if (isLiveConversationLevel(item.title)) {
      const status = getLiveConversationStatus(item.title);
      return {
        ...item,
        isLocked: !status.isUnlocked,
        isLiveConversation: true
      };
    }
    return item;
  });
};

/**
 * Create unlock notification configuration for SweetAlert2
 */
export const createLiveConversationUnlockNotification = () => {
  const availableLevels = getLiveConversationState().liveLevelsUnlocked;
  
  return {
    title: '🎉 Live Conversation Unlocked!',
    html: `
      <div class="text-center space-y-4">
        <div class="text-lg font-semibold text-gray-800">
          You've unlocked a live conversation session!
        </div>
        
        <div class="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
          <div class="text-sm text-gray-700 space-y-2">
            <div>🎯 <strong>Available:</strong> ${availableLevels.join(", ")}</div>
            <div>⚡ <strong>Usage:</strong> One session only</div>
            <div>🔄 <strong>Next Unlock:</strong> Complete 6 more levels</div>
          </div>
        </div>
        
        <div class="text-sm text-gray-600">
          🚀 Use it wisely - this session will lock again after one use!
        </div>
      </div>
    `,
    icon: 'success' as const,
    confirmButtonText: 'Start Live Conversation! 🎯',
    confirmButtonColor: '#10B981',
    timer: 8000,
    timerProgressBar: true,
    allowOutsideClick: false,
    customClass: {
      popup: 'animate__animated animate__bounceIn',
      title: 'text-2xl font-bold text-gray-800',
      confirmButton: 'px-6 py-3 text-lg font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200'
    }
  };
};

export default {
  LIVE_CONVERSATION_CONFIG,
  getLiveConversationState,
  saveLiveConversationState,
  isLiveConversationLevel,
  isLiveConversationUnlocked,
  recordRegularGameCompletion,
  recordLiveConversationUsage,
  getGamesUntilUnlock,
  getUnlockProgress,
  hasAvailableLiveConversations,
  getLiveConversationStatus,
  resetLiveConversationState,
  initializeLiveConversationSystem,
  filterLiveConversationComponents,
  createLiveConversationUnlockNotification
};
