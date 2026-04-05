/**
 * Loading Screen Component
 * Helicopter Game - Asset preloading and initialization
 */

import { useEffect, useState } from 'react';
import { useGameContext } from '../../context/GameContext';

// Assets to preload - using BASE_URL for GitHub Pages
const baseUrl = import.meta.env.BASE_URL;
const HELICOPTER_ASSETS = [
  `${baseUrl}assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_body.png`,
  `${baseUrl}assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_top_rotor_frame_1.png`,
  `${baseUrl}assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_top_rotor_frame_2.png`,
  `${baseUrl}assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_back_rotor_frame_1.png`,
  `${baseUrl}assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_back_rotor_frame_2.png`,
  `${baseUrl}assets/sprites/attack_helicopter/pngs/flying_side_view/attack_helicopter_side_view_frame_1.png`,
];

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Continue even if image fails
    img.src = src;
  });
}

export function LoadingScreen() {
  const { dispatch } = useGameContext();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    let mounted = true;

    const loadAssets = async () => {
      const totalAssets = HELICOPTER_ASSETS.length;
      let loaded = 0;

      setLoadingText('Loading helicopter sprites...');

      for (const asset of HELICOPTER_ASSETS) {
        await preloadImage(asset);
        loaded++;
        if (mounted) {
          setProgress((loaded / totalAssets) * 100);
        }
      }

      if (mounted) {
        setLoadingText('Ready for takeoff!');
        // Transition to menu
        setTimeout(() => {
          if (mounted) {
            dispatch({ type: 'SET_STATE', payload: 'menu' });
          }
        }, 500);
      }
    };

    loadAssets();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-md">
      <div className="relative flex flex-col items-center gap-4 sm:gap-5 p-6 sm:p-8 w-full max-w-xs sm:max-w-sm bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl clip-tactical">
        {/* Corner accents */}
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/30" />
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/30" />

        {/* Helicopter rotor animation */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <div 
            className="absolute w-14 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent"
            style={{ 
              animation: 'spin 0.15s linear infinite'
            }}
          />
          <div className="w-10 h-7 bg-white/20 border border-white/30" 
               style={{
                 clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)'
               }}
          />
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wider text-white uppercase">
            // HELICOPTER
          </h2>
          <p className="text-[10px] sm:text-xs text-white/50 tracking-[0.3em] uppercase font-mono">Cave Run</p>
        </div>

        {/* Loading text */}
        <div className="px-4 py-2 bg-black/40 border border-white/10">
          <p className="text-xs sm:text-sm text-white/70 tracking-wide font-mono uppercase">{loadingText}</p>
        </div>

        {/* Progress bar - tactical style */}
        <div className="w-full flex flex-col gap-2">
          <div className="w-full h-2 bg-black/40 border border-white/10 overflow-hidden">
            <div 
              className="h-full bg-white/30 transition-all duration-200 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          
          {/* Progress percentage */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-white/40 font-mono uppercase tracking-wider">Progress</span>
            <span className="text-xs sm:text-sm text-white font-mono font-bold">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* System status indicator */}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 bg-white animate-glow-pulse" />
          <span className="text-[10px] sm:text-xs text-white/50 font-mono tracking-wider uppercase">System Init</span>
        </div>
      </div>
    </div>
  );
}
