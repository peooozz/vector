/**
 * world5.js - World 5: "Spin"
 * Focus: Cross product (A x B) and the Right-Hand Rule.
 * Rotating Turbine Doors only open when the airship flies perpendicular
 * to both A and B along the direction of A x B.
 */

export const world5 = {
  id: 'world5',
  number: 5,
  name: 'World 5: Spin',
  subtitle: 'Cross Product (A × B) & Right-Hand Rule',
  themeColor: '#f43f5e',
  levels: [
    {
      id: 'w5-l1',
      world: 5,
      level: 1,
      name: '5-1: The Right-Hand Rule',
      concept: 'Cross Product of Basis Vectors (A × B)',
      intro: 'Magnetic Turbine Doors unlock only when your flight path points along the Cross Product A × B! Here A = (0, 1, 0) (Up) and B = (0, 0, 1) (South). Follow the 3D curl arc from A to B to find the perpendicular axis.',
      hint: 'A × B = (0, 1, 0) × (0, 0, 1) = (1, 0, 0). Scale it by 6× to fly through (3, 0, 0) to (6, 0, 0): set Thrust = (6, 0, 0).',
      showMeWhy: 'Using the cross product formula A × B = (AyBz - AzBy, AzBx - AxBz, AxBy - AyBx) = (1·1 - 0·0, 0·0 - 0·1, 0·0 - 1·0) = (1, 0, 0). Notice (1, 0, 0) is perpendicular to both A (dot = 0) and B (dot = 0)!',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 0, z: 0 }, radius: 1.4, label: 'Dynamo Isle (6, 0, 0)' },
      gravity: 0,
      fuel: 7.0,
      parFuel: 6.0,
      showHeadToTail: false,
      recommendedThrust: { x: 6, y: 0, z: 0 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 0, z: 0 }, scale: 1.25, type: 'goal', label: 'Goal (6, 0, 0)' }
      ],
      windZones: [],
      gates: [],
      turbines: [
        {
          position: { x: 3, y: 0, z: 0 },
          vecA: { x: 0, y: 1, z: 0 },
          vecB: { x: 0, y: 0, z: 1 },
          minAlignment: 0.92,
          radius: 1.9,
          label: 'Turbine: A=(0,1,0), B=(0,0,1)'
        }
      ],
      obstacles: []
    },
    {
      id: 'w5-l2',
      world: 5,
      level: 2,
      name: '5-2: Orthogonal Ascent',
      concept: 'Computing 3D Cross Product with Gravity',
      intro: 'This tilted Turbine has field vectors A = (0, 0, -1) and B = (-1, 2, 0). Compute A × B so your Resultant flies perpendicular to both vectors through (3, 1.5, 0) to (6, 3, 0) against gravity (g = 2)!',
      hint: 'A × B = (0·0 - (-1)·2, (-1)(-1) - 0·0, 0·2 - 0(-1)) = (2, 1, 0). Scale by 3× for Resultant = (6, 3, 0), then add +2 on Y for gravity => Thrust = (6, 5, 0).',
      showMeWhy: 'A × B = (2, 1, 0). Checking orthogonality: (2, 1, 0)·(0, 0, -1) = 0 and (2, 1, 0)·(-1, 2, 0) = -2 + 2 = 0! Scaling by 3 gives Resultant (6, 3, 0), and compensating for Gravity (0, -2, 0) requires Thrust = (6, 5, 0).',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 3, z: 0 }, radius: 1.4, label: 'Vortex Ridge (6, 3, 0)' },
      gravity: 2,
      fuel: 8.6,
      parFuel: 7.82,
      showHeadToTail: false,
      recommendedThrust: { x: 6, y: 5, z: 0 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 3, z: 0 }, scale: 1.25, type: 'goal', label: 'Goal (6, 3, 0)' }
      ],
      windZones: [],
      gates: [],
      turbines: [
        {
          position: { x: 3, y: 1.5, z: 0 },
          vecA: { x: 0, y: 0, z: -1 },
          vecB: { x: -1, y: 2, z: 0 },
          minAlignment: 0.92,
          radius: 1.9,
          label: 'Turbine: A=(0,0,-1), B=(-1,2,0)'
        }
      ],
      obstacles: []
    },
    {
      id: 'w5-l3',
      world: 5,
      level: 3,
      name: '5-3: Grand Master of Vector Skies',
      concept: 'Synthesis: Cross Product + Dot Product + Wind + Gravity',
      intro: 'The ultimate test! Compute A × B for A = (0, 1, 1) and B = (1, 0, 1) to open the Turbine, keep alignment through the Solar Gate, and cancel both Wind (-2, 1, 1) and Gravity (g = 2) to reach (4, 4, -4)!',
      hint: 'A × B = (1, 1, -1), so Target Resultant = (4, 4, -4). Subtract Wind (-2, 1, 1) and Gravity (0, -2, 0) => Thrust = (6, 5, -5).',
      showMeWhy: '1) Cross Product: (0, 1, 1) × (1, 0, 1) = (1, 1, -1). 2) Scaling by 4 gives Resultant R = (4, 4, -4), which also aligns at 0° (cos θ = 1.00) with the Solar Gate! 3) Subtracting Wind (-2, 1, 1) and Gravity (0, -2, 0) gives Thrust = (6, 5, -5).',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 4, y: 4, z: -4 }, radius: 1.4, label: 'Apex Citadel (4, 4, -4)' },
      gravity: 2,
      fuel: 10.2,
      parFuel: 9.28,
      showHeadToTail: false,
      recommendedThrust: { x: 6, y: 5, z: -5 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 4, y: 4, z: -4 }, scale: 1.3, type: 'goal', label: 'Citadel (4, 4, -4)' }
      ],
      windZones: [
        {
          position: { x: 2, y: 2, z: -2 },
          size: { x: 14, y: 12, z: 14 },
          vector: { x: -2, y: 1, z: 1 },
          label: 'Citadel Gale (-2, 1, 1)'
        }
      ],
      gates: [
        {
          position: { x: 2.8, y: 2.8, z: -2.8 },
          direction: { x: 1, y: 1, z: -1 },
          minAlignment: 0.94,
          radius: 1.9,
          label: 'Solar Gate d = (1, 1, -1)'
        }
      ],
      turbines: [
        {
          position: { x: 1.5, y: 1.5, z: -1.5 },
          vecA: { x: 0, y: 1, z: 1 },
          vecB: { x: 1, y: 0, z: 1 },
          minAlignment: 0.92,
          radius: 1.9,
          label: 'Turbine: A=(0,1,1), B=(1,0,1)'
        }
      ],
      obstacles: []
    }
  ]
};
