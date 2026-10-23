/**
 * Physics.js
 * Deterministic, custom semi-implicit Euler physics engine.
 * Shared identically between TrajectoryPreview (ghost line) and live flight (RUN phase).
 *
 * Core Integration Formula (Fixed Timestep dt = 1/60s):
 *   acceleration = thrust + wind(position) + gravity
 *   velocity += acceleration * dt
 *   position += velocity * dt
 *
 * Note on Burn Duration:
 *   84 steps of dt = 1/60s (t = 1.40s) satisfies 0.5 * t^2 ≈ 1.00 (84*85/7200 = 0.9917).
 *   This guarantees that a constant net acceleration vector R = (Rx, Ry, Rz)
 *   carries the airship from startPos (0,0,0) directly to startPos + R!
 */

import { add, sub, scale, magnitude, distance, alignmentCos, angleDegrees, cross, formatVec } from './Vec3Utils.js';

export const FIXED_DT = 1 / 60;
export const BURN_STEPS = 84; // 1.40s burn where displacement = 1.0 * resultant vector
export const MAX_SETTLE_STEPS = 36;

/**
 * Check if a 3D point lies inside an axis-aligned wind zone volume.
 */
export function isPointInBox(pos, boxCenter, boxSize) {
  const hx = boxSize.x * 0.5;
  const hy = boxSize.y * 0.5;
  const hz = boxSize.z * 0.5;
  return (
    pos.x >= boxCenter.x - hx && pos.x <= boxCenter.x + hx &&
    pos.y >= boxCenter.y - hy && pos.y <= boxCenter.y + hy &&
    pos.z >= boxCenter.z - hz && pos.z <= boxCenter.z + hz
  );
}

/**
 * Sum all wind vectors active at a given 3D position.
 */
export function getWindAtPosition(pos, windZones = []) {
  let totalWind = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < windZones.length; i++) {
    const wz = windZones[i];
    if (isPointInBox(pos, wz.position, wz.size)) {
      totalWind = add(totalWind, wz.vector);
    }
  }
  return totalWind;
}

/**
 * Compute gravity vector from scalar g: (0, -g, 0)
 */
export function getGravityVector(level) {
  const g = typeof level.gravity === 'number' ? level.gravity : 0;
  return { x: 0, y: -g, z: 0 };
}

/**
 * Compute instantaneous resultant vector at a given position:
 * Resultant = Thrust + Wind(pos) + Gravity
 */
export function getResultantAt(thrust, pos, level) {
  const wind = getWindAtPosition(pos, level.windZones || []);
  const gravity = getGravityVector(level);
  const resultant = add(add(thrust, wind), gravity);
  return { thrust, wind, gravity, resultant };
}

/**
 * Create initial simulation state prior to launch.
 */
export function createSimState(level, thrust) {
  const startPos = level.start ? { ...level.start } : { x: 0, y: 0, z: 0 };
  return {
    position: { ...startPos },
    velocity: { x: 0, y: 0, z: 0 },
    thrust: { ...thrust },
    step: 0,
    time: 0,
    done: false,
    outcome: null, // 'win' | 'fail'
    reasonTitle: '',
    reasonMath: '',
    gatesActivated: (level.gates || []).map(() => false),
    turbinesPassed: (level.turbines || []).map(() => false),
    burnApexPosition: null
  };
}

/**
 * Advance simulation by one fixed timestep (dt = 1/60s) using Semi-Implicit Euler.
 */
export function stepPhysics(state, level, dt = FIXED_DT) {
  if (state.done) return state;

  const wind = getWindAtPosition(state.position, level.windZones || []);
  const gravity = getGravityVector(level);

  // During active burn (steps 0 .. BURN_STEPS - 1), apply thrust + wind + gravity
  if (state.step < BURN_STEPS) {
    const netAccel = add(add(state.thrust, wind), gravity);
    // Semi-implicit Euler integration:
    // 1. Update velocity using current acceleration
    state.velocity = add(state.velocity, scale(netAccel, dt));
    // 2. Update position using new velocity
    state.position = add(state.position, scale(state.velocity, dt));
  } else {
    // Post-burn coast/drop if the ship missed the landing pad at burn apex
    const dropAccel = { x: wind.x * 0.25, y: -Math.max(4, (level.gravity || 0) + 4), z: wind.z * 0.25 };
    state.velocity = add(scale(state.velocity, 0.92), scale(dropAccel, dt));
    state.position = add(state.position, scale(state.velocity, dt));
  }

  state.step += 1;
  state.time = state.step * dt;

  // 1. Check Obstacle Collisions
  const obstacles = level.obstacles || [];
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    const dist = distance(state.position, obs.position);
    if (dist <= (obs.radius || 1.1)) {
      state.done = true;
      state.outcome = 'fail';
      state.reasonTitle = 'Clipped a Floating Spire!';
      state.reasonMath = `Your trajectory passed through ${formatVec(state.position)}, colliding with the rock obstacle at ${formatVec(obs.position)}. Adjust your components to steer clear.`;
      return state;
    }
  }

  // 2. Check Solar Sail Gates (World 4 - Dot Product alignment)
  const gates = level.gates || [];
  for (let i = 0; i < gates.length; i++) {
    const gate = gates[i];
    const dist = distance(state.position, gate.position);
    if (dist <= (gate.radius || 1.8) && !state.gatesActivated[i]) {
      const cosTheta = alignmentCos(state.velocity, gate.direction);
      const deg = angleDegrees(state.velocity, gate.direction);
      const minCos = gate.minAlignment || 0.9;
      if (cosTheta >= minCos) {
        state.gatesActivated[i] = true;
      } else {
        state.done = true;
        state.outcome = 'fail';
        state.reasonTitle = 'Solar Gate Misaligned!';
        state.reasonMath = `Your velocity angle with the gate was ${deg.toFixed(1)}° (normalized dot product cos θ = ${cosTheta.toFixed(2)}), but the gate needs cos θ ≥ ${minCos.toFixed(2)}. Align your Resultant vector with ${formatVec(gate.direction)}!`;
        return state;
      }
    }
  }

  // 3. Check Rotating Turbines (World 5 - Cross Product perpendicularity)
  const turbines = level.turbines || [];
  for (let i = 0; i < turbines.length; i++) {
    const turb = turbines[i];
    const dist = distance(state.position, turb.position);
    if (dist <= (turb.radius || 1.8) && !state.turbinesPassed[i]) {
      const targetCross = cross(turb.vecA, turb.vecB);
      const cosTheta = alignmentCos(state.velocity, targetCross);
      const minCos = turb.minAlignment || 0.92;
      if (cosTheta >= minCos) {
        state.turbinesPassed[i] = true;
      } else if (cosTheta <= -0.7) {
        state.done = true;
        state.outcome = 'fail';
        state.reasonTitle = 'Right-Hand Rule Reversed!';
        state.reasonMath = `Your velocity pointed along B × A instead of A × B! By the Right-Hand Rule, ${formatVec(turb.vecA)} × ${formatVec(turb.vecB)} = ${formatVec(targetCross)}. Flip your vector direction!`;
        return state;
      } else {
        const dotA = ( state.velocity.x * turb.vecA.x + state.velocity.y * turb.vecA.y + state.velocity.z * turb.vecA.z );
        const dotB = ( state.velocity.x * turb.vecB.x + state.velocity.y * turb.vecB.y + state.velocity.z * turb.vecB.z );
        state.done = true;
        state.outcome = 'fail';
        state.reasonTitle = 'Turbine Locked (Not Perpendicular)!';
        state.reasonMath = `To unlock the turbine, your flight vector must point along A × B = ${formatVec(targetCross)}. (Your velocity had v·A = ${dotA.toFixed(1)}, v·B = ${dotB.toFixed(1)}; both must be 0!)`;
        return state;
      }
    }
  }

  // 4. Evaluate Burn Apex Landing (at step === BURN_STEPS)
  if (state.step === BURN_STEPS) {
    state.burnApexPosition = { ...state.position };
    const goalPos = level.goal.position;
    const goalRadius = level.goal.radius || 1.35;
    const distToGoal = distance(state.position, goalPos);

    if (distToGoal <= goalRadius) {
      // Verify all gates and turbines were activated
      const missedGateIdx = state.gatesActivated.findIndex((v) => !v);
      if (missedGateIdx !== -1) {
        const g = gates[missedGateIdx];
        state.done = true;
        state.outcome = 'fail';
        state.reasonTitle = 'Bypassed Solar Gate!';
        state.reasonMath = `You reached the goal island, but didn't fly through the Solar Sail Gate at ${formatVec(g.position)} aligned with ${formatVec(g.direction)}.`;
        return state;
      }

      const missedTurbIdx = state.turbinesPassed.findIndex((v) => !v);
      if (missedTurbIdx !== -1) {
        const t = turbines[missedTurbIdx];
        const cp = cross(t.vecA, t.vecB);
        state.done = true;
        state.outcome = 'fail';
        state.reasonTitle = 'Bypassed Turbine Door!';
        state.reasonMath = `You must fly through the Turbine at ${formatVec(t.position)} along the cross product A × B = ${formatVec(cp)}.`;
        return state;
      }

      // Snap gently toward landing pad center and WIN
      state.done = true;
      state.outcome = 'win';
      state.reasonTitle = 'Touchdown on Goal Island!';
      state.reasonMath = `Your resultant vector carried the airship to ${formatVec(state.burnApexPosition)}, right on the target pad at ${formatVec(goalPos)}!`;
      return state;
    }
  }

  // 5. Post-burn miss diagnosis after settling/dropping or falling into void
  if (state.step >= BURN_STEPS + MAX_SETTLE_STEPS || state.position.y < -14) {
    state.done = true;
    state.outcome = 'fail';
    const apex = state.burnApexPosition || state.position;
    const goalPos = level.goal.position;
    const diff = sub(goalPos, apex);
    const { wind, gravity } = getResultantAt(state.thrust, level.start || { x: 0, y: 0, z: 0 }, level);

    // Build specific, friendly math diagnosis
    const axisErrors = [];
    if (Math.abs(diff.x) >= 0.6) {
      axisErrors.push(`X by ${diff.x > 0 ? '+' : ''}${diff.x.toFixed(1)}`);
    }
    if (Math.abs(diff.y) >= 0.6) {
      axisErrors.push(`Y by ${diff.y > 0 ? '+' : ''}${diff.y.toFixed(1)}`);
    }
    if (Math.abs(diff.z) >= 0.6) {
      axisErrors.push(`Z by ${diff.z > 0 ? '+' : ''}${diff.z.toFixed(1)}`);
    }

    const magApex = magnitude(apex);
    const magGoal = magnitude(goalPos);

    if (magnitude(wind) > 0.1 && (Math.abs(diff.x) > 0.7 || Math.abs(diff.z) > 0.7)) {
      state.reasonTitle = 'Drifted Off-Course in the Wind!';
      state.reasonMath = `Your burn ended at ${formatVec(apex)}, missing the goal ${formatVec(goalPos)}. Wind ${formatVec(wind)} pushed your ship—adjust Thrust by (${axisErrors.join(', ')}) to cancel it!`;
    } else if (Math.abs(diff.y) > 0.8 && (level.gravity || 0) > 0) {
      state.reasonTitle = 'Gravity Pulled You Down!';
      state.reasonMath = `Your burn ended at ${formatVec(apex)} instead of ${formatVec(goalPos)}. Gravity is (0, -${level.gravity}, 0), so change Thrust (${axisErrors.join(', ')}) to compensate!`;
    } else if (magApex < magGoal - 0.8) {
      state.reasonTitle = 'Stopped Short of the Island!';
      state.reasonMath = `Your resultant landed at ${formatVec(apex)} (|R| = ${magApex.toFixed(1)}), which fell short of ${formatVec(goalPos)} (|Goal| = ${magGoal.toFixed(1)}). Increase Thrust (${axisErrors.join(', ')}).`;
    } else if (magApex > magGoal + 0.8) {
      state.reasonTitle = 'Overshot the Goal Island!';
      state.reasonMath = `Your resultant reached ${formatVec(apex)} (|R| = ${magApex.toFixed(1)}), overshooting ${formatVec(goalPos)} (|Goal| = ${magGoal.toFixed(1)}). Adjust Thrust (${axisErrors.join(', ')}).`;
    } else {
      state.reasonTitle = 'Missed the Landing Pad!';
      state.reasonMath = `Your burn reached ${formatVec(apex)}, missing the target ${formatVec(goalPos)}. Adjust your Thrust components by (${axisErrors.join(', ')}).`;
    }
    return state;
  }

  return state;
}

/**
 * Deterministically simulate an entire trajectory for TrajectoryPreview.js
 * using the exact same stepPhysics function as the real flight.
 */
export function simulateFullTrajectory(level, thrust) {
  const state = createSimState(level, thrust);
  const points = [{ ...state.position }];
  let maxSteps = BURN_STEPS + MAX_SETTLE_STEPS + 5;
  while (!state.done && maxSteps > 0) {
    stepPhysics(state, level, FIXED_DT);
    points.push({ ...state.position });
    maxSteps--;
  }
  return {
    points,
    burnApexPosition: state.burnApexPosition || points[points.length - 1],
    outcome: state.outcome,
    reasonTitle: state.reasonTitle,
    reasonMath: state.reasonMath,
    gatesActivated: state.gatesActivated,
    turbinesPassed: state.turbinesPassed
  };
}

/**
 * Compute star rating (1 to 3 stars) on level win based on fuel used and attempts.
 */
export function calculateStars(level, fuelUsed, attempts) {
  const parFuel = level.parFuel || level.fuel * 0.9;
  if (fuelUsed <= parFuel + 0.25 && attempts <= 2) return 3;
  if (fuelUsed <= level.fuel + 0.05 && attempts <= 4) return 2;
  return 1;
}
