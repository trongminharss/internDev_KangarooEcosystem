# Spacing/Radius Tokens Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export the spacing/radius tokens via the styles barrel, document them in DESIGN.md, add enforcement rules to CLAUDE.md/README, and migrate every raw spacing/borderRadius number in `src/features/**` + `src/shared/components/**` onto tokens.

**Architecture:** Two Figma-derived scales stay as-is (`tokens.space` for screen/layout, `tokens.spacing` for component-internal, `tokens.borderRadius` for radii). StyleSheet factories and inline styles reference `tokens.*` values; the `spacing.*` helper objects are used where an exact helper exists for an inline style. Off-scale values snap to the nearest token, ties round down.

**Tech Stack:** React Native StyleSheet, TypeScript path alias `@/`, npm. Spec: `docs/superpowers/specs/2026-09-17-spacing-radius-tokens-design.md`.

**Context for the engineer:**

- `AGENTS.md` is a symlink to `CLAUDE.md` — NEVER edit `AGENTS.md` directly; edit `CLAUDE.md`.
- Token source: `src/shared/styles/tokens.ts` — `space` (`xs=4, sm=8, md=16, lg=24, xl=32, _2xl=40, _3xl=48, _4xl=56, _5xl=64, _6xl=80, _7xl=120`), `spacing` (`_3xs=4, _2xs=8, xs=12, s=16`), `borderRadius` (`small=8, medium=16, big=32, full=999`). Note leading underscores: `_3xs`, `_2xl`, etc.
- Helpers: `src/shared/styles/spacing.ts` — `p_/px_/py_/gap_` × `3xs/2xs/xs/s` as StyleSheet objects (spread into style arrays).
- Scale choice: screen/layout margins & screen padding → `tokens.space.*`; anything inside a component with value ≤16 → `tokens.spacing.*` (or helper); ≥24 inside a component → `tokens.space.*`. Value 12 exists only on `spacing`; 24+ only on `space`.
- Snap table: `1` exempt(1) · `2→4` · `5→4` · `10→8` · `12→12 (spacing)` or `→8 (layout)` · `15→16` · `20→16` · `36→32` · `46→48` · `100→80` · `130→120`. Radius: `4→small` · `18→medium` · `20→full` · `24→full`. (1) = geometry-coupled component inset — exempt with comment.
- Exemptions (keep literal): `0`, runtime-derived values (`insets.bottom`), geometry-coupled insets with comment, position properties (`top/left/right/bottom`), view dimensions (`width/height`), `borderWidth`, icon `size`.
- Prettier: `arrowParens: 'avoid'`, `bracketSpacing: false`, `singleQuote: true`, `trailingComma: 'all'`. Quality gates: `npx tsc --noEmit`, `npm test`, `npm run lint`.

---

### Task 1: Barrel export for `spacing` and `tokens`

**Files:**

- Modify: `src/shared/styles/index.ts`

- [ ] **Step 1: Replace file content**

```ts
export * from './FElevation';
export {default as FButtonSize} from './FButtonSize';
export {default as FInputSize} from './FInputSize';
export * from './spacing';
export {tokens} from './tokens';
export * from './FIconStyles';
```

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/shared/styles/index.ts
git commit -m "feat(ui): export spacing helpers and tokens from shared styles barrel"
```

---

### Task 2: DESIGN.md — document tokens, fix size40 sync error, amend spec exemptions

**Files:**

- Modify: `DESIGN.md` (§5, currently titled `## 5. Sizes`, lines ~301–313)
- Modify: `docs/superpowers/specs/2026-09-17-spacing-radius-tokens-design.md` (exemption line)

- [ ] **Step 1: Replace the whole `## 5. Sizes` section with this content**

(Leave `## 6. Iconography` and everything after untouched.)

```markdown
## 5. Sizes, Spacing & Radius

Control dimensions live in `src/shared/styles/`:

| Token set     | Token    | Height | Radius | Padding |
| ------------- | -------- | ------ | ------ | ------- |
| `FButtonSize` | `size40` | 40     | 8      | 8       |
| `FButtonSize` | `size48` | 48     | 8      | 12      |
| `FInputSize`  | `size48` | 48     | 8      | 12      |
| `FInputSize`  | `size56` | 56     | 8      | 10      |

These are the only sanctioned control heights — do not invent 44/52/etc. Button text
pairs: `size40` → `buttonText2/3`, `size48` → `buttonText1/2`.

### 5.1 Space scale — screen/layout (`tokens.space`, 8px grid + 4px fine-tune)

`src/shared/styles/tokens.ts`, from Figma. Use for margins between sections and
screen-level padding:

| Token        | Value | Token        | Value |
| ------------ | ----- | ------------ | ----- |
| `space.xs`   | 4     | `space._4xl` | 56    |
| `space.sm`   | 8     | `space._5xl` | 64    |
| `space.md`   | 16    | `space._6xl` | 80    |
| `space.lg`   | 24    | `space._7xl` | 120   |
| `space.xl`   | 32    |              |       |
| `space._2xl` | 40    |              |       |
| `space._3xl` | 48    |              |       |

### 5.2 Component spacing (`tokens.spacing`, Figma `spacing/*`)

Padding/gap **inside** components (chân button, khoảng cách icon–text):

| Token          | Value | Figma         |
| -------------- | ----- | ------------- |
| `spacing._3xs` | 4     | `spacing/3XS` |
| `spacing._2xs` | 8     | `spacing/2XS` |
| `spacing.xs`   | 12    | `spacing/XS`  |
| `spacing.s`    | 16    | `spacing/S`   |

Ready-made StyleSheet helpers in `src/shared/styles/spacing.ts` — `p_/px_/py_/gap_`
× `3xs/2xs/xs/s` (e.g. `spacing.p_s`, `spacing.px_xs`, `spacing.gap_2xs`). Spread
them into style arrays: `style={[spacing.px_s, {backgroundColor: colors.white}]}`.

### 5.3 Border radius (`tokens.borderRadius`)

| Token                 | Value | Use (Figma)                               |
| --------------------- | ----- | ----------------------------------------- |
| `borderRadius.small`  | 8     | Button, small card                        |
| `borderRadius.medium` | 16    | Card nhỏ, banner                          |
| `borderRadius.big`    | 32    | Phân chia section, card lớn               |
| `borderRadius.full`   | 999   | Pill / circle (RN clamps to half the box) |

### 5.4 Usage rules

1. No raw numbers for `padding*`, `gap`, `margin*`, `borderRadius` in
   `src/features/**` and `src/shared/components/**`.
2. Screen/layout spacing → `tokens.space.*`; component-internal padding/gap ≤16 →
   `tokens.spacing.*` or `spacing` helpers; ≥24 inside a component →
   `tokens.space.*`. Only `spacing` has 12; only `space` has 24/32/40+.
3. Exemptions (literal value allowed): `0`; runtime-derived values
   (`insets.bottom`); geometry-coupled component insets (e.g. `FSwitch` thumb
   inset) — each with a short comment saying why. Position properties
   (`top/left/right/bottom`), view `width/height`, `borderWidth`, and icon `size`
   are not spacing and stay literal.
4. Pills/circles use `borderRadius.full` (RN clamps to half the box).
5. New tokens: edit `tokens.ts` first, update this file in the same commit.
```

- [ ] **Step 2: Amend the spec's exemption clause (keep spec and code consistent)**

In `docs/superpowers/specs/2026-09-17-spacing-radius-tokens-design.md`, find:

```
  - Values derived at runtime (keyboard offsets, animation coordinates) are
    exempt but must carry a code comment naming the source.
```

Replace with:

```
  - Values derived at runtime (keyboard offsets, animation coordinates) and
    geometry-coupled component insets (e.g. `FSwitch` thumb inset) are exempt
    but must carry a code comment naming the source.
```

- [ ] **Step 3: Commit**

```bash
git add DESIGN.md docs/superpowers/specs/2026-09-17-spacing-radius-tokens-design.md
git commit -m "docs(design): document spacing, component-spacing and radius tokens"
```

---

### Task 3: CLAUDE.md rules + README sync

**Files:**

- Modify: `CLAUDE.md` (section `## Theme & UI`, after the line about `createStyles(colors)` factory, before the `ColorsProps` line)
- Modify: `README.md` (line ~95, the `styles/` tree entry)

- [ ] **Step 1: Insert two bullets into `## Theme & UI` in `CLAUDE.md`**

After the bullet `- Screen pattern: createStyles(colors) factory ...` insert:

```markdown
- Spacing/radius use tokens from `@/shared/styles`: screen/layout spacing → `tokens.space.*`; component-internal padding/gap ≤16 → `spacing` helpers (`p_s`, `px_xs`, `gap_2xs`...) or `tokens.spacing.*`; radius → `tokens.borderRadius.*` (`small=8/medium=16/big=32/full=999`). No raw numbers for padding*/gap/margin*/borderRadius — exempt: `0`, runtime-derived values, geometry-coupled insets (each with a comment). Position props, width/height, borderWidth, icon size are not spacing.
- Only `tokens.spacing` has 12 (component scale); only `tokens.space` has 24/32/40+. To add a token: edit `src/shared/styles/tokens.ts` first, update DESIGN.md in the same commit.
```

- [ ] **Step 2: Update README.md tree entry**

Find:

```
│   └── styles/                          # FIconStyles, FElevation, FButtonSize, FInputSize
```

Replace with:

```
│   └── styles/                          # tokens (space/spacing/borderRadius), spacing helpers, FIconStyles, FElevation, FButtonSize, FInputSize
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: add spacing/radius token rules to agent conventions"
```

---

### Task 4: Migrate `src/shared/components`

**Files:**

- Modify: `src/shared/components/Checkbox.tsx`, `FAppbar.tsx`, `FBottomSheet.tsx`, `FProgress.tsx`, `FSlider.tsx`, `FSnackbar.tsx`, `FSwitch.tsx`

Add imports at top of each file that needs them (per list below):

```ts
import {spacing, tokens} from '@/shared/styles';
```

(or just one of the two names; remove unused name — lint will flag it.)

- [ ] **Step 1: Checkbox.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before             | After                                      |
| ---- | ------------------ | ------------------------------------------ |
| 69   | `borderRadius: 8,` | `borderRadius: tokens.borderRadius.small,` |
| 73   | `marginRight: 8,`  | `marginRight: tokens.spacing._2xs,`        |

- [ ] **Step 2: FAppbar.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before                      | After                                      |
| ---- | --------------------------- | ------------------------------------------ |
| 42   | `padding: 0,`               | unchanged (exempt: `0`)                    |
| 59   | `style={{paddingLeft: 12}}` | `style={{paddingLeft: tokens.spacing.xs}}` |

- [ ] **Step 3: FBottomSheet.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before             | After                                      |
| ---- | ------------------ | ------------------------------------------ |
| 45   | `margin: 0`        | unchanged (exempt: `0`)                    |
| 98   | `borderRadius: 8,` | `borderRadius: tokens.borderRadius.small,` |
| 99   | `marginBottom: 4,` | `marginBottom: tokens.spacing._3xs,`       |
| 100  | `marginTop: 8,`    | `marginTop: tokens.spacing._2xs,`          |

- [ ] **Step 4: FProgress.tsx** — add `import {spacing, tokens} from '@/shared/styles';`

| Line            | Before                                                                              | After                                                                                    |
| --------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 33              | `<View style={{padding: 5, paddingHorizontal: 15, backgroundColor: colors.white}}>` | `<View style={[spacing.p_3xs, spacing.px_xs, {backgroundColor: colors.white}]}>`         |
| 34              | `<View style={{flexDirection: 'row', paddingVertical: 2}}>`                         | `<View style={{flexDirection: 'row', paddingVertical: tokens.spacing._3xs}}>` (snap 2→4) |
| 52, 81          | `marginVertical: 4,`                                                                | `marginVertical: tokens.spacing._3xs,`                                                   |
| 60, 70, 91, 101 | `borderRadius: 8,`                                                                  | `borderRadius: tokens.borderRadius.small,`                                               |
| 62, 93          | `marginHorizontal: 10,`                                                             | `marginHorizontal: tokens.spacing._2xs,` (snap 10→8)                                     |

- [ ] **Step 5: FSlider.tsx** — add `import {spacing, tokens} from '@/shared/styles';`

| Line    | Before                                                                       | After                                                                                                                 |
| ------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 49, 115 | `style={{padding: 5, paddingHorizontal: 15, backgroundColor: colors.white}}` | `style={[spacing.p_3xs, spacing.px_xs, {backgroundColor: colors.white}]}`                                             |
| 51, 117 | `paddingVertical: 2`                                                         | `paddingVertical: tokens.spacing._3xs`                                                                                |
| 73, 139 | `style={[{flex: 1, marginHorizontal: 20}, style]}`                           | `style={[{flex: 1, marginHorizontal: tokens.spacing.s}, style]}` (snap 20→16)                                         |
| 103     | `paddingHorizontal: 10`                                                      | `paddingHorizontal: tokens.spacing._2xs`                                                                              |
| 136     | `marginVertical: 10,`                                                        | `marginVertical: tokens.spacing._2xs,`                                                                                |
| 155     | `trackStyle={{height: 8, borderRadius: 4}}`                                  | `trackStyle={{height: 8, borderRadius: tokens.borderRadius.small}}` (height stays — dimension; radius clamps to pill) |

- [ ] **Step 6: FSnackbar.tsx** — add `import {tokens} from '@/shared/styles';`

| Line         | Before                                   | After                                                                      |
| ------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| 221, 248–251 | `margin: 0` / `marginHorizontal: 0` etc. | unchanged (exempt: `0`)                                                    |
| 230          | `marginHorizontal: 16,`                  | `marginHorizontal: tokens.space.md,` (screen-edge margin → layout scale)   |
| 231          | `borderRadius: 16,`                      | `borderRadius: tokens.borderRadius.medium,`                                |
| 256          | `paddingLeft: 12,`                       | `paddingLeft: tokens.spacing.xs,`                                          |
| 257          | `paddingRight: 4,`                       | `paddingRight: tokens.spacing._3xs,`                                       |
| 258, 259     | `paddingTop: 4,` / `paddingBottom: 4,`   | `paddingTop: tokens.spacing._3xs,` / `paddingBottom: tokens.spacing._3xs,` |
| 260, 267     | `gap: 8,`                                | `gap: tokens.spacing._2xs,`                                                |
| 266          | `paddingVertical: 8,`                    | `paddingVertical: tokens.spacing._2xs,`                                    |
| 278          | `gap: 2,`                                | `gap: tokens.spacing._3xs,` (snap 2→4)                                     |
| 283          | `borderRadius: 18,`                      | `borderRadius: tokens.borderRadius.medium,` (snap 18→16)                   |

- [ ] **Step 7: FSwitch.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before                  | After                                                                  |
| ---- | ----------------------- | ---------------------------------------------------------------------- |
| 63   | `borderRadius: 24,`     | `borderRadius: tokens.borderRadius.full, // pill — track height 24`    |
| 65   | `paddingHorizontal: 1,` | `paddingHorizontal: 1, // thumb inset, geometry — not a spacing token` |
| 70   | `borderRadius: 20,`     | `borderRadius: tokens.borderRadius.full, // circle — 22×22`            |

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean

- [ ] **Step 9: Commit**

```bash
git add src/shared/components
git commit -m "refactor(ui): migrate shared components to spacing/radius tokens"
```

---

### Task 5: Migrate `src/features/onboarding` + `src/features/account`

**Files:**

- Modify: `src/features/onboarding/presentation/screens/OnboardingScreen.tsx`, `src/features/account/presentation/screens/AccountScreen.tsx`

- [ ] **Step 1: OnboardingScreen.tsx** — add `import {tokens} from '@/shared/styles';`

| Line          | Before                   | After                                                                     |
| ------------- | ------------------------ | ------------------------------------------------------------------------- |
| 163, 176, 188 | `paddingHorizontal: 24,` | `paddingHorizontal: tokens.space.lg,`                                     |
| 168           | `marginBottom: 130,`     | `marginBottom: tokens.space._7xl,` (snap 130→120 — visual check)          |
| 174           | `bottom: 24,`            | unchanged (position prop, not spacing)                                    |
| 182           | `marginTop: 12,`         | `marginTop: tokens.space.sm,` (snap layout 12→8 — visual check)           |
| 189           | `paddingBottom: 36,`     | `paddingBottom: tokens.space.xl,` (snap 36→32 — visual check)             |
| 204           | `borderRadius: 4,`       | `borderRadius: tokens.borderRadius.small,` (clamps to pill on 8-high dot) |
| 205           | `marginHorizontal: 4,`   | `marginHorizontal: tokens.spacing._3xs,`                                  |

- [ ] **Step 2: AccountScreen.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before                   | After                                 |
| ---- | ------------------------ | ------------------------------------- |
| 80   | `paddingHorizontal: 16,` | `paddingHorizontal: tokens.space.md,` |
| 81   | `paddingTop: 24,`        | `paddingTop: tokens.space.lg,`        |
| 88   | `marginTop: 24,`         | `marginTop: tokens.space.lg,`         |
| 89   | `marginBottom: 8,`       | `marginBottom: tokens.space.sm,`      |
| 95   | `paddingVertical: 16,`   | `paddingVertical: tokens.space.md,`   |

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding src/features/account
git commit -m "refactor(ui): migrate onboarding and account screens to spacing tokens"
```

---

### Task 6: Migrate `src/features/home`

**Files:**

- Modify: `src/features/home/presentation/components/ButtonsSection.tsx`, `OverlaySection.tsx`, `FSection.tsx`, `TypographySection.tsx`, `src/features/home/presentation/screens/HomeScreen.tsx`

- [ ] **Step 1: ButtonsSection.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before     | After                     |
| ---- | ---------- | ------------------------- |
| 62   | `gap: 12,` | `gap: tokens.spacing.xs,` |

- [ ] **Step 2: OverlaySection.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before                    | After                                                                    |
| ---- | ------------------------- | ------------------------------------------------------------------------ |
| 66   | `style={{marginTop: 12}}` | `style={{marginTop: tokens.space.sm}}` (snap layout 12→8 — visual check) |
| 116  | `style={{marginTop: 8}}`  | `style={{marginTop: tokens.space.sm}}`                                   |
| 177  | `gap: 12,`                | `gap: tokens.spacing.xs,`                                                |
| 180  | `marginTop: 16,`          | `marginTop: tokens.space.md,`                                            |
| 181  | `marginBottom: 16,`       | `marginBottom: tokens.space.md,`                                         |
| 185  | `borderRadius: 8,`        | `borderRadius: tokens.borderRadius.small,`                               |
| 186  | `padding: 12,`            | `padding: tokens.spacing.xs,`                                            |

- [ ] **Step 3: FSection.tsx (home)** — add `import {tokens} from '@/shared/styles';`

| Line | Before                   | After                                      |
| ---- | ------------------------ | ------------------------------------------ |
| 32   | `paddingHorizontal: 16,` | `paddingHorizontal: tokens.space.md,`      |
| 33   | `paddingTop: 16,`        | `paddingTop: tokens.space.md,`             |
| 37   | `borderRadius: 8,`       | `borderRadius: tokens.borderRadius.small,` |
| 38   | `padding: 12,`           | `padding: tokens.spacing.xs,`              |
| 39   | `marginTop: 8,`          | `marginTop: tokens.spacing._2xs,`          |
| 40   | `gap: 12,`               | `gap: tokens.spacing.xs,`                  |

- [ ] **Step 4: TypographySection.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before     | After                     |
| ---- | ---------- | ------------------------- |
| 76   | `gap: 12,` | `gap: tokens.spacing.xs,` |

- [ ] **Step 5: HomeScreen.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before               | After                             |
| ---- | -------------------- | --------------------------------- |
| 41   | `paddingBottom: 32,` | `paddingBottom: tokens.space.xl,` |

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean

- [ ] **Step 7: Commit**

```bash
git add src/features/home
git commit -m "refactor(ui): migrate home feature to spacing/radius tokens"
```

---

### Task 7: Migrate `src/features/auth`

**Files:**

- Modify: `src/features/auth/presentation/screens/OtpScreen.tsx`, `PhoneLoginScreen.tsx`

- [ ] **Step 1: OtpScreen.tsx** — add `import {tokens} from '@/shared/styles';`

| Line | Before                                          | After                                                                                    |
| ---- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 152  | `style={{marginHorizontal: 16, marginTop: 46}}` | `style={{marginHorizontal: tokens.space.md, marginTop: tokens.space._3xl}}` (snap 46→48) |
| 187  | `paddingHorizontal: 16,`                        | `paddingHorizontal: tokens.space.md,`                                                    |
| 188  | `paddingTop: 100,`                              | `paddingTop: tokens.space._5xl,` (snap 100→80 — visual check)                            |
| 189  | `paddingBottom: 16,`                            | `paddingBottom: tokens.space.md,`                                                        |
| 192  | `marginHorizontal: 16,`                         | `marginHorizontal: tokens.space.md,`                                                     |
| 201  | `borderRadius: 8,`                              | `borderRadius: tokens.borderRadius.small,`                                               |
| 218  | `paddingHorizontal: 16,`                        | `paddingHorizontal: tokens.space.md,`                                                    |
| 219  | `paddingTop: 24,`                               | `paddingTop: tokens.space.lg,`                                                           |

- [ ] **Step 2: PhoneLoginScreen.tsx** — add `import {tokens} from '@/shared/styles';`

| Line     | Before                                            | After                                                                     |
| -------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| 130      | `style={{ paddingHorizontal: 16 }}`               | `style={{paddingHorizontal: tokens.space.md}}`                            |
| 181      | `style={{ marginHorizontal: 16, marginTop: 24 }}` | `style={{marginHorizontal: tokens.space.md, marginTop: tokens.space.lg}}` |
| 217      | `marginBottom: insets.bottom`                     | unchanged (runtime-derived)                                               |
| 247      | `paddingHorizontal: 16,`                          | `paddingHorizontal: tokens.space.md,`                                     |
| 248      | `paddingTop: 100,`                                | `paddingTop: tokens.space._5xl,` (snap 100→80 — visual check)             |
| 249      | `paddingBottom: 16,`                              | `paddingBottom: tokens.space.md,`                                         |
| 254      | `paddingHorizontal: 16,`                          | `paddingHorizontal: tokens.space.md,`                                     |
| 255      | `paddingTop: 20,`                                 | `paddingTop: tokens.space.md,` (snap 20→16 — visual check)                |
| 273      | `paddingTop: 8,`                                  | `paddingTop: tokens.space.sm,`                                            |
| 274, 279 | `paddingBottom: 16,`                              | `paddingBottom: tokens.space.md,`                                         |
| 278      | `paddingHorizontal: 16,`                          | `paddingHorizontal: tokens.space.md,`                                     |

Note: PhoneLoginScreen matches error substrings in Vietnamese (see AGENTS.md gotchas) — do not touch any non-style line in this file.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add src/features/auth
git commit -m "refactor(ui): migrate auth screens to spacing/radius tokens"
```

---

### Task 8: Full verification gates + grep audit

- [ ] **Step 1: Quality gates**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: all green (baseline was green; migrations are style-value changes only)

- [ ] **Step 2: Grep audit — no raw spacing/radius left in scope**

Run:

```bash
rg -n 'gap: \d+|padding[A-Za-z]*: \d+|margin[A-Za-z]*: \d+|borderRadius: \d+' src/features src/shared/components
```

Expected: only exempt lines — `0` values, `insets.bottom`, `FSwitch` `paddingHorizontal: 1` with its comment, and `height: 8` in FSlider `trackStyle` (height is a dimension; the regex matches it via `borderRadius` on the same line — only the borderRadius part must be tokenized).

If any non-exempt hit appears, migrate it using the Task 4–7 tables, re-run gates.

- [ ] **Step 3: Visual pass on flagged snaps**

Run the app (iOS simulator) and eyeball: onboarding logo/dots area (130→120, 36→32, marginTop 12→8), OTP + PhoneLogin top padding (100→80, 20→16), FSwitch pill/circle (should be identical), FSlider/FProgress (5→4, 15→16 shifts are 1px).

Expected: no broken layout. If a snap looks wrong, use the next-larger token only with a `// ` comment noting the deviation, per spec.

- [ ] **Step 4: Final commit (only if audit fixes were needed)**

```bash
git add -A
git commit -m "refactor(ui): fix remaining raw spacing values found by audit"
```
