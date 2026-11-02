# Agent Guardrails — Thiết kế

- **Ngày:** 2026-09-21
- **Trạng thái:** Đã duyệt design (chờ review spec)
- **Phạm vi:** Bộ công cụ bắt agent AI làm việc theo đúng flow của repo: chặn cơ khí (script + pre-commit hook), skill scaffold, agent review.

## 1. Bối cảnh và vấn đề

Repo đã có rulebook đầy đủ (`CLAUDE.md` / `AGENTS.md`) và flow spec → plan → implement (docs/superpowers). Tuy nhiên mọi quy định đều mang tính "nhờ entre":

- Không gì kiểm tra cơ khí các import rules (presentation → data, axiosClient scope, barrel exports...).
- Quality gates (tsc/test/lint) là manual — lỗi pre-existing (2 test Onboarding fail, 3 lỗi lint) tồn tại qua nhiều commit.
- Không có skill/agent project-level hỗ trợ scaffold feature hay review kiến trúc.

Mục tiêu: agent không thể tạo code sai flow mà không bị chặn, và việc scaffold feature đúng chuẩn trở thành quy trình có sẵn.

## 2. Hướng tiếp cận đã chọn

**Script-first, agent-second**: một script cơ khí + một pre-commit hook làm lớp chặn cứng; skill + agent là lớp bổ trợ. Không thêm dependency (bỏ husky/lint-staged/eslint-plugin-boundaries).

Các phương án đã loại:
- **Tooling industry (husky + eslint-plugin-boundaries)**: thêm 3 dependencies, config rườm, trùng lặp rules đã có trong AGENTS.md.
- **Rules-only**: là trạng thái hiện tại, không giải quyết gì.

## 3. Lớp chặn cơ khí

### 3.1 `scripts/check-boundaries.js`

Node CommonJS thuần (~80 dòng — `.js` để jest `require()` trực tiếp, không cần transform), quét thư mục đích (tham số thứ 1, mặc định `src`) theo `**/*.{ts,tsx}`, parse `import/export ... from '...'` bằng regex, áp các rules:

| # | Scope | Rule |
|---|-------|------|
| B1 | `src/features/*/domain/**` | Không import `data/`, `presentation/` (feature bất kỳ), `react-native`, `react-redux`, `@reduxjs/*`, `axios`, `core/api/axiosClient` |
| B2 | `src/features/*/data/**` | Không import `presentation/**` (feature bất kỳ); **chỉ** file `*RemoteDataSource.ts` được import `core/api/axiosClient` |
| B3 | `src/features/*/presentation/**` | Không import `data/**` (feature bất kỳ) hoặc `core/api/axiosClient` |
| B4 | `src/features/*/index.ts` | Không import/export `data/**` của chính feature |

Resolution specifier (script text-based, không AST):
- Tương đối `./`/`../` → `path.resolve` theo thư mục file, lấy path đích relative tới root quét.
- Alias `@/` → strip `@/` lấy path tương đối.
- Còn lại → package import (chỉ B1 quan tâm tên package).

> Lưu ý thiết kế: đã bỏ rule "bắt buộc alias `@/` trong features" — import tương đối nội bộ feature (barrels, domain/data/presentation) là practice chuẩn hiện có (~50 chỗ); rule đó chống lại thực tế và không có giá trị kiến trúc.

Hành vi:
- Vi phạm: in `file:line → [B?] import '...'` từng dòng, exit 1.
- Hợp lệ: exit 0, không output.
- Chỉ parse import tĩnh; không AST (đủ cho rules hiện có, ponytail).
- Tham số thư mục đích để test fed fixture vào (`scripts/__fixtures__/src/...`).
- Đăng ký `npm run check:arch` — pre-commit và CI gọi chung.
- Fixture vi phạm dùng **relative import trỏ tới stub file có thật trong cây fixture** — tsc resolve được, tự nhiên green, chỉ boundary script mới bắt lỗi.

### 3.2 `.githooks/pre-commit`

```sh
npm run check:arch && npx tsc --noEmit && npm test && npm run lint
```

- Kích hoạt: `git config core.hooksPath .githooks` (một lần sau clone; ghi trong README + AGENTS.md).
- Full run, không staged-only: đơn giản và đúng hơn; suite hiện ~4s, tổng hook < ~30s.
- Fail → commit bị chặn kèm message rõ rule/test lỗi.
- `--no-verify` chỉ dành cho người trong tình huống khẩn; **AGENTS.md cấm agent dùng**.

### 3.3 Bước 0 — fix lỗi pre-existing

Để hook strict ngay, không cần whitelist/baseline:

1. `__tests__/OnboardingScreen.test.tsx` (2 test fail): điều tra `Storage.setItem('isFirstTimeLoadApp', false)` không được gọi — xác định test stale hay bug thật ở screen; sửa theo đúng nguyên nhân.
2. `jest.setup.js` lỗi `no-undef`: thêm override `env: {jest: true}` cho file này trong `.eslintrc.js`.
3. `src/features/service/presentation/screens/ServiceScreen.tsx`: xóa import `FText` thừa.
4. `src/shared/components/FAppbar.tsx`: xóa param `languageIconColor` không dùng.

## 4. Lớp hỗ trợ agent

### 4.1 Skill `add-feature` (`.opencode/skill/add-feature/SKILL.md`)

Quy trình từng bước (khác AGENTS.md vốn là tham chiếu), hai đường:

**Full 3-layer** (có API/domain):
1. Scaffold `src/features/<name>/{domain/{entities,repositories,usecases}, data/{datasources,models,repositories}, presentation/{redux,screens,hooks}, index.ts}`
2. Domain: entity → `I<X>Repository` → use cases (pure TS)
3. Data: DTO + mapper → `*RemoteDataSource` → `XxxRepositoryImpl`
4. Đăng ký vào `src/core/di/container.ts`
5. Redux: thunks → slice → selectors → `use<X>` hook; thêm reducer vào `src/app/store/rootReducer.ts`
6. Screen + route (`RootStackParamList`/`BottomTabParamList` + navigator, `headerShown: false`, `animation: 'fade'`)
7. Unit test bắt buộc: use case / DTO mapper / slice mới
8. Barrel `index.ts` chỉ export domain + presentation
9. Chạy `npm run check:arch` + quality gates

**Presentation-only** (như `home`, `account`): screen + hook (+ slice nếu cần), bỏ qua domain/data — YAGNI.

Skill **tham chiếu** section tương ứng trong AGENTS.md thay vì chép nội dung — một nguồn sự thật.

### 4.2 Agent `architecture-reviewer` (`.opencode/agent/architecture-reviewer.md`)

- Frontmatter: `mode: subagent`, `tools: read, grep, glob, bash` — **không Edit/Write** (chỉ báo cáo, không sửa).
- Input: commit range hoặc working diff.
- Quy trình:
  1. Chạy `npm run check:arch`
  2. Đọc các file thay đổi, kiểm phần AGENTS.md mà script không bao phủ: đặt tên (`I`Repository / `X`UseCase / DTO / Slice), F-components từ `@/shared/components`, `useTheme()` thay vì màu cứng, spacing tokens, test đi kèm feature/slice mới
- Output: bảng `file:line | rule | severity (error/warning) | gợi ý`. Không tự sửa code.

### 4.3 CI + Docs

- `.github/workflows/ci.yml`: thêm bước `npm run check:arch` trước `tsc` — backstop cho máy chưa bật hooksPath.
- `AGENTS.md` + `README.md`: thêm mục "Tooling" ngắn: lệnh setup hooksPath, `check:arch`, khi nào dùng reviewer agent, cấm `--no-verify` cho agent. Cập nhật cả hai trong cùng commit (rule hiện có).

## 5. Testing

- `__tests__/checkBoundaries.test.ts` + fixture `scripts/__fixtures__/` (cây hợp lệ + cây vi phạm mỗi rule): assert script phát hiện đúng từng rule, pass với cây hợp lệ. Một test file duy nhất — script là logic mới duy nhất có nhánh.
- Skill/agent là markdown: không test tự động; verify opencode nhận diện khi dùng.
- Hook: kiểm thử tay một lần — commit chứa import cấm phải bị chặn.

## 6. Không làm (YAGNI)

- Không whitelist/baseline lỗi.
- Không husky/lint-staged/plop templates.
- Không rule cross-feature import (AGENTS.md không định nghĩa — đừng bịa luật).
- Không auto-fix trong reviewer agent.
- Không AST parser cho boundary script.

## 7. Cấu trúc file mới/sửa

```
scripts/check-boundaries.js               (mới, CommonJS)
scripts/__fixtures__/...                  (mới)
.githooks/pre-commit                      (mới)
.opencode/skill/add-feature/SKILL.md      (mới)
.opencode/agent/architecture-reviewer.md  (mới)
src/core/api/authToken.ts                 (mới — tách token helper khỏi axiosClient)
__tests__/checkBoundaries.test.ts         (mới)
package.json                              (sửa: script check:arch)
.eslintrc.js                              (sửa: override jest.setup.js)
.github/workflows/ci.yml                  (sửa: thêm check:arch)
AGENTS.md, README.md                      (sửa: mục Tooling)
src/features/onboarding/.../OnboardingScreen.tsx (sửa: bỏ __DEV__ shortcut trước persist)
src/features/service/.../ServiceScreen.tsx (sửa: bỏ import thừa)
src/shared/components/FAppbar.tsx          (sửa: bỏ param thừa)
src/core/api/axiosClient.ts                (sửa: dùng authToken module)
src/features/auth/.../AuthRepositoryImpl.ts (sửa: import authToken)
src/app/store/index.ts                     (sửa: import authToken)
__tests__/OnboardingScreen.test.tsx        (đã pass lại sau fix ở screen)
```
