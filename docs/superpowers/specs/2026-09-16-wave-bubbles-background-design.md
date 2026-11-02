# Water Wave Bubbles Background — Design

Date: 2026-09-16
Status: Approved

## Goal

Add a variant of the onboarding wave background that layers rising bubbles on
top of the existing two-layer water wave. Bubbles rise from the bottom of the
component, sway gently, and fade out as they approach the wave surface, looping
forever with staggered phases. The visual palette comes from a provided bubble
SVG (green gradient glass bubble).

## Placement

- New component `WaterWaveBubblesBackground` at
  `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.tsx`,
  copied from `WaterWaveBackground.tsx` (which stays untouched as the base).
- `OnboardingScreen` swaps its import and JSX to the new component, keeping the
  same `height={SCREEN_HEIGHT - 200}` prop. No other screen changes.
- Same props contract: optional `height` (default full window height).

## Tech & Rendering

- Single `<Svg>` (same as the base): `<Defs>` + back wave `<Path>` + front wave
  `<Path>` + 5 bubble `<Circle>`s drawn last (bubbles float on top of the water
  fill).
- One shared `<RadialGradient id="bubbleGrad">` (default objectBoundingBox
  units, off-center highlight at cx 0.35 / cy 0.3), rebuilt from the provided
  bubble SVG's three stacked layers into one def:
  - offset 0: `#D5D5D5` (glassy highlight, opacity ~0.9)
  - offset 0.61: `#C2E2AF` opacity 0.5
  - offset 1: `#69C56A` opacity 0.85
    All 5 circles share it; bubble size variation comes from each circle's `r`.
- Bubbles are `Animated.createAnimatedComponent(Circle)` animated via
  `useAnimatedProps` on `cx`, `cy`, `opacity` — worklets only, no JS-bridge
  traffic per frame (same pattern the base uses for path `d`).

## Bubble Configuration

Five static bubbles spread across the screen width (x as a fraction of
`SCREEN_W`):

| xFrac | r (px) | duration (ms) | offset (0–1) |
| ----- | ------ | ------------- | ------------ |
| 0.12  | 7      | 8000          | 0            |
| 0.30  | 13     | 6500          | 0.35         |
| 0.50  | 17     | 9000          | 0.7          |
| 0.68  | 9      | 7000          | 0.15         |
| 0.88  | 11     | 10000         | 0.5          |

Wobble amplitude 8–14px and wobble frequency 1–2 cycles per rise are part of
each config entry (kept next to the table values in code).

## Motion & Lifecycle

- **Single clock:** one `useFrameCallback` accumulates `elapsed` (ms) from
  `timeSincePreviousFrame` deltas into a shared value — survives re-renders and
  callback re-registrations, so neither waves nor bubbles restart mid-scroll
  (same rationale as the base's phase accumulator).
- **Waves** derive their phase inside the worklet as
  `(elapsed / LOOP_DURATION) * 2 * Math.PI` (`LOOP_DURATION = 7000`) — behavior
  identical to the base.
- **Bubbles** derive per-bubble progress in the worklet:
  `p = (elapsed / duration + offset) % 1`
  - `cy`: linear rise from `height + r` (below the screen bottom) to
    `endCy = (FRONT.baseY + FRONT.amplitude) + r` = just under the front wave
    surface ("near the surface").
  - `cx = x + wobble * sin(2π · freq · p)` — gentle horizontal sway.
  - `opacity`: fade-in over the first 10% of `p`, fade-out over the last 25%
    (fades as it nears the surface), clamped to 0–1.
  - Infinite loop; staggered offsets mean the bubbles never reset in unison.
- **Reduce Motion:** `useFrameCallback` `autostart` gated by
  `useReducedMotion()` (as in the base) — a static frame renders with bubbles
  frozen at their staggered offsets.
- `React.memo` wrapper retained; unmount cleanup stays with
  `useFrameCallback`'s internal effect.

## Deliberate Simplifications

- `mix-blend-mode: lighten` from the provided SVG is dropped —
  `react-native-svg` does not support blend modes; the semi-transparent
  gradient stops give a similar glassy result.
- The three stacked gradient layers of the reference bubble are collapsed into
  one shared radial gradient (visually equivalent at 7–17px radii).
- Colors are fixed constants (wave blues + bubble greens from the reference
  SVG), not theme tokens; the component does not react to dark mode.

## Testing

- `WaterWaveBubblesBackground.test.tsx` colocated, copying the inline
  reanimated mock from `WaterWaveBackground.test.tsx`. Cases:
  1. Renders 2 wave paths + 5 circles with `fill: 'url(#bubbleGrad)'`,
     autostart true.
  2. Reduce Motion → static render, autostart false.
  3. `React.memo` keeps the frame callback mounted across parent re-renders.
  4. `elapsed` accumulates from frame deltas (drives `mockFrameCb`).
- `OnboardingScreen.test.tsx` mocks `react-native-reanimated` inline (not the
  component module), so the real component renders under that mock — verify its
  mock covers the new component's hook set (identical to the base's) while
  implementing.

## Quality Gates

`npx tsc --noEmit`, `npm test`, `npm run lint` before commit.

## Non-Goals

- No bubble "pop" (scale-up burst) at the surface — bubbles fade instead.
- No size growth during rise (real bubbles expand as pressure drops; not
  requested).
- No interactive touch response, no dark-mode-aware colors.
