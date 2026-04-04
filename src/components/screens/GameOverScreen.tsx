/**
 * Game Over Screen Component
 * Modern Helicopter Game - Crash Screen
 */

import { useEffect, useState, useRef } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';

export function GameOverScreen() {
  const { state, dispatch } = useGameContext();
  const { startSession } = useCloudArcade();
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [countedScore, setCountedScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check for new high score
  useEffect(() => {
    if (state.score >= state.highScore && state.score > 0) {
      setShowNewRecord(true);
    }
  }, [state.score, state.highScore]);

  // Animated score count-up
  useEffect(() => {
    const target = state.score;
    const duration = 1000;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCountedScore(Math.floor(target * eased));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, [state.score]);

  // Crash effect background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; life: number; maxLife: number }> = [];
    
    // Initialize debris particles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: 60 + Math.random() * 60,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Debris particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life++;
        
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.6})`;
        ctx.fill();
      });

      // Pulsing red glow in center
      const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.2;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, 200
      );
      gradient.addColorStop(0, `rgba(239, 68, 68, ${pulse})`);
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handlePlayAgain = () => {
    setShowNewRecord(false);
    startSession();
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_STATE', payload: 'playing' });
  };

  const handleMenu = () => {
    setShowNewRecord(false);
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_STATE', payload: 'menu' });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Crash effect canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Main content card */}
      <div className="relative z-10 flex flex-col items-center gap-5 p-10 mx-4 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl shadow-red-500/10">
        {/* Crash title */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-orange-500 animate-pulse">
            CRASH!
          </h1>
          <p className="text-sm text-slate-400 tracking-wide">Flight terminated</p>
        </div>

        {/* Score display */}
        <div className="flex flex-col items-center gap-2 py-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Distance Flown</span>
          <strong className="text-6xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
            {countedScore.toLocaleString()}
          </strong>
        </div>

        {/* New record badge */}
        {showNewRecord && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 rounded-xl animate-bounce">
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-amber-300 font-semibold">NEW RECORD!</span>
          </div>
        )}

        {/* Best score (when not new record) */}
        {!showNewRecord && state.highScore > 0 && (
          <div className="flex flex-col items-center px-6 py-2 bg-slate-800/50 rounded-xl">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Best Distance</span>
            <span className="text-xl font-mono font-semibold text-amber-400">{state.highScore.toLocaleString()}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full mt-2">
          <button
            onClick={handlePlayAgain}
            className="relative group px-8 py-3.5 overflow-hidden rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10 tracking-wide">FLY AGAIN</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <button
            onClick={handleMenu}
            className="px-8 py-3 rounded-xl font-medium text-slate-300 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200"
          >
            Main Menu
          </button>
        </div>

        {/* Tip */}
        <p className="text-xs text-slate-500 mt-2 text-center">
          <span className="text-slate-400">Tip:</span> Hold longer to rise, release to descend
        </p>
      </div>
    </div>
  );
}
