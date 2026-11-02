const space = {
  // Spacing scale (from Figma — 8px grid, 4px fine-tune)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  _2xl: 40,
  _3xl: 48,
  _4xl: 56,
  _5xl: 64,
  _6xl: 80,
  _7xl: 120,
} as const;

const borderRadius = {
  // Corner radius (from Figma)
  small: 8, // Button, Small Card
  medium: 16, // Card nhỏ, Banner
  big: 32, // Phân chia Section, Card lớn
  full: 999,
} as const;

// Component spacing (Figma `spacing/*`) — padding/gap inside components
const spacing = {
  _3xs: 4, // spacing/3XS
  _2xs: 8, // spacing/2XS
  xs: 12, // spacing/XS
  s: 16, // spacing/S
} as const;

export const tokens = {space, borderRadius, spacing};
