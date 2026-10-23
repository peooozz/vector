/**
 * world4.js - World 4: "Alignment"
 * Focus: Dot product (a . b = |a||b|cos(theta)).
 * Solar Sail Gates only activate when the ship's velocity direction aligns
 * with the gate's marked direction vector.
 */

export const world4 = {
  id: 'world4',
  number: 4,
  name: 'World 4: Alignment',
  subtitle: 'Dot Product & Vector Angles (a · b = |a||b|cos θ)',
  themeColor: '#a78bfa',
  levels: [
    {
      id: 'w4-l1',
      world: 4,
      level: 1,
      name: '4-1: Solar Sail Gate',
      concept: 'Dot Product & Cosine Similarity (v̂ · d̂ = cos θ)',
      intro: 'Solar Sail Gates measure alignment using the Dot Product! When your velocity direction matches the gate arrow d = (1, 0, -1), the angle θ is 0° and v̂ · d̂ = cos(0°) = 1.00.',
      hint: 'Scale the gate direction (1, 0, -1) by 6× so your ship passes straight through the gate at (3, 0, -3) and lands at (6, 0, -6).',
      showMeWhy: 'For Thrust = (6, 0, -6) and Gate direction d = (1, 0, -1), the dot product is 6(1) + 0(0) + (-6)(-1) = 12. Dividing by |v||d| gives cos θ = 12 / (√72 · √2) = 12 / 12 = 1.00 (θ = 0°)!',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 0, z: -6 }, radius: 1.4, label: 'Solar Pier (6, 0, -6)' },
      gravity: 0,
      fuel: 9.2,
      parFuel: 8.5,
      showHeadToTail: false,
      recommendedThrust: { x: 6, y: 0, z: -6 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 0, z: -6 }, scale: 1.25, type: 'goal', label: 'Goal (6, 0, -6)' }
      ],
      windZones: [],
      gates: [
        {
          position: { x: 3, y: 0, z: -3 },
          direction: { x: 1, y: 0, z: -1 },
          minAlignment: 0.92,
          radius: 1.9,
          label: 'Solar Gate d = (1, 0, -1)'
        }
      ],
      turbines: [],
      obstacles: []
    },
    {
      id: 'w4-l2',
      world: 4,
      level: 2,
      name: '4-2: True Heading in Crosswind',
      concept: 'Aligning Resultant Velocity in Wind',
      intro: 'The Solar Gate tests your actual flight velocity (Resultant), not your raw Thrust! Cancel the wind W = (0, -2, 3) so your Resultant aligns with the gate arrow d = (2, 1, 0) toward (6, 3, 0).',
      hint: 'We need Resultant R = 3 × (2, 1, 0) = (6, 3, 0). Subtract Wind (0, -2, 3) => Thrust = (6, 5, -3).',
      showMeWhy: 'Setting Thrust = (6, 5, -3) in Wind (0, -2, 3) produces Resultant R = (6, 3, 0). The dot product with d = (2, 1, 0) is 6(2) + 3(1) + 0(0) = 15, giving cos θ = 15 / (√45 · √5) = 1.00 (θ = 0°)!',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 3, z: 0 }, radius: 1.4, label: 'Helios Spire (6, 3, 0)' },
      gravity: 0,
      fuel: 9.2,
      parFuel: 8.4,
      showHeadToTail: false,
      recommendedThrust: { x: 6, y: 5, z: -3 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 3, z: 0 }, scale: 1.25, type: 'goal', label: 'Goal (6, 3, 0)' }
      ],
      windZones: [
        {
          position: { x: 3, y: 1.5, z: 0 },
          size: { x: 14, y: 10, z: 12 },
          vector: { x: 0, y: -2, z: 3 },
          label: 'Downdraft Drift (0, -2, 3)'
        }
      ],
      gates: [
        {
          position: { x: 3, y: 1.5, z: 0 },
          direction: { x: 2, y: 1, z: 0 },
          minAlignment: 0.92,
          radius: 1.9,
          label: 'Solar Gate d = (2, 1, 0)'
        }
      ],
      turbines: [],
      obstacles: []
    },
    {
      id: 'w4-l3',
      world: 4,
      level: 3,
      name: '4-3: Prism Alignment',
      concept: '3D Diagonal Dot Product under Gravity & Wind',
      intro: 'Thread the high-precision Prism Gate at (2, 2, -2) aligned along d = (1, 1, -1) (requires cos θ ≥ 0.95) while countering Wind (-1, 0, 2) and Gravity (g = 2) to reach (4, 4, -4)!',
      hint: 'Target Resultant is (4, 4, -4). Subtract Wind (-1, 0, 2) and Gravity (0, -2, 0) => Thrust = (5, 6, -6).',
      showMeWhy: 'With Thrust = (5, 6, -6), R = (5 - 1, 6 - 2, -6 + 2) = (4, 4, -4) = 4 · (1, 1, -1). Since R is a positive scalar multiple of d = (1, 1, -1), the angle between them is 0° and cos θ = 1.00!',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 4, y: 4, z: -4 }, radius: 1.4, label: 'Prism Crown (4, 4, -4)' },
      gravity: 2,
      fuel: 10.6,
      parFuel: 9.86,
      showHeadToTail: false,
      recommendedThrust: { x: 5, y: 6, z: -6 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 4, y: 4, z: -4 }, scale: 1.25, type: 'goal', label: 'Goal (4, 4, -4)' }
      ],
      windZones: [
        {
          position: { x: 2, y: 2, z: -2 },
          size: { x: 14, y: 12, z: 14 },
          vector: { x: -1, y: 0, z: 2 },
          label: 'Prism Wind (-1, 0, 2)'
        }
      ],
      gates: [
        {
          position: { x: 2, y: 2, z: -2 },
          direction: { x: 1, y: 1, z: -1 },
          minAlignment: 0.95,
          radius: 1.9,
          label: 'Prism Gate d = (1, 1, -1)'
        }
      ],
      turbines: [],
      obstacles: []
    }
  ]
};
