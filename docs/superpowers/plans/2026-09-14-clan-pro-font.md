# Clan Pro Font Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bundle the Clan Pro font family (Book/Medium/Bold) and switch the app theme from the unbundled 'Inter' placeholder to it.

**Architecture:** Font `.ttf` files live in `src/assets/fonts/` as source of truth and are copied to the two native locations Android (`android/app/src/main/assets/fonts/`) and iOS (`ios/ReactCore/` + `UIAppFonts` in Info.plist + Resources build phase). No new dependencies; linking is manual and committed.

**Tech Stack:** React Native 0.87, plain file copies, `xcodeproj` ruby gem (1.27.0, already installed system-wide — do NOT use `bundle exec`, the repo Bundler version is broken on this machine), plist XML edit.

**Spec:** `docs/superpowers/specs/2026-09-14-clan-pro-font-design.md`

**Key fact (verified with fontTools):** PostScript names are `ClanPro-Book` (file ClanPro-Regular.ttf), `ClanPro-Medium`, `ClanPro-Bold`. The Regular file MUST be renamed to `ClanPro-Book.ttf` so Android (resolves by filename) and iOS (resolves by PostScript name) agree. All files have full Vietnamese diacritics. Italic variants exist but are not bundled — the theme uses no italics.

**Font source directory:** `/Users/macmini4/Downloads/tailieu-kangaroo/KGR_VN_Font/Clan Pro/`

---

### Task 1: Copy font files into the repo

**Files:**

- Create: `src/assets/fonts/ClanPro-Book.ttf`, `src/assets/fonts/ClanPro-Medium.ttf`, `src/assets/fonts/ClanPro-Bold.ttf`
- Create: `android/app/src/main/assets/fonts/` (same 3 files)
- Create: `ios/ReactCore/` (same 3 files)

- [ ] **Step 1: Copy + rename into src/assets/fonts**

```bash
mkdir -p src/assets/fonts
cp "/Users/macmini4/Downloads/tailieu-kangaroo/KGR_VN_Font/Clan Pro/ClanPro-Regular.ttf" src/assets/fonts/ClanPro-Book.ttf
cp "/Users/macmini4/Downloads/tailieu-kangaroo/KGR_VN_Font/Clan Pro/ClanPro-Medium.ttf" src/assets/fonts/ClanPro-Medium.ttf
cp "/Users/macmini4/Downloads/tailieu-kangaroo/KGR_VN_Font/Clan Pro/ClanPro-Bold.ttf" src/assets/fonts/ClanPro-Bold.ttf
```

- [ ] **Step 2: Copy to Android + iOS native locations**

```bash
mkdir -p android/app/src/main/assets/fonts
cp src/assets/fonts/ClanPro-*.ttf android/app/src/main/assets/fonts/
cp src/assets/fonts/ClanPro-*.ttf ios/ReactCore/
```

- [ ] **Step 3: Verify placement**

Run: `ls src/assets/fonts android/app/src/main/assets/fonts ios/ReactCore | grep ClanPro`
Expected: `ClanPro-Book.ttf`, `ClanPro-Bold.ttf`, `ClanPro-Medium.ttf` listed three times (once per directory).

- [ ] **Step 4: Commit**

```bash
git add src/assets/fonts android/app/src/main/assets/fonts ios/ReactCore/ClanPro-*.ttf
git commit -m "chore: add clan pro font files"
```

If `git add` stages nothing, check root `.gitignore` for `*.ttf` patterns before proceeding — fonts must be committed, not ignored.

---

### Task 2: Link fonts on iOS

**Files:**

- Modify: `ios/ReactCore/Info.plist` (insert `UIAppFonts` before `<key>UIBackgroundModes</key>`, line 42)
- Modify: `ios/ReactCore.xcodeproj/project.pbxproj` (via script)

- [ ] **Step 1: Add UIAppFonts to Info.plist**

Open `ios/ReactCore/Info.plist` and insert between the `RCTNewArchEnabled` entry (ends line 41) and `<key>UIBackgroundModes</key>` (line 42), keeping the file's tab indentation:

```xml
		<key>UIAppFonts</key>
		<array>
			<string>ClanPro-Book.ttf</string>
			<string>ClanPro-Medium.ttf</string>
			<string>ClanPro-Bold.ttf</string>
		</array>
```

- [ ] **Step 2: Validate the plist**

Run: `plutil -lint ios/ReactCore/Info.plist`
Expected: `ios/ReactCore/Info.plist: OK`

- [ ] **Step 3: Register fonts in the Xcode project (Resources build phase)**

Run this exact script from the repo root:

```bash
ruby -e "
require 'xcodeproj'
project = Xcodeproj::Project.open('ios/ReactCore.xcodeproj')
target = project.targets.find { |t| t.name == 'ReactCore' } or abort 'target ReactCore not found'
group = project.main_group['ReactCore'] or abort 'group ReactCore not found'
fonts = %w[ClanPro-Book.ttf ClanPro-Medium.ttf ClanPro-Bold.ttf]
fonts.each do |font|
  next if group.files.any? { |f| f.path == font }
  ref = group.new_reference(font)
  target.resources_build_phase.add_file_reference(ref)
end
project.save
puts project.targets[0].resources_build_phase.files.map(&:display_name).grep(/ClanPro/)
"
```

Expected output (the script is idempotent — safe to re-run):

```
ClanPro-Book.ttf
ClanPro-Medium.ttf
ClanPro-Bold.ttf
```

- [ ] **Step 4: Commit**

```bash
git add ios/ReactCore/Info.plist ios/ReactCore.xcodeproj/project.pbxproj
git commit -m "chore(ios): link clan pro fonts in resources and infoplist"
```

---

### Task 3: Switch FTheme to Clan Pro

**Files:**

- Modify: `src/core/theme/FTheme.ts:133,141,149,157,280,288` (the only 6 `fontFamily: 'Inter'` occurrences in the repo)

- [ ] **Step 1: Replace 'Inter' per weight**

Run from repo root (line numbers match the committed baseline; the verify step below catches any drift):

```bash
sed -i '' \
  -e "133s/'Inter'/'ClanPro-Book'/" \
  -e "141s/'Inter'/'ClanPro-Medium'/" \
  -e "149s/'Inter'/'ClanPro-Bold'/" \
  -e "157s/'Inter'/'ClanPro-Bold'/" \
  -e "280s/'Inter'/'ClanPro-Book'/" \
  -e "288s/'Inter'/'ClanPro-Book'/" \
  src/core/theme/FTheme.ts
```

Mapping (from the spec): 400 → `ClanPro-Book` (lines 133 regular, 280 subtitle3, 288 subtitle4), 500 → `ClanPro-Medium` (line 141 medium), 600 → `ClanPro-Bold` (lines 149 bold, 157 heavy).

- [ ] **Step 2: Verify the replacement**

Run: `grep -c "'ClanPro-" src/core/theme/FTheme.ts && grep -c "'Inter'" src/core/theme/FTheme.ts; true`
Expected: `6` then `0`.

Run: `grep -n "'ClanPro-" src/core/theme/FTheme.ts`
Expected lines: 133 `ClanPro-Book`, 141 `ClanPro-Medium`, 149 `ClanPro-Bold`, 157 `ClanPro-Bold`, 280 `ClanPro-Book`, 288 `ClanPro-Book`.

- [ ] **Step 3: Typecheck + tests**

Run: `npx tsc --noEmit && npm test`
Expected: tsc silent, all tests pass (baseline is clean; no test asserts on 'Inter').

- [ ] **Step 4: Commit**

```bash
git add src/core/theme/FTheme.ts
git commit -m "feat(theme): switch font family from inter to clan pro"
```

---

### Task 4: Update docs + full quality gates

**Files:**

- Modify: `CLAUDE.md:143` (AGENTS.md is a symlink to CLAUDE.md — edit CLAUDE.md, never the symlink)

- [ ] **Step 1: Update the font bullet**

In `CLAUDE.md`, replace the line:

```
- `fontFamily: 'Inter'` is referenced but no font file is bundled — known state; do not add font files on your own.
```

with:

```
- Fonts are bundled: Clan Pro (`ClanPro-Book` / `ClanPro-Medium` / `ClanPro-Bold`). Source of truth `src/assets/fonts/`, linked manually into `android/app/src/main/assets/fonts/` + `ios/ReactCore` resources + `UIAppFonts` in Info.plist. Weight map: 400→Book, 500→Medium, 600→Bold. Italic variants exist but are not bundled.
```

- [ ] **Step 2: Full quality gates**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: all three pass.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update font convention to clan pro"
```

---

### Manual follow-up (not automatable here)

Build on a simulator/device and spot-check: body text renders Clan Pro Book, headings with `heavy`/`bold` tokens render Clan Pro Bold, and Vietnamese diacritics render without per-glyph font fallback (mixed-font look means the family name is wrong on that platform).
