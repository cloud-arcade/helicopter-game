/**
 * Terrain Generation Hook
 * Generates procedural cave-like terrain with step-based walls and obstacles
 */

import { useCallback, useRef } from 'react';
import { TerrainSegment, Obstacle, GameConfig, DEFAULT_CONFIG } from './types';

interface UseTerrainOptions {
  config?: Partial<GameConfig>;
}

export function useTerrain(options: UseTerrainOptions = {}) {
  const config = { ...DEFAULT_CONFIG, ...options.config };
  const segmentsRef = useRef<TerrainSegment[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const distanceRef = useRef(0);
  const currentGapRef = useRef(config.initialGapSize);
  const topYRef = useRef(0);
  const bottomYRef = useRef(0);
  const lastObstacleDistanceRef = useRef(0);
  
  // Track segments since last step change
  const segmentCounterRef = useRef(0);
  const stepIntervalRef = useRef(3); // Change step every N segments
  const pendingTopStepRef = useRef(0);
  const pendingBottomStepRef = useRef(0);

  /**
   * Initialize terrain with starting segments
   */
  const initTerrain = useCallback((canvasWidth: number, canvasHeight: number) => {
    segmentsRef.current = [];
    obstaclesRef.current = [];
    distanceRef.current = 0;
    currentGapRef.current = config.initialGapSize;
    lastObstacleDistanceRef.current = 0;
    segmentCounterRef.current = 0;
    stepIntervalRef.current = 3;
    pendingTopStepRef.current = 0;
    pendingBottomStepRef.current = 0;
    
    // Start with centered tunnel
    const centerY = canvasHeight / 2;
    topYRef.current = centerY - config.initialGapSize / 2;
    bottomYRef.current = centerY + config.initialGapSize / 2;
    
    // Generate enough segments to fill the screen plus buffer
    const segmentCount = Math.ceil(canvasWidth / config.segmentWidth) + 10;
    
    for (let i = 0; i < segmentCount; i++) {
      const segment = generateNextSegment(i * config.segmentWidth, canvasHeight);
      segmentsRef.current.push(segment);
    }
    
    return segmentsRef.current;
  }, [config]);

  /**
   * Generate a single terrain segment with smooth step-based changes
   */
  const generateNextSegment = useCallback((x: number, canvasHeight: number): TerrainSegment => {
    // Gradually narrow the gap
    if (currentGapRef.current > config.minGapSize) {
      currentGapRef.current = Math.max(
        config.minGapSize,
        currentGapRef.current - config.gapNarrowRate
      );
    }
    
    segmentCounterRef.current++;
    
    // Only decide on new step direction periodically
    if (segmentCounterRef.current >= stepIntervalRef.current) {
      segmentCounterRef.current = 0;
      // Randomize next interval (2-5 segments)
      stepIntervalRef.current = 2 + Math.floor(Math.random() * 4);
      
      // Random step for top (-1, 0, or +1 step) - weighted towards 0 for smoother terrain
      pendingTopStepRef.current = (Math.random() < 0.25 ? -1 : Math.random() < 0.5 ? 1 : 0) * config.stepSize;
      // Random step for bottom (-1, 0, or +1 step)
      pendingBottomStepRef.current = (Math.random() < 0.25 ? -1 : Math.random() < 0.5 ? 1 : 0) * config.stepSize;
    }
    
    // Apply pending steps
    let newTopY = topYRef.current + pendingTopStepRef.current;
    let newBottomY = bottomYRef.current + pendingBottomStepRef.current;
    
    // Ensure minimum gap and stay within bounds
    const minTop = 20;
    const maxBottom = canvasHeight - 60; // Leave room for HUD
    
    // Clamp top
    newTopY = Math.max(minTop, Math.min(newTopY, canvasHeight / 2 - config.minGapSize / 2));
    
    // Ensure gap is maintained
    if (newBottomY - newTopY < currentGapRef.current) {
      newBottomY = newTopY + currentGapRef.current;
    }
    
    // Clamp bottom
    newBottomY = Math.min(maxBottom, Math.max(newBottomY, canvasHeight / 2 + config.minGapSize / 2));
    
    // Re-adjust top if bottom was clamped
    if (newBottomY - newTopY < currentGapRef.current) {
      newTopY = newBottomY - currentGapRef.current;
    }
    
    topYRef.current = newTopY;
    bottomYRef.current = newBottomY;
    
    // Reset pending steps after applying
    pendingTopStepRef.current = 0;
    pendingBottomStepRef.current = 0;
    
    return {
      x,
      topY: newTopY,
      bottomY: newBottomY,
    };
  }, [config]);

  /**
   * Update terrain - scroll and generate new segments and obstacles
   */
  const updateTerrain = useCallback((speed: number, canvasWidth: number, canvasHeight: number) => {
    // Move all segments to the left
    segmentsRef.current.forEach(segment => {
      segment.x -= speed;
    });
    
    // Move all obstacles to the left
    obstaclesRef.current.forEach(obstacle => {
      obstacle.x -= speed;
    });
    
    // Remove segments that are off-screen
    segmentsRef.current = segmentsRef.current.filter(s => s.x > -config.segmentWidth);
    
    // Remove obstacles that are off-screen
    obstaclesRef.current = obstaclesRef.current.filter(o => o.x > -config.obstacleWidth);
    
    // Generate new segments at the right edge
    while (segmentsRef.current.length > 0) {
      const lastSegment = segmentsRef.current[segmentsRef.current.length - 1];
      if (lastSegment.x < canvasWidth + config.segmentWidth * 2) {
        const newX = lastSegment.x + config.segmentWidth;
        segmentsRef.current.push(generateNextSegment(newX, canvasHeight));
      } else {
        break;
      }
    }
    
    // Update distance traveled
    distanceRef.current += speed;
    
    // Maybe spawn an obstacle
    maybeSpawnObstacle(canvasWidth, canvasHeight);
    
    return segmentsRef.current;
  }, [config, generateNextSegment]);

  /**
   * Maybe spawn an obstacle based on distance
   */
  const maybeSpawnObstacle = useCallback((canvasWidth: number, _canvasHeight: number) => {
    const distance = distanceRef.current;
    
    // Don't spawn before start distance
    if (distance < config.obstacleStartDistance) return;
    
    // Check if we should spawn a new obstacle
    const distanceSinceLastObstacle = distance - lastObstacleDistanceRef.current;
    
    if (distanceSinceLastObstacle >= config.obstacleSpawnDistance) {
      // Random chance to spawn
      if (Math.random() < 0.7) {
        // Get current terrain levels at spawn point
        const relevantSegment = segmentsRef.current.find(s => s.x > canvasWidth - 50);
        if (!relevantSegment) return;
        
        const fromTop = Math.random() < 0.5;
        const height = config.obstacleMinHeight + 
          Math.random() * (config.obstacleMaxHeight - config.obstacleMinHeight);
        
        const obstacle: Obstacle = {
          x: canvasWidth + 20,
          y: fromTop ? relevantSegment.topY : relevantSegment.bottomY - height,
          width: config.obstacleWidth,
          height: height,
          fromTop,
          floating: false,
          rockIndex: Math.floor(Math.random() * 5),
          opacity: 1,
        };
        
        obstaclesRef.current.push(obstacle);
        lastObstacleDistanceRef.current = distance;
      }
    }
  }, [config]);

  /**
   * Get current terrain segments
   */
  const getSegments = useCallback(() => {
    return segmentsRef.current;
  }, []);

  /**
   * Get distance traveled
   */
  const getDistance = useCallback(() => {
    return Math.floor(distanceRef.current);
  }, []);

  /**
   * Check collision with terrain and obstacles at a given position
   */
  const checkCollision = useCallback((x: number, y: number, helicopterHeight: number = 40): boolean => {
    const halfHeight = helicopterHeight / 2;
    const helicopterWidth = 60;
    const halfWidth = helicopterWidth / 2;
    
    // Check terrain collision
    for (const segment of segmentsRef.current) {
      // Check if helicopter X overlaps with this segment
      if (x + halfWidth >= segment.x && x - halfWidth <= segment.x + config.segmentWidth) {
        // Check collision with top wall
        if (y - halfHeight < segment.topY) {
          return true;
        }
        // Check collision with bottom wall
        if (y + halfHeight > segment.bottomY) {
          return true;
        }
      }
    }
    
    // Check obstacle collision
    for (const obstacle of obstaclesRef.current) {
      // Simple box collision
      if (
        x + halfWidth > obstacle.x &&
        x - halfWidth < obstacle.x + obstacle.width &&
        y + halfHeight > obstacle.y &&
        y - halfHeight < obstacle.y + obstacle.height
      ) {
        return true;
      }
    }
    
    return false;
  }, [config]);

  /**
   * Get obstacles
   */
  const getObstacles = useCallback(() => {
    return obstaclesRef.current;
  }, []);

  /**
   * Get current gap size (for difficulty display)
   */
  const getCurrentGap = useCallback(() => {
    return Math.floor(currentGapRef.current);
  }, []);

  /**
   * Get checkpoint level (deprecated - levels are now time-based in useHelicopterGame)
   */
  const getCheckpointLevel = useCallback(() => {
    // Levels are now time-based, this is kept for compatibility
    return 1;
  }, []);

  return {
    initTerrain,
    updateTerrain,
    getSegments,
    getObstacles,
    getDistance,
    checkCollision,
    getCurrentGap,
    getCheckpointLevel,
  };
}
