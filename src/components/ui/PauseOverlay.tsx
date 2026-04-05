import { useEffect } from 'react';
import { useGameContext } from '../../context';

export function PauseOverlay() {
  const { state, dispatch } = useGameContext();

  if (state.gameState !== 'paused') {
    return null;
  }

  const handleResume = () => {
    dispatch({ type: 'SET_STATE', payload: 'playing' });
  };

  const handleQuit = () => {
    dispatch({ type: 'SET_STATE', payload: 'menu' });
  };

  // ESC or SPACE to resume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.key === 'Escape' || e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-md z-50"
      onClick={handleResume}
      onTouchEnd={(e) => { e.preventDefault(); handleResume(); }}
    >
      {/* Tactical pause card */}
      <div 
        className="relative flex flex-col items-center gap-4 sm:gap-5 p-6 sm:p-8 w-full max-w-xs sm:max-w-sm bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Angular corner accent */}
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/30" />
        
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold tracking-wide text-white uppercase">
          // PAUSED
        </h2>

        {/* Stats grid - tactical display */}
        <div className="flex gap-3 sm:gap-4 w-full">
          <div className="flex-1 flex flex-col items-center gap-1 p-3 bg-black/40 border border-white/10">
            <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-mono">DIST</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-white">{state.score}m</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 p-3 bg-black/40 border border-white/10">
            <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-mono">LVL</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-white">{state.level}</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 p-3 bg-black/40 border border-white/10">
            <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-mono">LIVES</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-white">{state.lives}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <button
            onClick={handleResume}
            className="relative group w-full px-6 py-3 overflow-hidden bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 active:bg-white/30 transition-all duration-200"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)'
            }}
          >
            <span className="relative z-10 font-semibold text-white tracking-wide text-sm sm:text-base uppercase">Resume</span>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40 group-hover:border-white/60" />
          </button>
          
          <button
            onClick={handleQuit}
            className="w-full px-6 py-2.5 bg-transparent hover:bg-white/5 border border-white/20 hover:border-white/30 active:bg-white/10 transition-all duration-200 text-white/70 hover:text-white text-xs sm:text-sm uppercase tracking-wide"
          >
            Main Menu
          </button>
        </div>

        {/* Hint */}
        <div className="text-[10px] sm:text-xs text-white/40 font-mono">
          ESC • SPACE • TAP to resume
        </div>
      </div>
    </div>
  );
}
