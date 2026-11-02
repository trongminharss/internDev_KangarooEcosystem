# Design: Animated WaterWaveBackground in the Connected Device Panel

Date: 2026-09-21
Status: approved (design dialogue 2026-09-21)

## Problem

The home screen's connected device card (`ConnectedDevicePanel`) renders two
static SVG backgrounds — a vertical gradient for light mode and a hand-drawn
static wave SVG for dark mode. The user wants the animated
`WaterWaveBackground` component inside this card, with the wave color driven
by the device's operating status.

## Decisions (from design dialogue)

1. **Target card:** `ConnectedDevicePanel` (the large "water quality" card
   under `DeviceSection`), not the small `DeviceCard` grid items.
2. **Status source:** new required field `status: WaveStatus` on
   `ConnectedDeviceData` (mock layer for now). The wave renders whenever the
   panel renders (connected state); its color follows the status — reusing the
   three palettes added to `WaterWaveBackground` (normal `#38C4FF`,
   warning `#F16623`, error `#ED1C24`).
3. **Existing backgrounds:** both static SVG blocks are removed entirely and
   replaced by `WaterWaveBackground` for light and dark mode — one code path.
4. **Integration approach (A):** make `WaterWaveBackground` measure its own
   container via `onLayout` instead of hardcoding screen dimensions, so it
   renders correctly at any size (full screen or inside a card) without
   distortion or letterboxing.

## Changes

### 1. `src/shared/components/WaterWaveBackground.tsx`

- Add local state `{width, height}` initialized from the current
  `Dimensions.get('window')` values (existing behavior as fallback for the
  first paint).
- The root `<Svg>` gets `onLayout`; when the measured layout differs from
  state, update state. The `viewBox`, wave configs (`fillHeight`), and worklet
  path building all read from the measured size.
- The optional `height` prop keeps its meaning as the *initial* height
  estimate before layout resolves; full-screen callers are unaffected because
  measured size == screen size there.
- `WaveStatus` and the component are already exported; add the type export to
  the `@/shared/components` barrel.

### 2. `src/features/home/presentation/mocks/mockHome.ts`

- `ConnectedDeviceData` gains a required `status: WaveStatus` field
  (type imported from `@/shared/components` — presentation → shared is an
  allowed dependency direction).
- `MOCK_CONNECTED.status = 'normal'`. Mock loaders unchanged.

### 3. `src/features/home/presentation/components/ConnectedDevicePanel.tsx`

- Delete both static background branches (light gradient SVG, dark static
  wave SVG, ~90 lines) and the `react-native-svg` imports.
- Inside the existing `styles.card` (already `borderRadius` +
  `overflow: 'hidden'`), render `<WaterWaveBackground status={data.status} />`;
  its internal `absoluteFill` places it behind `cardContent`.
- Keep `isDark` usage for text and stat-pill colors — only the background
  branches go away.
- Contrast holds: light-mode warning/error back tints (`#FDDAC8`, `#FBC5C7`
  fading to white) keep `colors.title` readable; dark-mode fronts are
  saturated against the dark base.
- A status change re-renders the wave with the new palette (configs are
  memoized on the palette object).

## Testing

- `__tests__/WaterWaveBackground.test.tsx`: new case — fire `onLayout` with a
  card-sized layout (e.g. 358x170) and assert the `viewBox` follows the
  measured size instead of the screen size.
- `__tests__/HomeSections.test.tsx`: `ConnectedDevicePanel` cases stop
  referencing the removed gradient SVG ids; assert the wave background is
  present and receives the panel's `status`.
- `__tests__/mockHome.test.ts`: assert `MOCK_CONNECTED.status === 'normal'`.
- Gates: `npx tsc --noEmit`, `npm test`, `npm run check:arch`.

## Out of scope

- Real device-status data (thunks/API) — mocks stay until the data layer lands.
- The small `DeviceCard` grid items and full-screen `WaterWaveBackground`
  callers keep their current behavior.
