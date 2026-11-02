# Design: DESIGN.md — Project Style Guide (Theme-Synced)

- **Date**: 2026-09-09
- **Status**: Approved
- **Deliverables**: rewritten `DESIGN.md` (style guide), new `ARCHITECTURE.md` (moved architecture content)
- **Supersedes**: `2026-09-08-design-md-system-documentation-design.md`
- **Commit (spec)**: `docs(spec): rework DESIGN.md into theme style guide`
- **Commits (implementation)**: `docs: move architecture reference to ARCHITECTURE.md`, `docs: rework DESIGN.md into project style guide`

## 1. Background

The 2026-09-08 spec defined `DESIGN.md` as a system architecture reference. A review
against published conventions showed a mismatch with the owner's intent:

- Google's "Design Docs at Google" (Malte Ubl, 2020) defines design docs as
  _architecture / trade-off planning artifacts_ — the current doc matches that
  convention's content, but Google treats them as point-in-time planning documents,
  not repo-root living references.
- GitHub community standards (README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT,
  templates) include **no** `DESIGN.md` convention at all — neither meaning is standard.
- What Google publishes for _visual_ design is **Material Design 3** (color roles,
  type scale, elevation levels) — the style-guide model. The project already implements
  an MD3-based token system (`FTheme`/`DarkTheme` + `ColorsProps` + `FTheme.fonts` +
  `Felevation` + `F*Size`, mapped to Paper via `buildPaperTheme`) but documents it
  nowhere.

Decision (owner, 2026-09-09): **Option B** — `DESIGN.md` becomes the project style
guide synced with the theme; the architecture content moves to `ARCHITECTURE.md`.

## 2. Requirements

1. Language: English.
2. `ARCHITECTURE.md` receives the current architecture content via `git mv`
   (preserve rename history) with only title and intro tweaks; all 5 Mermaid
   diagrams and verified facts stay unchanged.
3. New `DESIGN.md` documents the actual token system, values quoted exactly from
   source: color groups (brand, status, surfaces/neutrals, text-opacity ramp,
   borders) in light **and** dark values; MD3 role mapping via `buildPaperTheme`;
   the 27-entry `FTheme.fonts` scale + 4 navigation fonts; `Felevation` tokens
   (iOS shadow params vs Android elevation); `FButtonSize` / `FInputSize`; the
   `FIcon` SVG-token system; F-component inventory.
4. Facts only; intentional quirks labeled as intentional. Known deviations to
   document as-is: `SplashScreen` hardcoded `'#fff'`; `subtitle4` `fontSize: 1`
   (likely typo, kept as-is); `Inter` font referenced but not bundled.
5. No changes to `README.md`, `AGENTS.md`/`CLAUDE.md`, or any source file. The
   `subtitle4` typo fix is explicitly out of scope.

## 3. DESIGN.md Outline

1. Purpose & theme pipeline (`FTheme`/`DarkTheme` → `useTheme()` → `buildPaperTheme` → MD3)
2. Color system (tables with light/dark hex values; dark-theme `white`/`black` inversion)
3. Typography (full `fonts` scale; navigation font rules)
4. Elevation (`Felevation`)
5. Sizes (`FButtonSize`, `FInputSize`)
6. Iconography (`FFilled`/`FOutlined`, literal `fill="black"`)
7. Components inventory (`src/shared/components`)
8. Known deviations

## 4. Verification

- Token tables diffed **mechanically** against `FTheme.ts` / `DarkTheme.ts` (script, not eyeball).
- All 5 Mermaid blocks in `ARCHITECTURE.md` still parse (mermaid@11 parser).
- All referenced paths exist; `npx tsc --noEmit` / tests unaffected (docs only).

## 5. Non-Goals

- No README/AGENTS link changes (unchanged from the superseded spec).
- No source code changes, including the `subtitle4` typo.
- No C4/ADR restructuring of ARCHITECTURE.md beyond the move.
