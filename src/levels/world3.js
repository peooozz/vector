/**
 * world3.js - World 3: "Wind"
 * Focus: Multiple wind zones, cancelling crosswinds (vector subtraction),
 * and riding jetstreams (scalar multiplication).
 */

export const world3 = {
  id: 'world3',
  number: 3,
  name: 'World 3: Wind',
  subtitle: 'Vector Subtraction & Scalar Multiplication',
  themeColor: '#fb923c',
  levels: [
    {
      id: 'w3-l1',
      world: 3,
      level: 1,
      name: '3-1: Crosswind Cancellation',
      concept: 'Vector Subtraction (T = R - W)',
      intro: 'A fierce crosswind W = (0, 0, 4) blows South across the sky! To fly straight East to (6, 0, 0), you must subtract the wind vector so its Z component cancels out.',
      hint: 'Solve T + (0, 0, 4) = (6, 0, 0) => T = (6, 0, 0) - (0, 0, 4) = (6, 0, -4).',
      showMeWhy: 'To achieve a desired Resultant R in a wind field W, use vector subtraction: T = R - W = (6 - 0, 0 - 0, 0 - 4) = (6, 0, -4). Your -4 Z thrust exactly cancels the +4 Z crosswind!',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 0, z: 0 }, radius: 1.35, label: 'Canyon Haven (6, 0, 0)' },
      gravity: 0,
      fuel: 8.0,
      parFuel: 7.25,
      showHeadToTail: true,
      recommendedThrust: { x: 6, y: 0, z: -4 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 0, z: 0 }, scale: 1.25, type: 'goal', label: 'Goal (6, 0, 0)' }
      ],
      windZones: [
        {
          position: { x: 3, y: 0, z: 0 },
          size: { x: 14, y: 8, z: 12 },
          vector: { x: 0, y: 0, z: 4 },
          label: 'South Gale (0, 0, 4)'
        }
      ],
      gates: [],
      turbines: [],
      obstacles: []
    },
    {
      id: 'w3-l2',
      world: 3,
      level: 2,
      name: '3-2: Twin Gale Convergence',
      concept: 'Summing Multiple Wind Fields (W_net = W₁ + W₂)',
      intro: 'Two wind currents overlap in this sector: W₁ = (-2, 2, 0) and W₂ = (4, 0, 3), with Gravity G = (0, -2, 0). Sum all environmental forces first, then solve for Thrust to reach (5, 1, -4)!',
      hint: 'W₁ + W₂ + G = (-2+4, 2+0-2, 0+3) = (2, 0, 3). Now subtract (2, 0, 3) from Goal (5, 1, -4) => Thrust = (3, 1, -7).',
      showMeWhy: 'Superposition lets us add all environmental vectors first: W₁ + W₂ + G = (-2, 2, 0) + (4, 0, 3) + (0, -2, 0) = (2, 0, 3). Then T = Goal - Env = (5 - 2, 1 - 0, -4 - 3) = (3, 1, -7).',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 5, y: 1, z: -4 }, radius: 1.35, label: 'Storm Outpost (5, 1, -4)' },
      gravity: 2,
      fuel: 8.5,
      parFuel: 7.7,
      showHeadToTail: false,
      recommendedThrust: { x: 3, y: 1, z: -7 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 5, y: 1, z: -4 }, scale: 1.25, type: 'goal', label: 'Goal (5, 1, -4)' }
      ],
      windZones: [
        {
          position: { x: 2.5, y: 0.5, z: -2 },
          size: { x: 14, y: 9, z: 12 },
          vector: { x: -2, y: 2, z: 0 },
          label: 'Thermal Shear (-2, 2, 0)'
        },
        {
          position: { x: 2.5, y: 0.5, z: -2 },
          size: { x: 12, y: 7, z: 10 },
          vector: { x: 4, y: 0, z: 3 },
          label: 'Cross Jet (4, 0, 3)'
        }
      ],
      gates: [],
      turbines: [],
      obstacles: []
    },
    {
      id: 'w3-l3',
      world: 3,
      level: 3,
      name: '3-3: Scalar Boost Jetstream',
      concept: 'Scalar Multiplication (k · v)',
      intro: 'Cloud Sanctuary at (6, 3, -6) is 9.0 units away—further than your 6.2 fuel tank can reach on its own! Ride the jetstream W = (2, 1, -2) by scaling W by 2× so T + W = 3W!',
      hint: 'Notice (6, 3, -6) = 3 × (2, 1, -2). Since Wind gives 1 × (2, 1, -2), set Thrust = 2 × (2, 1, -2) = (4, 2, -4).',
      showMeWhy: 'Multiplying a vector by a positive scalar k stretches its magnitude by k without changing its direction: 2 · (2, 1, -2) = (4, 2, -4) (fuel = 6.0). Adding 1 · (2, 1, -2) from the wind yields 3 · (2, 1, -2) = (6, 3, -6) (distance = 9.0)!',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 3, z: -6 }, radius: 1.4, label: 'Sanctuary (6, 3, -6)' },
      gravity: 0,
      fuel: 6.2,
      parFuel: 6.0,
      showHeadToTail: true,
      recommendedThrust: { x: 4, y: 2, z: -4 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 3, z: -6 }, scale: 1.3, type: 'goal', label: 'Goal (6, 3, -6)' }
      ],
      windZones: [
        {
          position: { x: 3, y: 1.5, z: -3 },
          size: { x: 15, y: 10, z: 15 },
          vector: { x: 2, y: 1, z: -2 },
          label: 'Jetstream v = (2, 1, -2)'
        }
      ],
      gates: [],
      turbines: [],
      obstacles: []
    }
  ]
};
