/**
 * LOCKED LEVELS FUNCTIONALITY MODULE
 * 
 * This module contains all the logic for level locking/unlocking based on user progress.
 * Currently DISABLED but can be easily re-enabled in the future.
 * 
 * To re-enable:
 * 1. Uncomment the imports and function calls in clientLayout.tsx
 * 2. Set isLocked: true and requiredScore values in componentsList
 * 3. Re-add guard components to protected pages
 * 4. Update the filtering logic in the dashboard
 */

interface CardScore {
  cardId: string;
  score: number;
  maxScore: number;
  completed: boolean;
  timestamp?: string;
}

interface UnlockState {
  advancedCardsUnlocked: boolean;
  popupShown: boolean;
  unlockedAt: string | null;
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
}

// ADVANCED CARD CONFIGURATION
// Define which card IDs are considered "advanced" and require unlocking
export const ADVANCED_CARD_IDS = [7]; // English Guide Bot
export const UNLOCK_THRESHOLD_SCORE = 60;
export const MINIMUM_COMPLETED_SCENARIOS = 3;

/**
 * Calculate average score from completed scenarios
 */
export const calculateAverageScore = (scores: CardScore[]): number => {
  const completedScores = scores.filter(score => score.completed);
  
  if (completedScores.length === 0) return 0;
  
  const totalPercentage = completedScores.reduce((sum, score) => {
    const percentage = (score.score / score.maxScore) * 100;
    return sum + percentage;
  }, 0);

  return Math.round(totalPercentage / completedScores.length);
};

/**
 * Check if user meets requirements to unlock advanced cards
 */
export const checkUnlockRequirements = (scores: CardScore[]): boolean => {
  const completedScores = scores.filter(score => score.completed);
  const averageScore = calculateAverageScore(scores);
  
  return completedScores.length >= MINIMUM_COMPLETED_SCENARIOS && 
         averageScore >= UNLOCK_THRESHOLD_SCORE;
};

/**
 * Get current unlock state from localStorage
 */
export const loadUnlockState = (): UnlockState => {
  try {
    const stored = localStorage.getItem('speakGrade_unlockState');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading unlock state:', error);
  }
  
  return {
    advancedCardsUnlocked: false,
    popupShown: false,
    unlockedAt: null,
  };
};

/**
 * Save unlock state to localStorage
 */
export const saveUnlockState = (state: UnlockState): void => {
  try {
    localStorage.setItem('speakGrade_unlockState', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving unlock state:', error);
  }
};

/**
 * Check and update unlock status based on current scores
 */
export const checkAndUpdateUnlockStatus = (scores: CardScore[]): UnlockState => {
  const shouldBeUnlocked = checkUnlockRequirements(scores);
  const currentState = loadUnlockState();

  if (shouldBeUnlocked && !currentState.advancedCardsUnlocked) {
    const newState: UnlockState = {
      advancedCardsUnlocked: true,
      popupShown: false,
      unlockedAt: new Date().toISOString(),
    };
    
    saveUnlockState(newState);
    return newState;
  }

  return currentState;
};

/**
 * Mark unlock popup as shown
 */
export const markPopupAsShown = (): void => {
  const state = loadUnlockState();
  if (state.advancedCardsUnlocked && !state.popupShown) {
    const updatedState = { ...state, popupShown: true };
    saveUnlockState(updatedState);
  }
};

/**
 * Check if a specific card should be locked
 */
export const isCardLocked = (cardId: number, unlockState: UnlockState): boolean => {
  return ADVANCED_CARD_IDS.includes(cardId) && !unlockState.advancedCardsUnlocked;
};

/**
 * Filter components list to show only unlocked items
 */
export const filterUnlockedComponents = (
  componentsList: ComponentItem[], 
  unlockState: UnlockState
): ComponentItem[] => {
  return componentsList.filter(item => {
    const isAdvancedCard = ADVANCED_CARD_IDS.includes(item.id);
    return !isAdvancedCard || unlockState.advancedCardsUnlocked;
  });
};

/**
 * Get unlock requirements info for UI display
 */
export const getUnlockRequirements = (scores: CardScore[]) => {
  const completedScores = scores.filter(score => score.completed);
  const averageScore = calculateAverageScore(scores);
  
  return {
    scenariosCompleted: completedScores.length,
    minimumScenarios: MINIMUM_COMPLETED_SCENARIOS,
    currentAverage: averageScore,
    targetAverage: UNLOCK_THRESHOLD_SCORE,
    canUnlock: checkUnlockRequirements(scores)
  };
};

/**
 * Create unlock success popup configuration
 */
export const createUnlockPopupConfig = (requirements: ReturnType<typeof getUnlockRequirements>) => {
  return {
    title: '🎉 Advanced Features Unlocked! 🚀',
    html: `
      <div class="text-center space-y-4">
        <div class="text-lg font-semibold text-gray-800">
          Congratulations! You've unlocked advanced scenarios!
        </div>
        
        <div class="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg">
          <div class="text-sm text-gray-700 space-y-2">
            <div>✅ <strong>Scenarios Completed:</strong> ${requirements.scenariosCompleted}/${requirements.minimumScenarios}</div>
            <div>✅ <strong>Average Score:</strong> ${requirements.currentAverage}%</div>
          </div>
        </div>
        
        <div class="text-sm text-gray-600">
          🚀 <strong>Interview Room</strong> and <strong>English Guide Bot</strong> are now available!
        </div>
      </div>
    `,
    icon: 'success' as const,
    confirmButtonText: 'Explore New Features! 🎯',
    confirmButtonColor: '#3B82F6',
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

// Export everything for easy importing
export default {
  ADVANCED_CARD_IDS,
  UNLOCK_THRESHOLD_SCORE,
  MINIMUM_COMPLETED_SCENARIOS,
  calculateAverageScore,
  checkUnlockRequirements,
  loadUnlockState,
  saveUnlockState,
  checkAndUpdateUnlockStatus,
  markPopupAsShown,
  isCardLocked,
  filterUnlockedComponents,
  getUnlockRequirements,
  createUnlockPopupConfig
};
