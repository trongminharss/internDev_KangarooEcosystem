# Onboarding Water Wave Background — Design

Date: 2026-09-15
Status: Approved

## Goal

Add an animated water-wave background to the onboarding screen, reproducing the
reference SVG: two layered wave surfaces near the top of the screen whose
gradient fades to transparent downward (`#C1EDFF` back layer filling to the
bottom, `#A3E4FF` front layer filling to ~45% height). The waves drift
continuously on their own — no coupling to slide swiping.

## Placement

- New component `WaterWaveBackground` at
  `src/features/onboarding/presentation/components/WaterWaveBackground.tsx`
  (feature-local; promote to `shared/components` as `FWaterWave` only if a
  second consumer appears).
- Mounted in `OnboardingScreen` as an absolutely positioned full-screen layer
  with `pointerEvents="none"`, rendered before (under) the horizontal
  `ScrollView`, so logo/title/subtitle float above the waves. Waves stay at
  the top of the screen with crests around y ≈ 22–30.
- Accepts an optional `height` prop (default: full window height) that scales
  both layers' fill depth (back = `height`, front = `45%` of `height`) and the
  Svg `viewBox`.

## Tech & Rendering

- `react-native-svg` (already installed) draws the shapes: 2 `<Path>` inside an
  `<Svg>` with 2 static `<LinearGradient>` defs (vertical, opaque at the crest →
  alpha 0 at the fill bottom).
- `react-native-reanimated` (new dependency) drives motion on the UI thread:
  `Animated.createAnimatedComponent(Path)` + `useAnimatedProps` returns a
  rebuilt `d` string each frame.
- Reanimated needs the babel plugin and a dev build: add the plugin to
  `babel.config.js`, install pods (`bundle exec pod install`) and gradle sync.
  The jest transformIgnorePatterns group is extended if Reanimated is ESM-only.

## Wave Shape (from the reference SVG)

Each layer is a sine surface sampled at ~8 points across the screen width and
joined with smooth cubic beziers, then closed down to its fill depth:

| Layer | Gradient (top → bottom)  | Crest base y | Amplitude | Fills to      |
| ----- | ------------------------ | ------------ | --------- | ------------- |
| Back  | `#C1EDFF` 100% → alpha 0 | ~30          | ~16px     | screen bottom |
| Front | `#A3E4FF` 100% → alpha 0 | ~22          | ~14px     | ~45% height   |

The two layers use different phase offsets and amplitudes so the crests ripple
naturally, as in the SVG.

## Motion & Lifecycle

- The component is wrapped in `React.memo`, so parent re-renders (slide
  index changes, theme/context updates in the screen) never re-render the
  background.
- Phase is driven by `useFrameCallback` on the UI thread (`autostart` gated by
  Reduce Motion): every frame adds
  `(timeSincePreviousFrame / LOOP_DURATION) * 2π` to the phase (mod `2π`),
  with `LOOP_DURATION = 7000ms`. The phase lives in the shared value and
  accumulates from per-frame deltas, so it survives re-renders and callback
  re-registrations — the wave can never restart mid-scroll. (History: the
  first design drove `phase` from `withRepeat(withTiming(2π))`, which both
  hitched at every cycle seam and jumped back to phase 0 whenever a parent
  re-render re-registered the callback.)
- The front layer derives its own phase inside the worklet as
  `phase * 2 + offset` (effective period 3.5s), keeping the layers out of
  sync.
- Path strings are built inside worklets — no JS-bridge traffic per frame.
- On unmount, `useFrameCallback`'s internal effect unregisters the callback —
  no manual cleanup needed.
- Reduce Motion: via `useReducedMotion()`; when enabled, the frame callback
  never starts and a single static frame (phase 0) renders.

## Deliberate Simplifications

- The SVG's `feGaussianBlur` (stdDeviation 2) is skipped — `react-native-svg`
  does not support SVG filters and the effect is visually negligible.
- Colors are fixed constants (per the reference SVG), not theme tokens; the
  component does not react to dark mode.

## Testing

- `WaterWaveBackground.test.tsx` colocated with the component
  (react-test-renderer): mocks `react-native-reanimated` (its official mock) and
  `react-native-svg` inline with `jest.mock()` per repo convention (no jest
  setup file); asserts two paths render without crashing.
- `OnboardingScreen.test.tsx` may need its mock block extended for the new
  component (verify while implementing).
- Quality gates before commit: `npx tsc --noEmit`, `npm test`, `npm run lint`.

## Non-Goals

- No reaction to slide swiping (autonomous drift only).
- No Reanimated-driven pagination migration — the screen's existing core
  `Animated` dot/scroll logic stays as is.
- No interactive/disturb-the-water effects.
