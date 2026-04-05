/**
 * Menu Screen Component
 * Clean overlay on top of game background
 */

import { useEffect, useState, useCallback } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';

export function MenuScreen() {
  const { state, dispatch } = useGameContext();
  const { startSession } = useCloudArcade();
  const [helicopterY, setHelicopterY] = useState(0);

  // Animated helicopter bobbing
  useEffect(() => {
    const interval = setInterval(() => {
      setHelicopterY(Math.sin(Date.now() / 500) * 6);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleStart = useCallback(() => {
    startSession();
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_STATE', payload: 'playing' });
  }, [startSession, dispatch]);

  // Listen for Space key to start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart]);

  return (
    <div 
      className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm cursor-pointer"
      onClick={handleStart}
      onTouchEnd={(e) => { e.preventDefault(); handleStart(); }}
    >
      {/* Main content card - responsive sizing */}
      <div className="flex flex-col items-center gap-4 sm:gap-5 p-6 sm:p-8 w-full max-w-xs sm:max-w-sm bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl">
        {/* Title */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400">
            HELICOPTER
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 tracking-[0.2em] sm:tracking-[0.25em] uppercase font-medium">Cave Run</p>
        </div>

        {/* Helicopter icon */}
        <div className="relative my-1">
          <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full scale-125" />
          <img 
            src={`${import.meta.env.BASE_URL}assets/sprites/attack_helicopter/pngs/flying_side_view/attack_helicopter_side_view_frame_1.png`} 
            alt="Helicopter"
            className="relative w-24 sm:w-32 h-auto drop-shadow-xl"
            style={{ transform: `translateY(${helicopterY}px)` }}
          />
        </div>

        {/* Instructions */}
        <p className="text-xs sm:text-sm text-slate-400 text-center">
          <span className="px-1.5 sm:px-2 py-0.5 bg-slate-800 rounded text-[10px] sm:text-xs text-cyan-400 mr-1.5 sm:mr-2">SPACE</span>
          or
          <span className="px-1.5 sm:px-2 py-0.5 bg-slate-800 rounded text-[10px] sm:text-xs text-cyan-400 mx-1.5 sm:mx-2">TAP</span>
          to fly
        </p>

        {/* High score */}
        {state.highScore > 0 && (
          <div className="flex flex-col items-center px-4 sm:px-5 py-2 bg-slate-800/60 rounded-lg border border-amber-500/20">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">Best</span>
            <span className="text-lg sm:text-xl font-mono font-bold text-amber-400">{state.highScore.toLocaleString()}</span>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleStart(); }}
          className="relative group w-full px-6 sm:px-8 py-3 sm:py-4 mt-1 overflow-hidden rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] transition-all duration-200"
        >
          <span className="relative z-10 tracking-wide text-base sm:text-lg">START FLIGHT</span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Connection status */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          {state.isPlatformConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-400/80">CloudArcade</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-slate-500">Standalone</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
