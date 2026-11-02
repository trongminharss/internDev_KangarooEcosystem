# Component Showcase Home — Design

- **Date:** 2026-09-11
- **Feature:** `home` (presentation-only)
- **Status:** Approved

## Mục tiêu

Biến HomeScreen thành catalog trực quan của toàn bộ 16 F-components trong
`src/shared` + bộ icon mẫu, để tra cứu API và kiểm tra visual nhanh khi dev.
Showcase tương tác đầy đủ (slider kéo được, switch bật/tắt, overlay mở/đóng...),
trình bày trong một màn hình cuộn duy nhất.

## Quyết định đã chốt

| Quyết định    | Lựa chọn                                                     |
| ------------- | ------------------------------------------------------------ |
| Bố cục        | 1 màn hình cuộn (ScrollView), mỗi component 1 section inline |
| Mức độ demo   | Tương tác đầy đủ, đúng trạng thái thật                       |
| Icon          | ~8 icon mẫu từ `FFilled`/`FOutlined`, KHÔNG gallery 617 icon |
| Tổ chức file  | HomeScreen + 5 file section nhóm theo loại + barrel          |
| Ngôn ngữ nhãn | Tiếng Việt hardcode (không thêm i18n keys — màn demo)        |

## Cấu trúc file

```
src/features/home/presentation/
  screens/HomeScreen.tsx            ← FAppbar + ScrollView + xếp 5 sections
  components/
    TypographySection.tsx           ← FText, FIcon, FIconButton, FTooltip
    ButtonsSection.tsx              ← FFilledButton, FSwitch
    InputsSection.tsx               ← FTextInput (4 biến thể)
    FeedbackSection.tsx             ← FLoading, FProgress, FSlider, FStepIndicator
    OverlaySection.tsx              ← FBottomSheet, FDialog, FSnackbar (useFSnackbar)
    index.ts                        ← barrel export sections
```

Không thêm route, không đổi `RootStackParamList`, không sửa file nào trong
`src/shared`.

## Bố cục màn hình

- `FAppbar` đầu trang: `title="F-Components Showcase"`, `noContent` (không nút
  back vì Home là tab đầu).
- Thân: `ScrollView` (không phải form nên không cần KeyboardAwareScrollView),
  mỗi section có tiêu đề `FText typo="title2"` và đường phân cách.
- Màu qua `useTheme()` → `createStyles(colors)` factory cuối file; nền
  `colors.white`, border `colors.grey1`.

## Nội dung demo từng section

### TypographySection

- FText: các typo chính `largeTitle, title1, title2, bodyText1, bodyText2,
subtitle1, buttonText1, label1`.
- FIcon: 8 icon mẫu (`c_check, c_info, c_remove, search, settings, close,
arrown_left, arrown_right` — mix FFilled/FOutlined), 2 size 16/24.
- FIconButton: 1 icon có `onPress` → show snackbar.
- FTooltip: bọc 1 FText, nhấn hiện message.

### ButtonsSection

- FFilledButton: `size48` (mặc định), `size40`, 1 bản custom
  `backgroundColor`/`textColor`.
- FSwitch: nối `useState` ngoài, bật/tắt được.

### InputsSection

- FTextInput cơ bản: gõ được, nút clear hiện khi focus + có text.
- FTextInput `secureTextEntry` + `rightIcon` mắt mở/đóng toggle state.
- FTextInput có `errorText` (đỏ, ví dụ "Email không hợp lệ").
- FTextInput `readonly`: `onPressIn` → show snackbar.

### FeedbackSection

- FLoading: `loadFullScreen={false}` (inline, luôn chạy).
- FProgress: `action="60%"`, có `value`/`value1`.
- FSlider: single (kéo, hiển thị % live) + range (`mode="Ranger"`, 2 thumb,
  hiển thị khoảng live).
- FStepIndicator: 3 bước, nút "Tiếp theo" tăng `currentPosition` (loop về 0).

### OverlaySection

- FFilledButton mở `FBottomSheet` (children: FText + FFilledButton đóng).
- FFilledButton mở `FDialog` (bản hardcoded hiện có của shared).
- 3 FFilledButton success / info / fail → `useFSnackbar().showSnackbar(msg,
{type})`.

### HomeScreen

- Chỉ compose: Appbar + ScrollView + 5 sections + spacing. Mọi state nằm trong
  section file của nó.

## Quy ước code

- Import qua alias `@/shared`, `@/core/theme`; không import relative ra ngoài
  feature.
- Sections là presentation thuần: không Redux, không thunk, không DI. Feature
  `home` vẫn presentation-only (YAGNI).
- Không sửa API của component shared, kể cả các điểm quirk (FSwitch nhận chỉ
  `status`, FProgress `action` là chuỗi width, FDialog nội dung hardcoded) —
  showcase demo đúng hiện trạng; state ngoài bọc quanh quirk nên mọi thứ vẫn
  hoạt động.

## Testing

- `HomeScreen.test.tsx` colocated, dùng `react-test-renderer`:
  render được toàn bộ tree và các section xuất hiện đúng thứ tự (query theo
  testID tiêu đề section).
- Mock inline theo khối chuẩn trong `__tests__/App.test.tsx` (gesture-handler,
  paper, safe-area, react-native-modal, animated-spinkit, react-native-svg,
  step-indicator, rn-tooltip). Không có jest setup file.
- Không viết unit test riêng cho từng section — không có logic ngoài `useState`
  hiển thị; coverage đến từ test render-all của HomeScreen.
- Quality gates phải sạch: `npx tsc --noEmit`, `npm test`, `npm run lint`.

## Error handling

- Không có async/data nên không có error state. Overlay tự đóng bằng state cục
  bộ; snackbar tự dismiss sau 2500ms (behavior sẵn có của FSnackbar).

## Ngoài phạm vi

- Gallery đầy đủ 617 icon.
- i18n keys mới cho màn showcase.
- Dark-mode tuning riêng cho từng section (màu đã tự theo `useTheme()`).
- Sửa bug/quirk của component shared (FSwitch, FDialog...).
