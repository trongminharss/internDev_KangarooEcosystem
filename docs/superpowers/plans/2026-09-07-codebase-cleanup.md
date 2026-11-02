# Codebase Cleanup Đợt 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dọn dẹp dead code và typo trong RNCore theo spec `docs/superpowers/specs/2026-09-07-codebase-cleanup-design.md` — 4 commit riêng biệt, giữ nguyên hành vi runtime.

**Architecture:** Cleanup-only, không thêm tính năng. Mỗi task tương ứng một mục trong spec, kết thúc bằng commit riêng. Không viết test mới — bộ test hiện có (6 suites / 22 tests) là lưới an toàn hồi quy.

**Tech Stack:** React Native 0.87.1, TypeScript, Redux Toolkit, Jest. Kiểm chứng bằng `npx tsc --noEmit` + `npm test`.

**Baseline (đã xác minh lúc viết plan):** `tsc --noEmit` sạch, 22/22 test pass, nhánh `dev`.

---

### Task 0: Xác nhận baseline

**Files:** không sửa file nào.

- [ ] **Step 1: Chạy type check và test**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: tsc không in gì (sạch); test in `Tests: 22 passed, 22 total`.

- [ ] **Step 2: Xác nhận working tree sạch**

Run: `git status --porcelain`
Expected: output rỗng. Nếu không rỗng, dừng và hỏi user trước khi tiếp tục.

---

### Task 1: Bỏ `user` alias trong rootReducer

**Files:**

- Modify: `src/app/store/rootReducer.ts`

- [ ] **Step 1: Sửa `src/app/store/rootReducer.ts`**

Thay toàn bộ nội dung file thành:

```ts
import {combineReducers} from '@reduxjs/toolkit';
import authReducer from '@/features/auth/presentation/redux/authSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
```

(Xóa dòng `user: authReducer` và comment phía trên nó.)

- [ ] **Step 2: Chạy type check + test**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: tsc sạch; `Tests: 22 passed, 22 total`. Nếu fail — đặc biệt chú ý `authSlice.test.ts` — dừng lại điều tra (không sửa test để qua chuyện).

- [ ] **Step 3: Commit**

```bash
git add src/app/store/rootReducer.ts
git commit -m "refactor(store): remove legacy user state alias"
```

---

### Task 2: Sửa typo tên file component

**Files:**

- Rename: `src/shared/components/FBottmSheet.tsx` → `src/shared/components/FBottomSheet.tsx`
- Rename: `src/shared/components/FToolTip.tsx` → `src/shared/components/FTooltip.tsx`
- Modify: `src/shared/components/FTooltip.tsx` (identifier bên trong)
- Modify: `src/shared/components/index.ts`

- [ ] **Step 1: Grep xác nhận không có tham chiếu nào ngoài barrel**

Dùng Grep tool, pattern `FBottmSheet|FToolTip`, tìm trên thư mục workspace (grep theo nội dung file).
Expected: chỉ 2 file match — `src/shared/components/FToolTip.tsx` (tên interface/const/export bên trong) và `src/shared/components/index.ts` (dòng 2 và 16). Lưu ý `FBottmSheet.tsx` sẽ không match vì identifier bên trong đã đúng `FBottomSheet`. Nếu thấy match ở chỗ khác — dừng, báo lại.

- [ ] **Step 2: Đổi tên 2 file bằng git mv**

```bash
git mv src/shared/components/FBottmSheet.tsx src/shared/components/FBottomSheet.tsx
git mv src/shared/components/FToolTip.tsx src/shared/components/FTooltip.tsx
```

- [ ] **Step 3: Sửa identifier bên trong `FTooltip.tsx`**

(Chỉ file FToolTip cần sửa; FBottomSheet.tsx bên trong đã đúng tên, không đụng.)

Thay:

```ts
interface FToolTipProps {
```

bằng:

```ts
interface FTooltipProps {
```

Thay:

```ts
const FToolTip: React.FC<FToolTipProps> = ({
```

bằng:

```ts
const FTooltip: React.FC<FTooltipProps> = ({
```

Thay:

```ts
export default FToolTip;
```

bằng:

```ts
export default FTooltip;
```

- [ ] **Step 4: Cập nhật barrel `src/shared/components/index.ts`**

Thay dòng:

```ts
export {default as FBottmSheet} from './FBottmSheet';
```

bằng:

```ts
export {default as FBottomSheet} from './FBottomSheet';
```

Thay dòng:

```ts
export {default as FToolTip} from './FToolTip';
```

bằng:

```ts
export {default as FTooltip} from './FTooltip';
```

- [ ] **Step 5: Grep lần cuối xác nhận sạch tên cũ**

Dùng Grep tool, pattern `FBottmSheet|FToolTip`.
Expected: 0 match.

- [ ] **Step 6: Chạy type check + test**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: tsc sạch; `Tests: 22 passed, 22 total`.

- [ ] **Step 7: Commit**

```bash
git add src/shared/components/
git commit -m "refactor(shared): fix FBottomSheet and FTooltip typos"
```

---

### Task 3: Gỡ dependency `react-query`

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json` (tự động bởi `npm install`)

- [ ] **Step 1: Xóa dòng trong `package.json`**

Xóa nguyên dòng (44):

```json
    "react-query": "^3.39.3",
```

(Kết quả JSON vẫn hợp lệ vì dòng trước đó `"react-redux": "^9.3.0",` giữ nguyên dấu phẩy, và `"redux": "^5.0.1",` theo sau.)

- [ ] **Step 2: Cập nhật lockfile**

Run: `npm install`
Expected: cài đặt thành công, không lỗi.

- [ ] **Step 3: Kiểm tra lockfile diff chỉ thay đổi react-query**

Run: `git diff package-lock.json | grep '^[+-]' | grep -v '^[+-][+-]' | head -40`
Expected: các dòng thêm/xóa chỉ liên quan `react-query` và node_modules của nó. Nếu thấy package lạ bị đổi version — dừng, báo lại.

- [ ] **Step 4: Chạy type check + test**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: tsc sạch; `Tests: 22 passed, 22 total`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): remove unused react-query"
```

---

### Task 4: Dọn compat layer (FTheme shim + middleware no-op)

**Files:**

- Delete: `src/shared/styles/FTheme.ts`
- Modify: `src/shared/styles/index.ts`
- Delete: `src/app/store/middleware.ts`
- Modify: `src/app/store/index.ts`

- [ ] **Step 1: Xóa 2 file dead code**

```bash
git rm src/shared/styles/FTheme.ts src/app/store/middleware.ts
```

- [ ] **Step 2: Sửa `src/shared/styles/index.ts`**

Xóa dòng (5):

```ts
export {default as FTheme, FTheme as theme} from '@/core/theme/FTheme';
```

Nội dung file sau khi sửa:

```ts
export * from './FElevation';
export {default as FButtonSize} from './FButtonSize';
export {default as FInputSize} from './FInputSize';
export * from './FIconStyles';
```

- [ ] **Step 3: Sửa `src/app/store/index.ts`**

Xóa dòng (4):

```ts
import middlewares from './middleware';
```

Thay:

```ts
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(middlewares),
```

bằng:

```ts
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
```

- [ ] **Step 4: Grep xác nhận không còn tham chiếu**

Dùng Grep tool, pattern `shared/styles/FTheme|from './middleware'`, tìm trên thư mục workspace.
Expected: 0 match.

- [ ] **Step 5: Chạy type check + test + lint**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5 && npm run lint 2>&1 | tail -5`
Expected: tsc sạch; `Tests: 22 passed, 22 total`; lint không in error.

- [ ] **Step 6: Commit**

```bash
git add src/shared/styles/index.ts src/app/store/index.ts
git commit -m "refactor: drop FTheme compat re-export and no-op middleware"
```

---

### Task 5: Xác minh tổng thể cuối đợt

- [ ] **Step 1: Xác nhận đủ 4 commit mới**

Run: `git log --oneline -5`
Expected (từ mới nhất xuống):

```
refactor: drop FTheme compat re-export and no-op middleware
chore(deps): remove unused react-query
refactor(shared): fix FBottomSheet and FTooltip typos
refactor(store): remove legacy user state alias
docs: add codebase cleanup round 1 design spec
```

- [ ] **Step 2: Chạy xác minh cuối**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5`
Expected: tsc sạch; `Tests: 22 passed, 22 total`.

- [ ] **Step 3: Báo kết quả**

Tóm tắt cho user: 4 commit đã thực hiện, kết quả tsc/test/lint, và các mục ngoài phạm vi đã cố tình giữ nguyên (mock fallback, touch-id/moment, Felevation naming, account feature).
