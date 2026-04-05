/**
 * HUD (Heads-Up Display) Component
 * Level indicator (top-left) and pause button (top-right)
 */

import { useGameContext } from '../../context/GameContext';

export function HUD() {
  const { state, dispatch } = useGameContext();

  const handlePause = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_STATE', payload: 'paused' });
  };

  if (state.gameState !== 'playing') {
    return null;
  }

  return (
    <div className="absolute inset-x-0 top-0 flex justify-between p-3 sm:p-4 z-10">
      {/* Level Indicator - Top Left */}
      <div
        className="pointer-events-none relative flex items-center justify-center px-4 h-10 sm:h-11 bg-black/40 backdrop-blur-sm border border-white/10"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)'
        }}
      >
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider font-mono">LVL</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white">{state.level}</span>
        </div>
        {/* Corner accent */}
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/30" />
      </div>

      {/* Tactical Pause Button - Top Right */}
      <button
        onClick={handlePause}
        onTouchEnd={(e) => { e.preventDefault(); handlePause(e); }}
        className="group pointer-events-auto relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white/40 active:bg-black/80 transition-all duration-200"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)'
        }}
        aria-label="Pause game"
      >
        {/* Pause icon */}
        <div className="flex gap-[3px]">
          <div className="w-[3px] h-4 bg-white/80 group-hover:bg-white group-active:bg-white transition-colors" />
          <div className="w-[3px] h-4 bg-white/80 group-hover:bg-white group-active:bg-white transition-colors" />
        </div>
        
        {/* Corner accent */}
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/30 group-hover:border-white/50" />
      </button>
    </div>
  );
}
