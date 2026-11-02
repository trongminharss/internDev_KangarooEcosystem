# Design: Bundle Clan Pro font

Date: 2026-09-14
Status: Approved

## Background

`FTheme.ts` references `fontFamily: 'Inter'` in 6 places (regular, medium, bold, heavy, subtitle3, subtitle4) but no font file is bundled. The app targets Vietnamese (`lng: 'vi'`). The team provides the Clan Pro font family (Kangaroo's VN font set), which has full Vietnamese diacritics coverage — verified with fontTools across all glyphs tested (Ạ ỹ Đ ế ệ ờ).

Source files: `/Users/macmini4/Downloads/tailieu-kangaroo/KGR_VN_Font/Clan Pro/`

| Source file         | PostScript name    | Vietnamese                               |
| ------------------- | ------------------ | ---------------------------------------- |
| ClanPro-Regular.ttf | ClanPro-Book       | full                                     |
| ClanPro-Medium.ttf  | ClanPro-Medium     | full                                     |
| ClanPro-Bold.ttf    | ClanPro-Bold       | full                                     |
| (italic variants)   | ClanProVN-\*Italic | full — NOT bundled, theme uses no italic |

## Decision

Manual native linking (no new dependencies). `react-native-asset` was considered and rejected: it automates a one-time, rarely-repeated config step.

## Changes

### 1. Font files — `src/assets/fonts/` (source of truth)

Copy from the source dir, renaming Regular so the filename matches its PostScript name (Android resolves custom fonts by filename minus extension; iOS by PostScript name — names must match so no per-platform code is needed):

- `ClanPro-Regular.ttf` → `src/assets/fonts/ClanPro-Book.ttf`
- `ClanPro-Medium.ttf` → `src/assets/fonts/ClanPro-Medium.ttf`
- `ClanPro-Bold.ttf` → `src/assets/fonts/ClanPro-Bold.ttf`

### 2. Android

Copy the same 3 files to `android/app/src/main/assets/fonts/`. No further config — Android picks up fonts from assets automatically.

### 3. iOS

- Add the 3 `.ttf` files to the Xcode project resources (`ios/ReactCore.xcodeproj`, Resources build phase) via a small Ruby script using the `xcodeproj` gem — already available through the repo's Bundler setup (cocoapods dependency), so no new dependency.
- Register them in `ios/ReactCore/Info.plist`:

```xml
<key>UIAppFonts</key>
<array>
  <string>ClanPro-Book.ttf</string>
  <string>ClanPro-Medium.ttf</string>
  <string>ClanPro-Bold.ttf</string>
</array>
```

### 4. Code — `src/core/theme/FTheme.ts`

Replace all 6 `'Inter'` literals with the weight-matched Clan Pro family name (literal strings, same style as today — no abstraction):

| Theme tokens (fontWeight)           | New fontFamily   |
| ----------------------------------- | ---------------- |
| regular, subtitle3, subtitle4 (400) | `ClanPro-Book`   |
| medium (500)                        | `ClanPro-Medium` |
| bold, heavy (600)                   | `ClanPro-Bold`   |

No other file references `Inter` (verified by grep).

### 5. Docs

Update the AGENTS.md bullet "`fontFamily: 'Inter'` is referenced but no font file is bundled" (edit the real file the symlink points to) and the matching README note: fonts are now bundled, list the three families and the weight mapping. Same commit as the code change, per repo convention.

## Error handling

None applicable. If a family name is wrong, RN falls back to the system font per platform — the risk is a silent visual mismatch, which is why the PostScript names were verified up front. `react-native.config.js` stays absent.

## Testing & verification

- No new unit tests — the change is config/data with no logic.
- Gates: `npx tsc --noEmit`, `npm test`, `npm run lint` (baseline is clean).
- Manual check after build on simulator: text renders in Clan Pro on both platforms (spot-check regular + bold weights).

## Addendum: full-coverage audit fix (2026-09-14, same day)

Post-implementation audit found the app still rendered the system font almost everywhere:

1. 23 of 29 `FTheme.fonts` tokens had no `fontFamily` — 57 of 58 `FText` usages (titles, buttons, labels, body) fell back to the system font; only `subtitle3` used Clan Pro.
2. `buildPaperTheme` mapped only colors, so Dialog/Snackbar/TextInput text kept Paper's MD3 default fonts.

Fix (approved by user, "chuyển toàn bộ về sử dụng clan pro"):

- Every `FTheme.fonts` token now sets `fontFamily` explicitly, weight-mapped (400/'normal'→`ClanPro-Book`, 500→`ClanPro-Medium`, 600→`ClanPro-Bold`); verified 29/29 tokens consistent by script.
- `buildPaperTheme` remaps all MD3 fonts: `body*`→`ClanPro-Book` (400), `label*`→`ClanPro-Medium` (500), display/headline/title→`ClanPro-Bold` (600).
- Paper mock in `__tests__/App.test.tsx` extended with `fonts: {}` to mirror the real MD3 theme shape.
- Docs (CLAUDE.md bullet + DESIGN.md typography/paper sections) updated in the same commit per repo convention.
