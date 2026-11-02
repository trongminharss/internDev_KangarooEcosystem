# CLAUDE.md Project Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a self-contained, rules-first `CLAUDE.md` at the repo root so AI assistants follow RNCore's established conventions automatically.

**Architecture:** Documentation-only change — one new file (`CLAUDE.md`), no code modifications. Content is synthesized from the approved spec `docs/superpowers/specs/2026-09-07-claude-md-project-rules-design.md`, which was researched from the actual codebase (2026-09-07, post-cleanup state).

**Tech Stack:** Markdown only. No dependencies, no build step.

## Global Constraints

- Language: **English**, rules-first — each rule is a one-line imperative (`Do X` / `Never Y`).
- Length: **150–250 lines** (hard bounds, verified with `wc -l`).
- Rules must reflect the **current code state** (post-cleanup 2026-09-07: `FBottomSheet`/`FTooltip` renamed, `user:` alias removed, FTheme shim deleted, `react-query` removed).
- All 14 sections from spec §3.1–§3.14 must be present.
- **No code changes anywhere.** `npx tsc --noEmit` and `npm test` must pass unchanged when done.
- Commit format: `type(scope): lowercase imperative summary`. Single branch `dev`.
- Working directory for all commands: repo root (`/Volumes/DEV/RN/RNCore`).

---

### Task 1: Create CLAUDE.md

**Files:**

- Create: `/Volumes/DEV/RN/RNCore/CLAUDE.md`

**Interfaces:**

- Consumes: nothing (first task).
- Produces: `CLAUDE.md` at repo root — Claude Code auto-loads it every session. Nothing else imports or references it.

- [ ] **Step 1: Create the file with exactly this content**

Create `/Volumes/DEV/RN/RNCore/CLAUDE.md` containing verbatim:

```markdown
# CLAUDE.md

Rules for AI assistants working on this repository. Follow them unless the user explicitly overrides.

## Project Overview

React Native 0.87 + TypeScript app built with Clean Architecture + Vertical Feature Slicing.
Stack: Redux Toolkit, Axios, React Navigation 7, react-native-paper 5, i18next, Firebase (messaging + notifee).
This is a demo/template project — the mock-login fallback in `AuthRepositoryImpl` is intentional. Do not "fix" it.

## Commands & Environment

- Package manager is **npm** (never yarn). Installs require `.npmrc` (`legacy-peer-deps=true`).
- `postinstall` runs `patch-package`; never remove it or `patches/react-native-touch-id+4.4.1.patch` — the Android build fails without it.
- iOS pods are Bundler-managed: `cd ios && bundle exec pod install` after native dependency changes (Gemfile pins cocoapods ~1.13 / activesupport < 7.1).
- **There are no `.env` files.** All runtime config is `src/core/config/env.ts`; edit it to switch environments.
- Quality gates (run before committing): `npx tsc --noEmit`, `npm test`, `npm run lint`.
- Path alias `@/*` → `src/*` is set in `tsconfig.json` AND `babel.config.js` — update both together.
- Node >= 20.

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

| Artifact             | Convention                                  | Example                 |
| -------------------- | ------------------------------------------- | ----------------------- |
| Entity               | PascalCase singular                         | `User.ts`               |
| Repository interface | `I` + PascalCase + `Repository`             | `IAuthRepository.ts`    |
| Repository impl      | PascalCase + `RepositoryImpl`               | `AuthRepositoryImpl.ts` |
| Use case             | Verb + PascalCase + `UseCase`, one per file | `LoginUseCase.ts`       |
| DTO                  | PascalCase + `DTO`                          | `AuthDTO.ts`            |
| Redux slice          | camelCase + `Slice`                         | `authSlice.ts`          |
| Thunk                | camelCase verb + noun                       | `loginUser`             |
| Screen / component   | PascalCase                                  | `LoginScreen.tsx`       |
| Hook                 | `use` + PascalCase                          | `useAuth.ts`            |
| Test                 | source name + `.test.ts(x)`, colocated      | `authSlice.test.ts`     |

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
- Use only color tokens from `ColorsProps` (`primary*`, `secondary*`, status groups, `title/label/body/subtitle/placeHolder`, `white/grey1/grey2/disable/black`, ...).
- Shared components are F-prefixed, imported from `@/shared/components`: FText, FFilledButton, FTextInput, FAppbar, FIcon, FIconButton, FLoading, FSnackbar, FBottomSheet, FDialog, FSwitch, FSlider, FStepIndicator, FExpansionPanel, FProgress, FTooltip.
- Text uses `<FText typo="...">` with a typography token from `FTheme.fonts`.
- Icons are static SVG XML strings in `FFilled` / `FOutlined` (`src/shared/styles/FIconStyles.tsx`) and must contain literal `fill="black"` to be tintable. Do not use icon fonts.
- Navigation font styles (`regular/medium/bold/heavy`) REQUIRE explicit `fontFamily` + `fontWeight` (enforced by types).
- `NavigationContainer` takes `theme={theme}`; the Paper theme rebuilds via `buildPaperTheme`.
- Snackbars go through `useFSnackbar()` (the provider is mounted in AppProviders).

## i18n

- i18next + react-i18next with `lng: 'vi'`, `fallbackLng: 'en'`, no language detector.
- Initialized by the side-effect import `import '@/core/i18n'` (already in `src/app/App.tsx`) — it must run before any `useTranslation`.
- Translate with `const {t} = useTranslation()` and dotted keys: `t('login.title')`, `t('common.error')`. Locale files: `src/core/i18n/locales/{en,vi}.json`.
- Hardcoded Vietnamese strings are accepted current practice outside new flows (YAGNI decision) — add keys only for genuinely new flows.

## Testing

- Feature tests are colocated `*.test.ts(x)` next to the source; app-level tests live in `__tests__/`.
- There is NO jest setup file — every mock is declared inline with `jest.mock()` per test.
- Tests touching the App tree must mock notifee, firebase messaging, AsyncStorage, touch-id, gesture-handler, paper, safe-area — copy the mock block from `__tests__/App.test.tsx`.
- `ThemeProvider` renders `null` until AsyncStorage hydration resolves — await `renderer.act()`.
- Mock repositories for use-case tests: hand-built `jest.Mocked<I<X>Repository>` objects.
- Adding an ESM-only RN lib requires extending `transformIgnorePatterns` in `jest.config.js`.
- New use case / DTO mapper / slice ⇒ unit test required. Baseline: tsc clean, all tests pass.

## Git Conventions

- Commit format: `type(scope): lowercase imperative summary` — types: feat, fix, refactor, test, docs, chore.
- Small, single-purpose commits.
- Single branch: `dev` (no main/master, no PR flow).

## Critical Gotchas

- Never delete the touch-id patch or the `postinstall` script — the Android build fails.
- `ThemeProvider` renders `null` before hydration completes.
- Use `Storage` from `@/core/utils/storage` (it JSON-wraps every value; keys come from `src/core/constants/storageKeys.ts`). Never call AsyncStorage directly.
- Dates use `moment` via `FDate` (`src/core/utils/date.ts`) — not native Date or dayjs.
- Forms use the Formik render-prop API + hand-written validation (`FValidatePhone` / `FValidateEmail` from `@/core/utils/validation`); no yup.
- Keyboards: wrap forms in `KeyboardAwareScrollView` with `keyboardShouldPersistTaps="handled"`; `Keyboard.dismiss()` before async submit.
- Prettier config: `arrowParens: 'avoid'`, `bracketSpacing: false`, `bracketSameLine: true`, `singleQuote: true`, `trailingComma: 'all'` — match it.
- Firebase builds require `ios/ReactCore/GoogleService-Info.plist` and `android/app/google-services.json`. FCM auto-init is off; registration is manual in `src/core/utils/firebase/fcmHelper.ts`.
- `fontFamily: 'Inter'` is referenced but no font file is bundled — known state; do not add font files on your own.
- LoginScreen branches on exact Vietnamese error substrings — preserve those message contracts when touching login.
- Provider order is meaningful (GestureHandler → Redux → Theme → Menu → Paper → Snackbar) — do not reorder.
- `react-native-vector-icons` fonts are linked on Android but unused in JS.

## Keeping This File Current

When changing any convention, update both `README.md` and this file in the same commit.
```

- [ ] **Step 2: Verify length is within 150–250 lines**

Run: `wc -l < CLAUDE.md`
Expected: a number between 150 and 250. If out of bounds, tighten wording (remove lines) or expand gotchas — do not change rules' meaning.

- [ ] **Step 3: Verify all 14 sections are present**

Run: `grep -c '^## ' CLAUDE.md`
Expected: `14`

Run: `grep '^## ' CLAUDE.md`
Expected output (exact set):

```
## Project Overview
## Commands & Environment
## Architecture Rules
## Adding a New Feature
## Adding a New Screen
## State Management
## DI Container
## API Layer
## Theme & UI
## i18n
## Testing
## Git Conventions
## Critical Gotchas
## Keeping This File Current
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project rules for AI assistants"
```

---

### Task 2: Validate accuracy and confirm nothing broke

**Files:**

- Modify (only if a check fails): `/Volumes/DEV/RN/RNCore/CLAUDE.md`

**Interfaces:**

- Consumes: `CLAUDE.md` from Task 1.
- Produces: validated `CLAUDE.md` — end state of the project.

- [ ] **Step 1: Verify every file path referenced in CLAUDE.md exists**

Run:

```bash
ls src/core/config/env.ts src/core/di/container.ts src/core/api/axiosClient.ts src/core/api/endpoints.ts src/app/navigation/types.ts src/app/store/rootReducer.ts src/app/store/index.ts src/shared/components/FBottomSheet.tsx src/shared/components/FTooltip.tsx src/shared/hooks/useSnackbar.tsx src/shared/styles/FIconStyles.tsx src/core/i18n/locales/en.json src/core/i18n/locales/vi.json src/core/utils/storage.ts src/core/utils/date.ts src/core/utils/validation.ts src/core/utils/firebase/fcmHelper.ts src/core/constants/storageKeys.ts patches/react-native-touch-id+4.4.1.patch __tests__/App.test.tsx
```

Expected: every path listed, no `No such file or directory`. If any path fails, the rule referencing it is stale — check the real path and fix the line in `CLAUDE.md`.

- [ ] **Step 2: Verify post-cleanup claims still hold**

Run: `grep -c react-query package.json`
Expected: `0` (rule "React Query is banned" relies on it being gone).

Run: `grep -n 'combineReducers' -A 3 src/app/store/rootReducer.ts`
Expected: only `auth: authReducer` — no `user:` alias.

Run: `ls src/shared/styles/FTheme.ts src/app/store/middleware.ts 2>&1`
Expected: both missing (`No such file or directory` x2) — CLAUDE.md must not reference them.

- [ ] **Step 3: Check consistency with README (no contradictions)**

Read `README.md` sections 3–9 and compare against CLAUDE.md:

- Layer dependency table — semantically identical.
- Naming conventions — identical.
- Feature-creation process — same steps/order.
- Axios/interceptor description — same behavior (Bearer token, 401/403 logout callback, `ApiError`).
  Expected: no contradictions. README explains more (Vietnamese tutorial) — that is fine; only wrong/stale claims in CLAUDE.md need fixing.

- [ ] **Step 4: Confirm the codebase is untouched**

Run: `npx tsc --noEmit`
Expected: exits 0, no output.

Run: `npm test 2>&1 | tail -5`
Expected: `Test Suites: N passed, N total` and `Tests: M passed, M total` with 0 failures (record N/M — the new baseline).

- [ ] **Step 5: Commit fixes if — and only if — Step 1–3 required edits**

If any CLAUDE.md line was corrected:

```bash
git add CLAUDE.md
git commit -m "docs: correct stale references in CLAUDE.md"
```

If nothing changed, skip — Task 1's commit is the final state.
