# Thiết kế CLAUDE.md — Project Rules cho RNCore

- **Ngày**: 2026-09-07
- **Trạng thái**: Approved (design)
- **Loại**: Documentation / DX tooling

---

## 1. Mục tiêu

Tạo file **`CLAUDE.md`** ở root dự án — bộ rules bằng tiếng Anh mà Claude Code tự nạp mỗi
session, giúp AI viết code đúng chuẩn kiến trúc và conventions đã thiết lập của RNCore.

Nội dung được **nghiên cứu từ code thực tế** (đã khảo sát toàn bộ 2026-09-07) và **tổng hợp
từ README.md** (bộ quy tắc tiếng Việt hiện có), ưu tiên rules-first, bỏ văn phong tutorial.

### Phi mục tiêu (Out of scope)

- Không tạo tooling enforcement (ESLint import boundaries, husky hooks, CI) — future work.
- Không viết lại/ refactor README (README giữ nguyên vai trò tutorial cho người).
- Không áp dụng các cleanup đã duyệt (rename `FBottmSheet`, xoá `user:` alias, xoá shim
  `shared/styles/FTheme.ts`, xoá `react-query`) — công việc của spec cleanup riêng.

## 2. Quyết định thiết kế

| #   | Quyết định                                                                   | Lý do                                                                                                      |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| D1  | **Một file `CLAUDE.md` tự chứa** ~150–250 dòng tiếng Anh, rules-first        | AI có đủ rules trong context mỗi session, 0 lượt đọc file phụ; đúng bản chất CLAUDE.md                     |
| D2  | **Ghi rule theo current state của code**                                     | Rules phải phản ánh đúng code đang có tại thời điểm viết để AI không sinh code tham chiếu thứ chưa tồn tại |
| D3  | **Sync rule 2 chiều**: đổi convention thì cập nhật cả README và CLAUDE.md    | Tránh lệch nguồn giữa 2 tài liệu trùng nội dung                                                            |
| D4  | **Mỗi rule 1 dòng mệnh lệnh** (`Do X` / `Never Y`), ví dụ code tối đa 3 dòng | Tối ưu token; đúng định dạng instruction AI tuân theo tốt                                                  |
| D5  | Ngôn ngữ:**tiếng Anh**                                                       | Theo lựa chọn của user                                                                                     |

## 3. Nội dung chi tiết CLAUDE.md

Target ~210 dòng. Dưới đây là spec nội dung từng section — mỗi rule nêu trong spec
phải xuất hiện (dạng rút gọn) trong CLAUDE.md.

### 3.1 Project Overview (~6 dòng)

- 1 dòng: React Native 0.87 + TypeScript, Clean Architecture + Vertical Feature Slicing.
- 1 dòng: Stack chính: Redux Toolkit, Axios, React Navigation 7, react-native-paper 5, i18next, Firebase (messaging + notifee).
- 1 dòng: Đây là **template/demo project** — mock-login fallback trong `AuthRepositoryImpl` là cố ý, không "fix".

### 3.2 Commands & Environment (~15 dòng)

- Dùng **npm** (không yarn) — `.npmrc` bắt buộc `legacy-peer-deps=true`.
- `postinstall: patch-package` là bắt buộc — không được xoá script hay `patches/react-native-touch-id+4.4.1.patch`.
- iOS pods qua Bundler: `cd ios && bundle exec pod install` (Gemfile pin cocoapods ~1.13, activesupport < 7.1).
- **Không có `.env`** — toàn bộ config nằm trong `src/core/config/env.ts` (sửa file này để đổi môi trường).
- Quality commands: `npx tsc --noEmit`, `npm test`, `npm test -- <path>`, `npm run lint`.
- Path alias `@/*` → `src/*` (tsconfig + babel-module-resolver — 2 file phải đồng bộ).
- Node >= 20.

### 3.3 Architecture Rules (~40 dòng)

Bảng dependency (trích từ README §3, giữ nguyên ngữ nghĩa):

| Layer          | Được import                              | Cấm import                                             |
| -------------- | ---------------------------------------- | ------------------------------------------------------ |
| `domain`       | pure TS, domain khác                     | `data/*`, `presentation/*`, axios, react-native, redux |
| `data`         | `domain`, axiosClient, AsyncStorage      | `presentation/*`, redux, RN UI                         |
| `presentation` | `domain`, `core/di`, redux, react-native | trực tiếp`data/*` (phải qua interface + container)     |

- `RemoteDataSource` là nơi **duy nhất** được import `axiosClient`.
- Naming conventions (bảng 1 dòng/mục): Entity `PascalCase` số ít (`User.ts`) · Repository interface `I<X>Repository.ts` · Impl `<X>RepositoryImpl.ts` · UseCase `<Verb><X>UseCase.ts` (1 use case/file) · DTO `<X>DTO.ts` · Slice `camelCase + Slice` · Thunk `verbNoun` camelCase · Screen/Component PascalCase · Hook `useX` · Test colocated `<tên file>.test.ts(x)`.
- Feature structure chuẩn: `src/features/<name>/{domain/{entities,repositories,usecases}, data/{datasources,models,repositories}, presentation/{redux,screens,hooks}, index.ts}`.
- Barrel `index.ts` của feature chỉ export domain + presentation, **không export data layer** (data wiring qua DI container).
- Import luôn dùng alias `@/` (trừ assets dùng relative `require`).

### 3.4 Adding a Feature (~15 dòng)

Quy trình rút gọn đúng thứ tự:

1. Tạo cấu trúc thư mục feature.
2. Domain: entities → repository interface → use cases (pure TS).
3. Data: DTO + mapper → RemoteDataSource → RepositoryImpl.
4. Đăng ký DI trong `src/core/di/container.ts`.
5. Presentation: thunks (gọi use case qua `container`) → slice → selectors → hook; thêm reducer vào `src/app/store/rootReducer.ts`.
6. Screen + đăng ký route; export qua feature `index.ts`.

### 3.5 Adding a Screen (~8 dòng)

- Thêm tên screen vào `RootStackParamList` / `BottomTabParamList` trong `src/app/navigation/types.ts`.
- Đăng ký `<Stack.Screen>` trong `RootNavigator.tsx` hoặc `<Tab.Screen>` trong `BottomNavigator.tsx` (chuẩn: `headerShown: false`, `animation: 'fade'`).
- Điều hướng bằng `useAppNavigation()`.

### 3.6 State Management (~20 dòng)

- **Mọi async state qua Redux Toolkit thunks** — slice `*Slice.ts` (createSlice + sync reducers + extraReducers), `*Thunks.ts` (createAsyncThunk, **chỉ** gọi use case qua `container`, `rejectValue: string`), `*Selectors.ts` (createSelector memoize), hook `use<X>` bọc dispatch + selectors.
- **Không dùng React Query** — dependency đã được xoá (2026-09-07); không introduce lại, toàn bộ async state đi qua thunks.
- **Theme không nằm trong Redux** — React Context (`ThemeProvider` + `useTheme`).
- Hook presentation có thể gọi `container` trực tiếp (không bắt buộc qua thunk).
- Store: `serializableCheck: false`; typed hooks `useAppDispatch`/`useAppSelector` từ `@/app/store`.
- Callback 401/403 đăng ký ở `src/app/store/index.ts` → dispatch `clearUser`.

### 3.7 DI Container (~6 dòng)

- Singleton map thủ công trong `src/core/di/container.ts`, eager instantiate lúc import.
- Thêm feature: datasource → repository → use case vào object `container`.

### 3.8 API Layer (~12 dòng)

- `axiosClient` (base URL/timeout từ `env.ts`) — chỉ RemoteDataSource import.
- Endpoint đặt trong `src/core/api/endpoints.ts` (`ENDPOINTS` const, endpoint động dạng hàm).
- Mọi lỗi axios được normalise thành `ApiError` (response interceptor).
- Token giữ ở module-level `setClientAuthToken` (không đọc từ Redux trong interceptor).

### 3.9 Theme & UI (~25 dòng)

- **Bắt buộc** `useTheme()` từ `@/core/theme` để lấy màu — **cấm** import tĩnh FTheme cho màu trong UI code (dark mode phụ thuộc điều này).
- `useTheme()` trả `{theme, isDark, mode, setMode}` — `theme` là full DefaultTheme; screen destruct `const {colors} = theme`.
- Pattern screen: `createStyles(colors)` factory (`StyleSheet.create`), `useMemo([colors])` khi cần.
- Màu chỉ dùng từ token `ColorsProps` (~50 keys: `primary`, `title/label/body/subtitle/placeHolder`, status groups...).
- Component dùng chung: prefix `F` (FText, FFilledButton, FTextInput, FAppbar, FIcon, FIconButton, FLoading, FSnackbar, FBottomSheet, FDialog, FSwitch, FSlider, FStepIndicator, FExpansionPanel, FProgress, FTooltip) — import từ `@/shared/components`.
- Text phải dùng `<FText typo={...}>` với typography token từ `FTheme.fonts`.
- Icon: SVG XML string tĩnh trong `FFilled`/`FOutlined` (`src/shared/styles/FIconStyles.tsx`), chứa literal `fill="black"` để tint được — **không** dùng vector-icon fonts.
- Navigation font styles (`regular/medium/bold/heavy`) **bắt buộc** khai báo `fontFamily` + `fontWeight` (type enforce).
- `NavigationContainer` nhận `theme={theme}`; Paper theme rebuild qua `buildPaperTheme`.
- Snackbar qua `useFSnackbar()` (provider đã mount).

### 3.10 i18n (~6 dòng)

- i18next + react-i18next, `lng: 'vi'` mặc định, `fallbackLng: 'en'`, không detector.
- Khởi tạo bằng side-effect `import '@/core/i18n'` (đã có trong `src/app/App.tsx`).
- Dùng `const {t} = useTranslation()` + key dạng `t('login.title')`, `t('common.error')`; locale files `src/core/i18n/locales/{en,vi}.json`.
- Current practice: nhiều chỗ hardcode tiếng Việt (được duyệt theo YAGNI) — chỉ thêm key mới cho flow mới thật sự cần.

### 3.11 Testing (~15 dòng)

- Test colocated `*.test.ts(x)` cạnh source (feature tests); app-level tests ở `__tests__/` root.
- **Không có jest setup file** — mọi mock khai báo inline `jest.mock()` trong từng test.
- Test chạm App tree phải mock: notifee, firebase messaging, AsyncStorage, touch-id, gesture-handler, paper, safe-area — **copy mock block từ `__tests__/App.test.tsx`**.
- `ThemeProvider` render `null` đến khi hydrate AsyncStorage xong — phải await `renderer.act()`.
- Mock repo cho UseCase test: `jest.Mocked<I<X>Repository>` object thủ công.
- Thêm lib ESM-only mới → phải mở rộng `transformIgnorePatterns` trong `jest.config.js`.
- Rule: UseCase mới / DTO mapper mới / slice mới phải kèm unit test. Baseline: tsc clean, toàn bộ test pass (đếm lại số lượng khi implement — cleanup 2026-09-07 có thể đã thay đổi).

### 3.12 Git Conventions (~8 dòng)

- Commit format: `type(scope): lowercase imperative summary` (types: feat, fix, refactor, test, docs, chore).
- Commit nhỏ, tách biệt theo mục đích.
- Single branch `dev` (không main/master); không PR flow trong repo.

### 3.13 Critical Gotchas (~30 dòng)

Liệt kê dạng bullet ngắn (mỗi mục 1–2 dòng) — đây là các bẫy AI dễ sai nhất:

1. Không xoá patch touch-id / script postinstall (Android build fail).
2. ThemeProvider render `null` trước khi hydrate xong.
3. `Storage` (`@/core/utils/storage`) JSON-wrap mọi giá trị — **cấm gọi AsyncStorage trực tiếp**; key dùng constant từ `src/core/constants/storageKeys.ts`.
4. Date dùng `moment` qua `FDate` (`src/core/utils/date.ts`) — không dùng native Date/dayjs.
5. Form dùng Formik render-prop + validate thủ công (`FValidatePhone`/`FValidateEmail` từ `@/core/utils/validation`), không yup.
6. Keyboard: `KeyboardAwareScrollView` + `keyboardShouldPersistTaps="handled"`, `Keyboard.dismiss()` trước submit async.
7. Prettier config đặc thù: `arrowParens: avoid`, `bracketSpacing: false`, `bracketSameLine: true`, `singleQuote`, `trailingComma: all` — tuân theo khi viết code.
8. Firebase cần `GoogleService-Info.plist` (iOS) + `google-services.json` (Android) tồn tại thì mới build được; FCM auto-init tắt, register thủ công qua `src/core/utils/firebase/fcmHelper.ts`.
9. `fontFamily: 'Inter'` được tham chiếu nhưng chưa bundle font file — known state, không tự thêm font.
10. LoginScreen phụ thuộc exact Vietnamese error substrings — giữ nguyên message contract khi sửa login.
11. Providers order có ý nghĩa (GestureHandler → Redux → Theme → Menu → Paper → Snackbar) — không đổi thứ tự.
12. `react-native-vector-icons` link trên Android nhưng không dùng trong JS.

### 3.14 Sync Rule & Pending Cleanups (~5 dòng)

- Rule sync: _"When changing any convention, update both README.md and this file."_
- Tại thời điểm viết spec (2026-09-07): **không còn cleanup nào đang chờ** — cả 4 khoản
  (rename `FBottomSheet`/`FTooltip`, xoá `user:` alias, xoá shim FTheme, xoá `react-query`)
  đã land qua commit `5c700c1`/`e90f994`. Section "Pending cleanups" trong CLAUDE.md chỉ
  tạo khi có nợ mới xuất hiện.

## 4. Nguồn dữ liệu nghiên cứu

- Khảo sát code toàn diện 2026-09-07 (Explore agent): kiến trúc, theme, shared components,
  i18n, state management, DI, API layer, testing, git, environment, gotchas — làm cơ sở
  trực tiếp cho các rule ở mục 3.
- `README.md` §1–§9 (bộ quy tắc tiếng Việt hiện có).
- `docs/superpowers/specs/2026-09-05-dark-light-theme-design.md` (theme design — rule
  "useTheme bắt buộc", "theme không dùng Redux").
- `docs/superpowers/plans/` + cleanup spec đã duyệt (danh sách pending cleanups).

## 5. Tiêu chí nghiệm thu

1. File `CLAUDE.md` tồn tại ở root, tiếng Anh, 150–250 dòng.
2. Mỗi section trong mục 3 của spec này có mặt tương ứng trong CLAUDE.md.
3. Mọi rule kiểm chứng được against code hiện tại (không rule nào mô tả state chưa tồn tại).
4. Không mâu thuẫn với README §3–§9 (nơi trùng nội dung).
5. `npm test` + `npx tsc --noEmit` vẫn pass (không đổi code — chỉ verify không vỡ gì).

## 6. Rủi ro & giảm thiểu

| Rủi ro                                            | Giảm thiểu                                                  |
| ------------------------------------------------- | ----------------------------------------------------------- |
| README và CLAUDE.md lệch nhau theo thời gian      | Sync rule D3 + pending-cleanups list nhắc cập nhật          |
| File quá dài → tốn token mỗi session              | Budget 250 dòng tối đa; review độ dài khi nghiệm thu        |
| Refactor/cleanup land nhưng quên update CLAUDE.md | Sync rule D3 nhắc cập nhật; review PR/commit chú ý file này |

## 7. Future Work (ngoài phạm vi)

- ESLint import-boundaries enforcement cho layer rules.
- Husky pre-commit (lint + tsc).
- CI chạy test tự động.
