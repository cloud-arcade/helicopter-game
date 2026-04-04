/**
 * Main Helicopter Game Engine Hook
 * Orchestrates game loop, rendering, and game state
 * 
 * Uses refs throughout to avoid React re-render issues with the game loop
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { GameConfig, DEFAULT_CONFIG, GamePhase, TerrainSegment, Obstacle, SmokeParticle } from './types';

interface UseHelicopterGameOptions {
  config?: Partial<GameConfig>;
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

interface GameState {
  phase: GamePhase;
  score: number;
  highScore: number;
  speed: number;
  level: number;
  startTime: number; // Timestamp when game started
  elapsedTime: number; // Seconds elapsed
  bgScrollX: number; // Background scroll position
  prevLevel: number; // Previous level for transitions
  levelTransition: number; // 0-1 transition progress
}

// Preload helicopter images
const helicopterImages = {
  body: new Image(),
  topRotor1: new Image(),
  topRotor2: new Image(),
  backRotor1: new Image(),
  backRotor2: new Image(),
};

// Preload smoke sprites
const smokeImages = {
  small: new Image(),
  medium: new Image(),
};

// No rock sprites needed - we draw custom blocks matching terrain colors

// Set image sources
helicopterImages.body.src = '/assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_body.png';
helicopterImages.topRotor1.src = '/assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_top_rotor_frame_1.png';
helicopterImages.topRotor2.src = '/assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_top_rotor_frame_2.png';
helicopterImages.backRotor1.src = '/assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_back_rotor_frame_1.png';
helicopterImages.backRotor2.src = '/assets/sprites/attack_helicopter/pngs/flying_side_view/parts/attack_helicopter_back_rotor_frame_2.png';
smokeImages.small.src = '/assets/sprites/smoke/smoke-small.png';
smokeImages.medium.src = '/assets/sprites/smoke/smoke-medium.png';

/**
 * Background layer system - loads layers 2-6 from each Bg folder
 * Layer 1 is ground terrain (skipped), layers 2-6 are parallax backgrounds
 */
interface BackgroundSet {
  layers: HTMLImageElement[]; // Layers 2-6
  loaded: boolean;
}

// Preload all background sets
const backgroundSets: BackgroundSet[] = [];

function loadBackgroundLayers(bgNumber: number): BackgroundSet {
  const layers: HTMLImageElement[] = [];
  
  // Load layers 2 through 6 (skip layer 1 which is ground)
  for (let layer = 2; layer <= 6; layer++) {
    const img = new Image();
    img.src = `/assets/sprites/seamless-bgs/Bg${bgNumber}/Layer${layer}.png`;
    layers.push(img);
  }
  
  return { layers, loaded: false };
}

// Initialize all 9 background sets
for (let i = 1; i <= 9; i++) {
  backgroundSets.push(loadBackgroundLayers(i));
}

export function useHelicopterGame(options: UseHelicopterGameOptions = {}) {
  // Memoize config to prevent recreation
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...options.config }), []);
  
  // Store all mutable state in refs to avoid closure issues
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  
  // Callbacks ref - always use latest
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  });
  
  // Game state
  const gameStateRef = useRef<GameState>({
    phase: 'ready',
    score: 0,
    highScore: 0,
    speed: config.baseSpeed,
    level: 1,
    startTime: 0,
    elapsedTime: 0,
    bgScrollX: 0,
    prevLevel: 1,
    levelTransition: 1, // 1 = fully transitioned
  });

  // Terrain state
  const terrainRef = useRef({
    segments: [] as TerrainSegment[],
    obstacles: [] as Obstacle[],
    distance: 0,
    currentGap: config.initialGapSize,
    topY: 0,
    bottomY: 0,
    lastObstacleDistance: 0,
    segmentCounter: 0,
    stepInterval: 3,
    pendingTopStep: 0,
    pendingBottomStep: 0,
  });

  // Helicopter state
  const helicopterRef = useRef({
    x: 0,
    y: 0,
    velocity: 0,
    rotation: 0,
    frame: 0,
    smokeParticles: [] as SmokeParticle[],
    isLifting: false,
    frameCounter: 0,
  });

  /**
   * Generate next terrain segment with SMALL FLOWING STEPS
   * Creates many small rectangular steps that flow like curves
   * First 3 seconds are flat, then steps begin
   */
  const generateNextSegment = useCallback((x: number, canvasHeight: number): TerrainSegment => {
    const t = terrainRef.current;
    
    // Gradually narrow the gap (very slowly)
    if (t.currentGap > config.minGapSize) {
      t.currentGap = Math.max(config.minGapSize, t.currentGap - config.gapNarrowRate);
    }
    
    t.segmentCounter++;
    
    // Flat start phase: first ~3 seconds of gameplay
    const flatPhaseEnd = 200;
    
    // Base positions
    const centerY = canvasHeight / 2;
    const halfGap = t.currentGap / 2;
    
    // Small flowing steps: fixed height blocks, frequent changes
    const blockWidth = 6; // Very frequent steps (every 6 segments)
    const fixedBlockHeight = 10; // ALL blocks same height - consistent look
    
    // Only start stepping after flat phase
    if (t.distance > flatPhaseEnd) {
      // Decide when to step - at block boundaries
      if (t.segmentCounter % blockWidth === 0) {
        const topChoice = Math.random();
        const bottomChoice = Math.random();
        
        // Top terrain - flowing direction changes
        if (topChoice < 0.38) {
          t.pendingTopStep = fixedBlockHeight; // Step down into play area
        } else if (topChoice < 0.76) {
          t.pendingTopStep = -fixedBlockHeight; // Step up away from play area
        } else {
          t.pendingTopStep = 0; // Stay flat briefly
        }
        
        // Bottom terrain  
        if (bottomChoice < 0.38) {
          t.pendingBottomStep = -fixedBlockHeight; // Step up into play area
        } else if (bottomChoice < 0.76) {
          t.pendingBottomStep = fixedBlockHeight; // Step down away from play area
        } else {
          t.pendingBottomStep = 0;
        }
        
        // Apply the step IMMEDIATELY (blocky)
        t.topY += t.pendingTopStep;
        t.bottomY += t.pendingBottomStep;
        
        // Reset pending
        t.pendingTopStep = 0;
        t.pendingBottomStep = 0;
      }
    } else {
      // During flat phase, stay at center
      t.topY = centerY - halfGap;
      t.bottomY = centerY + halfGap;
    }
    
    // Bounds - progressively tighter tunnel as game goes on
    const level = gameStateRef.current.level || 1;
    const levelNarrow = Math.min(0.10, (level - 1) * 0.015); // Narrows with each level
    const minTop = 55;
    const maxTop = canvasHeight * (0.28 + levelNarrow);   // Pushes ceiling further down
    const minBottom = canvasHeight * (0.72 - levelNarrow); // Pushes floor further up
    const maxBottom = canvasHeight - 55;
    
    // Clamp positions (snap to bounds)
    t.topY = Math.max(minTop, Math.min(maxTop, t.topY));
    t.bottomY = Math.max(minBottom, Math.min(maxBottom, t.bottomY));
    
    // Ensure minimum gap
    if (t.bottomY - t.topY < t.currentGap) {
      const mid = (t.topY + t.bottomY) / 2;
      t.topY = mid - t.currentGap / 2;
      t.bottomY = mid + t.currentGap / 2;
    }
    
    return { x, topY: t.topY, bottomY: t.bottomY };
  }, [config]);

  /**
   * Initialize terrain
   */
  const initTerrain = useCallback((canvasWidth: number, canvasHeight: number) => {
    const t = terrainRef.current;
    t.segments = [];
    t.obstacles = [];
    t.distance = 0;
    t.currentGap = config.initialGapSize;
    t.lastObstacleDistance = 0;
    t.segmentCounter = 0;
    t.stepInterval = 3;
    t.pendingTopStep = 0;
    t.pendingBottomStep = 0;
    
    const centerY = canvasHeight / 2;
    t.topY = centerY - config.initialGapSize / 2;
    t.bottomY = centerY + config.initialGapSize / 2;
    
    const segmentCount = Math.ceil(canvasWidth / config.segmentWidth) + 10;
    
    for (let i = 0; i < segmentCount; i++) {
      t.segments.push(generateNextSegment(i * config.segmentWidth, canvasHeight));
    }
  }, [config, generateNextSegment]);

  /**
   * Initialize helicopter
   */
  const initHelicopter = useCallback((canvasWidth: number, canvasHeight: number) => {
    const h = helicopterRef.current;
    h.x = canvasWidth * config.helicopterX;
    h.y = canvasHeight / 2;
    h.velocity = 0;
    h.rotation = 0;
    h.frame = 0;
    h.smokeParticles = [];
    h.frameCounter = 0;
    h.isLifting = false;
  }, [config]);

  /**
   * Update terrain - scroll left continuously
   */
  const updateTerrain = useCallback((speed: number, canvasWidth: number, canvasHeight: number) => {
    const t = terrainRef.current;
    
    // Move all segments left
    for (const segment of t.segments) {
      segment.x -= speed;
    }
    
    // Move all obstacles left
    for (const obstacle of t.obstacles) {
      obstacle.x -= speed;
    }
    
    // Track distance
    t.distance += speed;
    
    // Remove off-screen segments
    t.segments = t.segments.filter(s => s.x > -config.segmentWidth);
    
    // Fade out obstacles approaching left edge, remove fully faded ones
    t.obstacles = t.obstacles.filter(o => {
      if (o.x < -60) return false; // Hard remove past edge
      if (o.x < 40) {
        // Fade as approaching left edge
        o.opacity = Math.max(0, o.x / 40);
      }
      return true;
    });
    
    // Generate new segments at right edge
    while (t.segments.length > 0) {
      const lastSegment = t.segments[t.segments.length - 1];
      if (lastSegment.x < canvasWidth + config.segmentWidth * 2) {
        const newX = lastSegment.x + config.segmentWidth;
        t.segments.push(generateNextSegment(newX, canvasHeight));
      } else {
        break;
      }
    }
    
    // === SPAWN OBSTACLES - consistent sizes, always touching terrain ===
    const level = gameStateRef.current.level || 1;
    const spawnDist = Math.max(100, config.obstacleSpawnDistance - (level - 1) * 20);
    const spawnChance = Math.min(0.85, 0.6 + level * 0.04);
    
    // Block size with good variation - some quite tall for difficulty
    const blockW = 40 + Math.random() * 12;  // 40-52
    const blockH = 55 + Math.random() * 65;  // 55-120 (always noticeable, some very tall)
    
    if (t.distance - t.lastObstacleDistance > spawnDist && t.distance > 300) {
      if (Math.random() < spawnChance) {
        const lastSeg = t.segments[t.segments.length - 1];
        if (!lastSeg) { t.lastObstacleDistance = t.distance; return; }
        
        const gapSize = lastSeg.bottomY - lastSeg.topY;
        
        // Decide type: wall-attached (top/bottom) or floating
        const typeRoll = Math.random();
        const floatingChance = Math.min(0.25, 0.08 + level * 0.025);
        
        if (typeRoll < floatingChance) {
          // FLOATING obstacle - in the middle of the play area
          const floatH = 35 + Math.random() * 25;  // 35-60 (min 35 so they never look too small)
          const floatW = 36 + Math.random() * 14;   // 36-50
          const minY = lastSeg.topY + gapSize * 0.25;
          const maxY = lastSeg.bottomY - gapSize * 0.25 - floatH;
          const floatY = minY + Math.random() * Math.max(0, maxY - minY);
          
          t.obstacles.push({
            x: canvasWidth + 50,
            y: floatY,
            width: floatW,
            height: floatH,
            fromTop: false,
            floating: true,
            rockIndex: 0,
            opacity: 1,
          });
        } else {
          // WALL-ATTACHED obstacle - sunk into terrain so it's always behind steps
          const fromTop = Math.random() < 0.5;
          // Sink 20px into terrain so block is always behind the step edge
          const sinkAmount = 20;
          const visibleH = blockH;
          const totalH = visibleH + sinkAmount;
          
          t.obstacles.push({
            x: canvasWidth + 50,
            // Start INSIDE the terrain, extend into play area
            y: fromTop 
              ? lastSeg.topY - sinkAmount  // Starts 20px inside top terrain
              : lastSeg.bottomY - visibleH, // Visible part above bottom terrain
            width: blockW,
            height: totalH,
            fromTop,
            floating: false,
            rockIndex: 0,
            opacity: 1,
          });
        }
      }
      t.lastObstacleDistance = t.distance;
    }
  }, [config, generateNextSegment]);

  /**
   * Update helicopter physics
   */
  const updateHelicopter = useCallback((canvasHeight: number, isPlaying: boolean) => {
    const h = helicopterRef.current;
    h.frameCounter++;
    
    // Animate rotor
    h.frame = Math.floor(h.frameCounter / 3) % 2;
    
    if (!isPlaying) {
      // Idle bobbing
      h.y = canvasHeight / 2 + Math.sin(h.frameCounter * 0.05) * 5;
      h.rotation = Math.sin(h.frameCounter * 0.03) * 2;
      h.velocity = 0;
      return;
    }
    
    // ALWAYS apply gravity
    h.velocity += config.gravity;
    
    // Apply lift if pressing
    if (h.isLifting) {
      h.velocity += config.liftForce;
    }
    
    // Damping
    h.velocity *= 0.98;
    
    // Clamp velocity
    h.velocity = Math.max(-config.maxVelocity, Math.min(config.maxVelocity, h.velocity));
    
    // Update position
    h.y += h.velocity;
    
    // Rotation based on velocity
    const targetRotation = h.velocity * 2.5;
    h.rotation += (targetRotation - h.rotation) * 0.15;
    h.rotation = Math.max(-20, Math.min(20, h.rotation));
    
    // Add smoke with variation between small and medium
    if (h.frameCounter % 4 === 0) {
      h.smokeParticles.push({
        x: h.x - 35,
        y: h.y + Math.random() * 6 - 3,
        opacity: 0.7,
        size: Math.random() < 0.5 ? 16 : 24, // small or medium
        age: 0,
      });
      
      if (h.smokeParticles.length > 25) {
        h.smokeParticles.shift();
      }
    }
  }, [config]);

  /**
   * Update smoke particles
   */
  const updateSmoke = useCallback((speed: number) => {
    const h = helicopterRef.current;
    h.smokeParticles = h.smokeParticles.filter(p => {
      p.x -= speed;
      p.age++;
      p.opacity -= 0.015;
      p.size += 0.3;
      return p.opacity > 0;
    });
  }, []);

  /**
   * Check collision
   */
  const checkCollision = useCallback((x: number, y: number, radius: number): boolean => {
    const t = terrainRef.current;
    
    // Check terrain walls
    for (const segment of t.segments) {
      if (x + radius > segment.x && x - radius < segment.x + config.segmentWidth) {
        if (y - radius < segment.topY || y + radius > segment.bottomY) {
          return true;
        }
      }
    }
    
    // Check obstacles
    for (const obstacle of t.obstacles) {
      if (x + radius > obstacle.x && x - radius < obstacle.x + obstacle.width &&
          y + radius > obstacle.y && y - radius < obstacle.y + obstacle.height) {
        return true;
      }
    }
    
    return false;
  }, [config]);

  /**
   * Initialize the game
   */
  const initGame = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    initTerrain(canvas.width, canvas.height);
    initHelicopter(canvas.width, canvas.height);
    
    gameStateRef.current = {
      phase: 'ready',
      score: 0,
      highScore: gameStateRef.current.highScore,
      speed: config.baseSpeed,
      level: 1,
      startTime: 0,
      elapsedTime: 0,
      bgScrollX: 0,
      prevLevel: 1,
      levelTransition: 1,
    };
  }, [config, initTerrain, initHelicopter]);

  /**
   * Start the game
   */
  const startGame = useCallback(() => {
    if (gameStateRef.current.phase === 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset if crashed
    if (gameStateRef.current.phase === 'crashed') {
      initTerrain(canvas.width, canvas.height);
      initHelicopter(canvas.width, canvas.height);
      gameStateRef.current.score = 0;
      gameStateRef.current.speed = config.baseSpeed;
      gameStateRef.current.level = 1;
      gameStateRef.current.bgScrollX = 0;
      gameStateRef.current.prevLevel = 1;
      gameStateRef.current.levelTransition = 1;
    }

    // Set start time for time-based level progression
    gameStateRef.current.startTime = Date.now();
    gameStateRef.current.elapsedTime = 0;
    gameStateRef.current.phase = 'playing';
  }, [config, initTerrain, initHelicopter]);

  /**
   * Handle input start
   */
  const handleInputStart = useCallback(() => {
    if (gameStateRef.current.phase === 'ready') {
      startGame();
    }
    if (gameStateRef.current.phase === 'playing') {
      helicopterRef.current.isLifting = true;
    }
  }, [startGame]);

  /**
   * Handle input end
   */
  const handleInputEnd = useCallback(() => {
    helicopterRef.current.isLifting = false;
  }, []);

  /**
   * Game update - called every frame
   */
  const update = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = gameStateRef.current;
    const h = helicopterRef.current;
    const t = terrainRef.current;
    const isPlaying = state.phase === 'playing';

    // Update helicopter physics
    updateHelicopter(canvas.height, isPlaying);

    if (isPlaying) {
      // Increase speed gradually
      state.speed = Math.min(config.maxSpeed, state.speed + config.speedIncrement);

      // ALWAYS scroll terrain - this is the core mechanic
      updateTerrain(state.speed, canvas.width, canvas.height);

      // Update smoke
      updateSmoke(state.speed);

      // Update background scroll position
      state.bgScrollX += state.speed * 0.5;

      // Update score based on distance
      state.score = Math.floor(t.distance / 10);
      
      // Time-based level progression with smooth transitions
      state.elapsedTime = (Date.now() - state.startTime) / 1000;
      const newLevel = Math.min(config.totalBackgrounds, 1 + Math.floor(state.elapsedTime / config.levelDuration));
      
      // Track level changes for crossfade
      if (newLevel !== state.level && state.levelTransition >= 1) {
        state.prevLevel = state.level;
        state.levelTransition = 0;
      }
      state.level = newLevel;
      
      // Progress the transition (2 second fade)
      if (state.levelTransition < 1) {
        state.levelTransition = Math.min(1, state.levelTransition + 0.008);
      }
      
      callbacksRef.current.onScoreUpdate?.(state.score);

      // Check collisions (smaller hitbox for smaller helicopter)
      if (checkCollision(h.x, h.y, 20) || h.y < 0 || h.y > canvas.height) {
        state.phase = 'crashed';
        if (state.score > state.highScore) {
          state.highScore = state.score;
        }
        callbacksRef.current.onGameOver?.(state.score);
        return;
      }
    } else if (state.phase === 'ready') {
      // Idle animation
      updateSmoke(config.baseSpeed * 0.3);
    }
  }, [config, updateHelicopter, updateTerrain, updateSmoke, checkCollision]);

  /**
   * Render game frame - Modern polished UI
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;
    const t = terrainRef.current;
    const h = helicopterRef.current;
    const width = canvas.width;
    const height = canvas.height;

    // === PARALLAX BACKGROUND WITH CROSSFADE ===
    // Base fill with dark color
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);
    
    /**
     * Helper to draw a background set with parallax scrolling
     * Renders from back (layer 6) to front (layer 2)
     * layers array: [0]=Layer2, [1]=Layer3, [2]=Layer4, [3]=Layer5, [4]=Layer6
     * Draw order: Layer6 first (back), then 5,4,3, Layer2 last (front)
     */
    const drawBackgroundSet = (bgSet: BackgroundSet, alpha: number) => {
      if (!bgSet) return;
      
      // Parallax speeds: Layer6 (slowest/back) to Layer2 (fastest/front)
      // Index 4=Layer6, 3=Layer5, 2=Layer4, 1=Layer3, 0=Layer2
      const parallaxSpeeds = [0.7, 0.5, 0.3, 0.15, 0.05]; // Front to back speeds
      
      // Draw in reverse order: Layer6 (index 4) first, Layer2 (index 0) last
      for (let i = bgSet.layers.length - 1; i >= 0; i--) {
        const layer = bgSet.layers[i];
        // Skip layers that haven't loaded yet
        if (!layer.complete || layer.naturalWidth === 0) continue;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Speed based on layer position (back layers slower)
        const speed = parallaxSpeeds[i];
        const scale = height / layer.naturalHeight;
        const scaledWidth = layer.naturalWidth * scale;
        
        // Calculate scroll position (ensure it wraps properly)
        let scrollOffset = (state.bgScrollX * speed) % scaledWidth;
        if (scrollOffset < 0) scrollOffset += scaledWidth;
        
        // Draw tiles seamlessly
        const startX = -scrollOffset;
        const tilesNeeded = Math.ceil((width + scaledWidth) / scaledWidth) + 1;
        
        for (let tile = 0; tile < tilesNeeded; tile++) {
          ctx.drawImage(layer, startX + tile * scaledWidth, 0, scaledWidth, height);
        }
        
        ctx.restore();
      }
    };
    
    // Draw previous background (if transitioning)
    const prevBgIndex = Math.min(state.prevLevel - 1, config.totalBackgrounds - 1);
    const currBgIndex = Math.min(state.level - 1, config.totalBackgrounds - 1);
    
    if (state.levelTransition < 1 && prevBgIndex !== currBgIndex) {
      drawBackgroundSet(backgroundSets[prevBgIndex], 1 - state.levelTransition);
    }
    
    // Draw current background
    drawBackgroundSet(backgroundSets[currBgIndex], state.levelTransition < 1 ? state.levelTransition : 1);

    // === BLOCK OBSTACLES - drawn BEFORE terrain so wall-attached ones are behind steps ===
    // Helper to draw a rounded rectangle
    const drawRoundedRect = (rx: number, ry: number, rw: number, rh: number, r: number) => {
      r = Math.min(r, rw / 2, rh / 2);
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.lineTo(rx + rw - r, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
      ctx.lineTo(rx + rw, ry + rh - r);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
      ctx.lineTo(rx + r, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
      ctx.lineTo(rx, ry + r);
      ctx.quadraticCurveTo(rx, ry, rx + r, ry);
      ctx.closePath();
    };
    
    for (const obstacle of t.obstacles) {
      if (obstacle.opacity <= 0) continue;
      
      ctx.save();
      ctx.globalAlpha = obstacle.opacity;
      
      const ox = obstacle.x;
      const oy = obstacle.y;
      const ow = obstacle.width;
      const oh = obstacle.height;
      const radius = 6;
      
      if (obstacle.floating) {
        // FLOATING block - fully rounded, all edges visible
        drawRoundedRect(ox, oy, ow, oh, radius);
        const floatGrad = ctx.createLinearGradient(ox, oy, ox, oy + oh);
        floatGrad.addColorStop(0, '#1a1f27');
        floatGrad.addColorStop(0.5, '#21262d');
        floatGrad.addColorStop(1, '#161b22');
        ctx.fillStyle = floatGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (obstacle.fromTop) {
        // TOP-ATTACHED - extends from inside terrain downward
        // Top portion is hidden behind terrain, bottom edges rounded
        ctx.beginPath();
        ctx.moveTo(ox, oy); // Inside terrain (hidden)
        ctx.lineTo(ox + ow, oy);
        ctx.lineTo(ox + ow, oy + oh - radius);
        ctx.quadraticCurveTo(ox + ow, oy + oh, ox + ow - radius, oy + oh);
        ctx.lineTo(ox + radius, oy + oh);
        ctx.quadraticCurveTo(ox, oy + oh, ox, oy + oh - radius);
        ctx.closePath();
        
        const topBlockGrad = ctx.createLinearGradient(ox, oy, ox, oy + oh);
        topBlockGrad.addColorStop(0, '#0d1117');
        topBlockGrad.addColorStop(0.3, '#161b22');
        topBlockGrad.addColorStop(0.7, '#1a1f27');
        topBlockGrad.addColorStop(1, '#21262d');
        ctx.fillStyle = topBlockGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // BOTTOM-ATTACHED - extends from inside terrain upward
        // Bottom portion hidden behind terrain, top edges rounded
        ctx.beginPath();
        ctx.moveTo(ox + radius, oy);
        ctx.quadraticCurveTo(ox, oy, ox, oy + radius);
        ctx.lineTo(ox, oy + oh); // Inside terrain (hidden)
        ctx.lineTo(ox + ow, oy + oh);
        ctx.lineTo(ox + ow, oy + radius);
        ctx.quadraticCurveTo(ox + ow, oy, ox + ow - radius, oy);
        ctx.closePath();
        
        const botBlockGrad = ctx.createLinearGradient(ox, oy, ox, oy + oh);
        botBlockGrad.addColorStop(0, '#21262d');
        botBlockGrad.addColorStop(0.3, '#1a1f27');
        botBlockGrad.addColorStop(0.7, '#161b22');
        botBlockGrad.addColorStop(1, '#0d1117');
        ctx.fillStyle = botBlockGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // === TERRAIN RENDERING - FLOWING BLOCKS WITH FULLY ROUNDED CORNERS ===
    const cr = 5; // Corner radius for all block edges
    
    // === TOP TERRAIN (ceiling) ===
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-50, -10);
    
    let prevTopY = t.segments[0]?.topY || 0;
    ctx.lineTo(-50, prevTopY);
    
    for (let i = 0; i < t.segments.length; i++) {
      const seg = t.segments[i];
      const nextSeg = t.segments[i + 1];
      const endX = nextSeg ? nextSeg.x : seg.x + config.segmentWidth;
      
      if (Math.abs(seg.topY - prevTopY) > 1) {
        const stepDown = seg.topY > prevTopY;
        
        if (stepDown) {
          // Step down into play area - round both corners
          // Top-right corner of old level
          ctx.lineTo(seg.x - cr, prevTopY);
          ctx.quadraticCurveTo(seg.x, prevTopY, seg.x, prevTopY + cr);
          // Vertical drop
          ctx.lineTo(seg.x, seg.topY - cr);
          // Bottom-left corner of new level
          ctx.quadraticCurveTo(seg.x, seg.topY, seg.x + cr, seg.topY);
        } else {
          // Step up away from play area - round both corners
          // Bottom-right corner of old level
          ctx.lineTo(seg.x - cr, prevTopY);
          ctx.quadraticCurveTo(seg.x, prevTopY, seg.x, prevTopY - cr);
          // Vertical rise
          ctx.lineTo(seg.x, seg.topY + cr);
          // Top-left corner of new level
          ctx.quadraticCurveTo(seg.x, seg.topY, seg.x + cr, seg.topY);
        }
      }
      
      ctx.lineTo(endX, seg.topY);
      prevTopY = seg.topY;
    }
    
    ctx.lineTo(width + 50, prevTopY);
    ctx.lineTo(width + 50, -10);
    ctx.closePath();
    
    const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    topGradient.addColorStop(0, '#0d1117');
    topGradient.addColorStop(0.6, '#161b22');
    topGradient.addColorStop(1, '#21262d');
    ctx.fillStyle = topGradient;
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // === BOTTOM TERRAIN (floor) ===
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-50, height + 10);
    
    let prevBottomY = t.segments[0]?.bottomY || height;
    ctx.lineTo(-50, prevBottomY);
    
    for (let i = 0; i < t.segments.length; i++) {
      const seg = t.segments[i];
      const nextSeg = t.segments[i + 1];
      const endX = nextSeg ? nextSeg.x : seg.x + config.segmentWidth;
      
      if (Math.abs(seg.bottomY - prevBottomY) > 1) {
        const stepUp = seg.bottomY < prevBottomY;
        
        if (stepUp) {
          // Step up into play area - round both corners
          // Bottom-right corner of old level
          ctx.lineTo(seg.x - cr, prevBottomY);
          ctx.quadraticCurveTo(seg.x, prevBottomY, seg.x, prevBottomY - cr);
          // Vertical rise
          ctx.lineTo(seg.x, seg.bottomY + cr);
          // Top-left corner of new level
          ctx.quadraticCurveTo(seg.x, seg.bottomY, seg.x + cr, seg.bottomY);
        } else {
          // Step down away from play area - round both corners
          // Top-right corner of old level
          ctx.lineTo(seg.x - cr, prevBottomY);
          ctx.quadraticCurveTo(seg.x, prevBottomY, seg.x, prevBottomY + cr);
          // Vertical drop
          ctx.lineTo(seg.x, seg.bottomY - cr);
          // Bottom-left corner of new level
          ctx.quadraticCurveTo(seg.x, seg.bottomY, seg.x + cr, seg.bottomY);
        }
      }
      
      ctx.lineTo(endX, seg.bottomY);
      prevBottomY = seg.bottomY;
    }
    
    ctx.lineTo(width + 50, prevBottomY);
    ctx.lineTo(width + 50, height + 10);
    ctx.closePath();
    
    const bottomGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
    bottomGradient.addColorStop(0, '#21262d');
    bottomGradient.addColorStop(0.4, '#161b22');
    bottomGradient.addColorStop(1, '#0d1117');
    ctx.fillStyle = bottomGradient;
    ctx.fill();
    
    // Add subtle edge highlight
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // === SMOKE PARTICLES - Using sprites with fade ===
    for (const particle of h.smokeParticles) {
      const smokeImg = particle.size < 20 ? smokeImages.small : smokeImages.medium;
      if (smokeImg.complete) {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        const drawSize = particle.size * 1.5;
        ctx.drawImage(smokeImg, particle.x - drawSize / 2, particle.y - drawSize / 2, drawSize, drawSize);
        ctx.restore();
      }
    }

    // === HELICOPTER - Clean rendering ===
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.scale(-1, 1);
    ctx.rotate((-h.rotation * Math.PI) / 180);
    
    const scale = 0.4;
    const bodyWidth = 200 * scale;
    const bodyHeight = 80 * scale;
    
    if (helicopterImages.body.complete) {
      ctx.drawImage(helicopterImages.body, -bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);
    }
    
    const topRotor = h.frame === 0 ? helicopterImages.topRotor1 : helicopterImages.topRotor2;
    if (topRotor.complete) {
      const rotorWidth = 180 * scale;
      const rotorHeight = 30 * scale;
      ctx.drawImage(topRotor, -rotorWidth / 2, -bodyHeight / 2 - rotorHeight / 2 - 5, rotorWidth, rotorHeight);
    }
    
    const backRotor = h.frame === 0 ? helicopterImages.backRotor1 : helicopterImages.backRotor2;
    if (backRotor.complete) {
      const backRotorWidth = 25 * scale;
      const backRotorHeight = 40 * scale;
      ctx.drawImage(backRotor, bodyWidth / 2 - backRotorWidth / 2 - 5, -backRotorHeight / 2, backRotorWidth, backRotorHeight);
    }
    
    ctx.restore();

    // === HUD - Clean terrain-colored overlay ===
    const hudHeight = 56;
    const hudTopPad = 8; // Top margin/breathing room
    const hudY = height - hudHeight;
    
    // Subtle gradient matching terrain colors - blends into bottom terrain
    const hudGrad = ctx.createLinearGradient(0, hudY, 0, height);
    hudGrad.addColorStop(0, 'rgba(13, 17, 23, 0.0)');
    hudGrad.addColorStop(0.15, 'rgba(13, 17, 23, 0.6)');
    hudGrad.addColorStop(1, 'rgba(13, 17, 23, 0.85)');
    ctx.fillStyle = hudGrad;
    ctx.fillRect(0, hudY, width, hudHeight);
    
    // === DISTANCE STAT (left) ===
    ctx.save();
    const distX = 30;
    
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('DISTANCE', distX, hudY + hudTopPad + 14);
    
    ctx.font = 'bold 22px "SF Mono", "JetBrains Mono", Consolas, monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(state.score.toLocaleString(), distX, hudY + hudTopPad + 38);
    ctx.restore();

    // === LEVEL STAT (center) - clean minimal ===
    ctx.save();
    const levelX = width / 2;
    
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL', levelX, hudY + hudTopPad + 14);
    
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText(state.level.toString(), levelX, hudY + hudTopPad + 38);
    ctx.restore();

    // === BEST SCORE (right) ===
    ctx.save();
    const bestX = width - 30;
    
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.textAlign = 'right';
    ctx.fillText('BEST', bestX, hudY + hudTopPad + 14);
    
    ctx.font = 'bold 22px "SF Mono", "JetBrains Mono", Consolas, monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(state.highScore.toLocaleString(), bestX, hudY + hudTopPad + 38);
    ctx.restore();

    // === TIME DISPLAY (between distance and level) ===
    ctx.save();
    const timeX = distX + 150;
    const minutes = Math.floor(state.elapsedTime / 60);
    const seconds = Math.floor(state.elapsedTime % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('TIME', timeX, hudY + hudTopPad + 14);
    
    ctx.font = '600 15px "SF Mono", Consolas, monospace';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
    ctx.fillText(timeStr, timeX, hudY + hudTopPad + 36);
    ctx.restore();

    // === READY SCREEN OVERLAY ===
    if (state.phase === 'ready') {
      // Frosted overlay
      ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
      ctx.fillRect(0, 0, width, height);
      
      // Center card
      const cardWidth = Math.min(400, width - 60);
      const cardHeight = 220;
      const cardX = (width - cardWidth) / 2;
      const cardY = (height - cardHeight) / 2 - 20;
      
      // Card background with cyan border
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 16);
      ctx.fillStyle = 'rgba(13, 17, 23, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      
      // Ready title with cyan glow
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 30;
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('READY', width / 2, cardY + 60);
      ctx.restore();
      
      // Instructions
      ctx.font = '500 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Click or Space to Start', width / 2, cardY + 110);
      
      ctx.font = '400 14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
      ctx.fillText('Hold to rise • Release to fall', width / 2, cardY + 145);
      
      // Animated indicator dots (cyan)
      const dotY = cardY + 185;
      const time = Date.now() / 300;
      for (let i = 0; i < 3; i++) {
        const alpha = 0.3 + 0.7 * Math.max(0, Math.sin(time - i * 0.5));
        ctx.beginPath();
        ctx.arc(width / 2 - 20 + i * 20, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.fill();
      }
    }
  }, [config]);

  /**
   * Main game loop - runs continuously
   */
  const gameLoop = useCallback(() => {
    if (!isRunningRef.current) return;
    
    update();
    render();
    
    if (gameStateRef.current.phase !== 'crashed') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } else {
      isRunningRef.current = false;
    }
  }, [update, render]);

  /**
   * Start the game loop
   */
  const startLoop = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  /**
   * Stop the game loop
   */
  const stopLoop = useCallback(() => {
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
  }, []);

  /**
   * Reset game
   */
  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      initGame(canvas);
      startLoop();
    }
  }, [initGame, startLoop]);

  /**
   * Get current game state
   */
  const getGameState = useCallback(() => {
    return gameStateRef.current;
  }, []);

  /**
   * Set high score
   */
  const setHighScore = useCallback((score: number) => {
    gameStateRef.current.highScore = score;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  // Return stable object using useMemo
  return useMemo(() => ({
    initGame,
    startGame,
    resetGame,
    startLoop,
    stopLoop,
    handleInputStart,
    handleInputEnd,
    getGameState,
    setHighScore,
  }), [initGame, startGame, resetGame, startLoop, stopLoop, handleInputStart, handleInputEnd, getGameState, setHighScore]);
}
