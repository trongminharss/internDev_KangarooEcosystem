# Home Screen — Thiết kế triển khai (trạng thái chưa có thiết bị)

Ngày: 2026-09-18
Tham chiếu: `docs/superpowers/plans/KGR_HOME_UI_FLOW.md`, ảnh UI đính kèm (màn Home trạng thái chưa ghép nối thiết bị).

## 1. Phạm vi

- Dựng UI màn Home theo ảnh tham chiếu cho **trạng thái chưa có thiết bị**: header lời chào + avatar, banner "Chưa có thiết bị nào được ghép nối" + CTA "Kết nối ngay", lưới sản phẩm 2 cột, nút "Xem thêm".
- Nhánh "đã có thiết bị" **không thuộc phạm vi** — `DeviceSection` giữ placeholder, là điểm tích hợp sau (đúng mục 9 của flow doc).
- Dữ liệu sản phẩm/thiết bị: **mock trong presentation**. Home vẫn là presentation-only feature (không domain/data/redux). Trạng thái loading/error/empty được mô phỏng và demo được.
- Điều hướng: chỉ nối đích có sẵn (avatar → Account). Các đích chưa tồn tại (Kết nối ngay, chi tiết SP, giỏ hàng, Xem thêm, Thử lại) là noop + comment `// TODO: integration point`.
- Text: thêm key i18n `home.*` cho cả `vi` và `en`.
- BottomNavigator đã có sẵn (floating pill, 4 icon, không label) — **không sửa**.

## 2. Kiến trúc & Files

Tất cả trong `src/features/home/presentation/`:

```
presentation/
  screens/HomeScreen.tsx        # thay F-components showcase → màn Home thật
  components/
    HomeHeader.tsx              # lời chào theo giờ + avatar (bấm → Account)
    DeviceSection.tsx           # switch theo trạng thái vùng thiết bị
    EmptyDeviceCard.tsx         # banner gradient xanh + icon link + CTA "Kết nối ngay"
    ProductSection.tsx          # tiêu đề + switch trạng thái grid
    ProductCard.tsx             # ảnh, badge HOT/Mới, tên, giá, icon giỏ hàng
  mocks/
    mockHome.ts                 # MOCK_PRODUCTS + MOCK_REGION_STATE
    (cập nhật barrel index.ts — chỉ export presentation)
```

State vùng (device/product) là `useState` trong HomeScreen, truyền xuống qua props `{status, data}`. Không Redux, không domain/data.

## 3. Layout

- `FlatList numColumns={2}` làm vùng cuộn chính:
  - `ListHeaderComponent`: HomeHeader + DeviceSection + tiêu đề "Khám phá sản phẩm".
  - `renderItem`: ProductCard.
  - `ListFooterComponent`: nút "Xem thêm" (ẩn khi danh sách rỗng/lỗi).
  - `contentContainerStyle`: đệm bottom `insets.bottom + 90` cho tab bar nổi (như HomeScreen hiện tại).
- Chiều ngang, gap, radius dùng `tokens` + `spacing` helpers từ `@/shared/styles`.

## 4. Trạng thái & Data flow

- `MOCK_REGION_STATE: 'loading' | 'success' | 'error' | 'empty'` — const trong `mockHome.ts`, flip 1 dòng để demo (mặc định `'success'`).
- Cả 2 vùng đọc chung const, render độc lập — một vùng lỗi không chặn vùng còn lại.
- Mount: state khởi đầu `'loading'`; mock chuyển sang `MOCK_REGION_STATE` sau ~800ms (setTimeout trong mockHome). Khi nối API thật, thay mock bằng thunks — giữ nguyên interface props của components.
- Bảng trạng thái:

| Vùng | loading | success + rỗng | success + data | error |
|---|---|---|---|---|
| Device | skeleton/loading trong vùng | banner EmptyDeviceCard + CTA | placeholder điểm tích hợp | thông báo ngắn + Thử lại |
| Product | skeleton dạng lưới 2 cột | thông báo gọn, ẩn Xem thêm | lưới card | thông báo + Thử lại |

- Banner "chưa có thiết bị" chỉ hiển thị khi đã tải thành công và danh sách rỗng (không dùng trạng thái rỗng thay loading/lỗi).
- Ảnh sản phẩm lỗi/thiếu: placeholder View màu + icon, giữ tên và giá.

## 5. Tương tác

| Thao tác | Hành vi lần này |
|---|---|
| Bấm avatar | `navigation.navigate('Account')` |
| Kết nối ngay | noop + `// TODO: integration point` (luồng thêm thiết bị) |
| Ảnh/tên sản phẩm | noop + TODO (chi tiết sản phẩm) |
| Icon giỏ hàng | noop + TODO; là touch target riêng, không kích hoạt bấm card |
| Xem thêm | noop + TODO (danh sách sản phẩm) |
| Thử lại | noop + TODO (chưa có hàm tải thật) |
| Tab dưới | BottomNavigator có sẵn xử lý |

Lời chào theo giờ (sáng/trưa/chiều/tối) tính bằng `new Date().getHours()` inline — không cần moment/FDate.

## 6. Visual mapping

- Màu: `useTheme().colors` (gradient banner dùng `primary*`).
- Text: `FText` với typo token từ `FTheme.fonts`.
- Icon (link, giỏ hàng): `FFilled`/`FOutlined`; nếu thiếu icon phù hợp thì thêm SVG string mới vào `FIconStyles.tsx` với `fill="black"`.
- Badge HOT/Mới: View nhỏ đè góc trái card, màu từ nhóm status tokens, giá trị lấy từ dữ liệu mock.
- Ảnh sản phẩm mock: placeholder View màu + icon (chưa có asset ảnh thật).

## 7. i18n

Thêm nhóm key `home.*` vào `src/core/i18n/locales/vi.json` + `en.json`: greeting theo giờ, banner, CTA kết nối, tiêu đề section, xem thêm, thử lại, hot, mới, empty/error states.

## 8. Testing

- `__tests__/HomeScreen.test.tsx` (react-test-renderer, mock block theo `App.test.tsx`).
- `jest.mock` file `mockHome.ts` để điều khiển `MOCK_REGION_STATE` từng test case.
- Assert: đúng thứ tự bố cục theo ảnh; banner chỉ hiện khi `empty`; Xem thêm ẩn khi rỗng/lỗi; bấm giỏ hàng không mở chi tiết (noop); avatar render fallback; loading/error/empty phân biệt rõ.
- Unit test mới cho components có logic (HomeHeader greeting theo giờ).

## 9. Ngoại phạm vi (điểm tích hợp sau)

- UI trạng thái đã có thiết bị.
- Nối API thật cho product/device (nâng cấp thành feature 3 lớp theo recipe chuẩn AGENTS.md).
- Luồng thêm thiết bị, chi tiết sản phẩm, danh sách sản phẩm, giỏ hàng.
- Quy tắc thêm giỏ, giới hạn số sản phẩm trên Home.
