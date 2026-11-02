# Onboarding Dots Animation + Back Removal — Design Addendum

Date: 2026-09-15
Status: Approved
Parent spec: `2026-09-15-onboarding-intro-design.md`

## Changes

1. **Dots animation (continuous, scroll-driven).** Each dot is an
   `Animated.View` whose `width` (8↔20) and `backgroundColor`
   (`colors.grey2`↔`colors.primary`) interpolate continuously from the
   ScrollView's `contentOffset.x` (`Animated.event`, `useNativeDriver: false`
   — width is a layout property). Input range per dot `i`:
   `[(i-1)·width, i·width, (i+1)·width]`, output `[8, 20, 8]` /
   `[grey2, primary, grey2]`, `extrapolate: 'clamp'`. Button navigation
   (`scrollTo({animated: true})`) drives the same value — no extra logic.
   `index` state is unchanged (still drives the last-slide Next = finish).
   Uses RN built-in `Animated`; no new dependency. Replaces the discrete
   `dotActive` static style.
2. **Back button removed** (user decision; the working tree had an uncommitted
   edit removing it — kept). Footer is now Skip (left) — dots (center) — Next
   (right). `onboarding.back` i18n key removed from both locales.

## Testing

Dot style is now an interpolation node, so static width assertions are gone.
Tests assert observable behavior: 3 slides render, 3 dots render with an
interpolated width style, last-slide Next and Skip persist the flag and
replace to Login. The animation curve itself is not unit-tested (visual).

## Verification

`npx tsc --noEmit`, `npx jest src/features/onboarding`, `npx eslint` on the
feature — all clean before commit. Manual smoke: swipe slowly between slides
and confirm dots grow/fade smoothly (recommended on Android).
