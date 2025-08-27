// Scoring utilities for managing card performance across the application

export interface CardScore {
  cardId: string;
  score: number;
  maxScore: number;
  percentage: number;
  completed: boolean;
  lastUpdated: string;
}

export interface UnlockState {
  advancedCardsUnlocked: boolean;
  popupShown: boolean;
  unlockedAt: string | null;
}

// Save a card's score to localStorage
export const saveCardScore = (cardTitle: string, score: number, maxScore: number): void => {
  try {
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const newScore: CardScore = {
      cardId: cardTitle,
      score,
      maxScore,
      percentage,
      completed: true,
      lastUpdated: new Date().toISOString(),
    };

    // Get existing scores
    const existingScores = localStorage.getItem('speakGrade_scores');
    let scores: CardScore[] = existingScores ? JSON.parse(existingScores) : [];

    // Update or add the new score
    const existingIndex = scores.findIndex(s => s.cardId === cardTitle);
    if (existingIndex >= 0) {
      scores[existingIndex] = newScore;
    } else {
      scores.push(newScore);
    }

    // Save back to localStorage
    localStorage.setItem('speakGrade_scores', JSON.stringify(scores));

    // Check if Interview Room should be unlocked
    checkAndUpdateUnlockStatus(scores);
  } catch (error) {
    console.error('Error saving card score:', error);
  }
};

// Load all scores from localStorage
export const loadAllScores = (): CardScore[] => {
  try {
    const scores = localStorage.getItem('speakGrade_scores');
    return scores ? JSON.parse(scores) : [];
  } catch (error) {
    console.error('Error loading scores:', error);
    return [];
  }
};

// Calculate average score across all completed cards
export const calculateAverageScore = (scores: CardScore[]): number => {
  const completedScores = scores.filter(score => score.completed);
  if (completedScores.length === 0) return 0;
  
  const totalPercentage = completedScores.reduce((sum, score) => sum + score.percentage, 0);
  return Math.round(totalPercentage / completedScores.length);
};

// Check if advanced cards should be unlocked and update localStorage
export const checkAndUpdateUnlockStatus = (scores: CardScore[]): void => {
  try {
    const averageScore = calculateAverageScore(scores);
    const shouldBeUnlocked = averageScore >= 60;

    // Get current unlock state
    const existingUnlockState = localStorage.getItem('speakGrade_unlockState');
    let unlockState: UnlockState = existingUnlockState ? JSON.parse(existingUnlockState) : {
      advancedCardsUnlocked: false,
      popupShown: false,
      unlockedAt: null,
    };

    // Update if needed
    if (shouldBeUnlocked && !unlockState.advancedCardsUnlocked) {
      unlockState = {
        advancedCardsUnlocked: true,
        popupShown: false,
        unlockedAt: new Date().toISOString(),
      };
      
      localStorage.setItem('speakGrade_unlockState', JSON.stringify(unlockState));
    }
  } catch (error) {
    console.error('Error updating unlock status:', error);
  }
};

// Load unlock state from localStorage
export const loadUnlockState = (): UnlockState => {
  try {
    const unlockState = localStorage.getItem('speakGrade_unlockState');
    return unlockState ? JSON.parse(unlockState) : {
      advancedCardsUnlocked: false,
      popupShown: false,
      unlockedAt: null,
    };
  } catch (error) {
    console.error('Error loading unlock state:', error);
    return {
      advancedCardsUnlocked: false,
      popupShown: false,
      unlockedAt: null,
    };
  }
};

// Mark popup as shown
export const markPopupAsShown = (): void => {
  try {
    const unlockState = loadUnlockState();
    unlockState.popupShown = true;
    localStorage.setItem('speakGrade_unlockState', JSON.stringify(unlockState));
  } catch (error) {
    console.error('Error marking popup as shown:', error);
  }
};

// Get progress statistics
export const getProgressStats = () => {
  const scores = loadAllScores();
  const averageScore = calculateAverageScore(scores);
  const completedCount = scores.filter(s => s.completed).length;
  const totalCards = 7; // Total number of cards in the system (including English Guide Bot)
  
  return {
    averageScore,
    completedCount,
    totalCards,
    progressPercentage: Math.round((completedCount / totalCards) * 100),
    isInterviewRoomUnlocked: averageScore >= 60,
  };
};
