# Styleguide Typography Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled 29-token `FTheme.fonts` scale with the styleguide-derived token set (18 canonical + 25 legacy aliases + 4 navigation) from `/Users/macmini4/Downloads/FThemefixed.ts`, align `buildPaperTheme` weights, and update docs.

**Architecture:** Data-only theme change. `FTheme.ts` is replaced verbatim by the provided fixed file (source of truth, approved in `docs/superpowers/specs/2026-09-14-typography-styleguide-tokens-design.md`). Legacy token names remain as aliases so no call site changes. Docs updated in the same change set per repo convention.

**Tech Stack:** TypeScript, React Navigation `DefaultTheme` module augmentation, react-native-paper MD3 font mapping.

## Global Constraints

- Package manager is **npm**, never yarn (`.npmrc` has `legacy-peer-deps=true`).
- Quality gates (must pass before each commit): `npx tsc --noEmit`, `npm test`, `npm run lint`.
- Commit format: `type(scope): lowercase imperative summary`; small single-purpose commits.
- `AGENTS.md` is a symlink to `CLAUDE.md` — edit `CLAUDE.md`, never the symlink.
- Prettier: `arrowParens: 'avoid'`, `bracketSpacing: false`, `bracketSameLine: true`, `singleQuote: true`, `trailingComma: 'all'`.
- **Do NOT stage unrelated dirty files** (`ios/ReactCore.xcodeproj/project.pbxproj`, `src/shared/components/FTextInput.tsx` — pre-existing local changes). Stage only files named in each task.
- No new dependencies. No new unit tests (data-only change; spec decision).
- `FTheme.ts` content must be byte-identical to `/Users/macmini4/Downloads/FThemefixed.ts`. If that source file no longer exists, STOP and ask the user for the fixed theme file before executing Task 1.
- **Amendment (user-approved during execution):** the source file's wide `fontWeight` typing (`NonNullable<TextStyle['fontWeight']>`) breaks `DefaultTheme` assignability against React Navigation's narrow `Theme.fonts` contract (TS2322). Approved deviation, exactly three lines: `FontStylesProps.fontWeight?` and `NavigationFontStyleProps.fontWeight` use the narrow union `'normal' | 'bold' | '400' | '500' | '600' | '700'`, and `createNavigationFontStyle`'s parameter is typed `NavigationFontStyleProps['fontWeight']`. All token values remain byte-identical to the source.

---

### Task 1: Replace FTheme.ts and align paperTheme weights

**Files:**

- Modify: `src/core/theme/FTheme.ts` (full replacement, 29 → 47 font keys)
- Modify: `src/core/theme/paperTheme.ts:20` (one token change)

**Interfaces:**

- Consumes: `/Users/macmini4/Downloads/FThemefixed.ts` (verbatim source).
- Produces: `FTheme.fonts` with keys `regular`/`medium`/`bold`/`heavy` (NavigationFontStyleProps), 18 canonical keys `headline0-8`, `bodyLabel01-04`, `body01-05` (also exported standalone as `TypographyStyles`, plus `FontFamily` const), and 25 legacy alias keys `largeTitle`, `title1-6`, `bodyText1-2`, `buttonText1-5`, `subtitle1-4`, `label1-5`, `placeholder1-2`. `FText`'s `typo: keyof typeof FTheme.fonts` picks all of this up automatically — no consumer edits allowed in this task.

- [ ] **Step 1: Confirm the source file exists**

```bash
ls -la /Users/macmini4/Downloads/FThemefixed.ts
```

Expected: the file exists. If missing, stop and ask the user.

- [ ] **Step 2: Copy it over FTheme.ts**

```bash
cp /Users/macmini4/Downloads/FThemefixed.ts src/core/theme/FTheme.ts
```

- [ ] **Step 3: Verify byte-identical copy**

```bash
diff /Users/macmini4/Downloads/FThemefixed.ts src/core/theme/FTheme.ts
```

Expected: no output (exit 0).

- [ ] **Step 4: Align paperTheme bold weight with the new navigation fonts**

In `src/core/theme/paperTheme.ts`, the MD3 font remap hardcodes `'600'` for the non-body/non-label branch (titles/display). The new `bold`/`heavy` navigation fonts use `'700'`. Change exactly this fragment (lines 16-20):

```ts
        fontWeight: key.startsWith('body')
          ? '400'
          : key.startsWith('label')
          ? '500'
          : '600',
```

to:

```ts
        fontWeight: key.startsWith('body')
          ? '400'
          : key.startsWith('label')
          ? '500'
          : '700',
```

Cosmetic only — `fontFamily` is explicit and takes precedence — but keeps the two mappings consistent.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no output. If it fails, do NOT patch call sites — the copied file compiles as-is (alias names unchanged); a failure means the copy or the paperTheme edit went wrong. Re-check Step 3.

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: all pass (baseline is clean; no test asserts font token values).

- [ ] **Step 7: Lint**

```bash
npm run lint
```

Expected: no errors (warnings matching the pre-change baseline are acceptable).

- [ ] **Step 8: Commit**

```bash
git add src/core/theme/FTheme.ts src/core/theme/paperTheme.ts
git commit -m "feat(theme): adopt styleguide typography tokens"
```

---

### Task 2: Update typography docs

**Files:**

- Modify: `CLAUDE.md:143` (fonts bullet)
- Modify: `DESIGN.md:160-165` (Paper font mapping paragraph) and `DESIGN.md:167-219` (§3 Typography)

**Interfaces:**

- Consumes: the token set produced by Task 1 (names and values as listed there).
- Produces: documentation only. No code depends on it.

- [ ] **Step 1: Update the CLAUDE.md fonts bullet**

Replace the single bullet at `CLAUDE.md:143` (current text):

```markdown
- Fonts are bundled: Clan Pro (`ClanPro-Book` / `ClanPro-Medium` / `ClanPro-Bold`). Source of truth `src/assets/fonts/`, linked manually into `android/app/src/main/assets/fonts/` + `ios/ReactCore` resources + `UIAppFonts` in Info.plist. Weight map: 400→Book, 500→Medium, 600→Bold. Italic variants exist but are not bundled. All 29 font tokens in `FTheme.ts` set `fontFamily` explicitly (a token without it renders the system font); `buildPaperTheme` maps all MD3 fonts to the same families (titles→Bold, labels→Medium, body→Book).
```

with:

```markdown
- Fonts are bundled: Clan Pro (`ClanPro-Book` / `ClanPro-Medium` / `ClanPro-Bold`). Source of truth `src/assets/fonts/`, linked manually into `android/app/src/main/assets/fonts/` + `ios/ReactCore` resources + `UIAppFonts` in Info.plist. Weight map: 400→Book, 500→Medium, 700→Bold. Italic variants exist but are not bundled. All 47 font tokens in `FTheme.ts` set `fontFamily` explicitly (a token without it renders the system font). Canonical tokens are the 18 styleguide keys in `TypographyStyles` (`headline0-8`, `bodyLabel01-04`, `body01-05`) — use those in new code; the 25 legacy names (`largeTitle`, `title1-6`, `bodyText1-2`, `buttonText1-5`, `subtitle1-4`, `label1-5`, `placeholder1-2`) are deprecated aliases kept until call sites migrate (edit-as-you-touch). `buildPaperTheme` maps all MD3 fonts to the same families (titles→Bold, labels→Medium, body→Book).
```

- [ ] **Step 2: Update the Paper font-mapping paragraph in DESIGN.md**

In `DESIGN.md` lines 160-165, change `display/headline/title→ClanPro-Bold (600)` to `(700)`. The sentence becomes:

```markdown
All other MD3 roles keep the Paper defaults. `buildPaperTheme` also remaps every MD3
font (`fonts`) to the bundled Clan Pro families — `body*`→`ClanPro-Book` (400),
`label*`→`ClanPro-Medium` (500), display/headline/title→`ClanPro-Bold` (700) — so
Paper components (Dialog, Snackbar, TextInput labels) do not fall back to the system
font. When a Paper component looks "off-theme",
check this mapping before changing component props.
```

- [ ] **Step 3: Rewrite DESIGN.md §3 Typography (lines 167-218)**

Replace everything from `## 3. Typography` down to the `darkFonts` bullet (keep the `## 4` elevation section that follows) with:

```markdown
## 3. Typography

The full scale lives in `FTheme.fonts` — **47 keys**: 18 canonical styleguide
tokens (exported standalone as `TypographyStyles`), 25 legacy aliases, and 4
navigation styles. Everything uses the bundled **Clan Pro** family with
`letterSpacing: 0` (values: `fontSize / lineHeight`; family from the ramp name):

**Canonical ramp** (new code uses these):

| Token            | Size / Line                       | Family         | Use                     |
| ---------------- | --------------------------------- | -------------- | ----------------------- |
| `headline0-3`    | 128, 96, 72, 60 (line = size)     | ClanPro-Bold   | display sizes           |
| `headline4`      | 48 / 60                           | ClanPro-Bold   | large display           |
| `headline5`      | 36 / 40                           | ClanPro-Bold   | hero titles             |
| `headline6`      | 30 / 36                           | ClanPro-Bold   | page titles             |
| `headline7`      | 26 / 32                           | ClanPro-Bold   | section titles          |
| `headline8`      | 22 / 28                           | ClanPro-Bold   | subsection titles       |
| `bodyLabel01-04` | 18/28, 16/24, 14/20, 12/12        | ClanPro-Medium | emphasized body, labels |
| `body01-05`      | 18/28, 16/24, 14/20, 12/18, 10/12 | ClanPro-Book   | body, captions          |

**Legacy aliases** (deprecated; each maps 1:1 to a canonical token — migrate
call sites as files are touched):

| Alias                                              | Maps to       | Resolves to  |
| -------------------------------------------------- | ------------- | ------------ |
| `largeTitle`                                       | `headline5`   | 36/40 Bold   |
| `title1`                                           | `headline7`   | 26/32 Bold   |
| `title2`                                           | `headline8`   | 22/28 Bold   |
| `title3`, `buttonText1`                            | `bodyLabel01` | 18/28 Medium |
| `title4`, `buttonText2`, `label1`                  | `bodyLabel02` | 16/24 Medium |
| `title5`, `buttonText3`, `label3`                  | `bodyLabel03` | 14/20 Medium |
| `title6`, `buttonText4`                            | `bodyLabel04` | 12/12 Medium |
| `bodyText1`                                        | `body01`      | 18/28 Book   |
| `bodyText2`, `subtitle1`, `label2`, `placeholder1` | `body02`      | 16/24 Book   |
| `subtitle2`, `label4`, `placeholder2`              | `body03`      | 14/20 Book   |
| `buttonText5`, `subtitle3`, `label5`               | `body04`      | 12/18 Book   |
| `subtitle4`                                        | `body05`      | 10/12 Book   |

**Navigation styles** (`regular`, `medium`, `bold`, `heavy`) exist for React
Navigation's `fonts` contract and require **explicit `fontFamily` + `fontWeight`**
(enforced by `NavigationFontStyleProps` types): `regular` = `body03` @ '400',
`medium` = `bodyLabel03` @ '500', `bold` = Bold 14/20 @ '700', `heavy` =
Bold 16/24 @ '700'.

Usage rules:

- Text renders through `<FText typo="...">` — prefer a canonical token from the
  ramp above; do not set `fontSize` by hand.
- Fonts are bundled: the Clan Pro family (`ClanPro-Book.ttf` / `ClanPro-Medium.ttf` /
  `ClanPro-Bold.ttf`) lives in `src/assets/fonts/` (source of truth), is copied to
  `android/app/src/main/assets/fonts/`, and on iOS is registered via Xcode resources +
  `UIAppFonts` in `ios/ReactCore/Info.plist`. Weight map: 400→`ClanPro-Book`,
  500→`ClanPro-Medium`, 700→`ClanPro-Bold`. Italic variants exist in the font set but
  are not bundled — do not add font files on your own.
- In dark theme every style keeps its metrics; only `color` changes (to `#F4F7FF`),
  via `DarkTheme`'s derived `darkFonts` map.
```

- [ ] **Step 4: README.md — no change (verified)**

README has no typography/font section (only a one-line tree mention of `FTheme.ts`), so the spec's "matching README note" has nothing to attach to. Do not add one — do not touch README.md.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md DESIGN.md
git commit -m "docs(theme): document styleguide typography tokens and alias policy"
```

---

### Task 3: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Run all gates once more on the final tree**

```bash
npx tsc --noEmit && npm test && npm run lint
```

Expected: all green.

- [ ] **Step 2: Confirm working tree has no stray changes from this plan**

```bash
git status --short
```

Expected: only the two pre-existing dirty files remain
(`ios/ReactCore.xcodeproj/project.pbxproj`, `src/shared/components/FTextInput.tsx`).

- [ ] **Step 3: (Manual, on simulator) Visual spot-check**

Run the app and check: Splash/Login hero titles (smaller: 36/40), Account header
(title1 → 26/32), FSnackbar/FTooltip text (bodyText2 → 16/24),
`TypographySection` on Home renders the demo labels with new metrics.
