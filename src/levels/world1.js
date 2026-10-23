/**
 * world1.js - World 1: "Arrows"
 * Focus: 2D-ish levels, vector addition, and the head-to-tail method.
 * Shows visual head-to-tail construction as ghost arrows in 3D.
 */

export const world1 = {
  id: 'world1',
  number: 1,
  name: 'World 1: Arrows',
  subtitle: 'Vector Addition & Head-to-Tail Method',
  themeColor: '#38bdf8',
  levels: [
    {
      id: 'w1-l1',
      world: 1,
      level: 1,
      name: '1-1: First Burn',
      concept: 'Displacement Vector & Direction',
      intro: 'Welcome to Vector Skies! Your airship never steers mid-flight—instead, you set a Thrust vector before each burn. Aim straight East (+X) to land on the island at (6, 0, 0).',
      hint: 'Drag the cyan 3D arrow handle or slide Thrust X to 6.0 (with Y = 0, Z = 0).',
      showMeWhy: 'With zero wind and zero gravity, your Resultant vector R equals your Thrust vector T. Setting T = (6, 0, 0) creates a displacement of 6 units along +X, landing directly on (6, 0, 0) with |T| = 6.0 fuel.',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 0, z: 0 }, radius: 1.4, label: 'East Perch (6, 0, 0)' },
      gravity: 0,
      fuel: 9.0,
      parFuel: 6.0,
      showHeadToTail: true,
      recommendedThrust: { x: 6, y: 0, z: 0 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 0, z: 0 }, scale: 1.25, type: 'goal', label: 'Goal (6, 0, 0)' }
      ],
      windZones: [],
      gates: [],
      turbines: [],
      obstacles: []
    },
    {
      id: 'w1-l2',
      world: 1,
      level: 2,
      name: '1-2: Tail-to-Tip Breeze',
      concept: 'Head-to-Tail Vector Addition (R = T + W)',
      intro: 'A steady breeze blows at W = (2, 0, -1). Place the tail of the orange Wind arrow at the tip of your cyan Thrust arrow: together they form the gold Resultant path to (6, 0, -5)!',
      hint: 'You need Resultant R = (6, 0, -5). Since T + (2, 0, -1) = (6, 0, -5), set Thrust to (4, 0, -4).',
      showMeWhy: 'By the Head-to-Tail rule, Resultant R = Thrust + Wind = (4 + 2, 0 + 0, -4 + (-1)) = (6, 0, -5). Using the breeze saves fuel: |T| = √(4² + (-4)²) = 5.66 instead of |R| = 7.81!',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 0, z: -5 }, radius: 1.4, label: 'Breeze Isle (6, 0, -5)' },
      gravity: 0,
      fuel: 7.5,
      parFuel: 5.7,
      showHeadToTail: true,
      recommendedThrust: { x: 4, y: 0, z: -4 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 0, z: -5 }, scale: 1.25, type: 'goal', label: 'Goal (6, 0, -5)' }
      ],
      windZones: [
        {
          position: { x: 3, y: 0, z: -2.5 },
          size: { x: 14, y: 8, z: 12 },
          vector: { x: 2, y: 0, z: -1 },
          label: 'Trade Wind (2, 0, -1)'
        }
      ],
      gates: [],
      turbines: [],
      obstacles: []
    },
    {
      id: 'w1-l3',
      world: 1,
      level: 3,
      name: '1-3: Three-Arrow Chain',
      concept: 'Adding Three Vectors (Thrust + Wind + Gravity)',
      intro: 'Now gravity pulls down at G = (0, -3, 0) while a tailwind pushes East at W = (1, 0, 0). Watch all three ghost arrows chain head-to-tail to reach the high cliff at (5, 2, 0)!',
      hint: 'We need T + (1, 0, 0) + (0, -3, 0) = (5, 2, 0). Set Thrust X = 4, Thrust Y = 5, Thrust Z = 0.',
      showMeWhy: 'Chaining three vectors head-to-tail adds their components: R = T + W + G = (4 + 1 + 0, 5 + 0 - 3, 0 + 0 + 0) = (5, 2, 0). Your upward Thrust Y = +5 overcomes Gravity (-3) with +2 to spare!',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 5, y: 2, z: 0 }, radius: 1.4, label: 'High Cliff (5, 2, 0)' },
      gravity: 3,
      fuel: 8.5,
      parFuel: 6.45,
      showHeadToTail: true,
      recommendedThrust: { x: 4, y: 5, z: 0 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 5, y: 2, z: 0 }, scale: 1.25, type: 'goal', label: 'Goal (5, 2, 0)' }
      ],
      windZones: [
        {
          position: { x: 2.5, y: 1, z: 0 },
          size: { x: 14, y: 10, z: 10 },
          vector: { x: 1, y: 0, z: 0 },
          label: 'Updraft Breeze (1, 0, 0)'
        }
      ],
      gates: [],
      turbines: [],
      obstacles: []
    }
  ]
};
