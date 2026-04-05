/**
 * Menu Screen Component
 * Tactical helicopter nav-style menu overlay
 */

import { useEffect, useState, useCallback } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';

export function MenuScreen() {
  const { state, dispatch } = useGameContext();
  const { startSession } = useCloudArcade();
  const [helicopterY, setHelicopterY] = useState(0);
  const [rotorFrame, setRotorFrame] = useState(0);

  // Animated helicopter bobbing
  useEffect(() => {
    const interval = setInterval(() => {
      setHelicopterY(Math.sin(Date.now() / 500) * 6);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Rotor animation - alternate frames for spinning effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRotorFrame(prev => prev === 0 ? 1 : 0);
    }, 100);
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
      className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer animate-fade-in"
      onClick={handleStart}
      onTouchEnd={(e) => { e.preventDefault(); handleStart(); }}
    >
      {/* Tactical card */}
      <div 
        className="relative flex flex-col items-center gap-4 sm:gap-5 p-6 sm:p-8 w-full max-w-xs sm:max-w-sm bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl clip-tactical animate-fade-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner accent */}
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/30" />
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/30" />

        {/* Title */}
        <div className="flex flex-col items-center gap-1 animate-fade-slide-in delay-100">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider text-white uppercase">
            // HELICOPTER
          </h1>
          <p className="text-[10px] sm:text-xs text-white/50 tracking-[0.3em] uppercase font-mono">Cave Run</p>
        </div>

        {/* Helicopter icon with animated rotors */}
        <div className="relative my-1 animate-fade-slide-in delay-200">
          <div 
            className="relative w-24 sm:w-32"
            style={{ 
              transform: `translateY(${helicopterY}px) scaleX(-1)`,
              filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.15))'
            }}
          >
            {/* Helicopter body */}
            <img 
              src={`${import.meta.env.BASE_URL}assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_body.png`} 
              alt="Helicopter"
              className="relative w-full h-auto"
            />
            
            {/* Top rotor - animated */}
            <img 
              src={`${import.meta.env.BASE_URL}assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_top_rotor_frame_${rotorFrame + 1}.png`} 
              alt=""
              className="absolute top-[-8%] left-[10%] w-[90%] h-auto"
            />
            
            {/* Back rotor - animated */}
            <img 
              src={`${import.meta.env.BASE_URL}assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_back_rotor_frame_${rotorFrame + 1}.png`} 
              alt=""
              className="absolute top-[35%] right-[-2%] w-[13%] h-auto"
            />
          </div>
        </div>

        {/* Control instructions - tactical style */}
        <div className="flex gap-3 items-center text-white/60 animate-fade-slide-in delay-300">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-1 bg-white/10 border border-white/20 text-[10px] sm:text-xs text-white/80 font-mono clip-tactical-sm">SPACE</span>
          </div>
          <span className="text-white/30 text-xs">/</span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-1 bg-white/10 border border-white/20 text-[10px] sm:text-xs text-white/80 font-mono clip-tactical-sm">TAP</span>
          </div>
          <span className="text-[10px] sm:text-xs text-white/40 font-mono">=&nbsp;FLY</span>
        </div>

        {/* High score panel */}
        {state.highScore > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 w-full bg-black/40 border border-white/10 animate-fade-slide-in delay-300">
            <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-mono">BEST</span>
            <span className="text-base sm:text-lg font-bold font-mono text-white ml-auto">{state.highScore.toLocaleString()}m</span>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleStart(); }}
          className="relative group w-full px-6 py-3 sm:py-3.5 mt-1 overflow-hidden bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 active:bg-white/30 transition-all duration-200 clip-tactical-btn animate-fade-slide-in delay-400 animate-border-glow"
        >
          <span className="relative z-10 font-semibold text-white tracking-widest text-sm sm:text-base uppercase">Start Flight</span>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40 group-hover:border-white/60" />
        </button>

        {/* System status */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono animate-fade-slide-in delay-500">
          {state.isPlatformConnected ? (
            <>
              <span className="w-1.5 h-1.5 bg-white animate-glow-pulse" />
              <span className="text-white/50">SYS ONLINE</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 bg-white/40" />
              <span className="text-white/30">STANDALONE</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
