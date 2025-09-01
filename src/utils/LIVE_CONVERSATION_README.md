# Live Conversation System - Implementation Guide

## Overview

The Live Conversation System is a modular locking mechanism for special "live conversation" levels that require users to complete regular levels to unlock temporary access. This creates an engaging progression system where premium features are earned through gameplay.

## How It Works

### Core Mechanics

1. **Regular Game Tracking**: System tracks completions of non-live-conversation levels
2. **Unlock Threshold**: After 6 regular game completions, live conversation levels unlock
3. **One-Time Usage**: Live conversation levels lock again after one use
4. **Progressive Unlocking**: Process repeats - complete 6 more games to unlock again

### Initial State

- **English Guide Bot** starts **UNLOCKED** for first-time users
- After first use, it follows the standard 6-game unlock pattern
- This gives users a taste of the premium feature before requiring progression

## System Architecture

### Files Structure

```
src/
├── utils/
│   ├── liveConversationManager.ts     # Core system logic
│   └── LIVE_CONVERSATION_README.md    # This documentation
└── clientLayout.tsx                   # UI integration and event handling
```

### Key Components

#### 1. Live Conversation Manager (`liveConversationManager.ts`)

**Core Functions:**
- `recordRegularGameCompletion(levelTitle)`: Increments progress toward unlock
- `recordLiveConversationUsage(levelTitle)`: Locks level after use
- `getLiveConversationStatus(levelTitle)`: Gets current status for UI
- `initializeLiveConversationSystem()`: Sets up first-time unlock

**Configuration:**
```typescript
export const LIVE_CONVERSATION_CONFIG = {
  GAMES_REQUIRED_TO_UNLOCK: 6,
  LIVE_CONVERSATION_LEVELS: ["English Guide Bot"],
  STORAGE_KEY: 'speakGrade_liveConversation'
};
```

#### 2. UI Integration (`clientLayout.tsx`)

**Features:**
- Live conversation progress bar
- Dynamic card status indicators
- Unlock/lock confirmation popups
- Real-time progress tracking

## Adding New Live Conversation Levels

### 1. Update Configuration

In `liveConversationManager.ts`:
```typescript
export const LIVE_CONVERSATION_CONFIG = {
  GAMES_REQUIRED_TO_UNLOCK: 6,
  LIVE_CONVERSATION_LEVELS: [
    "English Guide Bot",
    "Your New Level Name"  // Add here
  ],
  STORAGE_KEY: 'speakGrade_liveConversation'
};
```

### 2. Mark Level in Components List

In `clientLayout.tsx`:
```typescript
{
  id: 8,
  title: "Your New Level Name",
  description: "Description of your live conversation level",
  image: "/cards/your-level-image.png",
  path: "/cards/yourNewLevel",
  isLocked: false, // Will be dynamically controlled
  requiredScore: 0,
  tags: ["Your Tags", "Live"], // Include "Live" tag
  isLiveConversation: true, // Mark as live conversation
}
```

### 3. Create Level Component

Create your level component with proper integration:
```typescript
// In your level completion handler
import liveConversationManager from '@/utils/liveConversationManager';

const handleLevelCompletion = () => {
  // Your existing completion logic
  
  // Record usage (this will lock the level again)
  liveConversationManager.recordLiveConversationUsage("Your New Level Name");
};
```

## Configuration Options

### Unlock Requirements

You can customize the unlock requirements:

```typescript
// Change number of games required
GAMES_REQUIRED_TO_UNLOCK: 3, // Instead of 6

// Add multiple live conversation levels
LIVE_CONVERSATION_LEVELS: [
  "English Guide Bot",
  "Advanced Interview Prep",
  "Business Negotiation",
  "Customer Service Master"
]
```

### UI Customization

The system provides several UI states:

1. **Locked State**: Shows games remaining until unlock
2. **Unlocked State**: Shows available session with warning
3. **Progress Tracking**: Visual progress bar on dashboard
4. **Notifications**: Unlock celebration popups

## Event System

The system uses custom events for real-time updates:

```typescript
// Automatically fired when state changes
window.addEventListener('liveConversationUpdated', (e) => {
  console.log('Live conversation state:', e.detail);
});

// Automatically fired when regular games complete
window.addEventListener('scoresUpdated', (e) => {
  // System automatically processes this for live conversation progress
});
```

## Testing the System

### Manual Testing Steps

1. **Initial State**: English Guide Bot should be unlocked initially
2. **First Usage**: Click English Guide Bot → should show "Starting Live Conversation" popup
3. **After Usage**: English Guide Bot should lock and show "X left" badge
4. **Progress**: Complete any 6 regular levels (Interview Room, Weekly Check, etc.)
5. **Re-unlock**: English Guide Bot should unlock again with celebration popup
6. **Repeat**: System should continue this cycle

### Reset for Testing

```typescript
// Call this in browser console to reset state
liveConversationManager.resetLiveConversationState();
```

### Debug Information

The system logs detailed information:
- `🎯 Regular game completed, updating live conversation progress...`
- `🔄 Live conversation state updated`
- `🎉 Live conversations unlocked!`

## Data Storage

### LocalStorage Structure

```json
{
  "regularGamesPlayed": 3,
  "liveLevelsUnlocked": ["English Guide Bot"],
  "lastUnlockTimestamp": "2024-01-15T10:30:00.000Z",
  "usageHistory": [
    {
      "levelId": "English Guide Bot",
      "usedAt": "2024-01-15T09:15:00.000Z",
      "gamesPlayedToUnlock": 6
    }
  ]
}
```

### Data Persistence

- State persists across browser sessions
- Automatic cleanup of old usage history
- Backup/restore functionality available
- Cross-tab synchronization via storage events

## Integration with Existing Systems

### Compatibility

- **Score System**: Integrates with existing `speakGrade_scores` tracking
- **Progress System**: Uses existing `scoresUpdated` events
- **UI Framework**: Uses existing SweetAlert2 popups and styling
- **Locked Levels**: Completely separate from the old locked levels system

### Migration Notes

- Old locked levels system is disabled but preserved
- Live conversation system is independent and additive
- No conflicts with existing progression systems
- Backwards compatible with existing user data

## Troubleshooting

### Common Issues

1. **Levels not unlocking**: Check that `scoresUpdated` events include `cardId`
2. **Progress not showing**: Verify `liveConversationState` is updating
3. **UI not updating**: Check event listeners are properly attached
4. **LocalStorage issues**: Check browser storage permissions

### Debug Commands

```typescript
// Check current state
console.log(liveConversationManager.getLiveConversationState());

// Check level status
console.log(liveConversationManager.getLiveConversationStatus("English Guide Bot"));

// Check unlock progress
console.log(`Progress: ${liveConversationManager.getUnlockProgress()}%`);
console.log(`Games until unlock: ${liveConversationManager.getGamesUntilUnlock()}`);
```

## Future Enhancements

### Possible Improvements

1. **Dynamic Requirements**: Different unlock requirements per level
2. **Time-based Unlocks**: Temporary unlocks that expire after time
3. **Achievement System**: Unlock levels through specific achievements
4. **Multiple Sessions**: Allow multiple uses before re-locking
5. **Level Tiers**: Bronze/Silver/Gold live conversation levels

### API Integration

The system is designed to be easily extended for:
- Server-side progress tracking
- Cross-device synchronization
- Analytics and usage monitoring
- A/B testing different unlock requirements

This modular design ensures the live conversation system can evolve with your application's needs while maintaining clean separation of concerns.
