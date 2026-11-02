# AGENTS.md Multi-Agent Rules Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing `CLAUDE.md` rules to every standards-following AI agent (Codex, opencode, Zed, Cursor 2025+, Jules, Amp) via an `AGENTS.md` symlink.

**Architecture:** Documentation-only change per spec `docs/superpowers/specs/2026-09-08-agents-md-rules-coverage-design.md` — one new symlink (`AGENTS.md → CLAUDE.md`) and one guard line appended to `CLAUDE.md`. No code, no dependency, no config changes.

**Tech Stack:** Markdown + POSIX symlink. No build step.

## Global Constraints

- `CLAUDE.md` stays the single source of truth — never copy its content into `AGENTS.md`.
- Symlink must be **relative** (`ln -s CLAUDE.md AGENTS.md`), not absolute — portable across machines.
- Exactly **one commit** covers both changes (spec D4): `docs: expose project rules to all agents via AGENTS.md symlink`.
- No other line of `CLAUDE.md` may change. README, code, `package.json`, configs: untouched.
- Working directory for all commands: repo root (`/Volumes/DEV/RN/RNCore`). Single branch `dev`.

---

### Task 1: Add guard line to CLAUDE.md

**Files:**

- Modify: `/Volumes/DEV/RN/RNCore/CLAUDE.md` (section "Keeping This File Current", line 156)

**Interfaces:**

- Consumes: nothing.
- Produces: the rule that protects the symlink from being overwritten by a copy (spec §3.2).

- [ ] **Step 1: Append the guard bullet to the "Keeping This File Current" section**

Find this exact text at the end of `CLAUDE.md`:

```markdown
## Keeping This File Current

When changing any convention, update both `README.md` and this file in the same commit.
```

Replace with:

```markdown
## Keeping This File Current

When changing any convention, update both `README.md` and this file in the same commit.

- `AGENTS.md` is a symlink to this file — never replace it with a copy or edit it directly; the symlink keeps every standards-following agent in sync.
```

Do not change any other line.

- [ ] **Step 2: Verify the guard line landed exactly once and length budget holds**

Run: `grep -c 'AGENTS.md. is a symlink' CLAUDE.md`
Expected: `1` (the `.` in the pattern matches the backtick around `AGENTS.md`)

Run: `wc -l < CLAUDE.md`
Expected: `157` (150–250 budget intact; no other line added or removed)

---

### Task 2: Create the AGENTS.md symlink, verify, and commit both changes

**Files:**

- Create: `/Volumes/DEV/RN/RNCore/AGENTS.md` (symlink → `CLAUDE.md`)
- Modify (already done in Task 1): `CLAUDE.md`

**Interfaces:**

- Consumes: `CLAUDE.md` from Task 1.
- Produces: end state — every AGENTS.md-standard agent picks up the full ruleset. Nothing in the app imports or reads `AGENTS.md`; it is agent tooling only.

- [ ] **Step 1: Create the relative symlink**

```bash
ln -s CLAUDE.md AGENTS.md
```

- [ ] **Step 2: Verify the symlink resolves and is staged as a symlink**

Run: `ls -la AGENTS.md`
Expected output contains: `AGENTS.md -> CLAUDE.md`

Run: `head -3 AGENTS.md`
Expected output (resolves through the symlink):

```
# CLAUDE.md

Rules for AI assistants working on this repository. Follow them unless the user explicitly overrides.
```

```bash
git add AGENTS.md CLAUDE.md
git ls-files -s AGENTS.md
```

Expected: mode `120000` (symlink), e.g. `120000 <sha> 0	AGENTS.md`. If it shows `100644`, the symlink was materialized as a regular file — delete it (`rm AGENTS.md`), redo Step 1, re-add.

- [ ] **Step 3: Confirm the codebase is untouched (docs-only baseline)**

Run: `npx tsc --noEmit`
Expected: exits 0, no output.

Run: `npm test 2>&1 | tail -5`
Expected: `Test Suites: N passed, N total` and `Tests: M passed, M total`, 0 failures — same N/M as before this plan.

Run: `git status --short`
Expected: exactly two staged entries — `A  AGENTS.md` and `M  CLAUDE.md`. Nothing else.

- [ ] **Step 4: Commit (single commit for both changes, spec D4)**

```bash
git commit -m "docs: expose project rules to all agents via AGENTS.md symlink"
```

Run: `git log --oneline -1`
Expected: `docs: expose project rules to all agents via AGENTS.md symlink` as the latest commit on `dev`.
