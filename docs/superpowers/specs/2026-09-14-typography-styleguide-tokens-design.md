# Design: Adopt styleguide typography tokens in FTheme

Date: 2026-09-14
Status: Approved

## Background

The new Figma style guide defines an 18-token primitive typography ramp. The team
delivered it as `/Users/macmini4/Downloads/FThemefixed.ts`, which reworks
`src/core/theme/FTheme.ts`:

- 9 headline tokens (`headline0-8`, ClanPro-Bold ramp 128/128 down to 22/28)
- 4 `bodyLabel01-04` (ClanPro-Medium 18/28, 16/24, 14/20, 12/12)
- 5 `body01-05` (ClanPro-Book 18/28, 16/24, 14/20, 12/18, 10/12)

Today `FTheme.ts` hand-rolls 29 tokens (4 navigation + 25 legacy names like
`title1`, `bodyText2`) with weight map 400/500/600, plus the `subtitle4`
fontSize-1 typo. 56 `FText typo="..."` call sites across 20 files use the
legacy names.

## Decision

Adopt the provided file **verbatim** — it is the styleguide source of truth.
Legacy token names stay as aliases remapped to canonical values, so no call
site changes and compilation is unaffected. Migration to canonical names
happens gradually, edit-as-you-touch (user decision; full migration and alias
removal are out of scope).

## Changes

### 1. `src/core/theme/FTheme.ts` — replace content

Replace with the fixed file's content:

- New `FontFamily` const (`book`/`medium`/`bold`) and `createFontStyle` /
  `createNavigationFontStyle` factories; `TypographyStyles` export (the 18
  canonical tokens) for new code to consume.
- `fontWeight` typing widened to `TextStyle['fontWeight']` /
  `NonNullable<TextStyle['fontWeight']>` (replaces the hand-rolled 6-value union).
- Module augmentation grows from 29 to 47 keys: 4 navigation
  (`regular`/`medium`/`bold`/`heavy`) + 18 canonical + 25 legacy aliases.
- Navigation fonts: `regular` = body03 @ '400', `medium` = bodyLabel03 @ '500',
  `bold` = Bold 14/20 @ '700', `heavy` = Bold 16/24 @ '700' (lineHeight 22→20 on
  the 14px pair, weight '600'→'700' on the bold pair).
- All 25 legacy aliases remapped to canonical tokens (visual deltas below).
- `colors` untouched. `FontStylesProps` / `ColorsProps` shapes unchanged.

### 2. `src/core/theme/paperTheme.ts` — 1 line

Non-body/non-label MD3 fonts keep `ClanPro-Bold` but move fontWeight
`'600'` → `'700'` to match the new `bold`/`heavy` navigation weights. Cosmetic
only — `fontFamily` is explicit and takes precedence.

### 3. No changes required (verified)

- `FText.tsx` — `typo: keyof typeof FTheme.fonts` widens automatically.
- `DarkTheme.ts` — `darkFonts` derives generically from `FTheme.fonts`.
- All 56 `FText` call sites — legacy names still exist as aliases.
- No test asserts font token values (grepped).

### 4. Docs — same commit, per repo convention

- `CLAUDE.md` (the real file behind the `AGENTS.md` symlink): typography
  bullet — 18 canonical + 25 alias tokens, weight map 400→Book / 500→Medium /
  700→Bold, new code uses canonical `headline*`/`body*`/`bodyLabel*` keys,
  legacy names are deprecated aliases.
- `README.md`: matching note.
- `DESIGN.md` §3 Typography: replace the 29-key table with the canonical ramp +
  alias-mapping table; drop the `subtitle4` ⚠ row (fixed).

## Visual impact (intentional, per styleguide)

Notable alias remaps: `largeTitle` 38/48→36/40; `title1` 24/32→26/32;
`title2` 20/28→22/28; `title3` Bold 16/24→Medium 18/28; `title5` Bold 14/22→
Medium 14/20; `title6` 14/22→12/12; `bodyText1` 16/28→18/28; `bodyText2`
14/22→16/24; `buttonText1` Bold 16/24→Medium 18/28; `buttonText2` 14/22→16/24;
`buttonText3` Book→Medium 14/20; `subtitle2`/`label3` 14/22→14/20;
`subtitle3`/`subtitle4`/`label5` → 12px ramp (fixes the `subtitle4` fontSize-1
typo). Unchanged: `title4`, `subtitle1`, `label1`.

## Error handling

None applicable — data-only change with alias names preserved, so the compile
surface is unchanged.

## Testing & verification

- No new unit tests — token data, no logic.
- Gates stay green: `npx tsc --noEmit`, `npm test`, `npm run lint`.
- Manual spot-check on simulator: Splash/Login/Account headings,
  `TypographySection` (home) renders the demo labels with the new sizes.

## Out of scope

- Migrating the 56 legacy `typo=` call sites to canonical names (gradual,
  edit-as-you-touch).
- Deleting the deprecated aliases (only after full migration).
