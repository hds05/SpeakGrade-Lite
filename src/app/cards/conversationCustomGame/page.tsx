'use client';

import SimplePhaserGame from './phaser-game';
import './game.css';

export default function ConversationCustomGame() {
  // Use only Phaser game engine - no DOM version
        return <SimplePhaserGame />;
}