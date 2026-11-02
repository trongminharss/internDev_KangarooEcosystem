# Dark/Light Theme — Design Spec

- **Ngày:** 2026-09-05
- **Project:** RNCore (React Native template dùng để nhân bản sang các dự án khác)
- **Trạng thái:** Đã duyệt

## 1. Mục tiêu

Triển khai tính năng dark/light theme cho toàn bộ app với 3 chế độ: **Light / Dark / System**.

Yêu cầu đặc biệt: source này được dùng làm template nhân bản cho các dự án khác, nên giải pháp phải:

- Không phụ thuộc thêm dependency nào
- Không coupling với Redux/i18n/feature cụ thể — theme là một module tự chứa trong `core/`
- Team dự án clone chỉ cần sửa 1-2 file palette là theme đổi theo toàn app
- Giữ backward compatibility export `FTheme` để code cũ/project clone không vỡ build

## 2. Nghiên cứu mô hình phổ biến nhất

Mô hình chuẩn công nghiệp (theo React Navigation v7 docs — xác nhận tại https://reactnavigation.org/docs/themes/):

1. Định nghĩa theme là plain object theo chuẩn `DefaultTheme` (`dark: boolean`, `colors`, `fonts`)
2. `useColorScheme()` (React Native built-in) lấy chế độ sáng/tối của hệ điều hành
3. Truyền theme qua prop `theme` của `NavigationContainer` — đổi prop là toàn bộ UI navigation cập nhật
4. Component tự do truy cập theme qua hook `useTheme()`
5. `Appearance.setColorScheme()` đồng bộ các UI native (Alert, ActionSheet, TextInput select-all menu…)
6. Lựa chọn người dùng lưu qua AsyncStorage

Đây đúng là nền tảng mà codebase đang có sẵn (`FTheme` extend `DefaultTheme` + `ThemeContext`), chỉ cần nâng cấp lên bản đầy đủ.

## 3. Phương án đã chốt

**Approach A — Context-based (nâng cấp `ThemeContext` hiện có).**

So sánh với 2 phương án còn lại:

- **B (Redux slice):** gắn theme vào Redux → mọi project clone phải giữ Redux, phải hydrate trước render đầu (rủi ro flicker). **Loại**.
- **C (thư viện ngoài: unistyles/styled-components):** thêm dependency nặng, phải viết lại toàn bộ styling. **Loại**.

## 4. Kiến trúc

```
src/core/theme/
├── FTheme.ts         # giữ nguyên: LightTheme + ColorsProps + module declaration
├── DarkTheme.ts      # MỚI: bảng màu tối, derive từ FTheme (dark: true)
├── ThemeContext.tsx  # NÂNG CẤP: state holder {theme, isDark, mode, setMode}, hydrate từ Storage
└── index.ts          # re-export: FTheme (alias LightTheme), DarkTheme, useTheme, ThemeProvider, ThemeMode
```

File mới:

```
src/features/account/presentation/screens/components/ThemeSettingItem.tsx  # (hoặc inline trong AccountScreen)
```

Thay đổi:

```
src/core/constants/storageKeys.ts      # + KEY_THEME_MODE
src/app/navigation/RootNavigator.tsx   # NavigationContainer nhận theme prop
src/app/providers/AppProviders.tsx     # PaperProvider nhận theme động, StatusBar theo theme
src/app/App.tsx                        # bỏ hardcode StatusBar
src/features/account/presentation/screens/AccountScreen.tsx  # + UI toggle 3 lựa chọn
```

### 4.1 ThemeContext (nâng cấp)

```ts
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: DefaultTheme; // FTheme | DarkTheme đã resolve
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}
```

Luồng:

1. `ThemeProvider` mount → đọc `Storage.getItem<ThemeMode>(Storage.KEY_THEME_MODE)`; giá trị không hợp lệ/null → fallback `'system'`
2. Lỗi đọc storage → catch, dùng `'system'` (không crash app)
3. Resolve theme: `mode === 'system'` → `useColorScheme()` của RN; `'dark'` → DarkTheme; `'light'` → FTheme
4. `setMode(mode)` → cập nhật state + `Storage.setItem` (fire-and-forget, có catch lỗi log console)
5. Dev chỉ cần 1 state: `mode`. `theme`/`isDark` là derived value — không sync 2 state.

### 4.2 DarkTheme

Derive từ FTheme theo nguyên tắc:

- **Không đổi:** `primary`/`primarySub`, toàn bộ `secondary1-4` + sub, `info`, `success`, `warning`, `error` + sub (màu thương hiệu/trạng thái giữ nguyên, tăng độ tương phản khi cần)
- **Đảo nền/khung:** `white` → `#161C24` (màu nền tối chính), `black` → `#FFFFFF`, `grey1` → tông tối, `grey2` → tối hơn, `disable` → tối
- **Text tầng bậc:** giữ hệ thống `title`/`label`/`body`/`subtitle`/`placeHolder` (alpha thay đổi theo nền): nền tối → chữ sáng
  - `title`: `#F4F7FF` (thay `#00204D`)
  - `label`/`body`/`subtitle`/`placeHolder`: trắng với alpha giảm dần (0.9 → 0.4)
- **Background tint:** `primaryBackground`/`infoBackground`/`successBackground`/`warningBackground`/`errorBackground` + border → phiên bản tối (alpha thấp, tông tối)
- **font:** giữ nguyên toàn bộ font styles, chỉ đổi `color` mặc định của text → sang `title` tối
- `dark: true`, `colors.card`/`background` (của React Navigation) → `#161C24`

### 4.3 Refactor component — import tĩnh → hook

Quy tắc: **mọi component/screen truy cập màu qua `useTheme()`**, không import `FTheme` tĩnh.

Phạm vi refactor:

- `shared/components/` (11 file chắc chắn): FFilledButton, FLoading, FText, FProgress, FSnackbar, FBottmSheet, FIcon, FIconButton, FTextInput, FAppbar, FSlider
- `shared/components/` (5 file cần kiểm tra, chỉ sửa nếu có dùng FTheme): FDialog, FExpansionPanel, FSwitch, FToolTip, FStepIndicator
- `app/navigation/BottomNavigator.tsx`: tabBarActiveTintColor/InactiveTintColor/Felevation
- Screens: HomeScreen, AccountScreen, LoginScreen (styles tĩnh `StyleSheet.create` → chuyển thành function `createStyles(theme)` gọi trong component)

Backward compatibility: `shared/styles/FTheme.ts` + `styles/index.ts` giữ re-export `FTheme` → build không vỡ với code chưa refactor.

### 4.4 Đồng bộ Paper, StatusBar, native UI

- **PaperProvider:** nhận `theme={paperTheme}`, trong đó `paperTheme = {..., colors: {primary, background, surface, text, placeholder, outline, ...}}` map từ theme hiện tại (helper `buildPaperTheme(theme)` trong `core/theme`). Chỉ map các màu Paper đang dùng (FTextInput).
- **StatusBar:** ở `AppProviders`/`App.tsx`: `barStyle = isDark ? 'light-content' : 'dark-content'`; Android `backgroundColor` theo nền theme.
- **Native sync:** `Appearance.setColorScheme(isDark ? 'dark' : 'light')` trong `useLayoutEffect` theo docs RN (Alert, ActionSheet, ...).

### 4.5 UI toggle — AccountScreen

AccountScreen trở thành màn hình cài đặt đơn giản: 3 dòng lựa chọn **Sáng / Tối / Theo hệ thống**

- Nhấn → `setMode` tương ứng
- Highlight dòng đang chọn: chữ màu `theme.colors.primary` + icon check `FIcon (FFilled.check)` phải cạnh — không dùng FSwitch
- i18n: text hardcode tiếng Việt như style hiện tại của project (BottomNavigator dùng "Trang chủ" trực tiếp), không mở rộng locale — YAGNI

### 4.6 Data flow tổng quát

```
User chọn (AccountScreen) → setMode → ThemeContext state
                                    ↓
Storage (AsyncStorage)        → hydrate lúc mount → state
                                    ↓
         mode='system' ? useColorScheme() : mode
                                    ↓
                          theme = isDark ? DarkTheme : FTheme
                        ┌───────────┴────────────┐
             NavigationContainer theme prop     ThemeContext.Provider value
                    (navbar/tab/header)         (components qua useTheme)
                        └───────────┬────────────┘
                    PaperProvider (buildPaperTheme)
                    StatusBar + Appearance.setColorScheme
```

## 5. Error handling

| Tình huống                                  | Xử lý                                             |
| ------------------------------------------- | ------------------------------------------------- |
| Đọc AsyncStorage lỗi / giá trị không hợp lệ | fallback `'system'`, log console                  |
| Ghi AsyncStorage lỗi                        | catch, log, UI vẫn đổi theme trong phiên hiện tại |
| `useColorScheme()` trả null (edge case)     | coi như `'light'`                                 |

## 6. Testing

- `jest` (đã cấu hình, `__tests__/App.test.tsx` render App — mở rộng: giữ test hiện tại chạy, mock đã có AsyncStorage)
- Test mới cho `ThemeContext` (dùng `@testing-library/react-native`? — KHÔNG, project chưa có; dùng `react-test-renderer` sẵn có): test setMode/switch theme/hydrate
- Test `resolveTheme(mode, scheme)` — pure function, test nhanh
- Verify manual: 3 chế độ trên iOS + Android, kill app → khởi động lại → mode giữ nguyên

## 7. Phạm vi — không làm (YAGNI)

- Không thêm animation chuyển theme
- Không thêm dependency (redux-persist, unistyles, styled-components…)
- Không tách locale mới cho cài đặt
- Không đổi font system
- Không làm store Redux cho theme

## 8. Kiến trúc tương lai (ghi chú cho project clone)

- Team clone: sửa `DarkTheme.ts`/`FTheme.ts` là xong; giữ nguyên `ThemeContext`
- Nếu cần theme riêng cho 1 màn hình: bọc `<ThemeProvider theme={...}>` con — hạ tầng đã hỗ trợ (ThemeContext cũ đã có prop theme này)
