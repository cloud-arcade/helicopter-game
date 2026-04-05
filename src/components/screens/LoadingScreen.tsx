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
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-background">
      <div className="flex flex-col items-center gap-6">
        {/* Helicopter icon with rotor animation */}
        <div className="relative">
          <div className="w-16 h-16 flex items-center justify-center">
            <div className="absolute w-12 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-full animate-spin" 
                 style={{ animationDuration: '0.2s' }} />
            <div className="w-8 h-6 bg-green-600 rounded-sm" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-green-500 tracking-wide">HELICOPTER</h2>

        {/* Loading text */}
        <p className="text-sm text-zinc-400 tracking-wide">{loadingText}</p>

        {/* Progress bar */}
        <div className="w-56 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-150 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>

        {/* Progress percentage */}
        <span className="text-xs text-zinc-500 font-mono">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
