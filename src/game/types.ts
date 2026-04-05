/**
 * Helicopter Game Type Definitions
 */

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface TerrainSegment {
  x: number;
  topY: number;
  bottomY: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  fromTop: boolean;
  floating: boolean;
  rockIndex: number;
  opacity: number; // For fade-out effect
}

export interface Helicopter {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
  frame: number;
}

export interface SmokeParticle {
  x: number;
  y: number;
  opacity: number;
  size: number;
  age: number;
}

export interface GameConfig {
  // Canvas dimensions (responsive - calculated at runtime)
  width: number;
  height: number;
  
  // Helicopter physics
  gravity: number;
  liftForce: number;
  maxVelocity: number;
  helicopterX: number; // Fixed X position (percentage from left)
  
  // Terrain generation
  segmentWidth: number;
  initialGapSize: number;
  minGapSize: number;
  gapNarrowRate: number; // How fast the gap narrows
  stepSize: number; // Height of each terrain step
  
  // Obstacles
  obstacleWidth: number;
  obstacleMinHeight: number;
  obstacleMaxHeight: number;
  obstacleSpawnDistance: number; // Min distance between obstacles
  obstacleStartDistance: number; // Distance before first obstacle spawns
  
  // Game speed
  baseSpeed: number;
  speedIncrement: number;
  maxSpeed: number;
  
  // Level progression (time-based)
  levelDuration: number; // Seconds per level
  totalBackgrounds: number; // Number of background sets (Bg1-Bg9)
}

export const DEFAULT_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  
  // Physics - tuned for responsive arcade feel
  gravity: 0.45,
  liftForce: -1.1,
  maxVelocity: 12,
  helicopterX: 0.18, // Slightly more room to react
  
  // Terrain - dynamic flowing cave with curves (easier start, tighter over time)
  segmentWidth: 15,     // Small segments for smooth flowing curves
  initialGapSize: 380,  // Wide starting gap - gives room to learn
  minGapSize: 130,      // Minimum gap - gets quite tight!
  gapNarrowRate: 0.012, // Gradual narrowing for smooth difficulty curve
  stepSize: 8,          // Used for bounds
  
  // Obstacles (blocks)
  obstacleWidth: 45,
  obstacleMinHeight: 45,
  obstacleMaxHeight: 80,
  obstacleSpawnDistance: 200, // Base spacing - more frequent
  obstacleStartDistance: 500,
  
  // Speed
  baseSpeed: 4.5,
  speedIncrement: 0.0015,
  maxSpeed: 10,
  
  // Level progression (time-based)
  levelDuration: 30, // 30 seconds per level
  totalBackgrounds: 9, // Bg1 through Bg9
};

export type GamePhase = 'ready' | 'playing' | 'crashed';
