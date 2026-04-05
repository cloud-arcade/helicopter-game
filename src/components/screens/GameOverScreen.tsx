/**
 * Game Over Screen Component
 * Clean overlay on top of crashed game state
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
      className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
      onClick={handlePlayAgain}
      onTouchEnd={(e) => { e.preventDefault(); handlePlayAgain(); }}
    >
      {/* Main content card - responsive sizing */}
      <div className="flex flex-col items-center gap-3 sm:gap-4 p-6 sm:p-8 w-full max-w-xs sm:max-w-sm bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl">
        {/* Crash title */}
        <div className="flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-orange-500">
            CRASH!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">Flight terminated</p>
        </div>

        {/* Score display */}
        <div className="flex flex-col items-center py-2 sm:py-3">
          <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Distance</span>
          <strong className="text-4xl sm:text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
            {countedScore.toLocaleString()}
          </strong>
        </div>

        {/* New record badge */}
        {showNewRecord && (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 rounded-xl animate-bounce">
            <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-amber-300 font-semibold text-xs sm:text-sm">NEW RECORD!</span>
          </div>
        )}

        {/* Best score (when not new record) */}
        {!showNewRecord && state.highScore > 0 && (
          <div className="flex flex-col items-center px-4 sm:px-5 py-2 bg-slate-800/60 rounded-lg">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Best</span>
            <span className="text-base sm:text-lg font-mono font-semibold text-amber-400">{state.highScore.toLocaleString()}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 w-full mt-1 sm:mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayAgain(); }}
            className={`relative group w-full px-6 sm:px-8 py-3 sm:py-3.5 overflow-hidden rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] transition-all duration-200 ${!canRestart ? 'opacity-50' : ''}`}
            disabled={!canRestart}
          >
            <span className="relative z-10 tracking-wide text-sm sm:text-base">FLY AGAIN</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); handleMenu(); }}
            className="px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 active:scale-[0.98] transition-all duration-200 text-sm sm:text-base"
          >
            Menu
          </button>
        </div>

        {/* Tip */}
        <p className="text-[10px] sm:text-xs text-slate-500 text-center">
          Hold to rise • Release to fall
        </p>
      </div>
    </div>
  );
}
