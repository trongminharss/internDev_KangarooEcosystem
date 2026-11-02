# Agent Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bổ sung bộ guardrails cho agent AI: script kiểm tra biên kiến trúc (B1–B4), pre-commit hook chạy quality gates, skill scaffold `add-feature`, agent review `architecture-reviewer`, đồng thời sửa hết lỗi pre-existing để hook strict ngay.

**Architecture:** Script-first, agent-second (spec: `docs/superpowers/specs/2026-09-21-agent-guardrails-design.md`). Một script CommonJS thuần + git hook làm lớp chặn cứng; skill/agent markdown trong `.opencode/` là lớp bổ trợ. Không thêm dependency.

**Tech Stack:** Node CommonJS (script), git hooks (`core.hooksPath`), opencode project skills/agents (markdown + frontmatter), Jest 29 + `@react-native/jest-preset`.

## Global Constraints

- Không thêm dependency nào vào `package.json`.
- Package manager là npm; `.npmrc` có `legacy-peer-deps=true`.
- Conventional commits: `type(scope): lowercase imperative summary` — types: feat, fix, refactor, test, docs, chore. Work trên branch `dev`.
- Test file đặt trong root `__tests__/`, import qua `@/` (trừ script CJS dùng relative).
- KHÔNG dùng `git commit --no-verify` sau khi hook được bật.
- Chất lượng cuối mỗi task: `npx tsc --noEmit`, `npm test`, `npm run lint` đều green (sau Task 2).
- Prettier: `arrowParens: 'avoid'`, `bracketSpacing: false`, `singleQuote: true`, `trailingComma: 'all'` — code trong plan đã theo format này.

---

### Task 1: Fix gốc rễ — OnboardingScreen bỏ qua persist flag trong __DEV__

**Files:**
- Modify: `src/features/onboarding/presentation/screens/OnboardingScreen.tsx:43-54`

**Interfaces:**
- Consumes: `Storage.setItem` từ `@/core/utils/storage` (đã import sẵn trong file).
- Produces: `finish()` luôn persist `KEY_FIRST_LOAD` trước khi navigate — contract mà 2 test trong `__tests__/OnboardingScreen.test.tsx` yêu cầu.

Nguyên nhân đã xác nhận: `finish()` early-return trong nhánh `__DEV__` **trước** `Storage.setItem`; Jest chạy với `__DEV__ === true` nên flag không bao giờ được lưu. Cả hai nhánh đều `navigation.replace('PhoneLogin')` nên shortcut rẽ nhánh là thừa — xóa nó.

- [ ] **Step 1: Sửa `finish()`**

Thay toàn bộ hàm hiện tại (dòng 43-54):

```tsx
  const finish = async () => {
    try {
      if(__DEV__){
         navigation.replace('PhoneLogin');
        return 
      }
      await Storage.setItem(Storage.KEY_FIRST_LOAD, false);
    } catch (e) {
      console.error('[OnboardingScreen] Error:', e);
    }
    navigation.replace('PhoneLogin');
  };
```

bằng:

```tsx
  const finish = async () => {
    try {
      await Storage.setItem(Storage.KEY_FIRST_LOAD, false);
    } catch (e) {
      console.error('[OnboardingScreen] Error:', e);
    }
    navigation.replace('PhoneLogin');
  };
```

- [ ] **Step 2: Chạy test Onboarding**

Run: `npx jest __tests__/OnboardingScreen.test.tsx`
Expected: `3 passed` (trước đó `2 failed`).

- [ ] **Step 3: Chạy full test suite**

Run: `npm test 2>&1 | tail -4`
Expected: `1 failed` duy nhất là `__tests__/OtpScreen.test.tsx` (đã được fix ở commit trước — nếu vẫn fail, dừng và điều tra; không được sửa lẻ tẻ ngoài plan). Kết quả đúng: `Test Suites: 25 passed, 26 total`... — nếu `OtpScreen` đã green từ trước thì expected là **`115 passed, 115 total`**.

- [ ] **Step 4: Commit**

```bash
git add src/features/onboarding/presentation/screens/OnboardingScreen.tsx
git commit -m "fix(onboarding): persist first-load flag on all builds"
```

---

### Task 2: Dọn 3 lỗi lint pre-existing

**Files:**
- Modify: `.eslintrc.js`
- Modify: `src/features/service/presentation/screens/ServiceScreen.tsx:5`
- Modify: `src/shared/components/FAppbar.tsx:37,55`

**Interfaces:**
- Consumes: không.
- Produces: `npm run lint` exit 0 (còn warnings là chấp nhận được — eslint chỉ fail theo error).

- [ ] **Step 1: Thêm override cho `jest.setup.js` vào `.eslintrc.js`**

File hiện tại toàn bộ là:

```js
module.exports = {
  root: true,
  extends: '@react-native',
};
```

thay bằng:

```js
module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['jest.setup.js'],
      env: {jest: true},
    },
  ],
};
```

- [ ] **Step 2: Bỏ import `FText` thừa trong ServiceScreen**

Dòng 5:

```tsx
import {FAppbar, FText} from '@/shared/components';
```

thay bằng:

```tsx
import {FAppbar} from '@/shared/components';
```

- [ ] **Step 3: Bỏ prop `languageIconColor` trong FAppbar**

Xóa dòng 37 trong interface:

```tsx
  languageIconColor?: string;
```

và xóa `languageIconColor,` trong destructuring (dòng 55). Đã grep toàn repo: không có call site nào dùng prop này.

- [ ] **Step 4: Chạy lint + gates**

Run: `npm run lint 2>&1 | tail -2 && npx tsc --noEmit && npm test 2>&1 | tail -3`
Expected: lint `0 errors` (warnings có thể còn), tsc exit 0, tests tất cả passed.

- [ ] **Step 5: Commit**

```bash
git add .eslintrc.js src/features/service/presentation/screens/ServiceScreen.tsx src/shared/components/FAppbar.tsx
git commit -m "chore(lint): fix pre-existing lint errors"
```

---

### Task 3: Boundary script + fixtures + test (TDD)

**Files:**
- Create: `scripts/check-boundaries.js`
- Create: `scripts/__fixtures__/src/core/api/axiosClient.ts`
- Create: `scripts/__fixtures__/src/features/demo/domain/Good.ts`
- Create: `scripts/__fixtures__/src/features/demo/domain/Bad.ts`
- Create: `scripts/__fixtures__/src/features/demo/data/models/Stub.ts`
- Create: `scripts/__fixtures__/src/features/demo/data/BadDataToPresentation.ts`
- Create: `scripts/__fixtures__/src/features/demo/data/datasources/BadNotRemoteDataSource.ts`
- Create: `scripts/__fixtures__/src/features/demo/data/datasources/GoodRemoteDataSource.ts`
- Create: `scripts/__fixtures__/src/features/demo/presentation/Stub.ts`
- Create: `scripts/__fixtures__/src/features/demo/presentation/BadToData.ts`
- Create: `scripts/__fixtures__/src/features/demo/index.ts`
- Test: `__tests__/checkBoundaries.test.ts`
- Modify: `package.json` (thêm script `check:arch`)

**Interfaces:**
- Consumes: không.
- Produces: `checkBoundaries(rootDir: string) → {file: string, line: number, rule: string, spec: string}[]` (export CJS); CLI `node scripts/check-boundaries.js [dir]` exit 1 khi có vi phạm; `npm run check:arch` chạy trên `src`.

Fixture dùng relative import trỏ tới stub có thật trong cây fixture → `tsc --noEmit` vẫn green trên toàn bộ fixture; chỉ script mới bắt được violation. Không cần chỉnh `tsconfig`.

- [ ] **Step 1: Tạo cây fixture**

`scripts/__fixtures__/src/core/api/axiosClient.ts`:

```ts
export const axiosClient = {};
```

`scripts/__fixtures__/src/features/demo/domain/Good.ts`:

```ts
export interface GoodEntity {
  id: string;
}
```

`scripts/__fixtures__/src/features/demo/domain/Bad.ts`:

```ts
import axios from 'axios';

export interface BadEntity {
  id: string;
  fetch: typeof axios;
}
```

`scripts/__fixtures__/src/features/demo/data/models/Stub.ts`:

```ts
export interface StubDto {
  id: string;
}
```

`scripts/__fixtures__/src/features/demo/data/BadDataToPresentation.ts`:

```ts
import {Stub} from '../presentation/Stub';

export const useStub = (): typeof Stub => Stub;
```

`scripts/__fixtures__/src/features/demo/data/datasources/BadNotRemoteDataSource.ts`:

```ts
import {axiosClient} from '../../../../core/api/axiosClient';

export const badClient = axiosClient;
```

`scripts/__fixtures__/src/features/demo/data/datasources/GoodRemoteDataSource.ts`:

```ts
import {axiosClient} from '../../../../core/api/axiosClient';
import {StubDto} from '../models/Stub';

export const goodRemote = {
  client: axiosClient,
  fetch: (): StubDto => ({id: '1'}),
};
```

`scripts/__fixtures__/src/features/demo/presentation/Stub.ts`:

```ts
export const Stub = {id: 'stub'};
```

`scripts/__fixtures__/src/features/demo/presentation/BadToData.ts`:

```ts
import {StubDto} from '../data/models/Stub';

export const badDto: StubDto = {id: '2'};
```

`scripts/__fixtures__/src/features/demo/index.ts`:

```ts
export * from './data/models/Stub';
```

- [ ] **Step 2: Viết test trước (failing test)**

Tạo `__tests__/checkBoundaries.test.ts`:

```ts
import path from 'path';
import {checkBoundaries} from '../scripts/check-boundaries';

const FIXTURES = path.join(__dirname, '..', 'scripts', '__fixtures__', 'src');

describe('check-boundaries', () => {
  it('flags each kind of boundary violation', () => {
    const violations = checkBoundaries(FIXTURES);
    const filesByRule = (rule: string) =>
      violations.filter(v => v.rule === rule).map(v => v.file).sort();

    expect(filesByRule('B1')).toEqual(['features/demo/domain/Bad.ts']);
    expect(filesByRule('B2')).toEqual([
      'features/demo/data/BadDataToPresentation.ts',
      'features/demo/data/datasources/BadNotRemoteDataSource.ts',
    ]);
    expect(filesByRule('B3')).toEqual([
      'features/demo/presentation/BadToData.ts',
    ]);
    expect(filesByRule('B4')).toEqual(['features/demo/index.ts']);
    expect(violations).toHaveLength(5);
  });

  it('does not flag valid files', () => {
    const violations = checkBoundaries(FIXTURES).filter(
      v =>
        v.file === 'features/demo/domain/Good.ts' ||
        v.file === 'features/demo/data/datasources/GoodRemoteDataSource.ts',
    );
    expect(violations).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận fail đúng cách**

Run: `npx jest __tests__/checkBoundaries.test.ts 2>&1 | tail -5`
Expected: FAIL — `Cannot find module '../scripts/check-boundaries'`.

- [ ] **Step 4: Implement `scripts/check-boundaries.js`**

```js
#!/usr/bin/env node
'use strict';

// Architecture boundary check. Rules B1-B4 are specified in
// docs/superpowers/specs/2026-09-21-agent-guardrails-design.md
const fs = require('fs');
const path = require('path');

const BANNED_DOMAIN_PACKAGES = ['react-native', 'react-redux', 'axios'];
const IMPORT_RE = /(?:import|export)\s[\s\S]*?from\s*['"]([^'"]+)['"]/g;

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(p));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

// Resolve a specifier to path segments relative to rootDir; null for packages.
function resolveTarget(rootDir, file, spec) {
  if (spec.startsWith('.')) {
    return path
      .relative(rootDir, path.resolve(path.dirname(file), spec))
      .split(path.sep);
  }
  if (spec.startsWith('@/')) {
    return spec.slice(2).split('/');
  }
  return null;
}

function ruleFor(rootDir, file, spec, ctx) {
  const {feature, layer, isBarrel} = ctx;
  const segs = resolveTarget(rootDir, file, spec);
  const target = segs ? segs.join('/') : null;

  if (layer === 'domain') {
    if (!segs && (BANNED_DOMAIN_PACKAGES.includes(spec) || spec.startsWith('@reduxjs/'))) {
      return 'B1';
    }
    if (
      segs &&
      segs[0] === 'features' &&
      segs[1] === feature &&
      (segs[2] === 'data' || segs[2] === 'presentation')
    ) {
      return 'B1';
    }
  }

  if (layer === 'data') {
    if (segs && segs[0] === 'features' && segs[2] === 'presentation') {
      return 'B2';
    }
    if (target === 'core/api/axiosClient' && !/RemoteDataSource\.tsx?$/.test(file)) {
      return 'B2';
    }
  }

  if (layer === 'presentation' && segs && segs[0] === 'features' && segs[2] === 'data') {
    return 'B3';
  }

  if (isBarrel && segs && segs[0] === 'features' && segs[1] === feature && segs[2] === 'data') {
    return 'B4';
  }

  return null;
}

function checkBoundaries(rootDir) {
  rootDir = path.resolve(rootDir);
  const violations = [];
  for (const file of listFiles(rootDir)) {
    const relFile = path.relative(rootDir, file).split(path.sep).join('/');
    const fm = relFile.match(/^features\/([^/]+)\/(.+)$/);
    if (!fm) {
      continue;
    }
    const ctx = {
      feature: fm[1],
      layer: fm[2].split('/')[0],
      isBarrel: fm[2] === 'index.ts',
    };
    const source = fs.readFileSync(file, 'utf8');
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(source)) !== null) {
      const rule = ruleFor(rootDir, file, m[1], ctx);
      if (rule) {
        violations.push({
          file: relFile,
          line: source.slice(0, m.index).split('\n').length,
          rule,
          spec: m[1],
        });
      }
    }
  }
  return violations;
}

module.exports = {checkBoundaries};

if (require.main === module) {
  const rootDir = process.argv[2] || 'src';
  const violations = checkBoundaries(rootDir);
  for (const v of violations) {
    console.error(`${v.file}:${v.line} [${v.rule}] import '${v.spec}'`);
  }
  process.exit(violations.length > 0 ? 1 : 0);
}
```

- [ ] **Step 5: Chạy test, xác nhận pass**

Run: `npx jest __tests__/checkBoundaries.test.ts`
Expected: `2 passed`.

- [ ] **Step 6: Đăng ký npm script + chạy trên src thật**

Trong `package.json`, thêm vào `scripts` (sau `"test"`):

```json
    "check:arch": "node scripts/check-boundaries.js src",
```

Run: `npm run check:arch; echo "exit=$?"`
Expected: không output, `exit=0` (src hiện tại sạch với B1–B4 — đã verify bằng grep trước khi viết plan).

- [ ] **Step 7: Gates toàn phần**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3 && npm run lint 2>&1 | tail -1`
Expected: tsc exit 0 (fixture resolve được), test tất cả passed, lint 0 errors.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-boundaries.js scripts/__fixtures__ __tests__/checkBoundaries.test.ts package.json package-lock.json
git commit -m "feat(tooling): add architecture boundary check script"
```

---

### Task 4: Pre-commit hook

**Files:**
- Create: `.githooks/pre-commit`

**Interfaces:**
- Consumes: `npm run check:arch` (Task 3).
- Produces: mọi `git commit` chạy đủ 4 gates; fail ⇒ commit bị chặn.

- [ ] **Step 1: Tạo `.githooks/pre-commit`**

```sh
#!/bin/sh
set -e

echo "[pre-commit] 1/4 architecture boundaries"
npm run --silent check:arch

echo "[pre-commit] 2/4 typescript"
npx tsc --noEmit

echo "[pre-commit] 3/4 tests"
npm test

echo "[pre-commit] 4/4 eslint"
npm run --silent lint
```

Rồi: `chmod +x .githooks/pre-commit`

- [ ] **Step 2: Bật hooksPath**

Run: `git config core.hooksPath .githooks && git config core.hooksPath`
Expected: `.githooks`

- [ ] **Step 3: Kiểm chứng hook chặn vi phạm**

```bash
printf "\nimport axios from 'axios';\n" >> src/features/auth/domain/entities/User.ts
git add src/features/auth/domain/entities/User.ts
git commit -m "test: should be blocked"
```

Expected: commit FAIL với `[B1] import 'axios'`. Sau đó hoàn tác:

```bash
git restore --staged src/features/auth/domain/entities/User.ts
git restore src/features/auth/domain/entities/User.ts
```

- [ ] **Step 4: Kiểm chứng hook cho commit sạch đi qua**

```bash
git commit --allow-empty -m "chore(tooling): verify pre-commit hook"
```

Expected: thấy `[pre-commit] 1/4 ... 4/4` rồi commit tạo thành công.

- [ ] **Step 5: Commit**

```bash
git add .githooks/pre-commit
git commit -m "chore(tooling): add pre-commit quality gate hook"
```

---

### Task 5: Skill `add-feature`

**Files:**
- Create: `.opencode/skill/add-feature/SKILL.md`

**Interfaces:**
- Consumes: `npm run check:arch`, quality gates, AGENTS.md.
- Produces: skill project-level opencode nhận diện qua frontmatter `name`/`description`.

- [ ] **Step 1: Tạo `.opencode/skill/add-feature/SKILL.md`**

```markdown
---
name: add-feature
description: "Use when adding a new feature (full domain/data/presentation or presentation-only) to this repo. Enforces the Clean Architecture + vertical slicing workflow with mandatory quality gates."
---

# Add a Feature

Read `AGENTS.md` sections "Architecture Rules", "Adding a New Feature", "State
Management", "Adding a New Screen" first — they define the rules; this skill
defines the order and the gates. Follow the steps exactly.

## Full three-layer feature (talks to API/domain)

1. Scaffold `src/features/<name>/{domain/{entities,repositories,usecases},data/{datasources,models,repositories},presentation/{redux,screens,hooks},index.ts}`.
2. Domain: entity (PascalCase singular) → `I<X>Repository.ts` → use cases
   (`Verb+PascalCase+UseCase.ts`, one per file, pure TS — no react-native /
   redux / axios imports).
3. Data: `<X>DTO.ts` + mapper → `<X>RemoteDataSource.ts` (the ONLY file that
   may import `@/core/api/axiosClient`; register endpoints in
   `src/core/api/endpoints.ts`) → `<X>RepositoryImpl.ts`.
4. Register datasource → RepositoryImpl → use cases in `src/core/di/container.ts`.
5. Redux: `<name>Thunks.ts` (createAsyncThunk via `container`,
   `rejectValue: string`) → `<name>Slice.ts` (extraReducers) →
   `<name>Selectors.ts` (createSelector) → `use<Name>.ts`; add the reducer to
   `src/app/store/rootReducer.ts`.
6. Screen: add route to `src/app/navigation/types.ts`, register in
   `RootNavigator.tsx` with `headerShown: false`, `animation: 'fade'`.
7. Unit tests in root `__tests__/` — MANDATORY for every new use case, DTO
   mapper and slice.
8. Barrel `index.ts`: export domain + presentation ONLY — never data.
9. Gates: `npm run check:arch && npx tsc --noEmit && npm test && npm run lint`
   — all green before any commit. The pre-commit hook re-runs them.

## Presentation-only feature (like home/account)

1. `src/features/<name>/presentation/{screens,hooks}` (+ `redux/` only if it
   holds shared async state).
2. Screen + route as in step 6 above. Skip domain/data/DI entirely (YAGNI).
3. Tests for non-trivial components/hooks; same gates.

## Hard rules (violation = rewrite, not discuss)

- presentation NEVER imports `data/*` — go through the domain interface + DI
  container. `npm run check:arch` enforces this mechanically.
- No React Query. No new dependencies without asking the user.
- Colors via `useTheme()`, spacing/radius via tokens, text via
  `<FText typo="...">`, shared components are F-prefixed from
  `@/shared/components`.
```

- [ ] **Step 2: Verify opencode nhận skill**

Run: `ls .opencode/skill/add-feature/SKILL.md`
Expected: file tồn tại. (Xác nhận runtime: session opencode mới liệt kê skill trong available skills.)

- [ ] **Step 3: Commit**

```bash
git add .opencode/skill/add-feature/SKILL.md
git commit -m "feat(tooling): add add-feature scaffold skill"
```

---

### Task 6: Agent `architecture-reviewer`

**Files:**
- Create: `.opencode/agent/architecture-reviewer.md`

**Interfaces:**
- Consumes: `npm run check:arch`, AGENTS.md.
- Produces: subagent `architecture-reviewer` — input commit range hoặc working diff, output bảng vi phạm + verdict PASS/FAIL. Agent KHÔNG có tool edit/write.

- [ ] **Step 1: Tạo `.opencode/agent/architecture-reviewer.md`**

```markdown
---
description: Architecture and convention reviewer for this repo. Run after feature work or before merging. Reports violations only — never edits code.
mode: subagent
tools: read, grep, glob, bash
---

You are the architecture reviewer for this React Native Clean Architecture
repo (React Native 0.87 + Redux Toolkit + feature slicing). Read `AGENTS.md`
first — it is the source of truth for conventions.

Input: a commit range (e.g. `HEAD~3..HEAD`) or nothing (review the working
diff via `git status` + `git diff`).

Procedure:

1. List changed files: `git diff <range> --name-only` (or `git status --short`
   for the working tree). Keep files under `src/`, `__tests__/`, `package.json`.
2. Run `npm run check:arch` — mechanical boundary rules B1-B4
   (see docs/superpowers/specs/2026-09-21-agent-guardrails-design.md).
3. Read each changed file and check what the script cannot:
   - Naming: `I<X>Repository`, `Verb+X+UseCase`, `<X>DTO`, `<X>RepositoryImpl`,
     `<x>Slice`, `use<X>`, tests in root `__tests__/`.
   - New use case / DTO mapper / slice without a unit test.
   - UI: F-components from `@/shared/components`, colors via `useTheme()`
     (never hardcoded hex in screens), spacing/radius via tokens (no raw
     padding*/gap/margin*/borderRadius numbers), text via `<FText typo="...">`.
   - New dependency in `package.json` — always flag it.
   - Feature barrel exporting anything from `data/`.
4. Output one table: `file:line | rule | severity (error|warning) | suggestion`.
   Rules from check:arch are `error`. Missing tests and new deps are `error`.
   Naming/typo nits are `warning`.
5. End with verdict: `PASS` or `FAIL` (any error = FAIL).

Never modify files. Never run destructive commands.
```

- [ ] **Step 2: Verify file + commit**

Run: `ls .opencode/agent/architecture-reviewer.md`

```bash
git add .opencode/agent/architecture-reviewer.md
git commit -m "feat(tooling): add architecture-reviewer subagent"
```

Expected: commit pass qua hook (file markdown không ảnh hưởng gates).

---

### Task 7: CI + docs

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `AGENTS.md` (symlink → sửa file đích; KHÔNG thay thế symlink)
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-21-agent-guardrails-design.md` (đã amend B5 từ trước — chỉ commit cùng đợt docs nếu còn unstaged)

**Interfaces:**
- Consumes: `npm run check:arch`.
- Produces: CI chạy 4 gates; docs có mục Tooling.

- [ ] **Step 1: Thêm bước check:arch vào `ci.yml`**

Trong job `quality`, thêm ngay sau `- run: npm ci`:

```yaml
      - run: npm run check:arch
```

Thứ tự steps cuối: `npm ci` → `npm run check:arch` → `npx tsc --noEmit` → `npm test` → `npm run lint`.

- [ ] **Step 2: Thêm mục Tooling vào `AGENTS.md`**

Chèn section mới ngay trước `## Keeping This File Current`:

```markdown
## Tooling (Agent Guardrails)

- After cloning, run `git config core.hooksPath .githooks` once — enables the pre-commit hook (check:arch → tsc → test → lint). Never bypass with `--no-verify`.
- `npm run check:arch` — mechanical boundary check (rules B1–B4, `scripts/check-boundaries.js`); CI runs it too.
- `.opencode/skill/add-feature/` — scaffold workflow for new features; follow it when asked to add a feature.
- `.opencode/agent/architecture-reviewer.md` — review-only subagent; run after feature work, it reports violations and never edits.
- Specs live in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`.
```

- [ ] **Step 3: Thêm cùng nội dung ngắn vào `README.md`**

Chèn section `## Agent Tooling` (nội dung như Step 2, có thể rút gọn còn 4 bullet đầu) ở nơi phù hợp theo cấu trúc README hiện có.

- [ ] **Step 4: Gates + commit**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3 && npm run lint 2>&1 | tail -1`
Expected: tất cả green.

```bash
git add .github/workflows/ci.yml CLAUDE.md README.md
git commit -m "chore(ci): run boundary check and document agent tooling"
```

(Lưu ý: `git add CLAUDE.md` — AGENTS.md là symlink tới CLAUDE.md, add file đích.)

---

## Self-Review (đã chạy khi viết plan)

1. **Spec coverage:** Bước 0 fix lỗi (Task 1–2) ✓; §3.1 script + fixture + npm script (Task 3) ✓; §3.2 hook + hooksPath + verify chặn (Task 4) ✓; §4.1 skill (Task 5) ✓; §4.2 agent (Task 6) ✓; §4.3 CI + AGENTS/README (Task 7) ✓; §5 testing — checkBoundaries.test (Task 3) + verify hook thủ công (Task 4) ✓.
2. **Placeholder scan:** không có TBD/TODO; mọi step đều có code/lệnh cụ thể.
3. **Type consistency:** `checkBoundaries(rootDir) → violations[]` dùng thống nhất ở Task 3 (script, test) và được CLI wrap; rule ids B1–B4 nhất quán giữa script/test/skill/agent/docs.
