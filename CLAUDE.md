# AGENTS.md

Rules for AI assistants working on this repository. Follow them unless the user explicitly overrides.

## Project Overview

React Native 0.87 + TypeScript app built with Clean Architecture + Vertical Feature Slicing.
Stack: Redux Toolkit, Axios, React Navigation 7, react-native-paper 5, i18next, Reanimated 4, Firebase (messaging + notifee).
This is a demo/template project — the mock-login fallback in `AuthRepositoryImpl` is intentional. Do not "fix" it.

## Commands & Environment

- Package manager is **npm** (never yarn). Installs require `.npmrc` (`legacy-peer-deps=true`).
- `postinstall` runs `patch-package`; never remove the script or `patches/react-native-modal+14.0.0-rc.1.patch`.
- iOS pods are Bundler-managed: `cd ios && bundle exec pod install` after native dependency changes (Gemfile pins cocoapods ~1.13 / activesupport < 7.1).
- **There are no `.env` files.** All runtime config is `src/core/config/env.ts`; edit it to switch environments.
- Quality gates (run before committing): `npx tsc --noEmit`, `npm test`, `npm run lint`.
- Path alias `@/*` → `src/*` is set in `tsconfig.json` AND `babel.config.js` — update both together.
- Node >= 20.
- `metro.config.js` is a bare `mergeConfig(getDefaultConfig(__dirname), {})` — put custom resolvers/transformers there, never in `babel.config.js`.
- Pinned majors that matter: `react-native 0.87.1`, `react 19.2.3`, `typescript ^6.0.3`, `eslint ^8.19.0`, `prettier 2.8.8` — do not bump them casually.

## Architecture Rules

Each feature lives in `src/features/<feature>/` with three layers:

| Layer           | May import                                | Must NOT import                                                    |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `domain/`       | pure TS, other domain files               | `data/*`, `presentation/*`, axios, react-native, redux             |
| `data/`         | `domain/`, axiosClient, AsyncStorage      | `presentation/*`, redux, RN UI components                          |
| `presentation/` | `domain/`, `core/di`, redux, react-native | `data/*` directly (go through the domain interface + DI container) |

- `*RemoteDataSource` is the ONLY file allowed to import `@/core/api/axiosClient`.
- `src/core/` is shared infrastructure (api, di, config, theme, i18n, utils, constants); `src/shared/` is shared UI (F-components, hooks, style tokens); `src/app/` is the app shell (providers, navigation, store).

Naming:

| Artifact             | Convention                                  | Example                       |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Entity               | PascalCase singular                         | `User.ts`                     |
| Repository interface | `I` + PascalCase + `Repository`             | `IAuthRepository.ts`          |
| Repository impl      | PascalCase +`RepositoryImpl`                | `AuthRepositoryImpl.ts`       |
| Use case             | Verb + PascalCase +`UseCase`, one per file  | `LoginUseCase.ts`             |
| DTO                  | PascalCase +`DTO`                           | `AuthDTO.ts`                  |
| Redux slice          | camelCase +`Slice`                          | `authSlice.ts`                |
| Thunk                | camelCase verb + noun                       | `loginUser`                   |
| Screen / component   | PascalCase                                  | `LoginScreen.tsx`             |
| Hook                 | `use` + PascalCase                          | `useAuth.ts`                  |
| Test                 | source name +`.test.ts(x)`, in `__tests__/` | `__tests__/authSlice.test.ts` |

- Feature `index.ts` barrels export domain + presentation only — never the data layer (it is wired via the DI container).
- Always import via the `@/` alias; only asset `require()` calls use relative paths.

## Adding a New Feature

1. Create `src/features/<name>/{domain/{entities,repositories,usecases}, data/{datasources,models,repositories}, presentation/{redux,screens,hooks}, index.ts}`.
2. Domain: entities → repository interface → use cases (pure TS).
3. Data: DTO + mapper → `RemoteDataSource` → `RepositoryImpl`.
4. Register everything in `src/core/di/container.ts`.
5. Presentation: thunks → slice → selectors → hook; add the reducer to `src/app/store/rootReducer.ts`.
6. Screen + route registration; public exports via the feature `index.ts`.

Presentation-only features (like `home`, `account`) skip domain/data — YAGNI.

## Adding a New Screen

1. Add the screen name to `RootStackParamList` / `BottomTabParamList` in `src/app/navigation/types.ts`.
2. Register `<Stack.Screen>` in `RootNavigator.tsx` (or `<Tab.Screen>` in `BottomNavigator.tsx`); convention: `headerShown: false`, `animation: 'fade'`.
3. Navigate with `useAppNavigation()`.

## State Management

- ALL async state goes through Redux Toolkit thunks: `*Slice.ts` (createSlice + sync reducers + extraReducers), `*Thunks.ts` (createAsyncThunk calling use cases via `container`, `rejectValue: string`), `*Selectors.ts` (createSelector for memoization), `use<X>` hook wrapping dispatch + selectors.
- **React Query is banned** — the dependency was removed (2026-09-07); do not reintroduce it.
- **Theme state is NOT in Redux** — it lives in React Context (`ThemeProvider` + `useTheme`).
- Presentation hooks may call `container` directly (not everything needs a thunk).
- The store sets `serializableCheck: false`; use the typed hooks `useAppDispatch` / `useAppSelector` from `@/app/store`.
- 401/403 responses trigger `clearUser` via the callback registered in `src/app/store/index.ts`.
- Import `useAppDispatch` / `useAppSelector` from `@/app/store` — plain `useDispatch` / `useSelector` from `react-redux` lose the typing.
- `setOnUnauthorizedCallback` is wired exactly once, in `src/app/store/index.ts`; do not register a second handler.

## DI Container

`src/core/di/container.ts` is a plain module-level singleton map, eagerly instantiated at import time. To add a feature: instantiate datasources → `XxxRepositoryImpl` → add `xxxUseCase` keys to the `container` object.

## API Layer

- Only RemoteDataSources import `axiosClient` (baseURL/timeout come from `env.ts`).
- Add endpoints to `src/core/api/endpoints.ts` (`ENDPOINTS` const; dynamic endpoints as functions).
- Every axios error is normalized to `ApiError` by the response interceptor.
- The auth token lives in a module-level variable managed by `setClientAuthToken` — interceptors never read Redux.

## Theme & UI

- ALWAYS get colors via `useTheme()` from `@/core/theme`. NEVER statically import FTheme for colors in UI code (dark mode depends on this).
- `useTheme()` returns `{theme, isDark, mode, setMode}`; `theme` is a full React Navigation DefaultTheme — destructure `const {colors} = theme`.
- Screen pattern: `createStyles(colors)` factory (`StyleSheet.create`) defined at file bottom, memoized on `colors`.
- Spacing/radius use tokens from `@/shared/styles`: screen/layout spacing → `tokens.space.*`; component-internal padding/gap ≤16 → `spacing` helpers (`p_s`, `px_xs`, `gap_2xs`...) or `tokens.spacing.*`; radius → `tokens.borderRadius.*` (`small=8/medium=16/big=32/full=999`). No raw numbers for padding*/gap/margin*/borderRadius — exempt: `0`, runtime-derived values, geometry-coupled insets (each with a comment). Position props, width/height, borderWidth, icon size are not spacing.
- Only `tokens.spacing` has 12 (component scale); only `tokens.space` has 24/32/40+. To add a token: edit `src/shared/styles/tokens.ts` first, update DESIGN.md in the same commit.
- Use only color tokens from `ColorsProps` (`primary*`, `secondary*`, status groups, `title/label/body/subtitle/placeHolder`, `white/grey1/grey2/disable/black`, ...).
- Shared components are F-prefixed, imported from `@/shared/components`: FText, FFilledButton, FTextInput, FAppbar, FIcon, FIconButton, FLoading, FSnackbar, FBottomSheet, FDialog, FSwitch, FSlider, FStepIndicator, FExpansionPanel, FProgress, FTooltip.
- Text uses `<FText typo="...">` with a typography token from `FTheme.fonts`.
- Icons are static SVG XML strings in `FFilled` / `FOutlined` (`src/shared/styles/FIconStyles.tsx`) and must contain literal `fill="black"` to be tintable. Do not use icon fonts.
- SVG assets (`src/assets/svg/*.svg`) import as React components — metro runs `react-native-svg-transformer` (metro.config.js), jest maps `*.svg` → `__mocks__/svgMock.js` (moduleNameMapper in jest.config.js), and `src/declarations.d.ts` types them. Sample: `import LogoSvg from '@/assets/svg/logo.svg'`.
- Navigation font styles (`regular/medium/bold/heavy`) REQUIRE explicit `fontFamily` + `fontWeight` (enforced by types).
- `NavigationContainer` takes `theme={theme}`; the Paper theme rebuilds via `buildPaperTheme`.
- Snackbars go through `useFSnackbar()` (the provider is mounted in AppProviders).
- Theme modes are `'light' | 'dark' | 'system'` (`ThemeMode` in `src/core/theme/themeUtils.ts`); `system` resolves against `useColorScheme()` via `resolveTheme` / `resolveIsDark`.
- The selected mode persists under `Storage.KEY_THEME_MODE`; `ThemeProvider` stays `null` until that read resolves (`isReady`).

## i18n

- i18next + react-i18next with `lng: 'vi'`, `fallbackLng: 'en'`, no language detector.
- Initialized by the side-effect import `import '@/core/i18n'` (already in `src/app/App.tsx`) — it must run before any `useTranslation`.
- Translate with `const {t} = useTranslation()` and dotted keys: `t('login.title')`, `t('common.error')`. Locale files: `src/core/i18n/locales/{en,vi}.json`.
- Hardcoded Vietnamese strings are accepted current practice outside new flows (YAGNI decision) — add keys only for genuinely new flows.

## Testing

- ALL tests live in the root `__tests__/` folder (not colocated with sources); imports use the `@/` alias.
- `jest.setup.js` only mocks the clipboard module; every other mock is declared inline with `jest.mock()` per test.
- Tests touching the App tree must mock notifee, firebase messaging, AsyncStorage, gesture-handler, paper, safe-area, react-native-webview — copy the mock block from `__tests__/App.test.tsx`.
- `ThemeProvider` renders `null` until AsyncStorage hydration resolves — await `renderer.act()`.
- Mock repositories for use-case tests: hand-built `jest.Mocked<I<X>Repository>` objects.
- Adding an ESM-only RN lib requires extending `transformIgnorePatterns` in `jest.config.js`.
- New use case / DTO mapper / slice ⇒ unit test required. Baseline: tsc clean, all tests pass.
- Components are asserted with `react-test-renderer` 19 (`renderer.create` + `renderer.act`); `@testing-library/react-native` is not installed.
- Jest is 29 with `preset: '@react-native/jest-preset'`; the existing `transformIgnorePatterns` group already whitelists `immer`, `@reduxjs/toolkit`, `react-redux`, `@react-navigation`, `@react-native-async-storage` — extend that same group, do not add a second entry.

## Git Conventions

- Commit format: `type(scope): lowercase imperative summary` — types: feat, fix, refactor, test, docs, chore.
- Small, single-purpose commits.
- Work happens on `dev` (push to `origin/dev`); a stale `main` also exists — do not merge to it or open PRs without being asked.

## Critical Gotchas

- Never delete the `postinstall` script — the remaining patches keep the builds green.
- `ThemeProvider` renders `null` before hydration completes.
- Use `Storage` from `@/core/utils/storage` (it JSON-wraps every value; keys come from `src/core/constants/storageKeys.ts`). Never call AsyncStorage directly.
- Dates use `moment` via `FDate` (`src/core/utils/date.ts`) — not native Date or dayjs.
- Forms use the Formik render-prop API + hand-written validation (`FValidatePhone` / `FValidateEmail` from `@/core/utils/validation`); no yup.
- Keyboards: wrap forms in `KeyboardAwareScrollView` with `keyboardShouldPersistTaps="handled"`; `Keyboard.dismiss()` before async submit.
- Prettier config: `arrowParens: 'avoid'`, `bracketSpacing: false`, `bracketSameLine: true`, `singleQuote: true`, `trailingComma: 'all'` — match it.
- Firebase builds require `ios/ReactCore/GoogleService-Info.plist` and `android/app/google-services.json`. FCM auto-init is off; registration is manual in `src/core/utils/firebase/fcmHelper.ts`.
- Fonts are bundled: Clan Pro (`ClanPro-Book` / `ClanPro-Medium` / `ClanPro-Bold`). Source of truth `src/assets/fonts/`, linked manually into `android/app/src/main/assets/fonts/` + `ios/ReactCore` resources + `UIAppFonts` in Info.plist. Weight map: 400→Book, 500→Medium, 700→Bold. Italic variants exist but are not bundled. All 47 font tokens in `FTheme.ts` set `fontFamily` explicitly (a token without it renders the system font). Canonical tokens are the 18 styleguide keys in `TypographyStyles` (`headline0-8`, `bodyLabel01-04`, `body01-05`) — use those in new code; the 25 legacy names (`largeTitle`, `title1-6`, `bodyText1-2`, `buttonText1-5`, `subtitle1-4`, `label1-5`, `placeholder1-2`) are deprecated aliases kept until call sites migrate (edit-as-you-touch). `buildPaperTheme` maps all MD3 fonts to the same families (titles→Bold, labels→Medium, body→Book).
- LoginScreen branches on exact Vietnamese error substrings — preserve those message contracts when touching login.
- Provider order is meaningful (GestureHandler → BottomSheetModalProvider → Redux → Theme → Menu → Paper → Snackbar) — do not reorder.
- `Storage` JSON-round-trips values (`getItem` runs `JSON.parse`), so never pre-`JSON.stringify` before `setItem` — that double-encodes.
- `Storage` spreads `STORAGE_KEYS`, so keys are reachable as `Storage.KEY_THEME_MODE`; `STORAGE_KEYS` stays the source of truth.
- `FValidatePhone` matches exactly VN prefixes 03/05/07/08/09 plus 8 digits; `FValidateEmail` is a pragmatic regex, not RFC-strict.
- `FDate` exposes only `yMd` and `dMy`, strict-parses ISO-8601 and otherwise assumes `DD/MM/YYYY` — add new formatters in `src/core/utils/date.ts` rather than calling `moment` in screens.
- `axiosClient` logs full requests/responses via `console.info` behind `__DEV__` — keep any new debug logging behind the same flag.
- Existing features are `auth`, `home`, `account`, `splash`, `onboarding`, `automation`, `service`, `store`, `device`; `splash` is the smallest reference for feature layout, `auth` for the full three-layer flow.
- `device` covers two flows: the add-device flow (`AddDevice` → BLE scan (C1) or manual `DeviceReset` (C2) → `WifiSetup` → `DeviceSearch` (C2 only) → `DeviceConnect`) on a simulated `DeviceBleDataSource` — no BLE/Wi-Fi native module is installed yet; swap that one file (keep its method shapes) when one is. Android permissions use the built-in `PermissionsAndroid` (`useDevicePermissions`); iOS prompts natively on first use. Only the Wi-Fi SSID is remembered (`KEY_SAVED_WIFI_SSID`), never the password — and the water-purifier detail flow (`PurifierDetail` → filter replace / warranty / water mode / feedback) is presentation-only with a WebView 3D model, mock data in `purifierMock.ts`, sync UI state shared across its screens in `purifierSlice`.
- `SimpleAddDevice` is a reference-style variant (switch-to-scan list + model catalog → `guide` (manual only) → Wi-Fi → pair/result) in `presentation/components/simple/`; on the manual path the pair stage scans for the chosen model and provisions the first match (`FIND_TIMEOUT_MS`).
- The connect/result step of both flows (`DeviceConnect`, `SimplePairStage`) renders the shared `components/LinkPipeline` (phone → device → Wi-Fi with streaming dots, then `LinkMedal`) plus the SSID `Eyebrow` — no spinners or rotating loaders anywhere in the device flows.
- Home auto-prompts `NearbyDeviceSheet` (AirTag-style card with the animated `WaterPurifier3D` SVG) via `useNearbyDevicePrompt`: only while Home is focused, only when `hasAllDevicePermissions()` (check-only, never prompts) is true, once per app session; "Kết nối" dismisses the sheet and navigates to `WifiSetup` from its `onClose` (fires after the dismiss animation). Never use `rotateY` + `perspective` inside a modal on iOS — it stops half the sheet from drawing; fake yaw with `scaleX` + `skewY`.
- `FBottomSheet` wraps `@gorhom/bottom-sheet`'s `BottomSheetModal` (ref API: `present()` / `dismiss()`, `onClose` fires after the dismiss animation). With dynamic sizing on (the default) it wraps children in `BottomSheetView` itself — gorhom cannot measure a plain `View`, so the sheet would never open. `patches/@gorhom+bottom-sheet+5.2.14.patch` makes `dismiss()` a no-op before the first `present()`; without it an early `dismiss()` (e.g. a `visible=false` effect on mount) sticks the modal at DISMISSING and every later `present()` is ignored. Re-check the patch when bumping gorhom.
- Generic timers live in `@/shared/hooks/useCountdown` (`{seconds, isDone, restart}`) — reuse it instead of writing a new interval hook.

## Tooling (Agent Guardrails)

- After cloning, run `git config core.hooksPath .githooks` once — enables the pre-commit hook (check:arch → tsc → test → lint). Never bypass with `--no-verify`.
- `npm run check:arch` — mechanical boundary check (rules B1–B4, `scripts/check-boundaries.js`); CI runs it too.
- `.opencode/skill/add-feature/` — scaffold workflow for new features; follow it when asked to add a feature.
- `.opencode/agent/architecture-reviewer.md` — review-only subagent; run after feature work, it reports violations and never edits.
- Specs live in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`.

## Keeping This File Current

When changing any convention, update both `README.md` and this file in the same commit.

- `AGENTS.md` is a symlink to this file — never replace it with a copy or edit it directly; the symlink keeps every standards-following agent in sync.
