# Locked Levels Functionality - Re-enablement Guide

## Overview

The locked levels functionality has been modularized and temporarily disabled. All the code is preserved and commented out for easy re-enablement in the future.

## Current State

- **All levels are unlocked** and accessible immediately
- **Interview Room** is now the first level on the dashboard
- **English Guide Bot** is the only level that was previously locked (now also unlocked)
- All locking logic is commented out but preserved

## How to Re-enable Locked Levels

### 1. Enable the Locked Levels Manager

In `src/clientLayout.tsx`, uncomment the import:
```typescript
// Change this:
// import lockedLevelsManager from '@/utils/lockedLevelsManager';

// To this:
import lockedLevelsManager from '@/utils/lockedLevelsManager';
```

### 2. Update Component Configuration

In `src/clientLayout.tsx`, update the `componentsList` array to mark levels as locked:

```typescript
{
  id: 7,
  title: "English Guide Bot",
  description: "AI-powered English fluency assessment with real-time feedback and vocabulary suggestions.",
  image: "/cards/english-coach.png",
  path: "/cards/englishGuideBot",
  isLocked: true,  // Change from false to true
  requiredScore: 60,  // Change from 0 to 60
  tags: ["Education", "Easy"],
}
```

### 3. Re-enable Unlock State Management

In `src/clientLayout.tsx`, uncomment the unlock state variables:

```typescript
// Uncomment these lines:
const [unlockState, setUnlockState] = useState<UnlockState>({
  advancedCardsUnlocked: false,
  popupShown: false,
  unlockedAt: null,
});
const [isUnlocking, setIsUnlocking] = useState(false);
```

### 4. Re-enable Unlock Logic

In `src/clientLayout.tsx`, uncomment the interface and functions:

```typescript
// Uncomment the UnlockState interface
interface UnlockState {
  advancedCardsUnlocked: boolean;
  popupShown: boolean;
  unlockedAt: string | null;
}

// Uncomment the checkUnlockStatus function
const checkUnlockStatus = (): boolean => {
  // ... function implementation
};

// Uncomment the getUnlockRequirements function
const getUnlockRequirements = () => {
  // ... function implementation
};

// Uncomment the useEffect for unlock state changes
useEffect(() => {
  // ... unlock logic
}, [scores, unlockState.advancedCardsUnlocked]);

// Uncomment the useEffect for saving unlock state
useEffect(() => {
  localStorage.setItem('speakGrade_unlockState', JSON.stringify(unlockState));
}, [unlockState]);
```

### 5. Re-enable Card Filtering

In `src/clientLayout.tsx`, uncomment the filtering logic:

```typescript
{componentsList
  .filter(item => {
    const isAdvancedCard = item.id === 7; // English Guide Bot only
    return !isAdvancedCard || unlockState.advancedCardsUnlocked;
  })
  .map((item) => {
    const isAdvancedCard = item.id === 7; // English Guide Bot only
    const isLocked = isAdvancedCard && !unlockState.advancedCardsUnlocked;
    const cardScore = scores.find(s => s.cardId === item.title);
    const isNewlyUnlocked = isAdvancedCard && unlockState.advancedCardsUnlocked && unlockState.unlockedAt;
    // ... rest of mapping logic
```

### 6. Re-enable Locked Card Check

In `src/clientLayout.tsx`, uncomment the locked card check in `handleCardClick`:

```typescript
// Check if it's an advanced card (English Guide Bot or Interview Room)
if ((cardPath === '/cards/englishGuideBot' || cardPath === '/cards/interviewRoom') && !unlockState.advancedCardsUnlocked) {
  // Show locked card popup...
  return;
}
```

### 7. Re-enable Locked Cards Section

In `src/clientLayout.tsx`, uncomment the locked cards display section:

```typescript
{/* Locked Advanced Cards Section */}
{!unlockState.advancedCardsUnlocked && (
  <div className={`mb-12 section-fade ${isUnlocking ? 'fade-out' : ''}`}>
    {/* ... locked cards display */}
  </div>
)}
```

### 8. Re-enable Guard Components

#### For English Guide Bot:
In `src/app/cards/englishGuideBot/EnglishGuideBotGuard.tsx`:
- Uncomment all the imports
- Uncomment all the logic in the component
- Re-add the guard to the page component in `src/app/cards/englishGuideBot/page.tsx`

#### For Interview Room (if you want to lock it again):
In `src/app/cards/interviewRoom/InterviewRoomGuard.tsx`:
- Uncomment all the imports
- Uncomment all the logic in the component
- Re-add the guard to the page component in `src/app/cards/interviewRoom/page.tsx`
- Update the componentsList to mark Interview Room as locked

### 9. Update Advanced Card Configuration

In `src/utils/lockedLevelsManager.ts`, adjust the configuration:

```typescript
// Define which card IDs are considered "advanced" and require unlocking
export const ADVANCED_CARD_IDS = [7]; // Add more IDs as needed
export const UNLOCK_THRESHOLD_SCORE = 60;
export const MINIMUM_COMPLETED_SCENARIOS = 3;
```

## Configuration Options

### Unlock Requirements
You can adjust the unlock requirements by modifying:
- `UNLOCK_THRESHOLD_SCORE`: Minimum average score required (default: 60%)
- `MINIMUM_COMPLETED_SCENARIOS`: Minimum scenarios to complete (default: 3)
- `ADVANCED_CARD_IDS`: Array of card IDs that should be locked (default: [7])

### Adding New Locked Levels
1. Add the card to `componentsList` with `isLocked: true` and appropriate `requiredScore`
2. Add the card ID to `ADVANCED_CARD_IDS` in the locked levels manager
3. Create a guard component if needed
4. Update filtering logic to include the new card

## Testing the Re-enablement

1. Clear localStorage to reset all progress: `localStorage.clear()`
2. Complete fewer than 3 scenarios - advanced cards should remain locked
3. Complete 3+ scenarios with 60%+ average - advanced cards should unlock
4. Try accessing locked cards directly - should redirect with warning

## File Structure

```
src/
├── utils/
│   ├── lockedLevelsManager.ts     # Main locking logic module
│   └── LOCKED_LEVELS_README.md    # This guide
├── clientLayout.tsx               # Main dashboard with commented locking logic
└── app/cards/
    ├── englishGuideBot/
    │   └── EnglishGuideBotGuard.tsx    # Commented guard component
    └── interviewRoom/
        └── InterviewRoomGuard.tsx      # Commented guard component
```

This modular approach ensures that the locked levels functionality can be easily re-enabled without losing any of the existing logic or having to rewrite code from scratch.
