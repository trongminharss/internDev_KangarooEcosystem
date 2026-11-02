# Design: Xác thực số điện thoại (Phone + OTP)

- **Ngày:** 2026-09-16
- **Nguồn flow:** `/Users/macmini4/Downloads/AUTH_PHONE_OTP_FLOW.md`
- **Quyết định đã chốt:** thay thế hoàn toàn flow password/biometrics; bàn phím hệ thống `number-pad`; mock fallback giữ nguyên pattern demo-user; 1 bottom sheet điều khoản dùng chung; background water-wave dùng chung với onboarding (40% height màn phone, 60% màn OTP).

## 1. Mục tiêu

Một form số điện thoại dùng chung cho đăng nhập **và** đăng ký: sau khi OTP hợp lệ, hệ thống tự xử lý đăng nhập hoặc tạo tài khoản ngầm, không thêm màn hình phân loại. Điểm kết thúc là Home (tab `BottomNavigation`).

## 2. Phạm vi

**Trong phạm vi:**

1. `PhoneLoginScreen`: nhập SĐT, checkbox điều khoản (3 link), bottom sheet điều khoản, CTA "Tiếp tục".
2. `OtpScreen`: 6 ô OTP (bàn phím hệ thống), đếm ngược gửi lại 30s, CTA "Tiếp tục".
3. Data layer: `requestOtp` / `verifyOtp` + mock fallback demo-user.
4. Xóa hoàn toàn flow password + biometrics.

**Ngoài phạm vi:** nội dung điều khoản thật (placeholder), endpoint thật (đường dẫn tạm), touch-id package/patch (giữ nguyên theo AGENTS.md).

## 3. Luồng

```
PhoneLogin (AUTH-01)
  → nhập SĐT hợp lệ + tick checkbox → CTA enabled
  → [link điều khoản] → FBottomSheet 80% (AUTH-02) → "Đồng ý" → đóng sheet, form giữ nguyên
  → Tiếp tục → requestOtp → Otp (AUTH-03)
Otp
  → nhập đủ 6 số → CTA enabled (AUTH-04)
  → Tiếp tục → verifyOtp → thành công → reset về BottomNavigation/Home (AUTH-05)
  → back → về PhoneLogin (state form còn nguyên)
```

## 4. Screens & Navigation

**Routes** (`src/app/navigation/types.ts`): bỏ `Login`, thêm:

```ts
PhoneLogin: undefined;
Otp: {
  phoneNumber: string;
}
```

`RootNavigator.tsx`: `PhoneLogin` animation `slide_from_bottom`, `Otp` animation `fade`, đều `headerShown: false`.

### 4.1. PhoneLoginScreen (thay `LoginScreen.tsx`)

- `FAppbar` back → `pop()`; giữ logic `Storage.KEY_FIRST_LOAD` hiện tại để ẩn content lần đầu.
- Title "Nhập số điện thoại của bạn".
- `FTextInput` SĐT: `keyboardType="numeric"`, lọc ký tự non-digit, validate `FValidatePhone` → lỗi inline.
- Checkbox đồng ý điều khoản: custom inline ~15 dòng trong screen (`TouchableOpacity` + ô vuông border + `FIcon` check) — không có checkbox component trong shared.
- 3 link (Điều khoản sử dụng / Tuyên bố pháp lý / Chính sách bảo mật) → mở **1 `FBottomSheet`** dùng chung: height 80% màn hình (qua `style`), nội dung scrollable placeholder, nút `FFilledButton` "Đồng ý" đóng sheet. Sheet là Modal nên state form không mất. Nền mờ dùng sẵn backdrop opacity 0.8 của `FBottomSheet`.
- CTA `FFilledButton` "Tiếp tục": disabled khi SĐT chưa hợp lệ **hoặc** checkbox chưa tick. (Doc ghi cả "Tiếp tục" mục 5.1 lẫn "Đăng nhập" mục 4/AUTH-01 — chọn "Tiếp tục" khớp spec component và CTA màn OTP.)
- Submit: `Keyboard.dismiss()` → dispatch `requestOtp(phone)` → `navigation.navigate('Otp', {phoneNumber})`.
- `KeyboardAwareScrollView` + `keyboardShouldPersistTaps="handled"` (quy ước forms).

### 4.2. OtpScreen

- `FAppbar` back → `goBack()`.
- Title "Nhập mã Xác thực" + SĐT che bớt: giữ 3 số đầu + 3 số cuối, giữa thay `•••` (VD `091•••678`).
- 6 ô hiển thị + **1 TextInput ẩn duy nhất** (`keyboardType="number-pad"`, `maxLength={6}`): pattern ít lỗi focus nhất; ô active tô border; tự focus khi vào màn.
- Đếm ngược 30s trong hook `useResendCountdown` (`presentation/hooks`): "Gửi lại sau 30s" → hết giờ thành link "Gửi lại mã" → dispatch lại `requestOtp`, reset timer.
- CTA disabled khi < 6 số → đủ 6 số enabled → dispatch `verifyOtp`.
- Thành công: `navigation.reset({index: 0, routes: [{name: 'BottomNavigation'}]})`.

### 4.3. Background

- `WaterWaveBubblesBackground` dời từ `features/onboarding/presentation/components/` → `src/shared/components/` (giữ nguyên tên component + test, chỉ dời file + export qua barrel; `OnboardingScreen` đổi import sang `@/shared/components`).
- PhoneLogin: `height = screenH * 0.4`; Otp: `height = screenH * 0.6` (`useWindowDimensions()`, không hardcode `Dimensions`).
- Bọc trong View `position:'absolute', bottom:0, left:0, right:0, height:<waveH>` để sóng neo đáy (SVG `absoluteFill` trong wrapper 1:1 với viewBox, không scale). Form render đè trên. Không sửa logic animation bên trong.

## 5. Domain (`auth/domain/`)

- `IAuthRepository`: bỏ `login`, 4 method biometrics, `getIsFirstLoad` (dead — không ai gọi; splash/onboarding đọc `Storage` trực tiếp). Thêm:
  - `requestOtp(phoneNumber: string): Promise<void>`
  - `verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession>`
  - Giữ: `logout`, `getStoredAuth`, `saveAuth`, `setIsFirstLoad` (`VerifyOtpUseCase` gọi `setIsFirstLoad(false)` sau khi xác thực thành công — parity với `LoginUseCase` cũ).
- Entities: xóa `LoginCredentials`, `BiometricPrefs`; giữ `User`, `AuthSession`.
- Use cases: `RequestOtpUseCase.ts`, `VerifyOtpUseCase.ts` (1 class/file). Xóa `LoginUseCase(+test)`, `CheckBiometricsUseCase`.

## 6. Data (`auth/data/`)

- `endpoints.ts`: `AUTH.REQUEST_OTP: 'customer/send-otp'`, `AUTH.VERIFY_OTP: 'customer/verify-otp'` — đường dẫn tạm chờ backend.
- `AuthRemoteDataSource`: `requestOtp(phone)` → `OtpResponseDTO`; `verifyOtp(phone, otp)` → `LoginResponseDTO` (tái dùng shape token/user).
- `AuthDTO.ts`: thêm `OtpResponseDTO {code?, message?}`; mappers giữ nguyên.
- `AuthRepositoryImpl`:
  - `requestOtp`: gọi API; lỗi network → `console.warn` + resolve (demo chạy tiếp).
  - `verifyOtp`: có token/code 200 → `mapLoginResponseDTOToSession` + `setClientAuthToken`; API trả lỗi rõ ràng → throw message (UI hiện); lỗi network/exception → fallback demo session (tái dùng `getMockUserData(phone)` — đổi param từ `credentials` sang `phoneNumber`). Đăng nhập và tự đăng ký là **cùng một response**, không phân nhánh UI.
- `AuthLocalDataSource`: xóa method biometrics + isFirstLoad.
- `react-native-touch-id` package + patch: **giữ nguyên**.

## 7. Redux (`auth/presentation/redux/`)

- `authThunks.ts`: `requestOtp(phoneNumber)` → `void`; `verifyOtp({phoneNumber, otp})` → `AuthSession` (qua `container`). Xóa `loginUser`.
- `authSlice.ts`: thêm `otpStatus: 'idle'|'loading'|'succeeded'|'failed'`; `status`/`error` hiện tại phục vụ verify. extraReducers cho 2 thunk mới.
- `authSelectors.ts`: thêm `selectOtpStatus`; selector khác giữ nguyên.
- `useAuth.ts`: `requestOtp(phone)` + `verifyOtp(...)` thay `login()`.
- DI `container.ts`: `requestOtpUseCase`, `verifyOtpUseCase` thay `loginUseCase`, `checkBiometricsUseCase`.

## 8. Error handling

- SĐT sai/trống hoặc checkbox chưa tick → CTA disabled; lỗi format → inline text.
- `requestOtp` không có failure nhìn thấy được (mock resolve) → chỉ `FLoading` overlay.
- OTP sai → snackbar `type:'fail'` với message API + xóa 6 ô + focus ô đầu. Chặn gửi lại khi `otpStatus === 'loading'`.
- Contract substring cũ ("Số điện thoại chưa được đăng ký" / "Mật khẩu không đúng") bị xóa theo flow password.

## 9. i18n

- Thêm nhóm key `auth.*` vào `src/core/i18n/locales/{en,vi}.json`: title màn phone/OTP, label điều khoản, "Tiếp tục", "Gửi lại sau {s}s" / "Gửi lại mã", "Đồng ý", nội dung placeholder điều khoản.
- Xóa key `login.*` không còn tham chiếu (chỉ LoginScreen cũ đang dùng).

## 10. Testing

- `RequestOtpUseCase.test.ts`, `VerifyOtpUseCase.test.ts` — pattern `jest.Mocked<IAuthRepository>`.
- `authSlice.test.ts` — cập nhật 2 thunk mới.
- `useResendCountdown.test.ts` — fake timers: 30→0, reset khi gửi lại.
- `AuthDTO.test.ts` — thêm case `OtpResponseDTO`.
- `WaterWaveBubblesBackground.test.tsx` dời theo component (sửa import).
- Checkbox + ô OTP: JSX nội bộ screen, không test riêng.

## 11. Danh sách xóa

`LoginScreen.tsx`, `useBiometrics.ts`, `LoginUseCase.ts` (+test), `CheckBiometricsUseCase.ts`, `LoginCredentials`, `BiometricPrefs`, method biometrics/isFirstLoad (repo + local DS), thunk `loginUser`, DI key `loginUseCase`/`checkBiometricsUseCase`, key i18n `login.*` chết. Barrel `features/auth/index.ts` cập nhật.

## 12. Quality gates

`npx tsc --noEmit`, `npm test`, `npm run lint` — sạch trước khi commit.
