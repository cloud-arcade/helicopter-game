/**
 * Game Over Screen Component
 * Tactical crash report overlay - helicopter nav style
 */

import { useEffect, useState, useCallback } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';

export function GameOverScreen() {
  const { state, dispatch } = useGameContext();
  const { startSession } = useCloudArcade();
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [countedScore, setCountedScore] = useState(0);
  const [canRestart, setCanRestart] = useState(false);

  // Check for new high score
  useEffect(() => {
    if (state.score >= state.highScore && state.score > 0) {
      setShowNewRecord(true);
    }
  }, [state.score, state.highScore]);

  // Animated score count-up
  useEffect(() => {
    const target = state.score;
    const duration = 800;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCountedScore(Math.floor(target * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [state.score]);

  // Delay restart ability to prevent accidental restart
  useEffect(() => {
    setCanRestart(false);
    const timer = setTimeout(() => setCanRestart(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (!canRestart) return;
    setShowNewRecord(false);
    startSession();
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_STATE', payload: 'playing' });
  }, [canRestart, startSession, dispatch]);

  // Listen for Space key to restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === ' ') && canRestart) {
        e.preventDefault();
        handlePlayAgain();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayAgain, canRestart]);

  const handleMenu = () => {
    setShowNewRecord(false);
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_STATE', payload: 'menu' });
  };

  return (
    <div 
      className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer animate-fade-in"
      onClick={handlePlayAgain}
      onTouchEnd={(e) => { e.preventDefault(); handlePlayAgain(); }}
    >
      {/* Tactical crash report card */}
      <div 
        className="relative flex flex-col items-center gap-3 sm:gap-4 p-6 sm:p-8 w-full max-w-xs sm:max-w-sm bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl clip-tactical animate-fade-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner accents */}
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/30" />
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/30" />

        {/* Warning header with animated line */}
        <div className="flex flex-col items-center gap-1 animate-slide-down">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-[1px] bg-white/30" />
            <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">System Alert</span>
            <div className="w-8 h-[1px] bg-white/30" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-white uppercase">
            // CRASH
          </h1>
          <p className="text-[10px] sm:text-xs text-white/40 font-mono tracking-wider">FLIGHT TERMINATED</p>
        </div>

        {/* Distance score - big tactical display */}
        <div className="flex flex-col items-center w-full py-3 sm:py-4 bg-black/40 border border-white/10 animate-fade-slide-in delay-100">
          <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-mono mb-1">TOTAL DISTANCE</span>
          <strong className="text-3xl sm:text-4xl font-bold font-mono text-white animate-count-up">
            {countedScore.toLocaleString()}m
          </strong>
        </div>

        {/* New record badge */}
        {showNewRecord && (
          <div className="flex items-center gap-2 px-4 py-2 w-full bg-white/10 border border-white/30 animate-fade-slide-in delay-200 animate-border-glow">
            <div className="w-2 h-2 bg-white animate-glow-pulse" />
            <span className="text-white font-semibold text-xs sm:text-sm font-mono tracking-wide uppercase">New Record</span>
          </div>
        )}

        {/* Best score (when not new record) */}
        {!showNewRecord && state.highScore > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 w-full bg-black/40 border border-white/10 animate-fade-slide-in delay-200">
            <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-mono">BEST</span>
            <span className="text-base sm:text-lg font-bold font-mono text-white ml-auto">{state.highScore.toLocaleString()}m</span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-3 sm:gap-4 w-full animate-fade-slide-in delay-300">
          <div className="flex-1 flex flex-col items-center gap-1 p-2 sm:p-3 bg-black/40 border border-white/10">
            <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider font-mono">LVL</span>
            <span className="text-sm sm:text-base font-bold font-mono text-white">{state.level}</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 p-2 sm:p-3 bg-black/40 border border-white/10">
            <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider font-mono">LIVES</span>
            <span className="text-sm sm:text-base font-bold font-mono text-white">{state.lives}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 w-full mt-1 sm:mt-2 animate-fade-slide-in delay-400">
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayAgain(); }}
            className={`relative group w-full px-6 py-3 overflow-hidden bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 active:bg-white/30 transition-all duration-200 clip-tactical-btn ${!canRestart ? 'opacity-40' : 'animate-border-glow'}`}
            disabled={!canRestart}
          >
            <span className="relative z-10 font-semibold text-white tracking-widest text-sm sm:text-base uppercase">Fly Again</span>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40 group-hover:border-white/60" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); handleMenu(); }}
            className="w-full px-6 py-2.5 bg-transparent hover:bg-white/5 border border-white/20 hover:border-white/30 active:bg-white/10 transition-all duration-200 text-white/70 hover:text-white text-xs sm:text-sm uppercase tracking-wide font-mono"
          >
            Main Menu
          </button>
        </div>

        {/* Hint */}
        <div className="text-[10px] sm:text-xs text-white/30 font-mono animate-fade-slide-in delay-500">
          SPACE to retry
        </div>
      </div>
    </div>
  );
}
