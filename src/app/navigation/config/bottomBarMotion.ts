/**
 * Bottom bar motion/interaction tokens + pure geometry helpers.
 * Values are starting points from the motion spec (sections 2, 3.2, 5, 7);
 * tune on device without touching logic. Functions called from worklets
 * carry the 'worklet' directive.
 */
export interface BarGeometry {
  barWidth: number;
  padding: number;
  tabCount: number;
}

export const MOTION = {
  // Interaction thresholds (spec 2 / 5)
  holdActivationMs: 220,
  moveSlop: 8,
  hysteresis: 6,
  dropZonePad: 16,

  // Layout (spec 3.2)
  barHeight: 64,
  barPadding: 6,
  capsuleHeight: 52,
  pillGap: 4, // pillWidth = slotWidth - 4
  iconSize: 26,
  bottomGap: 8,

  // Press feedback (spec 7)
  pressScale: 0.94,
  pressInMs: 70,
  pressOutMs: 120,

  // Preview (spec 5.1 / 7)
  previewScale: 1.04,
  previewMs: 100,

  // Icon crossfade (spec 7)
  crossfadeMs: 140,
  crossfadeDip: 0.5,

  // Stretch limits (spec 7)
  dragStretchMax: 1.12,
  dragStretchMs: 80,
  dragDeltaDivisor: 400,

  // Springs (spec 7)
  springTapLead: {stiffness: 420, damping: 32, mass: 1},
  springTapTrail: {stiffness: 280, damping: 30, mass: 1},
  springSnap: {stiffness: 420, damping: 34, mass: 1},
  springRestore: {stiffness: 380, damping: 34, mass: 1},

  // Keyboard hide (spec 8.6)
  keyboardMs: 200,
} as const;

export const slotWidth = (g: BarGeometry): number => {
  'worklet';
  return (g.barWidth - 2 * g.padding) / g.tabCount;
};

export const tabCenterX = (g: BarGeometry, index: number): number => {
  'worklet';
  return g.padding + slotWidth(g) * (index + 0.5);
};

export const pillWidth = (g: BarGeometry): number => {
  'worklet';
  return Math.max(slotWidth(g) - MOTION.pillGap, 0);
};

/** Render edges clamped to the bar inner area; width always >= 0 (spec 7). */
export const capsuleEdges = (
  centerX: number,
  halfWidth: number,
  g: BarGeometry,
): {left: number; width: number} => {
  'worklet';
  const lo = g.padding;
  const hi = g.barWidth - g.padding;
  const left = Math.min(Math.max(centerX - halfWidth, lo), hi);
  const right = Math.min(Math.max(centerX + halfWidth, lo), hi);
  return {left, width: Math.max(right - left, 0)};
};

/** Drag center is limited to the first..last tab centers (spec 5.2). */
export const clampCenterX = (pointerX: number, g: BarGeometry): number => {
  'worklet';
  const first = tabCenterX(g, 0);
  const last = tabCenterX(g, g.tabCount - 1);
  return Math.min(Math.max(pointerX, first), last);
};

/** Tab under pointerX, no hysteresis — used for taps. */
export const indexFromX = (pointerX: number, g: BarGeometry): number => {
  'worklet';
  const raw = Math.floor((pointerX - g.padding) / slotWidth(g));
  return Math.min(Math.max(raw, 0), g.tabCount - 1);
};

/** Tab under pointerX with hysteresis around boundaries (spec 5.2). */
export const candidateFromX = (
  pointerX: number,
  g: BarGeometry,
  current: number,
): number => {
  'worklet';
  const candidate = indexFromX(pointerX, g);
  if (candidate === current) {
    return current;
  }
  // Boundary crossed: require hysteresis past the shared edge. Multi-tab
  // jumps are already far past it and resolve straight to the new tab.
  const edgeX =
    g.padding + slotWidth(g) * (candidate > current ? candidate : current);
  const delta = candidate > current ? pointerX - edgeX : edgeX - pointerX;
  return delta >= MOTION.hysteresis ? candidate : current;
};

/** Drop zone: bar rect expanded dropZonePad each side (spec 5.4). */
export const isInsideDropZone = (
  x: number,
  y: number,
  barWidth: number,
  barHeight: number,
): boolean => {
  'worklet';
  const pad = MOTION.dropZonePad;
  return x >= -pad && x <= barWidth + pad && y >= -pad && y <= barHeight + pad;
};
