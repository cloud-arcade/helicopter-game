/**
 * Game Container Component
 * Main container that manages game screens - fully responsive
 * GameScreen always runs in background, overlays shown on top
 */

import { useGameContext } from '../context/GameContext';
import { LoadingScreen } from './screens/LoadingScreen';
import { MenuScreen } from './screens/MenuScreen';
import { GameScreen } from './screens/GameScreen';
import { PauseOverlay } from './ui/PauseOverlay';
import { GameOverScreen } from './screens/GameOverScreen';
import { HUD } from './ui/HUD';

export function GameContainer() {
  const { state } = useGameContext();
  const { gameState } = state;

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* Loading screen (full replacement) */}
      {gameState === 'loading' && <LoadingScreen />}
      
      {/* Game always renders when not loading (for menu/gameover backgrounds) */}
      {gameState !== 'loading' && <GameScreen />}
      
      {/* HUD - shows during gameplay */}
      {gameState === 'playing' && <HUD />}
      
      {/* Overlays on top of game */}
      {gameState === 'menu' && <MenuScreen />}
      {gameState === 'paused' && <PauseOverlay />}
      {gameState === 'gameover' && <GameOverScreen />}
    </div>
  );
}
