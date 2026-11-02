# Bottom Navigation Redesign — Design

Ngày: 23/09/2026
Trạng thái: Đã chốt với stakeholder, chờ implementation plan
Đặc tả hành vi/motion nguồn: [2026-09-23-bottom-navigation-motion-spec.md](./2026-09-23-bottom-navigation-motion-spec.md) (sao chép từ `~/Downloads/BOTTOM_NAVIGATION_MOTION_SPEC.md`, giữ nguyên làm chuẩn nghiệm thu)

## 1. Phạm vi đã chốt

| Quyết định | Lựa chọn |
| --- | --- |
| Tính năng | **Full spec**: (A) tap + capsule trượt/giãn **và** (B) giữ 220ms → kéo preview → thả chọn |
| Blur nền | Bỏ qua — dùng nền bán trong suốt màu token (fallback mục 8.6 spec) |
| Haptic | **Có** — rung 1 lần khi kích hoạt preview, qua `react-native-haptic-feedback` |
| Keyboard | **Có** — ẩn bar khi bàn phím hiện (translateY + opacity, giữ chỗ layout), cancel drag nếu đang kéo |
| Icon filled/outline | Không có cặp SVG tương ứng trong repo → fallback mục 3.3 spec: chỉ đổi màu/opacity |

Các quyết định tương tác, thông số motion, quy tắc hysteresis/commit/hủy và bảng nghiệm thu NAV-01→20 **tuân thủ nguyên văn đặc tả nguồn**, không lặp lại trong tài liệu này.

## 2. Hướng tiếp cận

**Chọn: custom `tabBar` hoàn chỉnh theo cấu trúc đề xuất mục 8.2 của spec** — truyền component riêng vào prop `tabBar` của `Tab.Navigator`.

Lý do so với 2 phương án đã loại:

- *Overlay capsule trên default tab bar*: bị loại vì PlatformPressable tự xử lý touch riêng, không thể làm hold-drag — vi phạm điều kiện mục 8.4 (một bộ điều phối gesture duy nhất).
- *Single-file custom tabBar*: khả thi nhưng 600–800 dòng trộn gesture + spring + layout + a11y, khó tune và không test được từng phần.

## 3. Cấu trúc file

```text
src/app/navigation/
  BottomNavigator.tsx              # sửa: truyền tabBar, bỏ PlatformPressable
  types.ts                         # không đổi
  config/bottomBarMotion.ts        # token + ngưỡng + hàm geometry thuần
  components/AnimatedBottomBar.tsx # custom tabBar: onLayout, safe area, keyboard
  components/BottomBarItem.tsx     # icon + accessibility + press scale 0.94
  components/SlidingIndicator.tsx  # capsule — chỉ render shared values, không navigation
  hooks/useBottomBarMotion.ts      # spring 2 cạnh, press feedback, preview, snap/restore
  hooks/useBottomBarGesture.ts     # phân xử tap/hold-drag, hysteresis, commit qua runOnJS
```

## 4. Tách lớp state (spec 8.3)

| Lớp | Nguồn | Quyền quyết |
| --- | --- | --- |
| Chân lý navigation | `state.index` (react-navigation) | selected icon, `accessibilityState.selected`, vị trí capsule khi restore |
| Chuyển động (UI thread) | Reanimated shared values: `centerX`, `halfWidth`, `iconScales`, `iconOpacity` | hình ảnh capsule/crossfade |
| Gesture session | shared values: `gesturePhase`, `previewIndex`, `sessionId`, `didCommit` | phân xử tap/hold/drag, chống commit trùng |

Preview không bao giờ ghi vào navigation/Redux; commit chỉ xuất phát từ `commitSelection(routeKey, sessionId)` chạy trên JS tại đúng 1 điểm (spec 8.5).

## 5. Quyết định riêng của repo

- **Theme:** thêm nhóm token `tabBar` gồm 5 khóa (`background`, `indicator`, `iconActive`, `iconInactive`, `border`) vào `ColorsProps` + light/dark trong `src/core/theme`; UI lấy qua `useTheme()`. Không hardcode màu mô phỏng từ video.
- **Layout khác hiện tại 2 chỗ:** chiều cao thanh 65 → **64**, icon 28 → **26**. Còn lại giữ theo spec 3.2 (margin 16, radius full, capsule 52, padding trong 6, bottom gap 8, hit area ≥ 48×48).
- **Spacing tokens:** giá trị trùng token sẵn có thì dùng token (ví dụ `tokens.space.sm` cho margin 16); số geometry tính runtime từ `onLayout` là geometry-coupled — ghi chú exempt theo rule spacing trong AGENTS.md.
- **Haptic:** import thẳng `react-native-haptic-feedback` trong `useBottomBarGesture`, gọi đúng 1 lúc kích hoạt preview; không viết wrapper. Mock trong jest per-test theo convention.
- **Keyboard:** ẩn visual bằng translateY + opacity, giữ nguyên chỗ layout (bar area trống khi gõ) — các screen form đã tự xử lý scroll, không phá layout navigation.
- **Gesture API:** Tap + LongPress (220ms, maxDistance 8dp) trong một hook duy nhất, chung worklet state; cách compose chính xác cho gesture-handler 3.2.1 được pin ở bước implementation plan (yêu cầu kiểm chứng API của spec 8.4).
- **UI → JS bridge:** navigation chỉ được gọi từ `runOnJS` tại thời điểm commit; không đưa navigation object vào worklet, không gọi JS mỗi frame.

## 6. Testing & nghiệm thu

| Kiểm chứng | Cách |
| --- | --- |
| `__tests__/bottomBarGeometry.test.ts` | hàm thuần: slot/center/pill, clamp capsule, candidate + hysteresis 6dp, vùng thả hợp lệ |
| `__tests__/AnimatedBottomBar.test.tsx` | render 4 item, selected theo `state.index`; mock block copy từ `__tests__/App.test.tsx` |
| Worklet/spring | không unit test — nghiệm thu bằng checklist NAV-01→20 (trong đặc tả nguồn) trên thiết bị release build, 60/120Hz |
| Quality gates | `npx tsc --noEmit`, `npm test`, `npm run lint`, `npm run check:arch` xanh sau mỗi milestone |

## 7. Dependency

Duy nhất 1 dependency mới: `react-native-haptic-feedback` (RN thuần, iOS UIImpactFeedbackGenerator + Android Vibration; cần `cd ios && bundle exec pod install` và config Android 1 dòng). Cài ngay từ milestone 1 để pod install một lần duy nhất.

## 8. Trình tự triển khai (spec mục 11)

Mỗi milestone chạy được và có thể dừng:

1. Layout 4 tab + capsule tĩnh đúng vị trí + hit area
2. Tap + capsule trượt/giãn, xử lý bấm liên tục, chống giật hướng (NAV-01→05)
3. Hold 220ms → preview → kéo → thả/đổi chiều/hủy, chống commit trùng (NAV-06→12, 16, 20)
4. Crossfade icon, Reduce Motion, screen reader, keyboard hide (NAV-13→18)
5. Haptic + tune thông số theo video + profile hiệu năng (NAV-19)
