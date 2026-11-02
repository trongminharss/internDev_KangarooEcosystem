# Phone + OTP Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế flow đăng nhập password/biometrics bằng flow xác thực số điện thoại + OTP (login và auto-register chung một form), theo spec `docs/superpowers/specs/2026-09-16-phone-otp-auth-design.md`.

**Architecture:** Clean Architecture + Vertical Feature Slicing hiện tại của repo. Thêm `requestOtp`/`verifyOtp` vào `IAuthRepository` (mock fallback demo-user giữ nguyên pattern), 2 use case mới, 2 thunk mới, 2 screen mới (`PhoneLoginScreen`, `OtpScreen`), xóa sạch code password/biometrics.

**Tech Stack:** React Native 0.87 + TypeScript, Redux Toolkit, Formik, react-native-svg + Reanimated (water wave background), i18next, Jest 29 + react-test-renderer.

**Quy ước chung:** npm (không yarn), import qua alias `@/`, commit format `type(scope): summary`, quality gates `npx tsc --noEmit` + `npm test` + `npm run lint` sạch trước mỗi commit.

---

### Task 1: DTO `OtpResponseDTO` + endpoints tạm

**Files:**

- Modify: `src/core/api/endpoints.ts`
- Modify: `src/features/auth/data/models/AuthDTO.ts`
- Test: `src/features/auth/data/models/AuthDTO.test.ts`

- [ ] **Step 1: Write the failing test** — thêm vào `AuthDTO.test.ts` (import `OtpResponseDTO` vào dòng import hiện có):

```ts
import {
  mapUserDTOToEntity,
  mapLoginResponseDTOToSession,
  UserDTO,
  LoginResponseDTO,
  OtpResponseDTO,
} from './AuthDTO';

describe('OtpResponseDTO', () => {
  it('should carry code and message from the send-otp response', () => {
    const dto: OtpResponseDTO = {code: 200, message: 'sent'};
    expect(dto.code).toBe(200);
    expect(dto.message).toBe('sent');
  });

  it('should tolerate an empty response body', () => {
    const dto: OtpResponseDTO = {};
    expect(dto.code).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/auth/data/models/AuthDTO.test.ts`
Expected: FAIL — `OtpResponseDTO` chưa tồn tại (TS error qua ts-jest/babel).

- [ ] **Step 3: Implement** — thêm vào cuối `AuthDTO.ts`:

```ts
export interface OtpResponseDTO {
  code?: number;
  message?: string;
}
```

Thêm 2 endpoint tạm vào `endpoints.ts` (giữ `LOGIN` — sẽ xóa ở Task 4):

```ts
export const ENDPOINTS = {
  AUTH: {
    LOGIN: 'customer/login',
    REQUEST_OTP: 'customer/send-otp',
    VERIFY_OTP: 'customer/verify-otp',
    SETUP_CALL: (guid: string) => `customer/callvideo/${guid}`,
  },
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/auth/data/models/AuthDTO.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/api/endpoints.ts src/features/auth/data/models/AuthDTO.ts src/features/auth/data/models/AuthDTO.test.ts
git commit -m "feat(auth): add otp response dto and provisional otp endpoints"
```

---

### Task 2: `AuthRemoteDataSource` — thêm `requestOtp` / `verifyOtp`

**Files:**

- Modify: `src/features/auth/data/datasources/AuthRemoteDataSource.ts`

Giữ nguyên method `login` cũ (chỉ xóa ở Task 4 để các commit luôn compile-green).

- [ ] **Step 1: Thêm 2 method** (import `OtpResponseDTO`, giữ các import hiện có):

```ts
import {axiosClient} from '@/core/api/axiosClient';
import {ENDPOINTS} from '@/core/api/endpoints';
import {LoginCredentials} from '../../domain/entities/User';
import {LoginResponseDTO, OtpResponseDTO} from '../models/AuthDTO';

export class AuthRemoteDataSource {
  async login(credentials: LoginCredentials): Promise<LoginResponseDTO> {
    const response = await axiosClient.post<LoginResponseDTO>(
      ENDPOINTS.AUTH.LOGIN,
      {
        phoneNumber: credentials.phoneNumber,
        password: credentials.password,
      },
    );
    return response.data;
  }

  async requestOtp(phoneNumber: string): Promise<OtpResponseDTO> {
    const response = await axiosClient.post<OtpResponseDTO>(
      ENDPOINTS.AUTH.REQUEST_OTP,
      {
        phoneNumber,
      },
    );
    return response.data;
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<LoginResponseDTO> {
    const response = await axiosClient.post<LoginResponseDTO>(
      ENDPOINTS.AUTH.VERIFY_OTP,
      {
        phoneNumber,
        otp,
      },
    );
    return response.data;
  }
}
```

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/data/datasources/AuthRemoteDataSource.ts
git commit -m "feat(auth): add requestotp and verifyotp to remote data source"
```

---

### Task 3: Domain — interface + 2 use case (TDD) + repo impl + DI

**Files:**

- Modify: `src/features/auth/domain/repositories/IAuthRepository.ts`
- Create: `src/features/auth/domain/usecases/RequestOtpUseCase.ts`
- Create: `src/features/auth/domain/usecases/VerifyOtpUseCase.ts`
- Test: `src/features/auth/domain/usecases/RequestOtpUseCase.test.ts`
- Test: `src/features/auth/domain/usecases/VerifyOtpUseCase.test.ts`
- Modify: `src/features/auth/domain/usecases/LoginUseCase.test.ts` (bổ sung mock cho 2 method mới của interface)
- Modify: `src/features/auth/data/repositories/AuthRepositoryImpl.ts`
- Modify: `src/core/di/container.ts`

Interface đang thêm method mới ⇒ mock literal trong `LoginUseCase.test.ts` (typed `jest.Mocked<IAuthRepository>`) sẽ thiếu 2 key ⇒ phải bổ sung trong cùng task.

- [ ] **Step 1: Mở rộng `IAuthRepository`** — thêm 2 method (giữ nguyên các method cũ, kể cả `login` và biometrics tới Task 4):

```ts
import {LoginCredentials, AuthSession, BiometricPrefs} from '../entities/User';

export interface IAuthRepository {
  requestOtp(phoneNumber: string): Promise<void>;
  verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession>;
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  getStoredAuth(): Promise<AuthSession | null>;
  saveAuth(session: AuthSession): Promise<void>;
  getBiometricPrefs(): Promise<BiometricPrefs>;
  saveBiometricPrefs(prefs: BiometricPrefs): Promise<void>;
  checkBiometricsSupported(): Promise<string | null>;
  authenticateWithBiometrics(promptMessage: string): Promise<boolean>;
  getIsFirstLoad(): Promise<boolean>;
  setIsFirstLoad(value: boolean): Promise<void>;
}
```

- [ ] **Step 2: Bổ sung mock trong `LoginUseCase.test.ts`** — thêm 2 dòng vào object `mockAuthRepo` trong `beforeEach`:

```ts
      requestOtp: jest.fn().mockResolvedValue(undefined),
      verifyOtp: jest.fn().mockResolvedValue(mockSession),
```

- [ ] **Step 3: Write the failing tests**

`RequestOtpUseCase.test.ts`:

```ts
import {RequestOtpUseCase} from './RequestOtpUseCase';
import {IAuthRepository} from '../repositories/IAuthRepository';

describe('RequestOtpUseCase', () => {
  let mockAuthRepo: jest.Mocked<IAuthRepository>;
  let useCase: RequestOtpUseCase;

  beforeEach(() => {
    mockAuthRepo = {
      requestOtp: jest.fn().mockResolvedValue(undefined),
      verifyOtp: jest.fn().mockResolvedValue(undefined),
      login: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      getStoredAuth: jest.fn().mockResolvedValue(null),
      saveAuth: jest.fn().mockResolvedValue(undefined),
      getBiometricPrefs: jest
        .fn()
        .mockResolvedValue({isLoginWithBiometric: false}),
      saveBiometricPrefs: jest.fn().mockResolvedValue(undefined),
      checkBiometricsSupported: jest.fn().mockResolvedValue(null),
      authenticateWithBiometrics: jest.fn().mockResolvedValue(false),
      getIsFirstLoad: jest.fn().mockResolvedValue(true),
      setIsFirstLoad: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RequestOtpUseCase(mockAuthRepo);
  });

  it('should throw if phone number is empty', async () => {
    await expect(useCase.execute('')).rejects.toThrow(
      'Số điện thoại không được để trống',
    );
    expect(mockAuthRepo.requestOtp).not.toHaveBeenCalled();
  });

  it('should delegate to repo requestOtp', async () => {
    await useCase.execute('0912345678');
    expect(mockAuthRepo.requestOtp).toHaveBeenCalledWith('0912345678');
  });
});
```

`VerifyOtpUseCase.test.ts`:

```ts
import {VerifyOtpUseCase} from './VerifyOtpUseCase';
import {IAuthRepository} from '../repositories/IAuthRepository';
import {AuthSession} from '../entities/User';

describe('VerifyOtpUseCase', () => {
  let mockAuthRepo: jest.Mocked<IAuthRepository>;
  let useCase: VerifyOtpUseCase;

  const mockSession: AuthSession = {
    token: 'test-token',
    user: {
      fullName: 'Nguyen Van A',
      phoneNumber: '0912345678',
      idNo: '123456789',
      birthDay: '01/01/1995',
      gender: 1,
      nationality: 'VN',
      placeOfOrigin: 'HN',
      placeOfResidence: 'HN',
      personalIdentification: 'None',
      placeIssue: 'CA',
      dateIssue: '01/01/2020',
      email: 'a@example.com',
    },
  };

  beforeEach(() => {
    mockAuthRepo = {
      requestOtp: jest.fn().mockResolvedValue(undefined),
      verifyOtp: jest.fn().mockResolvedValue(mockSession),
      login: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      getStoredAuth: jest.fn().mockResolvedValue(null),
      saveAuth: jest.fn().mockResolvedValue(undefined),
      getBiometricPrefs: jest
        .fn()
        .mockResolvedValue({isLoginWithBiometric: false}),
      saveBiometricPrefs: jest.fn().mockResolvedValue(undefined),
      checkBiometricsSupported: jest.fn().mockResolvedValue(null),
      authenticateWithBiometrics: jest.fn().mockResolvedValue(false),
      getIsFirstLoad: jest.fn().mockResolvedValue(true),
      setIsFirstLoad: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new VerifyOtpUseCase(mockAuthRepo);
  });

  it('should throw if otp is not 6 digits', async () => {
    await expect(useCase.execute('0912345678', '12345')).rejects.toThrow(
      'Mã OTP phải gồm 6 chữ số',
    );
    expect(mockAuthRepo.verifyOtp).not.toHaveBeenCalled();
  });

  it('should verify, saveAuth and setIsFirstLoad(false) on success', async () => {
    const result = await useCase.execute('0912345678', '123456');

    expect(mockAuthRepo.verifyOtp).toHaveBeenCalledWith('0912345678', '123456');
    expect(mockAuthRepo.saveAuth).toHaveBeenCalledWith(mockSession);
    expect(mockAuthRepo.setIsFirstLoad).toHaveBeenCalledWith(false);
    expect(result).toEqual(mockSession);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx jest src/features/auth/domain/usecases`
Expected: FAIL — không tìm thấy module `RequestOtpUseCase` / `VerifyOtpUseCase`.

- [ ] **Step 5: Implement 2 use case**

`RequestOtpUseCase.ts`:

```ts
import {IAuthRepository} from '../repositories/IAuthRepository';

export class RequestOtpUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(phoneNumber: string): Promise<void> {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new Error('Số điện thoại không được để trống');
    }
    await this.authRepo.requestOtp(phoneNumber);
  }
}
```

`VerifyOtpUseCase.ts`:

```ts
import {IAuthRepository} from '../repositories/IAuthRepository';
import {AuthSession} from '../entities/User';

export class VerifyOtpUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(phoneNumber: string, otp: string): Promise<AuthSession> {
    if (!otp || otp.trim().length !== 6) {
      throw new Error('Mã OTP phải gồm 6 chữ số');
    }
    const session = await this.authRepo.verifyOtp(phoneNumber, otp);
    await this.authRepo.saveAuth(session);
    await this.authRepo.setIsFirstLoad(false);
    return session;
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest src/features/auth/domain/usecases`
Expected: PASS (3 file test: Login, RequestOtp, VerifyOtp)

- [ ] **Step 7: Thêm `requestOtp`/`verifyOtp` vào `AuthRepositoryImpl`** (giữ nguyên code cũ; thêm 2 method vào class và thêm import `OtpResponseDTO` không cần — repo chỉ dùng DTO qua mapper). Chèn sau method `login`:

```ts
  async requestOtp(phoneNumber: string): Promise<void> {
    try {
      await this.remote.requestOtp(phoneNumber);
    } catch (error: any) {
      console.warn(
        '[AuthRepositoryImpl] requestOtp failed, continue in demo mode:',
        error?.message,
      );
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession> {
    let dto;
    try {
      dto = await this.remote.verifyOtp(phoneNumber, otp);
    } catch (error: any) {
      // ApiError có statusCode = lỗi business từ backend (vd OTP sai) → throw
      // cho UI hiện; chỉ lỗi mạng thật (statusCode 0/undefined) mới fallback demo.
      if (error instanceof ApiError && error.statusCode) {
        throw error;
      }
      console.warn(
        '[AuthRepositoryImpl] verifyOtp network error, fallback to demo session:',
        error?.message,
      );
      const fallback = this.getMockUserData(phoneNumber);
      setClientAuthToken(fallback.token);
      return fallback;
    }
    if (dto && (dto.code === 200 || dto.token || dto.data?.token)) {
      const session = mapLoginResponseDTOToSession(dto);
      setClientAuthToken(session.token);
      return session;
    }
    throw new Error(dto?.message || 'Mã OTP không đúng hoặc đã hết hạn');
  }
```

Cần thêm import `import {ApiError} from '@/core/api/apiError';` ở đầu file. (Đây là hình thái đã implement từ Task 3 — commit `b93c08d`; không revert.) Ghi chú production: khi có backend thật, cân nhắc inspect `OtpResponseDTO` trong `requestOtp` (hiện swallow hết — demo mode).

- [ ] **Step 8: Đăng ký use case trong `container.ts`** (giữ `loginUseCase`/`checkBiometricsUseCase` tới Task 4):

```ts
import {AuthRemoteDataSource} from '@/features/auth/data/datasources/AuthRemoteDataSource';
import {AuthLocalDataSource} from '@/features/auth/data/datasources/AuthLocalDataSource';
import {AuthRepositoryImpl} from '@/features/auth/data/repositories/AuthRepositoryImpl';
import {LoginUseCase} from '@/features/auth/domain/usecases/LoginUseCase';
import {LogoutUseCase} from '@/features/auth/domain/usecases/LogoutUseCase';
import {CheckBiometricsUseCase} from '@/features/auth/domain/usecases/CheckBiometricsUseCase';
import {RequestOtpUseCase} from '@/features/auth/domain/usecases/RequestOtpUseCase';
import {VerifyOtpUseCase} from '@/features/auth/domain/usecases/VerifyOtpUseCase';

// Data Sources
const authRemoteDataSource = new AuthRemoteDataSource();
const authLocalDataSource = new AuthLocalDataSource();

// Repositories
export const authRepository = new AuthRepositoryImpl(
  authRemoteDataSource,
  authLocalDataSource,
);

// Use Cases
export const container = {
  loginUseCase: new LoginUseCase(authRepository),
  logoutUseCase: new LogoutUseCase(authRepository),
  checkBiometricsUseCase: new CheckBiometricsUseCase(authRepository),
  requestOtpUseCase: new RequestOtpUseCase(authRepository),
  verifyOtpUseCase: new VerifyOtpUseCase(authRepository),
};

export default container;
```

- [ ] **Step 9: Gates + commit**

Run: `npx tsc --noEmit && npm test`
Expected: all pass

```bash
git add src/features/auth/domain/repositories/IAuthRepository.ts src/features/auth/domain/usecases/RequestOtpUseCase.ts src/features/auth/domain/usecases/RequestOtpUseCase.test.ts src/features/auth/domain/usecases/VerifyOtpUseCase.ts src/features/auth/domain/usecases/VerifyOtpUseCase.test.ts src/features/auth/domain/usecases/LoginUseCase.test.ts src/features/auth/data/repositories/AuthRepositoryImpl.ts src/core/di/container.ts
git commit -m "feat(auth): add otp use cases, repository methods and di wiring"
```

---

### Task 4: Cutover — xóa password/biometrics, đổi thunk/slice/hook

**Files:**

- Modify: `src/features/auth/domain/entities/User.ts`
- Modify: `src/features/auth/domain/repositories/IAuthRepository.ts`
- Modify: `src/features/auth/data/datasources/AuthLocalDataSource.ts`
- Modify: `src/features/auth/data/datasources/AuthRemoteDataSource.ts`
- Modify: `src/features/auth/data/repositories/AuthRepositoryImpl.ts`
- Modify: `src/features/auth/presentation/redux/authThunks.ts`
- Modify: `src/features/auth/presentation/redux/authSlice.ts`
- Modify: `src/features/auth/presentation/redux/authSelectors.ts`
- Modify: `src/features/auth/presentation/redux/authSlice.test.ts`
- Modify: `src/features/auth/presentation/hooks/useAuth.ts`
- Modify: `src/features/auth/index.ts`
- Modify: `src/core/di/container.ts`
- Delete: `src/features/auth/presentation/screens/LoginScreen.tsx`
- Delete: `src/features/auth/presentation/hooks/useBiometrics.ts`
- Delete: `src/features/auth/domain/usecases/LoginUseCase.ts`
- Delete: `src/features/auth/domain/usecases/LoginUseCase.test.ts`
- Delete: `src/features/auth/domain/usecases/CheckBiometricsUseCase.ts`

Đây là commit "cắt sang" — các file trên phải đổi cùng nhau để compile-green. Giữ `setIsFirstLoad` (VerifyOtpUseCase dùng); giữ các storage key `LOGIN_WITH_BIOMETRIC`/`USERNAME`/`PASSWORD` trong `src/core/constants/storageKeys.ts` (constants vô hại, không đụng core).

- [ ] **Step 1: `User.ts`** — xóa interface `LoginCredentials` và `BiometricPrefs`, giữ `User` + `AuthSession`:

```ts
export interface User {
  fullName: string;
  phoneNumber?: string;
  isValid?: boolean;
  idNo: string;
  birthDay: string;
  gender: number;
  nationality: string;
  placeOfOrigin: string;
  placeOfResidence: string;
  personalIdentification: string;
  placeIssue: string;
  dateIssue: string;
  imageIdentityCardBack?: string;
  imageIdentityCardFront?: string;
  stepVerify?: number;
  loginStepVerify?: number;
  originStepVerify?: number;
  isCreateDigitalSignature?: boolean;
  identityDateExpire?: string;
  email: string;
}

export interface AuthSession {
  token: string;
  user: User;
}
```

- [ ] **Step 2: `IAuthRepository.ts`** — bản final:

```ts
import {AuthSession} from '../entities/User';

export interface IAuthRepository {
  requestOtp(phoneNumber: string): Promise<void>;
  verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession>;
  logout(): Promise<void>;
  getStoredAuth(): Promise<AuthSession | null>;
  saveAuth(session: AuthSession): Promise<void>;
  setIsFirstLoad(value: boolean): Promise<void>;
}
```

- [ ] **Step 3: `AuthLocalDataSource.ts`** — xóa import `TouchID`, `colors`, `BiometricPrefs`; xóa `getBiometricPrefs`, `saveBiometricPrefs`, `checkBiometricsSupported`, `authenticateWithBiometrics`, `getIsFirstLoad`. Bản final:

```ts
import {Storage} from '@/core/utils/storage';
import {AuthSession} from '../../domain/entities/User';

export class AuthLocalDataSource {
  async getStoredAuth(): Promise<AuthSession | null> {
    const token = await Storage.getItem<string>(Storage.AUTH_TOKEN);
    const user = await Storage.getItem<any>(Storage.USER_INFO);
    if (token && user) {
      return {token, user};
    }
    return null;
  }

  async saveAuth(session: AuthSession): Promise<void> {
    await Storage.setItem(Storage.AUTH_TOKEN, session.token);
    await Storage.setItem(Storage.USER_INFO, session.user);
  }

  async clearAuth(): Promise<void> {
    await Storage.removeItem(Storage.AUTH_TOKEN);
    await Storage.removeItem(Storage.USER_INFO);
  }

  async setIsFirstLoad(value: boolean): Promise<void> {
    await Storage.setItem(Storage.KEY_FIRST_LOAD, value);
  }
}
```

- [ ] **Step 4: `AuthRemoteDataSource.ts`** — xóa method `login` + import `LoginCredentials` + endpoint `LOGIN` dùng cuối cùng ở đây; đồng thời xóa `LOGIN` khỏi `endpoints.ts`. Bản final của datasource:

```ts
import {axiosClient} from '@/core/api/axiosClient';
import {ENDPOINTS} from '@/core/api/endpoints';
import {LoginResponseDTO, OtpResponseDTO} from '../models/AuthDTO';

export class AuthRemoteDataSource {
  async requestOtp(phoneNumber: string): Promise<OtpResponseDTO> {
    const response = await axiosClient.post<OtpResponseDTO>(
      ENDPOINTS.AUTH.REQUEST_OTP,
      {
        phoneNumber,
      },
    );
    return response.data;
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<LoginResponseDTO> {
    const response = await axiosClient.post<LoginResponseDTO>(
      ENDPOINTS.AUTH.VERIFY_OTP,
      {
        phoneNumber,
        otp,
      },
    );
    return response.data;
  }
}
```

`endpoints.ts`:

```ts
export const ENDPOINTS = {
  AUTH: {
    REQUEST_OTP: 'customer/send-otp',
    VERIFY_OTP: 'customer/verify-otp',
    SETUP_CALL: (guid: string) => `customer/callvideo/${guid}`,
  },
} as const;
```

- [ ] **Step 5: `AuthRepositoryImpl.ts`** — xóa `login`, `getMockUserData` đổi param, xóa các method biometrics/isFirstLoad-getter. Bản final:

```ts
import {IAuthRepository} from '../../domain/repositories/IAuthRepository';
import {AuthSession} from '../../domain/entities/User';
import {AuthRemoteDataSource} from '../datasources/AuthRemoteDataSource';
import {AuthLocalDataSource} from '../datasources/AuthLocalDataSource';
import {mapLoginResponseDTOToSession} from '../models/AuthDTO';
import {setClientAuthToken} from '@/core/api/axiosClient';

export class AuthRepositoryImpl implements IAuthRepository {
  constructor(
    private remote: AuthRemoteDataSource,
    private local: AuthLocalDataSource,
  ) {}

  private getMockUserData(phoneNumber: string): AuthSession {
    return {
      token: 'demo-token-' + Date.now(),
      user: {
        fullName: 'Người Dùng Demo',
        phoneNumber: phoneNumber || '0910000000',
        isValid: true,
        idNo: '001234567890',
        birthDay: '01/01/1990',
        gender: 1,
        nationality: 'Việt Nam',
        placeOfOrigin: 'Hà Nội',
        placeOfResidence: 'Hà Nội',
        personalIdentification: 'Nốt ruồi dưới mép phải',
        placeIssue: 'Cục Cảnh sát QLHC về TTXH',
        dateIssue: '01/01/2021',
        stepVerify: 32,
        loginStepVerify: 32,
        originStepVerify: 32,
        isCreateDigitalSignature: true,
        identityDateExpire: '01/01/2035',
        email: 'demo@fpt.com',
      },
    };
  }

  async requestOtp(phoneNumber: string): Promise<void> {
    try {
      await this.remote.requestOtp(phoneNumber);
    } catch (error: any) {
      console.warn(
        '[AuthRepositoryImpl] requestOtp failed, continue in demo mode:',
        error?.message,
      );
    }
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<AuthSession> {
    let dto;
    try {
      dto = await this.remote.verifyOtp(phoneNumber, otp);
    } catch (error: any) {
      console.warn(
        '[AuthRepositoryImpl] verifyOtp network error, fallback to demo session:',
        error?.message,
      );
      const fallback = this.getMockUserData(phoneNumber);
      setClientAuthToken(fallback.token);
      return fallback;
    }
    if (dto && (dto.code === 200 || dto.token || dto.data?.token)) {
      const session = mapLoginResponseDTOToSession(dto);
      setClientAuthToken(session.token);
      return session;
    }
    throw new Error(dto?.message || 'Mã OTP không đúng hoặc đã hết hạn');
  }

  async logout(): Promise<void> {
    setClientAuthToken(null);
    await this.local.clearAuth();
  }

  async getStoredAuth(): Promise<AuthSession | null> {
    const session = await this.local.getStoredAuth();
    if (session?.token) {
      setClientAuthToken(session.token);
    }
    return session;
  }

  async saveAuth(session: AuthSession): Promise<void> {
    await this.local.saveAuth(session);
    setClientAuthToken(session.token);
  }

  async setIsFirstLoad(value: boolean): Promise<void> {
    await this.local.setIsFirstLoad(value);
  }
}
```

- [ ] **Step 6: `authThunks.ts`** — bản final:

```ts
import {createAsyncThunk} from '@reduxjs/toolkit';
import {container} from '@/core/di/container';
import {AuthSession} from '../../domain/entities/User';

export const requestOtp = createAsyncThunk<void, string, {rejectValue: string}>(
  'auth/requestOtp',
  async (phoneNumber, {rejectWithValue}) => {
    try {
      await container.requestOtpUseCase.execute(phoneNumber);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Không gửi được mã OTP');
    }
  },
);

export const verifyOtp = createAsyncThunk<
  AuthSession,
  {phoneNumber: string; otp: string},
  {rejectValue: string}
>('auth/verifyOtp', async ({phoneNumber, otp}, {rejectWithValue}) => {
  try {
    return await container.verifyOtpUseCase.execute(phoneNumber, otp);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Xác thực OTP thất bại');
  }
});

export const logoutUser = createAsyncThunk<void, void, {rejectValue: string}>(
  'auth/logoutUser',
  async (_, {rejectWithValue}) => {
    try {
      await container.logoutUseCase.execute();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đăng xuất thất bại');
    }
  },
);
```

- [ ] **Step 7: `authSlice.ts`** — thêm `otpStatus`, đổi extraReducers. `AuthState` và `initialState`:

```ts
export interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  otpStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
```

`initialState` thêm `otpStatus: 'idle',` sau `status: 'idle',`. Import đổi thành:

```ts
import {requestOtp, verifyOtp, logoutUser} from './authThunks';
```

`extraReducers` — thay block `// Login` bằng:

```ts
// Request OTP
builder
  .addCase(requestOtp.pending, state => {
    state.otpStatus = 'loading';
  })
  .addCase(requestOtp.fulfilled, state => {
    state.otpStatus = 'succeeded';
  })
  .addCase(requestOtp.rejected, state => {
    state.otpStatus = 'failed';
  });

// Verify OTP (login / auto register)
builder
  .addCase(verifyOtp.pending, state => {
    state.status = 'loading';
    state.error = null;
  })
  .addCase(verifyOtp.fulfilled, (state, action) => {
    state.status = 'succeeded';
    state.user = action.payload.user;
    state.token = action.payload.token;
    state.error = null;
  })
  .addCase(verifyOtp.rejected, (state, action) => {
    state.status = 'failed';
    state.error = action.payload || 'Xác thực OTP thất bại';
  });
```

Block `// Logout` giữ nguyên.

- [ ] **Step 8: `authSelectors.ts`** — thêm:

```ts
export const selectOtpStatus = createSelector(
  [selectAuthState],
  auth => auth.otpStatus,
);
```

- [ ] **Step 9: `useAuth.ts`** — bản final:

```ts
import {useCallback} from 'react';
import {useAppDispatch, useAppSelector} from '@/app/store';
import {
  selectCurrentUser,
  selectAuthToken,
  selectAuthStatus,
  selectOtpStatus,
  selectAuthError,
  selectIsAuthenticated,
  selectIsAuthLoading,
} from '../redux/authSelectors';
import {
  requestOtp as requestOtpThunk,
  verifyOtp as verifyOtpThunk,
  logoutUser,
} from '../redux/authThunks';
import {setUser, clearUser} from '../redux/authSlice';
import {User} from '../../domain/entities/User';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAuthToken);
  const status = useAppSelector(selectAuthStatus);
  const otpStatus = useAppSelector(selectOtpStatus);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsAuthLoading);

  const requestOtp = useCallback(
    async (phoneNumber: string) => {
      return dispatch(requestOtpThunk(phoneNumber)).unwrap();
    },
    [dispatch],
  );

  const verifyOtp = useCallback(
    async (payload: {phoneNumber: string; otp: string}) => {
      return dispatch(verifyOtpThunk(payload)).unwrap();
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    return dispatch(logoutUser()).unwrap();
  }, [dispatch]);

  const saveUserSession = useCallback(
    (userInfo: User, authToken: string, isFromLogin: boolean = true) => {
      dispatch(setUser({userInfo, token: authToken, isFromLogin}));
    },
    [dispatch],
  );

  const resetUser = useCallback(() => {
    dispatch(clearUser());
  }, [dispatch]);

  return {
    user,
    token,
    status,
    otpStatus,
    error,
    isAuthenticated,
    isLoading,
    requestOtp,
    verifyOtp,
    logout,
    saveUserSession,
    resetUser,
  };
};

export default useAuth;
```

- [ ] **Step 10: `authSlice.test.ts`** — `initialState` thêm `otpStatus: 'idle',`; xóa block `jest.mock('react-native-touch-id', ...)` (không còn ai import touch-id); thêm 2 test cuối cùng:

```ts
it('should handle requestOtp lifecycle', () => {
  let state = authReducer(initialState, {type: 'auth/requestOtp/pending'});
  expect(state.otpStatus).toBe('loading');

  state = authReducer(state, {type: 'auth/requestOtp/fulfilled'});
  expect(state.otpStatus).toBe('succeeded');

  state = authReducer(state, {type: 'auth/requestOtp/rejected'});
  expect(state.otpStatus).toBe('failed');
});

it('should handle verifyOtp fulfilled and rejected', () => {
  const mockUser = {
    ...initialState.user!,
    fullName: 'Otp User',
    phoneNumber: '0912345678',
  };
  const payload = {token: 'otp-token', user: mockUser};

  let state = authReducer(initialState, {
    type: 'auth/verifyOtp/fulfilled',
    payload,
  });
  expect(state.status).toBe('succeeded');
  expect(state.token).toBe('otp-token');
  expect(state.user?.fullName).toBe('Otp User');

  state = authReducer(state, {
    type: 'auth/verifyOtp/rejected',
    payload: 'Mã OTP không đúng hoặc đã hết hạn',
  });
  expect(state.status).toBe('failed');
  expect(state.error).toBe('Mã OTP không đúng hoặc đã hết hạn');
});
```

- [ ] **Step 11: Xóa file cũ + cập nhật `container.ts` + barrel**

```bash
git rm src/features/auth/presentation/screens/LoginScreen.tsx src/features/auth/presentation/hooks/useBiometrics.ts src/features/auth/domain/usecases/LoginUseCase.ts src/features/auth/domain/usecases/LoginUseCase.test.ts src/features/auth/domain/usecases/CheckBiometricsUseCase.ts
```

`container.ts` — bỏ import + key `loginUseCase`, `checkBiometricsUseCase`:

```ts
import {AuthRemoteDataSource} from '@/features/auth/data/datasources/AuthRemoteDataSource';
import {AuthLocalDataSource} from '@/features/auth/data/datasources/AuthLocalDataSource';
import {AuthRepositoryImpl} from '@/features/auth/data/repositories/AuthRepositoryImpl';
import {LogoutUseCase} from '@/features/auth/domain/usecases/LogoutUseCase';
import {RequestOtpUseCase} from '@/features/auth/domain/usecases/RequestOtpUseCase';
import {VerifyOtpUseCase} from '@/features/auth/domain/usecases/VerifyOtpUseCase';

// Data Sources
const authRemoteDataSource = new AuthRemoteDataSource();
const authLocalDataSource = new AuthLocalDataSource();

// Repositories
export const authRepository = new AuthRepositoryImpl(
  authRemoteDataSource,
  authLocalDataSource,
);

// Use Cases
export const container = {
  logoutUseCase: new LogoutUseCase(authRepository),
  requestOtpUseCase: new RequestOtpUseCase(authRepository),
  verifyOtpUseCase: new VerifyOtpUseCase(authRepository),
};

export default container;
```

`src/features/auth/index.ts`:

```ts
// Domain
export * from './domain/entities/User';
export * from './domain/repositories/IAuthRepository';
export * from './domain/usecases/RequestOtpUseCase';
export * from './domain/usecases/VerifyOtpUseCase';
export * from './domain/usecases/LogoutUseCase';

// Presentation
export * from './presentation/redux/authSlice';
export {default as authReducer} from './presentation/redux/authSlice';
export * from './presentation/redux/authThunks';
export * from './presentation/redux/authSelectors';
export * from './presentation/hooks/useAuth';
```

(`LoginScreen` export khỏi barrel — Task 7 sẽ export 2 screen mới.)

- [ ] **Step 12: Gates + commit** — `RootNavigator.tsx` vẫn import `LoginScreen` từ barrel nên sẽ lỗi compile ⇒ xóa luôn trong task này: bỏ dòng `import {LoginScreen} from '@/features/auth';` và block `<Stack.Screen name="Login" ...>` trong `src/app/navigation/RootNavigator.tsx`; đồng thời xóa `Login: undefined;` khỏi `RootStackParamList` trong `src/app/navigation/types.ts` (Task 7 sẽ thêm route `PhoneLogin`/`Otp` mới).

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: all pass

```bash
git add -A
git commit -m "refactor(auth): replace password login with phone otp domain and redux"
```

---

### Task 5: Shared — dời `WaterWaveBubblesBackground`, thêm `disabled` cho `FFilledButton`

**Files:**

- Rename (git mv): `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.tsx` → `src/shared/components/WaterWaveBubblesBackground.tsx`
- Rename (git mv): `src/features/onboarding/presentation/components/WaterWaveBubblesBackground.test.tsx` → `src/shared/components/WaterWaveBubblesBackground.test.tsx`
- Modify: `src/shared/components/index.ts`
- Modify: `src/features/onboarding/presentation/screens/OnboardingScreen.tsx`
- Modify: `src/shared/components/FFilledButton.tsx`

- [ ] **Step 1: Move files**

```bash
git mv src/features/onboarding/presentation/components/WaterWaveBubblesBackground.tsx src/shared/components/WaterWaveBubblesBackground.tsx
git mv src/features/onboarding/presentation/components/WaterWaveBubblesBackground.test.tsx src/shared/components/WaterWaveBubblesBackground.test.tsx
```

- [ ] **Step 2: Export từ shared barrel** — thêm vào `src/shared/components/index.ts`:

```ts
export {WaterWaveBubblesBackground} from './WaterWaveBubblesBackground';
```

- [ ] **Step 3: Đổi import trong `OnboardingScreen.tsx`:**

```ts
import {WaterWaveBubblesBackground} from '@/shared/components';
```

(xóa dòng `import {WaterWaveBubblesBackground} from '../components/WaterWaveBubblesBackground';` cũ)

- [ ] **Step 4: `FFilledButton` thêm prop `disabled`:**

```ts
interface FFilledButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: FButtonSizeProps;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
}

const FFilledButton: React.FC<FFilledButtonProps> = ({
  title,
  onPress,
  style,
  size = FButtonSize.size48,
  textStyle = FTheme.fonts.bodyLabel03,
  backgroundColor,
  textColor,
  disabled = false,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const bgColor = backgroundColor ?? colors.primary;
  const fgColor = textColor ?? colors.white;

  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        {
          height: size.height,
          backgroundColor: bgColor,
          borderRadius: size.borderRadius,
          padding: size.padding,
        },
        style,
        disabled && {opacity: 0.5},
      ]}
      onPress={onPress}>
      <Text
        style={[
          {
            fontSize: textStyle.fontSize,
            fontFamily: textStyle.fontFamily,
            fontWeight: textStyle.fontWeight,
            letterSpacing: textStyle.letterSpacing,
            lineHeight: textStyle.lineHeight,
            textAlign: 'center',
            color: fgColor,
          },
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
```

- [ ] **Step 5: Gates + commit**

Run: `npx tsc --noEmit && npm test`
Expected: all pass (test WaterWave vẫn pass sau khi move)

```bash
git add -A
git commit -m "refactor(shared): move water wave background to shared and support disabled button"
```

---

### Task 6: Hook `useResendCountdown` (TDD)

**Files:**

- Create: `src/features/auth/presentation/hooks/useResendCountdown.ts`
- Test: `src/features/auth/presentation/hooks/useResendCountdown.test.ts`

- [ ] **Step 1: Write the failing test**

```tsx
import React from 'react';
import {Text} from 'react-native';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {useResendCountdown} from './useResendCountdown';

let hookResult: ReturnType<typeof useResendCountdown>;

const Probe: React.FC = () => {
  hookResult = useResendCountdown(30);
  return <Text>{hookResult.seconds}</Text>;
};

describe('useResendCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down from 30 to 0 then allows resend', () => {
    let tree: ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Probe />);
    });
    expect(hookResult.seconds).toBe(30);
    expect(hookResult.canResend).toBe(false);

    for (let i = 0; i < 30; i++) {
      renderer.act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(hookResult.seconds).toBe(0);
    expect(hookResult.canResend).toBe(true);
  });

  it('restarts the countdown', () => {
    let tree: ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<Probe />);
    });
    for (let i = 0; i < 30; i++) {
      renderer.act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(hookResult.canResend).toBe(true);

    renderer.act(() => {
      hookResult.restart();
    });
    expect(hookResult.seconds).toBe(30);
    expect(hookResult.canResend).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/auth/presentation/hooks/useResendCountdown.test.ts`
Expected: FAIL — không tìm thấy module.

- [ ] **Step 3: Implement**

```ts
import {useCallback, useEffect, useState} from 'react';

export const useResendCountdown = (initialSeconds: number = 30) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const canResend = seconds <= 0;

  useEffect(() => {
    if (canResend) {
      return;
    }
    const timer = setInterval(() => {
      setSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [canResend]);

  const restart = useCallback(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  return {seconds, canResend, restart};
};

export default useResendCountdown;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/auth/presentation/hooks/useResendCountdown.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/presentation/hooks/useResendCountdown.ts src/features/auth/presentation/hooks/useResendCountdown.test.ts
git commit -m "feat(auth): add resend countdown hook with tests"
```

---

### Task 7: i18n `auth.*` + `PhoneLoginScreen` + `OtpScreen` + navigation

**Files:**

- Modify: `src/core/i18n/locales/vi.json`, `src/core/i18n/locales/en.json`
- Create: `src/features/auth/presentation/screens/PhoneLoginScreen.tsx`
- Create: `src/features/auth/presentation/screens/OtpScreen.tsx`
- Modify: `src/app/navigation/types.ts`
- Modify: `src/app/navigation/RootNavigator.tsx`
- Modify: `src/features/auth/index.ts`

- [ ] **Step 1: i18n** — trong **cả hai** file locale, thay nguyên block `"login": {...}` bằng `"auth": {...}`.

`vi.json`:

```json
  "auth": {
    "phoneTitle": "Nhập số điện thoại của bạn",
    "phoneLabel": "Số điện thoại của bạn",
    "enterPhone": "Nhập số điện thoại",
    "invalidPhone": "Số điện thoại không hợp lệ",
    "agreePrefix": "Tôi đồng ý với",
    "termsOfUse": "Điều khoản sử dụng",
    "legalDeclaration": "Tuyên bố pháp lý",
    "privacyPolicy": "Chính sách bảo mật",
    "continue": "Tiếp tục",
    "termsTitle": "Điều khoản sử dụng",
    "termsContent": "Nội dung điều khoản sử dụng đang được cập nhật. Đây là nội dungplaceholder để minh họa layout của bottom sheet điều khoản.",
    "agree": "Đồng ý",
    "otpTitle": "Nhập mã Xác thực",
    "otpSentTo": "Mã xác thực đã được gửi đến số",
    "resendAfter": "Gửi lại sau {{seconds}}s",
    "resend": "Gửi lại mã"
  },
```

`en.json`:

```json
  "auth": {
    "phoneTitle": "Enter your phone number",
    "phoneLabel": "Your phone number",
    "enterPhone": "Enter phone number",
    "invalidPhone": "Invalid phone number",
    "agreePrefix": "I agree to the",
    "termsOfUse": "Terms of Use",
    "legalDeclaration": "Legal Declaration",
    "privacyPolicy": "Privacy Policy",
    "continue": "Continue",
    "termsTitle": "Terms of Use",
    "termsContent": "Terms of use content is being updated. This is placeholder content illustrating the terms bottom sheet layout.",
    "agree": "Agree",
    "otpTitle": "Enter verification code",
    "otpSentTo": "Verification code sent to",
    "resendAfter": "Resend in {{seconds}}s",
    "resend": "Resend code"
  },
```

Kiểm tra không còn tham chiếu `t('login.` nào trong `src/` sau khi xóa key (grep để chắc).

- [ ] **Step 2: `types.ts`** — thêm route `Otp` (Task 4 đã xóa `Login`):

```ts
export type RootStackParamList = {
  Splash: undefined;
  BottomNavigation: undefined;
  Onboarding: undefined;
  PhoneLogin: undefined;
  Otp: {phoneNumber: string};
  Home: undefined;
  Account: undefined;
};
```

- [ ] **Step 3: `PhoneLoginScreen.tsx`** — file mới:

```tsx
import {Keyboard, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useMemo, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useTranslation} from 'react-i18next';
import {Formik} from 'formik';
import {useWindowDimensions} from 'react-native';

import {ColorsProps, useTheme} from '@/core/theme';
import {FValidatePhone} from '@/core/utils/validation';
import {Storage} from '@/core/utils/storage';
import {
  FAppbar,
  FBottomSheet,
  FFilledButton,
  FIcon,
  FLoading,
  FText,
  FTextInput,
  WaterWaveBubblesBackground,
} from '@/shared/components';
import {FOutlined} from '@/shared/styles/FIconStyles';
import {useAppNavigation} from '@/app/navigation/types';

import {useAuth} from '../hooks/useAuth';

export const PhoneLoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {height: screenH} = useWindowDimensions();
  const navigation = useAppNavigation();
  const {t} = useTranslation();
  const {requestOtp, isLoading} = useAuth();

  const [isFirstload, setIsFirstload] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    const fetchFirstLoad = async () => {
      try {
        const storedData = await Storage.getItem<boolean>(
          Storage.KEY_FIRST_LOAD,
        );
        if (storedData !== null) {
          setIsFirstload(storedData);
        }
      } catch (error) {
        console.error('Error fetching first load data:', error);
      }
    };
    fetchFirstLoad();
  }, []);

  const handleContinue = async (phoneNumber: string) => {
    Keyboard.dismiss();
    await requestOtp(phoneNumber);
    navigation.navigate('Otp', {phoneNumber});
  };

  const termLinks = [
    {key: t('auth.termsOfUse'), onPress: () => setSheetVisible(true)},
    {key: t('auth.legalDeclaration'), onPress: () => setSheetVisible(true)},
    {key: t('auth.privacyPolicy'), onPress: () => setSheetVisible(true)},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <WaterWaveBubblesBackground height={Math.round(screenH * 0.4)} />
      </View>
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
        {isLoading && <FLoading visible={isLoading} />}
        <FAppbar onBack={() => navigation.pop()} noContent={!isFirstload} />
        <FText typo="largeTitle" style={styles.largeTitle}>
          {t('auth.phoneTitle')}
        </FText>
        <Formik
          initialValues={{phoneNumber: ''}}
          validate={values => {
            const errors: any = {};
            const phoneText = values.phoneNumber.trim();
            if (!phoneText) {
              errors.phoneNumber = `${t('common.invalidEmpty')}`;
            } else if (!FValidatePhone(phoneText)) {
              errors.phoneNumber = `${t('auth.invalidPhone')}`;
            }
            return errors;
          }}
          onSubmit={values => handleContinue(values.phoneNumber.trim())}>
          {({values, submitForm, errors, touched, setFieldValue}) => {
            const phoneValid =
              values.phoneNumber.trim().length > 0 && !errors.phoneNumber;
            const canContinue = phoneValid && agreedTerms;
            return (
              <View>
                <FText typo="label3" style={styles.titlePhone}>
                  {t('auth.phoneLabel')}
                </FText>
                <View style={{paddingHorizontal: 16}}>
                  <FTextInput
                    label={t('auth.enterPhone')}
                    value={values.phoneNumber}
                    keyboardType="numeric"
                    onClear={() => setFieldValue('phoneNumber', '')}
                    onChangeText={text =>
                      setFieldValue('phoneNumber', text.replace(/[^0-9]/g, ''))
                    }
                    errorText={
                      touched.phoneNumber && errors.phoneNumber
                        ? errors.phoneNumber
                        : ''
                    }
                  />
                </View>

                <TouchableOpacity
                  style={styles.termRow}
                  activeOpacity={0.7}
                  onPress={() => setAgreedTerms(v => !v)}>
                  <View
                    style={[
                      styles.checkbox,
                      agreedTerms && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}>
                    {agreedTerms ? (
                      <FIcon
                        icon={FOutlined.check}
                        size={12}
                        iconColor={colors.white}
                      />
                    ) : null}
                  </View>
                  <View style={styles.termTextWrap}>
                    <FText typo="bodyText2" style={{color: colors.body}}>
                      {`${t('auth.agreePrefix')} `}
                    </FText>
                    {termLinks.map((link, index) => (
                      <React.Fragment key={link.key}>
                        <TouchableOpacity onPress={link.onPress}>
                          <FText
                            typo="bodyText2"
                            style={{color: colors.primary}}>
                            {link.key}
                          </FText>
                        </TouchableOpacity>
                        {index < termLinks.length - 1 ? (
                          <FText typo="bodyText2" style={{color: colors.body}}>
                            {index === termLinks.length - 2
                              ? ` ${t('common.and')} `
                              : ', '}
                          </FText>
                        ) : null}
                      </React.Fragment>
                    ))}
                  </View>
                </TouchableOpacity>

                <FFilledButton
                  title={t('auth.continue')}
                  onPress={submitForm}
                  disabled={!canContinue}
                  style={{marginHorizontal: 16, marginTop: 24}}
                />
              </View>
            );
          }}
        </Formik>
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.bottomSafe,
          {paddingBottom: insets.bottom + (insets.bottom > 0 ? 8 : 16)},
        ]}
      />

      <FBottomSheet
        isVisible={sheetVisible}
        closeModal={() => setSheetVisible(false)}
        style={styles.sheet}>
        <FText typo="title2" style={styles.sheetTitle}>
          {t('auth.termsTitle')}
        </FText>
        <View style={styles.sheetContent}>
          <FText typo="bodyText2" style={{color: colors.body}}>
            {t('auth.termsContent')}
          </FText>
        </View>
        <FFilledButton
          title={t('auth.agree')}
          onPress={() => setSheetVisible(false)}
          style={{marginHorizontal: 16, marginBottom: 16}}
        />
      </FBottomSheet>
    </View>
  );
};

export default PhoneLoginScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    background: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    largeTitle: {
      color: colors.primary,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 44,
    },
    titlePhone: {
      color: colors.title,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    termRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 20,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: colors.grey2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    termTextWrap: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    bottomSafe: {
      width: '100%',
    },
    sheet: {
      height: '80%',
      justifyContent: 'flex-start',
    },
    sheetTitle: {
      color: colors.title,
      textAlign: 'center',
      paddingTop: 8,
      paddingBottom: 16,
    },
    sheetContent: {
      flex: 1,
      paddingHorizontal: 16,
    },
  });
```

Lưu ý: `t('common.and')` — thêm `"and": "và"` (vi) / `"and": "and"` (en) vào block `common` của cả 2 locale.

- [ ] **Step 4: `OtpScreen.tsx`** — file mới:

```tsx
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import React, {useMemo, useRef, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {RouteProp, useRoute} from '@react-navigation/native';

import {ColorsProps, useTheme} from '@/core/theme';
import {
  FAppbar,
  FFilledButton,
  FLoading,
  FText,
  WaterWaveBubblesBackground,
} from '@/shared/components';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';

import {useAuth} from '../hooks/useAuth';
import {useResendCountdown} from '../hooks/useResendCountdown';

export const OtpScreen: React.FC = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'Otp'>>();
  const phoneNumber = params.phoneNumber;
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {height: screenH} = useWindowDimensions();
  const navigation = useAppNavigation();
  const {t} = useTranslation();
  const {showSnackbar, hideSnackbar} = useFSnackbar();
  const {requestOtp, verifyOtp, isLoading} = useAuth();
  const {seconds, canResend, restart} = useResendCountdown(30);

  const hiddenInputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');

  const maskedPhone =
    phoneNumber.length >= 6
      ? `${phoneNumber.slice(0, 3)}•••${phoneNumber.slice(-3)}`
      : phoneNumber;

  const handleResend = async () => {
    if (!canResend || isLoading) {
      return;
    }
    hideSnackbar();
    await requestOtp(phoneNumber);
    restart();
  };

  const handleContinue = async () => {
    if (otp.length < 6 || isLoading) {
      return;
    }
    try {
      await verifyOtp({phoneNumber, otp});
      navigation.reset({index: 0, routes: [{name: 'BottomNavigation'}]});
    } catch (error: any) {
      showSnackbar(error || t('common.error'), {type: 'fail'});
      setOtp('');
      hiddenInputRef.current?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <WaterWaveBubblesBackground height={Math.round(screenH * 0.6)} />
      </View>
      {isLoading && <FLoading visible={isLoading} />}
      <FAppbar onBack={() => navigation.goBack()} noContent={true} />
      <FText typo="largeTitle" style={styles.largeTitle}>
        {t('auth.otpTitle')}
      </FText>
      <FText typo="bodyText2" style={styles.sentTo}>
        {`${t('auth.otpSentTo')} ${maskedPhone}`}
      </FText>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.boxesTouch}
        onPress={() => hiddenInputRef.current?.focus()}>
        <View style={styles.otpRow} pointerEvents="none">
          {Array.from({length: 6}).map((_, i) => {
            const digit = otp[i] ?? '';
            const isActive = otp.length === i;
            return (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  isActive && {borderColor: colors.primary},
                ]}>
                <FText typo="title3">{digit}</FText>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={hiddenInputRef}
          value={otp}
          onChangeText={text => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus={true}
          style={styles.hiddenInput}
        />
      </TouchableOpacity>

      <View style={styles.resendRow}>
        {canResend ? (
          <TouchableOpacity onPress={handleResend}>
            <FText typo="buttonText2" style={{color: colors.primary}}>
              {t('auth.resend')}
            </FText>
          </TouchableOpacity>
        ) : (
          <FText typo="bodyText2" style={{color: colors.subtitle}}>
            {t('auth.resendAfter', {seconds})}
          </FText>
        )}
      </View>

      <View
        style={[
          styles.bottomButtonView,
          {paddingBottom: insets.bottom + (insets.bottom > 0 ? 8 : 16)},
        ]}>
        <FFilledButton
          title={t('auth.continue')}
          onPress={handleContinue}
          disabled={otp.length < 6 || isLoading}
        />
      </View>
    </View>
  );
};

export default OtpScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    background: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    largeTitle: {
      color: colors.primary,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    sentTo: {
      color: colors.subtitle,
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    boxesTouch: {
      marginHorizontal: 16,
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    otpBox: {
      width: 48,
      height: 56,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.grey2,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hiddenInput: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      opacity: 0,
    },
    resendRow: {
      alignItems: 'center',
      paddingTop: 24,
    },
    bottomButtonView: {
      width: '100%',
      bottom: 0,
      position: 'absolute',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
  });
```

- [ ] **Step 5: Đăng ký route trong `RootNavigator.tsx`:**

```tsx
import {PhoneLoginScreen} from '@/features/auth';
import {OtpScreen} from '@/features/auth';
```

(viết gộp: `import {PhoneLoginScreen, OtpScreen} from '@/features/auth';`)

Thay block `Login` (đã xóa ở Task 4) bằng 2 screen:

```tsx
        <Stack.Screen
          name="PhoneLogin"
          component={PhoneLoginScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Otp"
          component={OtpScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
```

- [ ] **Step 5b: Trỏ lại splash + onboarding về `PhoneLogin`** — Task 4 đã tạm trỏ `'Home'` để compile-green:

  - `SplashScreen.tsx`: target `'Home'` tạm (nhánh không phải lần đầu load) → `'PhoneLogin'`; xóa dòng comment chết `// height={logoHeight}` (biến đã bị xóa ở Task 4 fix).
  - `OnboardingScreen.tsx`: target `'Home'` tạm khi kết thúc onboarding → `'PhoneLogin'`.
  - `OnboardingScreen.test.tsx`: cập nhật các assertion đang pin `'Home'` → `'PhoneLogin'`.

- [ ] **Step 6: Barrel `src/features/auth/index.ts`** — thêm 2 dòng vào section Presentation:

```ts
export * from './presentation/screens/PhoneLoginScreen';
export * from './presentation/screens/OtpScreen';
```

- [ ] **Step 7: Kiểm tra còn sót tham chiếu `login.*` i18n / `LoginScreen`:**

Run: `rg "t\('login\.|LoginScreen|useBiometrics" src/`
Expected: không có kết quả.

- [ ] **Step 8: Gates + commit**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: all pass

```bash
git add -A
git commit -m "feat(auth): add phone login and otp screens with terms bottom sheet"
```

---

### Task 8: Smoke chạy app + dọn scaffold

- [ ] **Step 1: Toàn bộ gates**

Run: `npx tsc --noEmit && npm test && npm run lint`
Expected: all pass — nếu red, sửa trước khi sang bước sau.

- [ ] **Step 2: Smoke test thủ công (device/simulator)**

Run: `npm run android` (hoặc `npm run ios`)

Kịch bản kiểm tra theo spec:

1. Splash → Onboarding/PhoneLogin đúng luồng first-load.
2. PhoneLogin: sóng nước height 40% đáy màn hình; CTA disabled khi chưa đủ điều kiện; tick checkbox + nhập SĐT hợp lệ → CTA enabled.
3. Link điều khoản → bottom sheet 80%, nền mờ, "Đồng ý" đóng sheet, form giữ nguyên.
4. Tiếp tục → OtpScreen: sóng height 60%, SĐT masked `091•••678`, countdown 30s chạy.
5. Nhập đủ 6 số → CTA enabled → Tiếp tục → (mock fallback) về BottomNavigation/Home.
6. Back từ OTP → PhoneLogin, form còn nguyên SĐT + checkbox.
7. Dark mode: vào lại màn phone/OTP kiểm tra màu qua `useTheme` không có màu cứng.

- [ ] **Step 3: Commit cuối (nếu có fix phát sinh)**

```bash
git add -A
git commit -m "fix(auth): address issues found during smoke test"
```

(Chỉ chạy khi có thay đổi; nếu sạch thì bỏ qua.)

---

## Self-review kết luận

- **Spec coverage:** mọi mục spec 2–12 đều có task: DTO/endpoints (T1), datasource (T2), domain/repo/DI (T3, T4), screens/navigation/background/disabled (T5, T7), countdown (T6), error handling trong screens (T7), i18n (T7), tests (T1, T3, T4, T6), quality gates (T4, T5, T7, T8).
- **Placeholder scan:** không có TBD/TODO; mọi step đều có code hoặc lệnh cụ thể.
- **Type consistency:** `requestOtn`/`verifyOtn` đã soát — dùng thống nhất `requestOtp(phoneNumber: string)` / `verifyOtp(phoneNumber, otp)` ở interface, repo, use case; thunk `verifyOtp({phoneNumber, otp})` unwrap qua `useAuth.verifyOtp(payload)`; `otpStatus` nhất quán slice/selector/hook.
