# FBottomSheet Rebuild on @gorhom/bottom-sheet — Design

Date: 2026-09-24
Status: Approved

## Problem

`src/shared/components/FBottomSheet.tsx` is a hand-rolled bottom sheet (~210 lines of
custom reanimated shared values, pan gesture, backdrop, and Android back handling).
It must be rebuilt on the standard `@gorhom/bottom-sheet` package to get
maintained gesture/animation/keyboard behavior instead of bespoke code.

## Research Findings

- Target package: `@gorhom/bottom-sheet@^5.2.14` (latest stable, 2026-05).
- Peer deps satisfied by the repo already: `react-native-reanimated >=3.16 || >=4.0-`
  (we have 4.6.0), `react-native-gesture-handler >=2.16.1` (we have 3.2.1).
  No new transitive dependencies; the package is pure JS — no `pod install`, no patch.
- The package ships an official Jest mock at `@gorhom/bottom-sheet/mock`.
- `BottomSheetModal` renders in a portal above navigation and requires a
  `BottomSheetModalProvider` ancestor.
- The package has NO Android hardware-back handling (verified in v5.2.14 source:
  no `BackHandler` usage). The current component's back-to-close behavior must be
  re-implemented in the wrapper.
- `enablePanDownToClose` defaults to `false` in v5; the current UX closes on
  swipe-down, so the wrapper must enable it.
- The built-in `BottomSheetBackdrop` hardcodes black; it accepts a `style` override,
  which we use to preserve the themed `colors.title` backdrop color.
- gorhom sizes sheets to content (`enableDynamicSizing`, default true) or to
  `snapPoints`. The terms sheet in PhoneLoginScreen is currently `height: '88%'`
  and therefore needs `snapPoints={['88%']}`.

## Decisions (from brainstorming)

1. **Imperative API** — no `isVisible`/`closeModal` props. Call sites use
   `ref.current?.present()` / `.dismiss()`. `FAppbar` and `PhoneLoginScreen` are
   migrated.
2. **`isLoading` dropped** — no production call site uses it; the spinkit/avatar
   overlay, interaction lock, and their tests are deleted. Add back if a loading
   sheet is ever needed.
3. **`BottomSheetModal` base** — portal rendering above navigation; provider
   mounted once in `AppProviders`.
4. **Thin imperative wrapper kept** — a shared skin centralizes theme defaults,
   backdrop, and Android back handling instead of duplicating them at 2 call sites
   (would be ~30 duplicated lines each and drifts from the F-component convention).

## Architecture

### Install & provider

- `npm install @gorhom/bottom-sheet` (`.npmrc` already sets `legacy-peer-deps`).
- `BottomSheetModalProvider` mounted in `src/app/providers/AppProviders.tsx`,
  directly inside `GestureHandlerRootView`. Existing provider order unchanged:
  GestureHandler → Redux → Theme → Menu → Paper → Snackbar.

### `src/shared/components/FBottomSheet.tsx` (rewrite, ~70 lines)

```tsx
export type FBottomSheetRef = BottomSheetModal;

interface FBottomSheetProps extends BottomSheetModalProps {
  onClose?: () => void;
}

const FBottomSheet = forwardRef<FBottomSheetRef, FBottomSheetProps>(...);
export default FBottomSheet;
```

- `ref` is the raw `BottomSheetModal` instance — call sites get the full gorhom
  imperative surface (`present`, `dismiss`, `snapToIndex`, ...).
- Props extend `BottomSheetModalProps` so any gorhom prop remains reachable;
  wrapper defaults are plain prop defaults and can be overridden by callers:
  - `enablePanDownToClose` (default true here; gorhom default is false)
  - `enableDynamicSizing` (gorhom default true — content-sized sheets)
  - `backdropComponent`: built-in `BottomSheetBackdrop` with
    `opacity={0.8}`, `appearsOnIndex={0}`, `disappearsOnIndex={-1}`,
    `pressBehavior="close"`, `style={{backgroundColor: colors.title}}`
    (preserves current backdrop color/opacity and tap-to-close)
  - `backgroundStyle`: `{backgroundColor: colors.white}`
  - `borderRadius`: `tokens.borderRadius.big` (32, matches current top corners)
  - `handleIndicatorStyle`: width 40, height 4, `colors.bgDarkBase`,
    `borderRadius: tokens.borderRadius.full` (current grab dot)
- **Android back**: internal `isOpen` state, driven by `onChange` (index >= 0)
  and reset by `onDismiss`. While open, a `BackHandler` listener calls
  `ref.current?.dismiss()` and returns `true`. No listener while closed, so
  normal back navigation is unaffected.
- `onDismiss` also invokes the caller's `onClose` callback (state sync escape hatch).

### Call-site migrations

`src/shared/components/FAppbar.tsx` (language sheet):

- Delete `isSheetVisible` state; add `languageSheetRef = useRef<FBottomSheetRef>(null)`.
- Flag press → `languageSheetRef.current?.present()`.
- Language row → `setLanguage(code)` + `languageSheetRef.current?.dismiss()`.
- Content styles unchanged (bottom-inset padding stays in the call site).
  - Review amendment: the language sheet is content-sized in this spec, but on
    device (iOS, reanimated 4) the `enableDynamicSizing` detent calculation
    never completed — the sheet presented invisibly. It is pinned to
    `snapPoints={['40%']}` with `enableDynamicSizing={false}` (same pattern as
    the terms sheet).

`src/features/auth/presentation/screens/PhoneLoginScreen.tsx` (terms sheet):

- Delete `sheetVisible` state; add `termsSheetRef = useRef<FBottomSheetRef>(null)`.
- Tapping the terms checkbox while unchecked → `termsSheetRef.current?.present()`.
- Agree button → `toggleAgreedTerms(true)` + `termsSheetRef.current?.dismiss()`.
- `style={{height: '88%'}}` → `snapPoints={['88%']}` (existing `flex: 1`
  ScrollView fills the sheet).
  - Review amendment: also pinned `enableDynamicSizing={false}` at this call
    site — with dynamic sizing on (the wrapper default), gorhom measures
    content and pushes a content-derived detent into the provided snap list
    (the sheet could rest partway instead of only at 88%), and `snapPoints`
    are effectively ignored until measurement resolves.

## Error Handling

- Backdrop tap, swipe-down, and Android back all route through gorhom's
  `dismiss()`; wrapper ensures exactly one `BackHandler` listener per open sheet.
- When the app navigates with a sheet open, modal unmount cleanup removes the
  back listener (effect cleanup keyed on `isOpen`).

## Testing

Rewrite `__tests__/FBottomSheet.test.tsx` around the official mock:
`jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'))`,
declared inline (repo rule: mocks live in the test file, `jest.setup.js` only
mocks clipboard). Cases:

1. Renders children through the wrapper.
2. Ref exposes `present`/`dismiss` (official mock class).
3. `BackHandler` not registered while closed; while open, back press calls
   `dismiss` and returns `true`.
4. `onDismiss` fires the `onClose` callback.

Deleted with the old implementation: swipe-threshold, backdrop-press,
loading-lock, and unmount-after-close tests (gesture/backdrop behavior is now
owned by gorhom; `isLoading` no longer exists).

If jest trips on package ESM bits, extend the existing `transformIgnorePatterns`
group in `jest.config.js` — no second entry.

## Verification

- `npx tsc --noEmit`
- `npm test`
- `npm run lint`
- `npm run check:arch`
- Manual smoke test (user, on device/simulator): open/close both sheets via
  flag button and terms checkbox; swipe-down, backdrop tap, Android back each
  close; no back-swallowing while sheets are closed.

## Out of Scope

- Keyboard interaction inside sheets (neither sheet has inputs).
- `isLoading` branded loading overlay.
- Migration of `react-native-modal` (used elsewhere, patched — untouched).
