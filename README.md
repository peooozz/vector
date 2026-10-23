# Vector Skies ⛵📐

**Vector Skies** is a complete, playable 3D educational browser game built with **Three.js** and **Vite** in vanilla JavaScript (ES modules). Players pilot a low-poly airship across floating islands by planning 3D thrust vectors before each burn. The airship's trajectory is governed directly by vector mathematics:

$$\vec{v}_{\text{next}} = \vec{v} + (\vec{T}_{\text{thrust}} + \vec{W}_{\text{wind}}(\vec{p}) + \vec{G}_{\text{gravity}}) \cdot \Delta t$$

---

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal (default `http://localhost:5173`) in any desktop or mobile browser.

---

## Controls & Gameplay Loop

1. **PLAN Phase**:
   - **Orbit Camera**: Left-click + drag (or 1-finger touch drag) to orbit around the islands.
   - **Pan Camera**: Right-click + drag (or Shift + drag) to pan.
   - **Zoom**: Scroll wheel or trackpad pinch.
   - **Set Thrust Vector**:
     - Adjust the **X, Y, Z sliders** or type exact coordinates in the numeric inputs on the left panel.
     - Or grab the **cyan 3D Arrow Handle** at the tip of the Thrust vector directly in the 3D viewport! Toggle between **XZ Horizontal** and **Y Vertical** drag planes (or hold `Shift` while dragging) to adjust altitude in 3D.
2. **PREVIEW**:
   - A dotted ghost trajectory previews your exact path using the deterministic semi-implicit Euler physics engine (`src/core/Physics.js`).
   - Toggle **Head-to-Tail Ghost Arrows** (`🔗 Head-to-Tail`) to see $\vec{T} + \vec{W} + \vec{G} = \vec{R}$ chained visually in 3D space.
3. **LAUNCH**:
   - Click **🚀 Launch Burn** to run the fixed-timestep (`1/60s`) physics simulation with smooth camera tracking and a flight trail.
4. **RESULT & "Show Me Why"**:
   - Land on the Goal Island pad to earn up to **3 Stars** based on fuel efficiency ($|\vec{T}| = \sqrt{x^2 + y^2 + z^2}$) and attempts.
   - Click **📐 Show Me Why** at any time (or on the post-flight telemetry screen) to inspect the step-by-step vector equations and apply the exact mathematical solution.

---

## 5 Worlds & 15 Progressive Levels

- **World 1 — "Arrows"** (`src/levels/world1.js`): 2D-ish levels introducing displacement vectors, vector addition, and visual head-to-tail ghost arrow construction.
- **World 2 — "Components"** (`src/levels/world2.js`): Breaking 3D vectors into $(x, y, z)$ coordinates and computing magnitude $|\vec{v}| = \sqrt{x^2 + y^2 + z^2}$ via the 3D Pythagorean theorem.
- **World 3 — "Wind"** (`src/levels/world3.js`): Cancelling crosswinds via vector subtraction ($\vec{T} = \vec{R} - \vec{W}$), summing overlapping wind zones, and riding jetstreams with scalar multiplication ($k\vec{v}$).
- **World 4 — "Alignment"** (`src/levels/world4.js`): Dot product ($\vec{a} \cdot \vec{b} = |\vec{a}||\vec{b}|\cos\theta$). Solar Sail Gates activate only when your resultant velocity direction aligns with the gate's marked direction vector.
- **World 5 — "Spin"** (`src/levels/world5.js`): Cross product ($\vec{A} \times \vec{B}$) and a 3D hand-free Right-Hand-Rule indicator. Rotating magnetic turbines unlock only when your trajectory is perpendicular to both $\vec{A}$ and $\vec{B}$ in the right-hand direction.
- **Sandbox Lab**: Accessible from the **🗺 Worlds & Levels** menu—freely customize Goal coordinates, Wind vectors, and Gravity to experiment.

---

## How to Add a New Level

Levels are pure JSON-like objects inside `src/levels/world1.js` through `src/levels/world5.js`. To add a level, append an object to any world's `levels` array:

```js
{
  id: 'w3-l4',
  world: 3,
  level: 4,
  name: '3-4: Custom Canyon',
  concept: 'Cancelling Diagonal Shear',
  intro: 'Short 2-3 line explanation shown at the start of the level.',
  hint: 'Optional hint revealed when clicking the Hint button.',
  showMeWhy: 'Detailed mathematical breakdown shown in the Show Me Why drawer.',
  start: { x: 0, y: 0, z: 0 },
  goal: { position: { x: 6, y: 2, z: -4 }, radius: 1.4, label: 'Goal (6, 2, -4)' },
  gravity: 2,          // Constant gravity vector (0, -g, 0)
  fuel: 9.5,           // Max allowed |thrust| magnitude budget
  parFuel: 8.5,        // Target |thrust| for 3 stars
  showHeadToTail: true,
  recommendedThrust: { x: 5, y: 4, z: -2 },
  islands: [
    { position: { x: 0, y: 0, z: 0 }, scale: 1.15, type: 'start', label: 'Origin (0, 0, 0)' },
    { position: { x: 6, y: 2, z: -4 }, scale: 1.25, type: 'goal', label: 'Goal (6, 2, -4)' }
  ],
  windZones: [
    {
      position: { x: 3, y: 1, z: -2 },
      size: { x: 14, y: 10, z: 12 },
      vector: { x: 1, y: 0, z: -2 },
      label: 'Wind (1, 0, -2)'
    }
  ],
  gates: [],     // Optional World 4 Solar Sail Gates: { position, direction, minAlignment, radius, label }
  turbines: [],  // Optional World 5 Turbines: { position, vecA, vecB, minAlignment, radius, label }
  obstacles: []  // Optional Rock Spires: { position, radius, label }
}
```
