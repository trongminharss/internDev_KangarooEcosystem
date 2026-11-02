# Home Screen — Connected Device State Design

Date: 2026-09-19

## Context

`HomeScreen` hiện có `HomeHeader` + `DeviceSection` + product grid. `DeviceSection`
đã xử lý `loading` / `empty` (EmptyDeviceCard) / `error`, nhưng nhánh `success`
chỉ trả `null` (TODO "has-device UI chưa đặc tả"). Cần bổ sung trạng thái **đã
kết nối thiết bị** và tách rõ từng vùng màn hình để dễ quản lý.

Ảnh thiết kế: màn hình đã kết nối gồm card chất lượng nước (gradient xanh, grade
A+ / 3.2 ppm), 3 pill stats, row "A+ 32 ppm" có mũi tên, 3 quick actions (Bảo
Hành / Thay lõi / Hỗ trợ), và grid "Thiết bị nổi bật" thay cho product grid.

## Quyết định

Phương án **A — DeviceSection sở hữu vùng trạng thái, FlatList đổi data theo
trạng thái**:

- `DeviceSection` mở rộng: `success` → `ConnectedDevicePanel`.
- `HomeScreen` giữ một FlatList; connected ⇒ data đổi từ products sang devices,
  tiêu đề section đổi, see-more footer ẩn.
- Bỏ phương án B (hai màn hình con — nhân đôi khung FlatList) và C (toàn bộ UI
  trong DeviceSection — mất virtualization, section phình to).

Đã chốt với user: connected thay thế hoàn toàn product grid; dữ liệu từ mock
(extend `mockHome.ts`, giữ pattern "swap for thunks"); mọi đích điều hướng mới
là noop + TODO.

## Data model & mocks (`mockHome.ts`)

```ts
export interface MockDevice {
  id: string;
  room: string;       // 'Phòng khách' — chuỗi hiển thị, pattern như MockProduct.name
  name: string;       // 'Máy lọc nước'
  statusText: string; // 'Tốt' (kèm chấm xanh)
}

export interface ConnectedDeviceData {
  grade: string;        // 'A+'
  gradePpm: string;     // '3.2' — số trong card lớn
  tdsPpm: string;       // '32' — số trong row A+ (khác gradePpm, theo ảnh 1)
  qualityLabel: string; // 'Tuyệt vời' — data vì là rating theo grade
  stats: {efficiency: string; filtered: string; inputPpm: string}; // '85%', '12.4L', '214'
  devices: MockDevice[];
}

export type DeviceRegionResult =
  | {status: 'error' | 'empty'}
  | {status: 'success'; data: ConnectedDeviceData};
```

- `MOCK_CONNECTED` đúng số liệu ảnh 1; `loadDeviceRegion('success')` trả
  `{status: 'success', data: MOCK_CONNECTED}`.
- Chuỗi hiển thị trong mock giữ literal tiếng Việt (như product name hiện tại);
  label UI mới qua i18n.

## Components

### `ConnectedDevicePanel.tsx` (mới)

Props: `data: ConnectedDeviceData`.

- Card gradient xanh (dùng lại pattern Svg `LinearGradient` của EmptyDeviceCard,
  `blue200 → blue50`): trái "Chất lượng nước" + qualityLabel, phải grade lớn +
  gradePpm + "ppm".
- Hàng 3 pill stats nền trắng: giá trị đậm + label nhỏ.
- Row `grade` + `tdsPpm` + "ppm" (vd "A+ 32 ppm") + `FFilled.arrow_right`,
  Pressable noop, testID `device-tds-row`.
- Hàng 3 quick actions (icon tròn nền `green50` + label, noop): Bảo Hành
  `FFilled.shield`, Thay lõi `FOutlined.refresh`, Hỗ trợ `FFilled.phone`;
  testID `device-action-warranty|filter|support`.

### `DeviceCard.tsx` (mới)

Mirror ProductCard: Pressable `flex:1`, nền `card`, radius `medium`; icon
placeholder trên nền `green50` (`FFilled.settings`, kèm comment
`ponytail:` placeholder tới khi có icon thiết bị thật); room (subtitle) → name
(đậm) → chấm xanh + statusText. testID `device-card-${id}`, onPress noop từ
screen.

### `DeviceSection.tsx` (sửa)

- Thêm prop `data?: ConnectedDeviceData`; nhánh `success` render
  `ConnectedDevicePanel` (guard `data ? panel : null`); các trạng thái khác giữ
  nguyên.
- Thêm export `DeviceGridHeader` trong cùng file: "Thiết bị nổi bật" + nút
  "Thêm ⊕" noop, testID `device-more` — không tạo file mới.

## `HomeScreen.tsx` (sửa)

```tsx
const connected = device.status === 'success';
const devices = connected && device.data ? device.data.devices : [];
```

- FlatList giữ nguyên khung (`numColumns={2}` dùng chung cho 2 grid):
  - `data`: connected → `devices`, không → products; `keyExtractor` dùng chung
    `item.id`.
  - `renderItem`: connected → `DeviceCard`, không → `ProductCard`.
  - `ListHeaderComponent`: `HomeHeader` → `DeviceSection` (thêm `data`) →
    connected ? `DeviceGridHeader` : `ProductSectionTitle`.
  - `ListEmptyComponent`: connected → `null` (mock bảo đảm devices ≠ rỗng; thêm
    trạng thái empty-devices khi có API thật), không → `ProductSectionBody`.
  - `ListFooterComponent` (see-more): chỉ render khi **không** connected.
- Device `loading` ⇒ `connected = false` ⇒ fallback products path — hành vi
  hiện tại được bảo toàn trong lúc chờ.
- Device success + products error ⇒ products bị bỏ qua, chỉ hiện device grid.

## i18n (`home.device`, vi + en)

| key | vi |
|---|---|
| `quality` | Chất lượng nước |
| `statEfficiency` | Hiệu suất lọc |
| `statFiltered` | Nước lọc |
| `statInput` | Nguồn vào |
| `warranty` | Bảo Hành |
| `replaceFilter` | Thay lõi |
| `support` | Hỗ trợ |
| `gridTitle` | Thiết bị nổi bật |
| `more` | Thêm |

"ppm" hardcode trong component (đa năng). en.json đặt tên tiếng Anh tương ứng.

## Tests

- `__tests__/HomeScreen.test.tsx` — thêm case connected: `loadDeviceRegion` →
  `{status:'success', data:{...}}`; assert thứ tự `home-header` →
  `device-panel` → `device-card-*`; không có `see-more`/`product-card-*`;
  press tds-row/action không navigate. Case cũ giữ nguyên (mock
  `{status:'empty'|'error'}` vẫn hợp union mới).
- `__tests__/HomeSections.test.tsx` — thêm: DeviceSection success render panel;
  `DeviceGridHeader` đúng title + Thêm; DeviceCard render room/name/status +
  noop press.
- `__tests__/mockHome.test.ts` — cập nhật shape mới (success có `data`).
- Gates: `npx tsc --noEmit`, `npm test`, `npm run lint`.

## Error handling

- Guard `data ? panel : null` cho success thiếu data.
- Mọi callback mới là noop an toàn; không có luồng lỗi mới (mock đồng bộ shape
  cũ cho error/empty).
