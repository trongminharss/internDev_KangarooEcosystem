# Language Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persisted language switcher (Tiếng Việt / English) to the Account tab.

**Architecture:** No new provider. i18next is already the global reactive store; `react-i18next`'s `useTranslation` subscribes to `languageChanged`, so mounted `t()` consumers re-render live. A thin `useLanguage` hook wraps `changeLanguage` + `Storage` persistence; one hydration effect in `App` applies the stored value at startup. AccountScreen gets a "Ngôn ngữ" section mirroring its existing "Giao diện" section.

**Tech Stack:** i18next + react-i18next (installed), `Storage` util (`@/core/utils/storage`), react-test-renderer for tests.

**Spec:** `docs/superpowers/specs/2026-09-10-language-switcher-design.md`

---

## File Structure

| File                                                          | Action | Responsibility                                      |
| ------------------------------------------------------------- | ------ | --------------------------------------------------- |
| `src/core/constants/storageKeys.ts`                           | Modify | Add `KEY_LANGUAGE`                                  |
| `src/core/i18n/i18n.ts`                                       | Modify | Export `LanguageCode` type + `isLanguageCode` guard |
| `src/core/i18n/useLanguage.ts`                                | Create | `LANGUAGES` list + `useLanguage` hook               |
| `src/core/i18n/useLanguage.test.tsx`                          | Create | Hook + guard unit tests (colocated, per spec)       |
| `src/core/i18n/index.ts`                                      | Modify | Barrel-export the hook                              |
| `src/app/App.tsx`                                             | Modify | Hydration effect (one-shot, fire-and-forget)        |
| `src/features/account/presentation/screens/AccountScreen.tsx` | Modify | "Ngôn ngữ" section                                  |

No new dependencies. No `jest.config.js` change (i18next/react-i18next are CJS, not affected by `transformIgnorePatterns`). No README/AGENTS.md change (no convention change).

---

### Task 1: `LanguageCode` type, guard, and storage key

**Files:**

- Modify: `src/core/constants/storageKeys.ts`
- Modify: `src/core/i18n/i18n.ts`
- Test: `src/core/i18n/useLanguage.test.tsx` (created here; extended in Task 2)

- [ ] **Step 1: Write the failing test**

Create `src/core/i18n/useLanguage.test.tsx` with guard tests only. Keep the import block minimal (hook tests and their imports are added in Task 2):

```tsx
import {isLanguageCode} from '@/core/i18n';

describe('isLanguageCode', () => {
  it('accepts supported codes', () => {
    expect(isLanguageCode('vi')).toBe(true);
    expect(isLanguageCode('en')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isLanguageCode('fr')).toBe(false);
    expect(isLanguageCode(null)).toBe(false);
    expect(isLanguageCode(undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/core/i18n/useLanguage.test.tsx`
Expected: FAIL — `SyntaxError: Unexpected token 'export'` or "isLanguageCode is not a function" / module resolution failure, because neither `useLanguage` nor `isLanguageCode` exists yet.

- [ ] **Step 3: Write minimal implementation**

In `src/core/constants/storageKeys.ts`, add one key to `STORAGE_KEYS`:

```ts
  KEY_THEME_MODE: 'theme_mode',
  KEY_LANGUAGE: 'language',
```

In `src/core/i18n/i18n.ts`, add above `languageResources`:

```ts
export type LanguageCode = 'vi' | 'en';

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === 'vi' || value === 'en';
}
```

(Literal union, not derived from `languageResources` — matches `ThemeMode` style in `src/core/theme/themeUtils.ts`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/core/i18n/useLanguage.test.tsx`
Expected: PASS — 2 guard tests. (TDD purists note: red-green happened across Steps 2→3; the hook half of this file goes red again in Task 2 Step 2 by design.)

- [ ] **Step 5: Commit**

```bash
git add src/core/constants/storageKeys.ts src/core/i18n/i18n.ts src/core/i18n/useLanguage.test.tsx
git commit -m "feat(i18n): add language code type, guard and storage key"
```

---

### Task 2: `useLanguage` hook

**Files:**

- Create: `src/core/i18n/useLanguage.ts`
- Modify: `src/core/i18n/index.ts`
- Test: `src/core/i18n/useLanguage.test.tsx`

- [ ] **Step 1: Write the failing tests**

In `src/core/i18n/useLanguage.test.tsx`, replace the entire import block at the top with:

```tsx
import 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import renderer from 'react-test-renderer';
import i18next, {isLanguageCode} from '@/core/i18n';
import {useLanguage} from './useLanguage';

let captured: ReturnType<typeof useLanguage> | null = null;

const Probe = () => {
  captured = useLanguage();
  return null;
};
```

Then append below the existing `describe('isLanguageCode', ...)` block:

```tsx
describe('useLanguage', () => {
  beforeEach(() => {
    captured = null;
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    return i18next.changeLanguage('vi');
  });

  it('defaults to vi', async () => {
    await renderer.act(async () => {
      renderer.create(<Probe />);
    });
    expect(captured?.language).toBe('vi');
  });

  it('changes language and persists on setLanguage', async () => {
    await renderer.act(async () => {
      renderer.create(<Probe />);
    });
    await renderer.act(async () => {
      captured?.setLanguage('en');
    });
    expect(captured?.language).toBe('en');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('language', '"en"');
  });

  it('still switches language when persistence fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
      new Error('io error'),
    );
    await renderer.act(async () => {
      renderer.create(<Probe />);
    });
    await renderer.act(async () => {
      captured?.setLanguage('en');
    });
    expect(captured?.language).toBe('en');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
```

Notes for the implementer:

- `Storage` JSON-wraps values (`setItem` runs `JSON.stringify`), so the AsyncStorage-level assertion is `'"en"'` — same pattern as `__tests__/themeContext.test.tsx:69`.
- `beforeEach` resets the shared i18next instance to `vi` because the module-level instance leaks across tests.
- No I18nextProvider is needed: `initReactI18next` wires the default instance.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/core/i18n/useLanguage.test.tsx`
Expected: FAIL — `Cannot find module './useLanguage'`.

- [ ] **Step 3: Write minimal implementation**

Create `src/core/i18n/useLanguage.ts`:

```ts
import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {Storage} from '@/core/utils/storage';
import {LanguageCode} from './i18n';

export const LANGUAGES: readonly {code: LanguageCode; label: string}[] = [
  {code: 'vi', label: 'Tiếng Việt'},
  {code: 'en', label: 'English'},
];

export const useLanguage = () => {
  const {i18n} = useTranslation();
  const language = i18n.language as LanguageCode;
  const setLanguage = useCallback(
    (lng: LanguageCode) => {
      i18n.changeLanguage(lng);
      Storage.setItem(Storage.KEY_LANGUAGE, lng).catch(e =>
        console.error('[i18n] Failed to persist language:', e),
      );
    },
    [i18n],
  );
  return {language, setLanguage};
};
```

In `src/core/i18n/index.ts`, add:

```ts
export * from './useLanguage';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/core/i18n/useLanguage.test.tsx`
Expected: PASS — all 5 tests (2 guard + 3 hook).

- [ ] **Step 5: Commit**

```bash
git add src/core/i18n/useLanguage.ts src/core/i18n/useLanguage.test.tsx src/core/i18n/index.ts
git commit -m "feat(i18n): add useLanguage hook with storage persistence"
```

---

### Task 3: Hydrate stored language at startup

**Files:**

- Modify: `src/app/App.tsx`

- [ ] **Step 1: Replace the i18n side-effect import with a value import**

In `src/app/App.tsx`, change:

```tsx
import '@/core/i18n';
```

to:

```tsx
import i18next, {isLanguageCode, LanguageCode} from '@/core/i18n';
```

(The default import still performs the side-effect initialization — nothing else about init timing changes.)

Also add the Storage import next to the existing `@/core` imports:

```tsx
import {Storage} from '@/core/utils/storage';
```

- [ ] **Step 2: Add the hydration effect inside the `App` component**

Inside `export const App: React.FC = () => {...}`, add alongside the FCM `useEffect`:

```tsx
/** Hydrate stored language preference */
useEffect(() => {
  Storage.getItem<LanguageCode>(Storage.KEY_LANGUAGE)
    .then(stored => {
      if (isLanguageCode(stored)) {
        i18next.changeLanguage(stored);
      }
    })
    .catch(e => console.error('[i18n] Failed to load stored language:', e));
}, []);
```

No render gating: default `vi` is the baseline; the spec explicitly accepted a brief flash for `en` users over adding a gated provider.

- [ ] **Step 3: Run typecheck and existing tests**

Run: `npx tsc --noEmit && npm test`
Expected: tsc clean; all tests pass including `__tests__/App.test.tsx` (it already mocks AsyncStorage, so the new effect no-ops there).

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat(app): hydrate stored language on startup"
```

---

### Task 4: Language section in AccountScreen

**Files:**

- Modify: `src/features/account/presentation/screens/AccountScreen.tsx`

- [ ] **Step 1: Add imports**

```tsx
import {LANGUAGES, useLanguage} from '@/core/i18n';
```

- [ ] **Step 2: Consume the hook and render the section**

Inside the component, next to `const {mode, setMode, theme} = useTheme();` add:

```tsx
const {language, setLanguage} = useLanguage();
```

After the closing `})}` of the theme `OPTIONS.map(...)` block, add:

```tsx
<FText typo="subtitle2" style={styles.subHeader}>
  Ngôn ngữ
</FText>;
{
  LANGUAGES.map(option => {
    const selected = language === option.code;
    return (
      <TouchableOpacity
        key={option.code}
        style={styles.row}
        onPress={() => setLanguage(option.code)}>
        <FText
          typo="title6"
          style={{color: selected ? colors.primary : colors.body}}>
          {option.label}
        </FText>
        {selected && (
          <FIcon icon={FFilled.c_check} size={20} iconColor={colors.primary} />
        )}
      </TouchableOpacity>
    );
  });
}
```

Labels stay hardcoded (`Tiếng Việt` / `English`) — language names render in their own language by i18n convention and are NOT translated. "Ngôn ngữ" header stays hardcoded Vietnamese, consistent with the existing "Giao diện" header (scope decision: switcher only).

- [ ] **Step 3: Run typecheck, tests, lint**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: all green. This is the final gate — fix any issue before committing.

- [ ] **Step 4: Commit**

```bash
git add src/features/account/presentation/screens/AccountScreen.tsx
git commit -m "feat(account): add language section to account screen"
```

---

## Verification Checklist (run after Task 4, before done)

- [ ] `npx tsc --noEmit` — clean
- [ ] `npm test` — all pass (incl. new `src/core/i18n/useLanguage.test.tsx` and existing `__tests__/App.test.tsx`)
- [ ] `npm run lint` — clean
- [ ] `git log --oneline -4` shows the 4 feature commits, small and single-purpose
