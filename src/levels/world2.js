/**
 * world2.js - World 2: "Components"
 * Focus: Breaking a 3D vector into (x, y, z) coordinates and computing
 * magnitude |v| = sqrt(x^2 + y^2 + z^2) via 3D Pythagoras.
 */

export const world2 = {
  id: 'world2',
  number: 2,
  name: 'World 2: Components',
  subtitle: '3D Coordinates (x, y, z) & Pythagorean Magnitude',
  themeColor: '#34d399',
  levels: [
    {
      id: 'w2-l1',
      world: 2,
      level: 1,
      name: '2-1: The 3-4-5 Climb',
      concept: 'Pythagorean Magnitude |v| = √(x² + y² + z²)',
      intro: 'Every 3D vector splits into (x, y, z) components, and fuel cost equals its length |v| = √(x² + y² + z²). You have exactly 5.2 fuel to reach Sky Dock at (3, 4, 0)!',
      hint: 'Set X = 3, Y = 4, Z = 0. By Pythagoras, √(3² + 4² + 0²) = √(9 + 16) = √25 = 5.0!',
      showMeWhy: 'A vector with components (3, 4, 0) forms a right triangle with legs 3 and 4. By the Pythagorean theorem, its hypotenuse (magnitude) is |v| = √(3² + 4²) = 5.0.',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 3, y: 4, z: 0 }, radius: 1.35, label: 'Sky Dock (3, 4, 0)' },
      gravity: 0,
      fuel: 5.2,
      parFuel: 5.0,
      showHeadToTail: false,
      recommendedThrust: { x: 3, y: 4, z: 0 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 3, y: 4, z: 0 }, scale: 1.25, type: 'goal', label: 'Goal (3, 4, 0)' }
      ],
      windZones: [],
      gates: [],
      turbines: [],
      obstacles: []
    },
    {
      id: 'w2-l2',
      world: 2,
      level: 2,
      name: '2-2: 3D Pythagorean Quadruple',
      concept: 'Full 3D Components & Distance Formula',
      intro: 'Now combine all three axes at once! Reach the Starlight Observatory at (6, 2, -3). Before launching, check how 6² + 2² + (-3)² adds up in the magnitude readout!',
      hint: 'Match the goal coordinates directly: X = 6, Y = 2, Z = -3. Notice √(36 + 4 + 9) = √49 = 7.0!',
      showMeWhy: 'In 3D space, the Pythagorean theorem extends across all three perpendicular axes: |v| = √(x² + y² + z²) = √(6² + 2² + (-3)²) = √(36 + 4 + 9) = √49 = 7.0.',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: 6, y: 2, z: -3 }, radius: 1.35, label: 'Observatory (6, 2, -3)' },
      gravity: 0,
      fuel: 7.4,
      parFuel: 7.0,
      showHeadToTail: false,
      recommendedThrust: { x: 6, y: 2, z: -3 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: 6, y: 2, z: -3 }, scale: 1.25, type: 'goal', label: 'Goal (6, 2, -3)' }
      ],
      windZones: [],
      gates: [],
      turbines: [],
      obstacles: []
    },
    {
      id: 'w2-l3',
      world: 2,
      level: 3,
      name: '2-3: Octant Spire Threading',
      concept: 'Signed 3D Components with Gravity Offset',
      intro: 'Signs determine which octant of 3D space you fly into! Navigate past the rock spire to the western peak at (-4, 3, -4) while gravity pulls down at g = 1.',
      hint: 'Goal is (-4, 3, -4) and Gravity is (0, -1, 0). Set Thrust = (-4, 4, -4).',
      showMeWhy: 'Negative X (-4) flies West, positive Y (+4 - 1 = +3) climbs upward against gravity, and negative Z (-4) flies North. The fuel magnitude is |T| = √((-4)² + 4² + (-4)²) = √48 ≈ 6.93.',
      start: { x: 0, y: 0, z: 0 },
      goal: { position: { x: -4, y: 3, z: -4 }, radius: 1.35, label: 'West Peak (-4, 3, -4)' },
      gravity: 1,
      fuel: 7.5,
      parFuel: 6.95,
      showHeadToTail: false,
      recommendedThrust: { x: -4, y: 4, z: -4 },
      islands: [
        { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
        { position: { x: -4, y: 3, z: -4 }, scale: 1.25, type: 'goal', label: 'Goal (-4, 3, -4)' }
      ],
      windZones: [],
      gates: [],
      turbines: [],
      obstacles: [
        { position: { x: -2, y: 0, z: -2 }, radius: 0.85, label: 'Basalt Spire (-2, 0, -2)' }
      ]
    }
  ]
};
