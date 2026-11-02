# Thiết kế AGENTS.md — Mở rộng Project Rules cho mọi AI Agent

- **Ngày**: 2026-09-08
- **Trạng thái**: Approved (design)
- **Loại**: Documentation / DX tooling
- **Tiền đề**: `CLAUDE.md` đã land (commit `69dec3a`, theo spec `2026-09-07-claude-md-project-rules-design.md`)

---

## 1. Mục tiêu

Cho phép **mọi AI coding agent** — không chỉ Claude Code — nạp được bộ rules của dự án.
Các agent theo chuẩn mở `AGENTS.md` (OpenAI Codex CLI, opencode, Zed, Cursor từ 2025,
Jules, Amp...) sẽ tự đọc `AGENTS.md` ở repo root mỗi session.

### Phi mục tiêu (Out of scope)

- Không đổi nội dung rules hiện có (156 dòng của `CLAUDE.md` giữ nguyên).
- Không tạo file riêng cho từng tool (`.github/copilot-instructions.md`, `.cursor/rules/`,
  `GEMINI.md`, `.windsurfrules`) — chỉ khi team thực sự dùng tool đó (YAGNI).
- Không làm enforcement tooling (ESLint import-boundaries, husky pre-commit, CI) —
  vẫn là future work như spec cũ đã ghi.

## 2. Quyết định thiết kế

| #   | Quyết định                                                                    | Lý do                                                                                              |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| D1  | `AGENTS.md` là **symlink → `CLAUDE.md`**                                      | 1 edit cập nhật cả 2, zero drift; git lưu symlink chuẩn (mode `120000`); GitHub render bình thường |
| D2  | `CLAUDE.md` giữ vai trò **nguồn sự thật duy nhất**                            | File đã có sync rule với README; mọi agent khác trỏ về nó                                          |
| D3  | Thêm 1 dòng **guard** vào section "Keeping This File Current" của `CLAUDE.md` | Chống agent/tool khác ghi đè symlink bằng bản copy (nguy cơ drift số 1)                            |
| D4  | **1 commit duy nhất** cho cả symlink + guard line                             | Cùng một mục đích: mở rộng coverage; đúng convention "small, single-purpose"                       |

### Phương án đã loại

- **Pointer file mỏng** (AGENTS.md chỉ ghi "Read CLAUDE.md"): robust mọi OS nhưng agent
  tốn thêm 1 lượt đọc file và có nguy cơ bỏ qua instruction.
- **Nhân bản nội dung**: dễ lệch nhau theo thời gian, cần sync thủ công — vi phạm nguyên tắc single source of truth của spec cũ (D3).

## 3. Nội dung thay đổi

### 3.1 Tạo symlink

```bash
ln -s CLAUDE.md AGENTS.md
git add AGENTS.md
```

Git stage dạng symlink (kiểm chứng: `git ls-files -s AGENTS.md` → mode `120000`).

### 3.2 Guard line trong `CLAUDE.md`

Section "Keeping This File Current" bổ sung (nguyên văn, tiếng Anh):

> `AGENTS.md` is a symlink to this file — never replace it with a copy or edit it directly; the symlink keeps every standards-following agent in sync.

### 3.3 Không đổi gì khác

- README, source code, `package.json`, jest/eslint config: untouched.
- Không đổi nội dung bất kỳ rule nào khác trong `CLAUDE.md`.

## 4. Rủi ro & giảm thiểu

| Rủi ro                                                    | Giảm thiểu                                                                                                 |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Windows checkout không bật `core.symlinks` thấy file hỏng | Đã chấp nhận — team dev trên macOS (spec cũ xác nhận môi trường)                                           |
| Agent/tool nào đó ghi đè `AGENTS.md` thành file thường    | Guard line ở §3.2; nếu bị đè thì `git status` hiện typechange → khôi phục bằng `git checkout -- AGENTS.md` |
| Claude Code muốn sửa CLAUDE.md qua symlink                | Không xảy ra — Claude Code đọc/ghi `CLAUDE.md` trực tiếp; symlink chỉ chiều AGENTS.md → CLAUDE.md          |

## 5. Tiêu chí nghiệm thu

1. `ls -la AGENTS.md` hiển thị `AGENTS.md -> CLAUDE.md`.
2. `head AGENTS.md` resolve ra nội dung đầu của `CLAUDE.md`.
3. `git ls-files -s AGENTS.md` → mode `120000` (symlink, không phải file thường).
4. Guard line xuất hiện đúng 1 lần trong `CLAUDE.md`.
5. `npx tsc --noEmit` + `npm test` pass unchanged (docs-only, baseline không đổi).
6. Commit message: `docs: expose project rules to all agents via AGENTS.md symlink`.

## 6. Future Work (ngoài phạm vi)

- Thêm `.github/copilot-instructions.md` / `.cursor/rules/` khi team dùng tool đó.
- ESLint import-boundaries enforcement cho layer rules.
- Husky pre-commit (lint + tsc); CI chạy test tự động.
