/**
 * Game Screen Component
 * Main helicopter game canvas and controls
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';
import { useHelicopterGame } from '../../game';

export function GameScreen() {
  const { state, dispatch } = useGameContext();
  const { submitScore, gameOver, endSession } = useCloudArcade();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameInitializedRef = useRef(false);

  // Store callbacks in refs to avoid stale closures
  const stateRef = useRef(state);
  const dispatchRef = useRef(dispatch);
  const cloudArcadeRef = useRef({ submitScore, gameOver, endSession });
  
  useEffect(() => {
    stateRef.current = state;
    dispatchRef.current = dispatch;
    cloudArcadeRef.current = { submitScore, gameOver, endSession };
  });

  const handleGameOver = useCallback((finalScore: number) => {
    const { submitScore, gameOver, endSession } = cloudArcadeRef.current;
    submitScore(finalScore, { gameType: 'helicopter' });
    gameOver(finalScore, true);
    endSession();
    
    if (finalScore > stateRef.current.highScore) {
      dispatchRef.current({ type: 'SET_HIGH_SCORE', payload: finalScore });
    }
    dispatchRef.current({ type: 'SET_STATE', payload: 'gameover' });
  }, []);

  const game = useHelicopterGame({
    onGameOver: handleGameOver,
  });

  // Store game in ref for use in effects
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  });

  // Initialize canvas and game ONCE when mounted
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    gameRef.current.initGame(canvas);
    gameRef.current.setHighScore(stateRef.current.highScore);
    gameRef.current.startLoop();
    gameInitializedRef.current = true;

    // Handle resize without full reinit
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      gameRef.current.stopLoop();
    };
  }, []);

  // Input handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        gameRef.current.handleInputStart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        gameRef.current.handleInputEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse/touch handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    gameRef.current.handleInputStart();
  }, []);

  const handlePointerUp = useCallback(() => {
    gameRef.current.handleInputEnd();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 bg-zinc-950 cursor-pointer select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
}
