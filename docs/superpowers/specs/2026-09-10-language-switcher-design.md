# Language Switcher — Design

Date: 2026-09-10
Status: Approved

## Goal

Add a language switcher (Tiếng Việt / English) to the Account tab. The choice
persists across app restarts. Scope: the switcher only — screens that already
use i18n (LoginScreen) react to the change; hardcoded Vietnamese strings stay
as-is (YAGNI decision, revisit when a screen needs real localization).

## Current State

- i18next initialized in `src/core/i18n/i18n.ts` with hardcoded `lng: 'vi'`,
  `fallbackLng: 'en'`, locales `vi.json` / `en.json`. `changeLanguage` is never
  called; nothing persists a language preference.
- Only `LoginScreen` consumes `useTranslation()`.
- `AccountScreen` already renders a "Giao diện" (theme) section — option rows
  with a checkmark — driven by `useTheme().mode / setMode`, persisted under
  `KEY_THEME_MODE` via `Storage`. The language section mirrors this pattern.

## Rejected Alternatives

- **LanguageProvider mirroring ThemeProvider** (~70 lines): rejected — i18next
  is already a global reactive store; `useTranslation` subscribes to
  `languageChanged` so mounted `t()` consumers re-render automatically. A
  Context wrapping it duplicates state and adds a provider to an
  order-sensitive chain.
- **Migrating all hardcoded strings to i18n**: rejected by scope decision.

## Design

### 1. Types & storage key

- `src/core/i18n/i18n.ts`: export `type LanguageCode = 'vi' | 'en'` and guard
  `isLanguageCode(value: unknown): value is LanguageCode` — mirrors
  `ThemeMode` / `isThemeMode` in `themeUtils.ts`.
- `src/core/constants/storageKeys.ts`: add `KEY_LANGUAGE: 'language'` to
  `STORAGE_KEYS`. `Storage` spreads this const, so the key is reachable as
  `Storage.KEY_LANGUAGE`.

### 2. `useLanguage` hook (new file `src/core/i18n/useLanguage.ts`)

- `LANGUAGES: readonly {code: LanguageCode; label: string}[]` — labels are the
  native names (`Tiếng Việt`, `English`), intentionally not translated
  (standard i18n convention: language names render in their own language).
- `useLanguage()` returns `{language, setLanguage}`:
  - `language`: current `i18n.language` cast to `LanguageCode` (init guarantees
    a valid value; hydration re-validates).
  - `setLanguage(lng)`: `i18next.changeLanguage(lng)` then
    `Storage.setItem(Storage.KEY_LANGUAGE, lng).catch(console.error)` —
    fire-and-forget persist, same as `ThemeProvider.setMode`.

### 3. Hydration (`src/app/App.tsx`)

- One effect in the `App` component (alongside the FCM effect): read
  `Storage.getItem<LanguageCode>(Storage.KEY_LANGUAGE)`; if `isLanguageCode`,
  call `i18next.changeLanguage(stored)`. No render gating — default `vi` is
  the baseline; splash covers the async gap in practice.
- Known trade-off: an `en`-user may see a brief Vietnamese flash on cold start
  before hydration resolves. Accepted; a gated provider was explicitly
  rejected above.

### 4. AccountScreen UI

- New section header "Ngôn ngữ" below the existing "Giao diện" section,
  reusing the existing `row` style: `TouchableOpacity` + `FText` +
  `FFilled.c_check` when selected. Options map from `LANGUAGES`; selection
  compares `language === option.code`.

### 5. Error handling

- Hydration/persist failures only `console.error` with a `[i18n]` prefix; the
  app continues with the default `vi`. Same resilience model as ThemeProvider.

### 6. Testing

- `useLanguage.test.ts` colocated in `src/core/i18n/`:
  - `setLanguage('en')` calls `i18next.changeLanguage('en')` and
    `Storage.setItem('language', 'en')`.
  - Storage failure does not throw (rejection swallowed, logged).
  - Hydration guard: `isLanguageCode` rejects invalid stored values (e.g.
    `'fr'`), so a corrupt entry falls back to the default `vi`. Covered in the
    same test file by unit-testing the guard directly; the App effect itself
    stays inline and untested (mirrors the untested ThemeProvider effect).
- Tests mock `Storage` and `react-i18next` inline (no jest setup file in this
  repo).

## Out of Scope

- ~~Translating hardcoded strings in AccountScreen and other screens.~~
  **Superseded 2026-09-10 (user decision):** all hardcoded UI strings were
  migrated to `vi.json`/`en.json` (`account.*`, `tab.*`, `home.*`,
  `firstLoad.*`). Deliberately untranslated: "React Core" (brand),
  "Tiếng Việt"/"English" native labels, LoginScreen runtime error substrings
  (mock repository contract), FDialog demo defaults.
- Adding locales beyond `vi`/`en` (locale files for others do not exist).
- A language-change splash/restart mechanism (not needed — react-i18next
  re-renders subscribed components live).
