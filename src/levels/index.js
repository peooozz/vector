import { world1 } from './world1.js';
import { world2 } from './world2.js';
import { world3 } from './world3.js';
import { world4 } from './world4.js';
import { world5 } from './world5.js';

export const WORLDS = [world1, world2, world3, world4, world5];

export const ALL_LEVELS = WORLDS.flatMap((w) => w.levels);

export function getLevelById(id) {
  return ALL_LEVELS.find((lvl) => lvl.id === id) || ALL_LEVELS[0];
}

export function getNextLevel(currentId) {
  const idx = ALL_LEVELS.findIndex((lvl) => lvl.id === currentId);
  if (idx >= 0 && idx + 1 < ALL_LEVELS.length) {
    return ALL_LEVELS[idx + 1];
  }
  return null;
}

export function createDefaultSandboxLevel() {
  return {
    id: 'sandbox',
    world: 0,
    level: 0,
    name: 'Sandbox Lab: Free Experiment',
    concept: 'Custom Wind Zones, Gates, Turbines & Goals',
    intro: 'Welcome to the Vector Skies Sandbox! Place or edit Wind Zones, move the Goal Island, toggle Solar Gates or Cross-Product Turbines, and test any vector combination freely.',
    hint: 'Use the Sandbox Builder controls to move the Goal Island or add Wind Zones, or click "Solve Vector" to see the exact mathematical Thrust.',
    showMeWhy: 'In Sandbox mode, Resultant = Thrust + ΣWind + Gravity. Any target coordinate G is reached when Thrust = G - ΣWind - Gravity!',
     isSandbox: true,
    start: { x: 0, y: 0, z: 0 },
    goal: { position: { x: 5, y: 2, z: -4 }, radius: 1.4, label: 'Custom Goal (5, 2, -4)' },
    gravity: 1,
    fuel: 15.0,
    parFuel: 10.0,
    showHeadToTail: true,
    recommendedThrust: { x: 4, y: 3, z: -2 },
    islands: [
      { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
      { position: { x: 5, y: 2, z: -4 }, scale: 1.25, type: 'goal', label: 'Custom Goal' }
    ],
    windZones: [
      {
        position: { x: 2.5, y: 1, z: -2 },
        size: { x: 14, y: 10, z: 14 },
        vector: { x: 1, y: 0, z: -2 },
        label: 'Custom Wind (1, 0, -2)'
      }
    ],
    gates: [],
    turbines: [],
    obstacles: []
  };
}
