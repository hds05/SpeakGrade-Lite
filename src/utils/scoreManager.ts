// Score management utility for all scenarios
export interface ScenarioScore {
  cardId: string;
  score: number;
  maxScore: number;
  percentage: number;
  completed: boolean;
  lastUpdated: string;
}

export const saveScenarioScore = (scenarioData: {
  cardId: string;
  score: number;
  maxScore: number;
  completed?: boolean;
}): void => {
  try {
    // Calculate final percentage
    const finalPercentage = scenarioData.maxScore > 0 
      ? Math.round((scenarioData.score / scenarioData.maxScore) * 100) 
      : 0;
    
    // Create score data for this scenario
    const scenarioScore: ScenarioScore = {
      cardId: scenarioData.cardId,
      score: scenarioData.score,
      maxScore: scenarioData.maxScore,
      percentage: finalPercentage,
      completed: scenarioData.completed ?? true,
      lastUpdated: new Date().toISOString()
    };
    
    // Get existing scores
    const existingScores = JSON.parse(localStorage.getItem('speakGrade_scores') || '[]');
    
    // Remove any existing score for this scenario
    const updatedScores = existingScores.filter((s: any) => s.cardId !== scenarioData.cardId);
    
    // Add the new score
    updatedScores.push(scenarioScore);
    
    // Save to localStorage
    localStorage.setItem('speakGrade_scores', JSON.stringify(updatedScores));
    
    // Also save completion status
    localStorage.setItem(`${scenarioData.cardId}_Completed`, "true");
    
    console.log(`💾 Saved score for ${scenarioData.cardId}: ${scenarioData.score}/${scenarioData.maxScore} (${finalPercentage}%)`);
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('scoresUpdated', { 
      detail: { scenarioId: scenarioData.cardId, scores: updatedScores } 
    }));
    
  } catch (error) {
    console.error('Error saving scenario score:', error);
  }
};

export const getScenarioScores = (): ScenarioScore[] => {
  try {
    const storedScores = localStorage.getItem('speakGrade_scores');
    return storedScores ? JSON.parse(storedScores) : [];
  } catch (error) {
    console.error('Error getting scenario scores:', error);
    return [];
  }
};

export const getScenarioScore = (cardId: string): ScenarioScore | null => {
  const scores = getScenarioScores();
  return scores.find(score => score.cardId === cardId) || null;
};
