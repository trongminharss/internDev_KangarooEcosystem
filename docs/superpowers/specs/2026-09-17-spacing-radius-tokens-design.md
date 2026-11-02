# Spacing, Radius & Gap Tokens — Design

Date: 2026-09-17
Status: Approved

## Goal

Document the spacing/radius/gap token system in `DESIGN.md`, add enforcement
rules to `CLAUDE.md` (= `AGENTS.md` symlink), and migrate all existing raw
numeric values in screens/components onto the tokens.

## Current State (findings)

- `src/shared/styles/tokens.ts` defines three Figma-derived groups:
  - `space` — layout scale, 8px grid: `xs=4, sm=8, md=16, lg=24, xl=32, _2xl=40, _3xl=48, _4xl=56, _5xl=64, _6xl=80, _7xl=120`
  - `spacing` — component scale (Figma `spacing/*`): `_3xs=4, _2xs=8, xs=12, s=16`
  - `borderRadius` — `small=8, medium=16, big=32, full=999`
- `src/shared/styles/spacing.ts` exposes ready-made StyleSheet helpers
  (`p_/px_/py_/gap_` × `3xs/2xs/xs/s`) over `tokens.spacing`.
- **Neither file is imported anywhere** — `spacing` is not even exported from
  the barrel `src/shared/styles/index.ts`.
- Screens/components use ~80 raw numeric values today (padding/gap/margin/
  borderRadius), including off-scale values (15, 5, 2, radius 18/20/24).
- `DESIGN.md` §5 has a sync error: `FButtonSize size40` padding documented as
  16, code says 8.
- `AGENTS.md` is a symlink to `CLAUDE.md`; edits go to `CLAUDE.md`.

## Decisions

1. **Keep both scales, exactly as Figma defines them** (no merging):
   - `tokens.space.*` → screen/layout spacing (margins between sections,
     screen padding).
   - `tokens.spacing.*` / `spacing` helpers → padding/gap **inside**
     components.
   - Consequence of the Figma structure: only `spacing` has 12; only `space`
     has 24/32/40+.
2. **Full migration now** (not edit-as-you-touch): all raw values in
   `src/features/**` and `src/shared/components/**` move onto tokens.
3. **Snap off-scale values to the nearest token.** Ties round **down**
   (equidistant values go to the smaller token).
4. `borderWidth` is **not tokenized** — not part of the Figma token set (YAGNI).
   Icon `size`, view `width/height` are out of scope.
5. `borderRadius` snaps are visually noticeable → requires a quick visual pass
   over affected screens after migration.

## Changes

### 1. `src/shared/styles/index.ts` — barrel export

```ts
export * from './FElevation';
export {default as FButtonSize} from './FButtonSize';
export {default as FInputSize} from './FInputSize';
export * from './spacing';
export {tokens} from './tokens';
export * from './FIconStyles';
```

Consumers import from `@/shared/styles` (not deep paths).

### 2. `DESIGN.md` — extend §5 to "Sizes, Spacing & Radius"

Add (keeping existing section numbering for §6+):

- Table `tokens.space` (11 steps) — screen/layout scale, 8px grid.
- Table `tokens.spacing` (4 steps, Figma `spacing/*`) — component-internal
  padding/gap.
- Table `spacing` helpers (`p_/px_/py_/gap_` × `3xs/2xs/xs/s`) with usage note
  (spread into a style object; avoids repeating common StyleSheet entries).
- Table `tokens.borderRadius` (`small/medium/big/full`) with the Figma usage
  hints (button/small card · card/banner · section divider/large card ·
  pill/circle).
- Usage rules:
  - No raw numbers for `padding*`, `gap`, `margin*`, `borderRadius`.
  - `0` is exempt (explicit reset, not a spacing decision).
  - Values derived at runtime (keyboard offsets, animation coordinates) and
    geometry-coupled component insets (e.g. `FSwitch` thumb inset) are exempt
    but must carry a code comment naming the source.
  - `borderWidth` stays untokenized.
  - New tokens: change `tokens.ts` first, update DESIGN.md in the same commit.
- Fix sync error: `FButtonSize size40` padding `16` → `8` (code is source of
  truth per DESIGN.md's own contract).

### 3. `CLAUDE.md` — new rules in "Theme & UI"

Compact block (~6 lines):

> - Spacing/radius use tokens from `@/shared/styles`: screen/layout →
>   `tokens.space.*`; component-internal padding/gap → `spacing` helpers
>   (`p_s`, `gap_xs`, …) or `tokens.spacing.*`; radius →
>   `tokens.borderRadius.*` (`small/medium/big/full`). No raw numbers for
>   padding/gap/margin/radius (`0` and runtime-derived values with a comment
>   are exempt).
> - Only `tokens.spacing` has 12; only `tokens.space` has 24/32/40+. To add a
>   token: edit `tokens.ts` first, update DESIGN.md in the same commit.

Also update `README.md` (styles token mention) in the same commit, per the
repo's "keep AGENTS.md current" rule.

### 4. Migration of call sites

Scope: `src/features/**` and `src/shared/components/**` (all `createStyles`
factories and inline styles).

Snap mapping:

| Raw value                     | Token                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `1, 2, 3, 5` (spacing)        | `spacing._3xs` / `space.xs` (= 4)                                                                     |
| `6, 7, 10`                    | `spacing._2xs` / `space.sm` (= 8)                                                                     |
| `12` component context        | `spacing.xs` (= 12)                                                                                   |
| `12` layout context (margins) | `space.sm` (= 8) — tie with 16 rounds down; only if visually wrong, use `space.md` (= 16) and note it |
| `15, 20` (spacing)            | `spacing.s` / `space.md` (= 16)                                                                       |
| `46`                          | `space._3xl` (= 48)                                                                                   |
| `130`                         | `space._7xl` (= 120)                                                                                  |
| radius `4`                    | `borderRadius.small` (= 8)                                                                            |
| radius `18, 20`               | `borderRadius.medium` (= 16)                                                                          |
| radius `24`                   | `borderRadius.big` (= 32)                                                                             |

Rules:

- Values already on scale map to the same-number token of the correct scale
  (component context → `spacing.*`, layout context → `space.*`; ambiguous
  8/16 → keep current visual context: margins and screen padding go `space.*`).
- `0` stays literal.
- Icon sizes / width / height are untouched.

### 5. Verification

- `npx tsc --noEmit`, `npm test`, `npm run lint` all green.
- Grep gate: remaining raw `padding*/gap/margin*/borderRadius` numeric values
  in scope must be only `0` or commented exemptions.
- Quick visual pass over screens whose `borderRadius` snapped (4→8, 18/20→16,
  24→32).

## Out of Scope

- Tokenizing `borderWidth`, icon sizes, view dimensions.
- New ESLint rules / lint enforcement (no reliable plugin; custom rule is
  over-engineering).
- Changing `FButtonSize` / `FInputSize` internals (their embedded padding/
  radius already match tokens; only the DESIGN.md doc error is fixed).
