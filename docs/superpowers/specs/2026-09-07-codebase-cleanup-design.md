# Codebase Cleanup Đợt 1 — Design Spec

- **Ngày:** 2026-09-07
- **Project:** RNCore (React Native template Clean Architecture)
- **Trạng thái:** Đã duyệt

## 1. Mục tiêu

Dọn dẹp các vấn đề phát hiện từ buổi review cấu trúc dự án ngày 2026-09-07, giữ nguyên hành vi runtime (trừ việc loại bỏ dead code).

Bối cảnh quan trọng: đây là **dự án demo/template** — mock user fallback trong `AuthRepositoryImpl` là chủ ý của người viết (làm mẫu), do đó **không thuộc phạm vi** đợt này.

## 2. Phạm vi

### 2.1. #2 — Bỏ `user` alias trong rootReducer

**File:** `src/app/store/rootReducer.ts`

- Xóa dòng `user: authReducer` và comment giải thích.
- Giữ nguyên `auth: authReducer`.

**Cơ sở an toàn (đã xác minh bằng grep toàn `src/`):**

- Không có code nào đọc root `state.user`. Các match `state.user.*` trong `authSlice.ts` là state nội bộ của slice (`auth.user`), không phải root key.
- Test `authSlice.test.ts:92` (`state.user?.stepVerify`) là slice-level state, không ảnh hưởng.
- Callback 401 trong `store/index.ts` dispatch action `clearUser` (action name), không liên quan đến root key `user`.

### 2.2. #3 — Sửa typo tên file component

**Renaming (dùng `git mv` để giữ history):**

- `src/shared/components/FBottmSheet.tsx` → `FBottomSheet.tsx`
- `src/shared/components/FToolTip.tsx` → `FTooltip.tsx`

**Cập nhật kèm theo:**

- Identifier bên trong file nếu còn chứa typo (`FToolTipProps`, `FToolTip`, ...).
- Barrel export `src/shared/components/index.ts`: `FBottmSheet` → `FBottomSheet`, `FToolTip` → `FTooltip`.

**Cơ sở an toàn:** đã grep toàn `src/` — 2 file này chỉ được tham chiếu qua barrel `shared/components/index.ts`, hiện không có import nào khác trong repo. Rủi ro duy nhất là project clone (nếu có) đã dùng tên export cũ qua barrel — sẽ lộ ngay khi build, chấp nhận được vì template chưa phát hành rộng.

### 2.3. #4 — Gỡ dependency `react-query`

- Xóa `"react-query": "^3.39.3"` khỏi `package.json`, chạy `npm install` cập nhật `package-lock.json`.

**Cơ sở an toàn:** 0 import trong toàn bộ `src/` (dự án quản lý async state bằng Redux Toolkit thunks).

**Không đụng vào (đang được dùng thật, xác minh bằng grep):**

- `react-native-touch-id` → `AuthLocalDataSource.ts` (biết là deprecated, nâng cấp sang thư viện khác là việc riêng)
- `moment` → `core/utils/date.ts`
- `react-native-keyboard-aware-scroll-view` → `LoginScreen.tsx`

### 2.4. #5 + #6 — Dọn compat layer

**FTheme shim:**

- Xóa file `src/shared/styles/FTheme.ts` (chỉ là re-export của `@/core/theme/FTheme`).
- Xóa dòng export tương ứng trong `src/shared/styles/index.ts`.

**Ghi chú lịch sử:** shim này được thêm **chủ ý** theo spec dark/light theme (2026-09-05) để giữ backward-compat cho code cũ/project clone. Nay gỡ bỏ là quyết định có chủ đích vì: (a) grep toàn repo xác nhận không ai import `FTheme` từ `shared/styles` qua alias — import chuẩn trong toàn codebase là `@/core/theme`; (b) giữ 2 đường import cùng tên gây nhiễu cho người mới đọc template.

**Bổ sung khi triển khai (post-mortem):** grep theo pattern alias đã sót 3 file import shim qua **đường relative** `../styles/FTheme` (`FFilledButton.tsx`, `FText.tsx`, `FTextInput.tsx`). Trong commit triển khai `5c700c1`, 3 import này được repoint về `@/core/theme/FTheme` — đúng chủ đích chuẩn hóa nêu trên. Bài học: khi xóa re-export shim, grep phải cover cả relative path.

**Middleware no-op:**

- Xóa file `src/app/store/middleware.ts` (`loggerMiddleware` là placeholder không làm gì).
- Sửa `src/app/store/index.ts`: bỏ `import middlewares from './middleware'` và `.concat(middlewares)` trong `configureStore`.

## 3. Ngoài phạm vi (rõ ràng loại trừ)

- Mock user fallback trong `AuthRepositoryImpl.login` — chủ ý của dự án demo.
- Thay thế `react-native-touch-id` / `moment` / `react-native-keyboard-aware-scroll-view`.
- Đặt lại tên style token `Felevation` / `FFilled` (naming lạ nhưng ngoài phạm vi đã chốt).
- Bổ sung tầng domain/data cho feature `account` (chỉ có presentation — chấp nhận theo YAGNI).

## 4. Quy trình triển khai & commit

4 commit riêng biệt, đúng thứ tự, khớp style lịch sử commit của repo (commit nhỏ, tách bạch):

| #   | Commit message                                                | Nội dung |
| --- | ------------------------------------------------------------- | -------- |
| 1   | `refactor(store): remove legacy user state alias`             | Mục 2.1  |
| 2   | `refactor(shared): fix FBottomSheet and FTooltip typos`       | Mục 2.2  |
| 3   | `chore(deps): remove unused react-query`                      | Mục 2.3  |
| 4   | `refactor: drop FTheme compat re-export and no-op middleware` | Mục 2.4  |

## 5. Xác minh

- Sau **mỗi** commit: `npx tsc --noEmit` && `npm test` (baseline: tsc sạch, 22/22 test pass).
- Sau commit cuối: chạy thêm `npm run lint`.
- Nếu bước nào làm test fail → sửa ngay trước khi commit, không gộp lỗi sang bước sau.
- Không viết test mới — đây là cleanup, bộ test hiện có đóng vai trò lưới an toàn hồi quy.

## 6. Rủi ro & biện pháp

| Rủi ro                                                 | Khả năng | Giảm thiểu                                                               |
| ------------------------------------------------------ | -------- | ------------------------------------------------------------------------ |
| Code ngoài `src/` (vd: `__tests__/`) tham chiếu tên cũ | Thấp     | Grep toàn repo (loại `node_modules`) trước commit #2                     |
| `npm install` kéo đổi version khác trong lockfile      | Thấp     | Kiểm tra `git diff package-lock.json` chỉ thay đổi liên quan react-query |
| Project clone đã dùng alias `FBottmSheet`/`state.user` | Thấp     | Template chưa phát hành rộng; nếu có, lỗi sẽ lộ ngay khi build           |
