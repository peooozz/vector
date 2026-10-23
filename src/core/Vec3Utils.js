/**
 * Vec3Utils.js
 * Pure 3D vector mathematics functions used across physics, UI readouts,
 * and 3D educational visualizations.
 * Every vector is a plain { x, y, z } object.
 */

export function vec3(x = 0, y = 0, z = 0) {
  return { x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 };
}

export function cloneVec3(v) {
  return { x: v.x, y: v.y, z: v.z };
}

/**
 * Vector addition: a + b = (ax + bx, ay + by, az + bz)
 */
export function add(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
}

/**
 * Vector subtraction: a - b = (ax - bx, ay - by, az - bz)
 */
export function sub(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
}

/**
 * Scalar multiplication: s * v = (s*vx, s*vy, s*vz)
 */
export function scale(v, s) {
  return {
    x: v.x * s,
    y: v.y * s,
    z: v.z * s
  };
}

/**
 * Euclidean magnitude (length) via 3D Pythagorean theorem:
 * |v| = sqrt(x^2 + y^2 + z^2)
 */
export function magnitude(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Distance between two 3D points: |a - b|
 */
export function distance(a, b) {
  return magnitude(sub(a, b));
}

/**
 * Unit vector (direction only, length = 1): v / |v|
 */
export function normalize(v) {
  const mag = magnitude(v);
  if (mag < 1e-8) return { x: 0, y: 0, z: 0 };
  return scale(v, 1 / mag);
}

/**
 * Dot product: a . b = ax*bx + ay*by + az*bz = |a||b|cos(theta)
 * Measures how strongly two vectors align.
 */
export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Normalized alignment (cosine of angle between a and b, in [-1, 1])
 */
export function alignmentCos(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA < 1e-8 || magB < 1e-8) return 0;
  const rawCos = dot(a, b) / (magA * magB);
  return Math.max(-1, Math.min(1, rawCos));
}

/**
 * Angle between two vectors in radians: arccos((a . b) / (|a||b|))
 */
export function angle(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA < 1e-8 || magB < 1e-8) return 0;
  return Math.acos(alignmentCos(a, b));
}

/**
 * Angle between two vectors in degrees [0, 180]
 */
export function angleDegrees(a, b) {
  return (angle(a, b) * 180) / Math.PI;
}

/**
 * Cross product: a x b
 * Returns a vector perpendicular to both a and b following the right-hand rule.
 */
export function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

/**
 * Format vector cleanly for UI readouts: "(x, y, z)"
 */
export function formatVec(v, decimals = 1) {
  const fmt = (n) => {
    const val = Math.abs(n) < 1e-4 ? 0 : n;
    return Number(val.toFixed(decimals));
  };
  return `(${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)})`;
}

/**
 * Visual 3D world-space multiplier so floating platforms sit far apart across a grand sky
 * while keeping student math coordinates small, clean integers.
 */
export const WORLD_SCALE = 2.35;

export function toWorldPos(v) {
  return {
    x: v.x * WORLD_SCALE,
    y: v.y * WORLD_SCALE,
    z: v.z * WORLD_SCALE
  };
}
