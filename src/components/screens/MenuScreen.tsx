/**
 * Menu Screen Component
 * Modern Helicopter Game Menu
 */

import { useEffect, useState, useRef } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useCloudArcade } from '../../hooks/useCloudArcade';

export function MenuScreen() {
  const { state, dispatch } = useGameContext();
  const { startSession } = useCloudArcade();
  const [helicopterY, setHelicopterY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated helicopter on menu
  useEffect(() => {
    const interval = setInterval(() => {
      setHelicopterY(Math.sin(Date.now() / 500) * 8);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{ x: number; y: number; size: number; speed: number; opacity: number }> = [];
    
    // Initialize particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const animate = () => {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Floating particles
      particles.forEach(p => {
        p.x -= p.speed;
        if (p.x < 0) {
          p.x = canvas.width;
          p.y = Math.random() * canvas.height;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
        ctx.fill();
      });

      // Terrain silhouettes
      const time = Date.now() / 5000;
      ctx.fillStyle = 'rgba(20, 184, 166, 0.1)';
      
      // Top terrain
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= canvas.width; x += 30) {
        const y = 60 + Math.sin(x * 0.02 + time) * 30 + Math.sin(x * 0.01) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, 0);
      ctx.closePath();
      ctx.fill();

      // Bottom terrain
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 30) {
        const y = canvas.height - 60 - Math.sin(x * 0.015 + time + 2) * 30 - Math.sin(x * 0.008) * 25;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleStart = () => {
    startSession();
    dispatch({ type: 'RESET_GAME' });
    dispatch({ type: 'SET_STATE', payload: 'playing' });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Animated canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Main content card */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-10 mx-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5">
        {/* Title */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400">
            HELICOPTER
          </h1>
          <p className="text-sm text-slate-400 tracking-[0.3em] uppercase font-medium">Cave Runner</p>
        </div>

        {/* Helicopter icon with glow */}
        <div className="relative my-2">
          <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full scale-150" />
          <img 
            src="/assets/sprites/attack_helicopter/pngs/flying_side_view/attack_helicopter_side_view_frame_1.png" 
            alt="Helicopter"
            className="relative w-36 h-auto drop-shadow-2xl"
            style={{ transform: `translateY(${helicopterY}px)` }}
          />
          {/* Engine glow */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-3 bg-gradient-to-l from-cyan-400/50 to-transparent rounded-full blur-sm"
            style={{ transform: `translateY(${helicopterY}px) translateX(-90%)` }}
          />
        </div>

        {/* Instructions */}
        <div className="flex flex-col items-center gap-1 text-sm text-slate-400">
          <p className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-cyan-400">SPACE</span>
            <span>or</span>
            <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-cyan-400">CLICK</span>
            <span>to fly</span>
          </p>
        </div>

        {/* High score */}
        {state.highScore > 0 && (
          <div className="flex flex-col items-center px-6 py-3 bg-slate-800/50 rounded-xl border border-amber-500/20">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Best Distance</span>
            <span className="text-2xl font-mono font-bold text-amber-400">{state.highScore.toLocaleString()}</span>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          className="relative group px-10 py-4 mt-2 overflow-hidden rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105"
        >
          <span className="relative z-10 tracking-wide">START FLIGHT</span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Connection status */}
        <div className="flex items-center gap-2 text-xs mt-2">
          {state.isPlatformConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-400">Connected to CloudArcade</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-slate-500">Standalone Mode</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
