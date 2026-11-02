# Design: Canonical typography defaults for FTextInput and FFilledButton

Date: 2026-09-14
Status: Approved

## Background

Continuing the styleguide token adoption (`2026-09-14-typography-styleguide-tokens-design.md`),
the two shared components still default to legacy alias tokens:

- `src/shared/components/FTextInput.tsx:50` — `textStyle = FTheme.fonts.bodyText1`
  (alias → `body01`, ClanPro-Book 18/28)
- `src/shared/components/FFilledButton.tsx:22` — `textStyle = FTheme.fonts.buttonText1`
  (alias → `bodyLabel01`, ClanPro-Medium 18/28)

`FFilledButton` is the only button component in the repo; none of its 8 call
sites (ButtonsSection, FeedbackSection, OverlaySection) passes a `textStyle`
override, and `FTextInput` callers use the default — so changing the two
defaults changes every usage. The user wants the styleguide tokens directly:
input text = `body02`, button labels = `bodyLabel03`.

## Decision

Change the two defaults in place to canonical tokens. No new props, no alias
remaps (those would leak the change to unrelated tokens or add unused API).

## Changes

1. `src/shared/components/FFilledButton.tsx:22` — default becomes
   `FTheme.fonts.bodyLabel03` (ClanPro-Medium 14/20; was 18/28).
2. `src/shared/components/FTextInput.tsx:50` — default becomes
   `FTheme.fonts.body02` (ClanPro-Book 16/24; was 18/28).
3. Both canonical tokens carry no `fontWeight` field. Not a regression: the
   previous defaults (via aliases `body01`/`bodyLabel01`) had none either;
   `fontFamily` governs rendering. `FFilledButton.tsx:48` and the Paper
   `TextInput` simply read `undefined`, as today.
4. Unchanged on purpose: `FTextInput` error text keeps `typo="subtitle3"`
   (`FTextInput.tsx:163`); no call-site edits anywhere.
5. Docs, same commit: DESIGN.md §7 component table — `FFilledButton` row
   tokens `buttonText*` → `bodyLabel03`; `FTextInput` row gains `body02`.
6. Commit note: `FTextInput.tsx` carries two pre-existing uncommitted lines of
   the user's own underline fixes (`activeUnderlineColor`,
   `underlineColorAndroid` at ~121-122). User approved committing them
   together (option a) — same component, same visual-topic commit.

## Visual impact (intentional)

- Button labels: Medium 18/28 → Medium 14/20 — clearly smaller, most visible
  on size48 buttons.
- Input text: Book 18/28 → Book 16/24.

## Error handling

None applicable — constant token swap, no logic.

## Testing & verification

- No component tests assert these defaults today; none added (data-only).
- Gates: `npx tsc --noEmit`, `npm test`, `npm run lint` (baseline clean).
- Manual: Home ButtonsSection (size48 label) and any Login input render at the
  new sizes.

## Out of scope

- Migrating remaining legacy `typo=` call sites to canonical names.
- Touching `FProgress`/`FSlider` `buttonText2` usages.
