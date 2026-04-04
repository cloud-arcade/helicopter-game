/**
 * Helicopter Physics Hook
 * Handles helicopter movement with click/tap lift mechanics
 */

import { useCallback, useRef } from 'react';
import { Helicopter, SmokeParticle, GameConfig, DEFAULT_CONFIG } from './types';

interface UseHelicopterOptions {
  config?: Partial<GameConfig>;
}

export function useHelicopter(options: UseHelicopterOptions = {}) {
  const config = { ...DEFAULT_CONFIG, ...options.config };
  
  const helicopterRef = useRef<Helicopter>({
    x: 0,
    y: 0,
    velocity: 0,
    rotation: 0,
    frame: 0,
  });
  
  const smokeParticlesRef = useRef<SmokeParticle[]>([]);
  const isLiftingRef = useRef(false);
  const frameCounterRef = useRef(0);

  /**
   * Initialize helicopter position
   */
  const initHelicopter = useCallback((canvasWidth: number, canvasHeight: number) => {
    helicopterRef.current = {
      x: canvasWidth * config.helicopterX,
      y: canvasHeight / 2,
      velocity: 0,
      rotation: 0,
      frame: 0,
    };
    smokeParticlesRef.current = [];
    frameCounterRef.current = 0;
    
    return helicopterRef.current;
  }, [config]);

  /**
   * Apply lift force (called on click/tap)
   */
  const applyLift = useCallback(() => {
    isLiftingRef.current = true;
  }, []);

  /**
   * Release lift (called on mouse/touch release)
   */
  const releaseLift = useCallback(() => {
    isLiftingRef.current = false;
  }, []);

  /**
   * Update helicopter physics - arcade style with constant gravity
   */
  const updateHelicopter = useCallback((canvasHeight: number, isPlaying: boolean) => {
    const heli = helicopterRef.current;
    frameCounterRef.current++;
    
    // Always animate rotor blades
    heli.frame = Math.floor(frameCounterRef.current / 3) % 2;
    
    if (!isPlaying) {
      // Idle animation - gentle bobbing before game starts
      heli.y = canvasHeight / 2 + Math.sin(frameCounterRef.current * 0.05) * 5;
      heli.rotation = Math.sin(frameCounterRef.current * 0.03) * 2;
      heli.velocity = 0;
      return heli;
    }
    
    // ALWAYS apply gravity - helicopter falls if you don't click
    heli.velocity += config.gravity;
    
    // Apply lift ONLY if pressing - this counters gravity
    if (isLiftingRef.current) {
      heli.velocity += config.liftForce;
    }
    
    // Apply slight damping for floaty arcade feel
    heli.velocity *= 0.98;
    
    // Clamp velocity
    heli.velocity = Math.max(-config.maxVelocity, Math.min(config.maxVelocity, heli.velocity));
    
    // Update position
    heli.y += heli.velocity;
    
    // Smooth rotation based on velocity (tilt up when rising, down when falling)
    const targetRotation = heli.velocity * 2.5;
    heli.rotation += (targetRotation - heli.rotation) * 0.15;
    heli.rotation = Math.max(-20, Math.min(20, heli.rotation));
    
    // Add smoke/exhaust particle
    if (frameCounterRef.current % 3 === 0) {
      addSmokeParticle();
    }
    
    return heli;
  }, [config]);

  /**
   * Add a smoke particle at helicopter position
   */
  const addSmokeParticle = useCallback(() => {
    const heli = helicopterRef.current;
    smokeParticlesRef.current.push({
      x: heli.x - 40,
      y: heli.y + Math.random() * 10 - 5,
      opacity: 0.6,
      size: 8 + Math.random() * 6,
      age: 0,
    });
    
    // Limit particle count
    if (smokeParticlesRef.current.length > 30) {
      smokeParticlesRef.current.shift();
    }
  }, []);

  /**
   * Update smoke particles
   */
  const updateSmoke = useCallback((speed: number) => {
    smokeParticlesRef.current = smokeParticlesRef.current
      .map(particle => ({
        ...particle,
        x: particle.x - speed * 0.8,
        y: particle.y - 0.3,
        opacity: particle.opacity - 0.02,
        size: particle.size + 0.3,
        age: particle.age + 1,
      }))
      .filter(p => p.opacity > 0 && p.x > -50);
    
    return smokeParticlesRef.current;
  }, []);

  /**
   * Get current helicopter state
   */
  const getHelicopter = useCallback(() => {
    return helicopterRef.current;
  }, []);

  /**
   * Get smoke particles
   */
  const getSmokeParticles = useCallback(() => {
    return smokeParticlesRef.current;
  }, []);

  /**
   * Check if helicopter is out of bounds
   */
  const isOutOfBounds = useCallback((canvasHeight: number): boolean => {
    const heli = helicopterRef.current;
    return heli.y < 0 || heli.y > canvasHeight;
  }, []);

  return {
    initHelicopter,
    applyLift,
    releaseLift,
    updateHelicopter,
    updateSmoke,
    getHelicopter,
    getSmokeParticles,
    isOutOfBounds,
  };
}
