# Input/Button Canonical Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch the `FTextInput` text default to `body02` and the `FFilledButton` label default to `bodyLabel03` (canonical styleguide tokens), and sync DESIGN.md's component table.

**Architecture:** Two one-line default-token swaps in shared components (no call sites pass overrides, so defaults govern all usages), plus a two-row doc touch-up, in a single commit.

**Tech Stack:** TypeScript / React Native; tokens from `FTheme.fonts` (`TypographyStyles` canonical keys adopted in the previous change).

## Global Constraints

- Package manager is **npm**, never yarn. Gates before commit: `npx tsc --noEmit`, `npm test`, `npm run lint` (baseline: tsc clean, 30/30 tests, lint 0 errors / 95 pre-existing warnings).
- Commit format: `type(scope): lowercase imperative summary`.
- Token facts (from `src/core/theme/FTheme.ts`): `body02` = ClanPro-Book 16/24, `bodyLabel03` = ClanPro-Medium 14/20; canonical tokens carry **no** `fontWeight` field — consumers read `undefined`, same as the outgoing aliases.
- `FTextInput.tsx` contains two pre-existing uncommitted user lines (`activeUnderlineColor="transparent"` and `underlineColorAndroid="transparent"`, around lines 121-122). User approved committing them together (spec §Changes item 6) — `git add` the whole file.
- Do NOT stage `ios/ReactCore.xcodeproj/project.pbxproj` (the other pre-existing dirty file). Stage only files named in the commit step.
- No new tests (data-only swap; no component test asserts these defaults).
- Do not touch: error text `typo="subtitle3"` in FTextInput, `FProgress`/`FSlider` `buttonText2` usages, any call site.

---

### Task 1: Swap defaults and sync docs

**Files:**

- Modify: `src/shared/components/FFilledButton.tsx:22`
- Modify: `src/shared/components/FTextInput.tsx:50`
- Modify: `DESIGN.md` (§7 component table, `FFilledButton` and `FTextInput` rows)

**Interfaces:**

- Consumes: `FTheme.fonts.body02`, `FTheme.fonts.bodyLabel03` (already exported; typed `FontStylesProps`).
- Produces: default `FTextInputProps` text style = `body02`; default `FFilledButtonProps` text style = `bodyLabel03`. No signatures change.

- [ ] **Step 1: Swap the FFilledButton default**

In `src/shared/components/FFilledButton.tsx` line 22, change:

```ts
  textStyle = FTheme.fonts.buttonText1,
```

to:

```ts
  textStyle = FTheme.fonts.bodyLabel03,
```

- [ ] **Step 2: Swap the FTextInput default**

In `src/shared/components/FTextInput.tsx` line 50, change:

```ts
  textStyle = FTheme.fonts.bodyText1,
```

to:

```ts
  textStyle = FTheme.fonts.body02,
```

Leave the two pre-existing user lines (`activeUnderlineColor="transparent"`, `underlineColorAndroid="transparent"`) untouched — they commit together per Global Constraints.

- [ ] **Step 3: Sync the DESIGN.md §7 component table**

In the `## 7. Component Inventory` table, change the row:

```markdown
| `FFilledButton` | primary actions | `FButtonSize`, `primary*`, `buttonText*` |
```

to:

```markdown
| `FFilledButton` | primary actions | `FButtonSize`, `primary*`, `bodyLabel03` |
```

and the row:

```markdown
| `FTextInput` | form inputs | `FInputSize`, `placeHolder`, `border*` |
```

to:

```markdown
| `FTextInput` | form inputs | `FInputSize`, `body02`, `placeHolder`, `border*` |
```

- [ ] **Step 4: Verify no other reference regressed**

```bash
rg -n "buttonText1|bodyText1" src/shared/components/FFilledButton.tsx src/shared/components/FTextInput.tsx
```

Expected: no output. (`rg "buttonText\*|FTextInput.*body02" DESIGN.md` should show the two updated rows.)

- [ ] **Step 5: Run the gates**

```bash
npx tsc --noEmit && npm test && npm run lint
```

Expected: tsc clean, 30/30 tests pass, lint 0 errors / 95 pre-existing warnings.

- [ ] **Step 6: Commit**

```bash
git add src/shared/components/FFilledButton.tsx src/shared/components/FTextInput.tsx DESIGN.md
git commit -m "feat(ui): switch input and button defaults to styleguide tokens"
```

Expected: `git show --stat HEAD` lists exactly those 3 files (`FTextInput.tsx` includes the user's 2 underline lines); `ios/ReactCore.xcodeproj/project.pbxproj` stays unstaged.

---

### Task 2: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Re-run all gates on the final tree**

```bash
npx tsc --noEmit && npm test && npm run lint
```

Expected: all green (baseline as in Global Constraints).

- [ ] **Step 2: Confirm clean scope**

```bash
git status --short
```

Expected: only `ios/ReactCore.xcodeproj/project.pbxproj` remains dirty.

- [ ] **Step 3: (Manual, on simulator) Visual spot-check**

Home → ButtonsSection: size48 button label renders 14/20 Medium (visibly smaller than before). Any form input (e.g. Login): input text renders 16/24 Book.
