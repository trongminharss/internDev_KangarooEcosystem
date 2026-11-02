# ReactCore — Clean Architecture

> Dự án React Native được xây dựng theo chuẩn **Clean Architecture** kết hợp **Vertical Feature Slicing**.
> Stack: **React Native + TypeScript + Redux Toolkit + Axios + React Navigation + Reanimated**.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Quy tắc phụ thuộc giữa các layer](#3-quy-tắc-phụ-thuộc-giữa-các-layer)
4. [Nguyên tắc cốt lõi &amp; Convention](#4-nguyên-tắc-cốt-lõi--convention)
5. [Quy tắc từng layer](#5-quy-tắc-từng-layer)
   - [Domain Layer](#51-domain-layer)
   - [Data Layer](#52-data-layer)
   - [Presentation Layer &amp; Redux Toolkit](#53-presentation-layer--redux-toolkit)
   - [Network Layer (Axios)](#54-network-layer-axios)
   - [Dependency Injection (DI)](#55-dependency-injection-di)
6. [Quy trình tạo một Feature mới](#6-quy-trình-tạo-một-feature-mới)
7. [Bắt đầu chạy dự án](#7-bắt-đầu-chạy-dự-án)
8. [Kiểm thử &amp; Kiểm tra chất lượng](#8-kiểm-thử--kiểm-tra-chất-lượng)
9. [Agent Tooling](#9-agent-tooling)
10. [Checklist Review PR](#10-checklist-review-pr)

---

## 1. Tổng quan kiến trúc

Dự án áp dụng mô hình **Clean Architecture** kết hợp phân chia theo **tính năng (Vertical Slicing)**:

- **Vertical Slicing (Feature-based)**: Mỗi nghiệp vụ lớn nằm trọn vẹn trong một thư mục feature (`src/features/<feature_name>/`).
- **3-Layer Architecture** bên trong mỗi feature:
  - **Domain**: Trọng tâm nghiệp vụ, chứa Entity, Repository Interface, UseCase. **Pure TypeScript**, hoàn toàn độc lập với UI, framework và thư viện ngoài.
  - **Data**: Hiện thực hoá việc lấy dữ liệu (API Axios, AsyncStorage, SQLite...), DTO model và Repository Implementation.
  - **Presentation**: UI components, Screens, Hooks, Redux Toolkit Slices/Thunks/Selectors.
- **Core (`src/core/`)**: Chứa hạ tầng dùng chung toàn app (Axios Client, DI Container, Config, Theme, i18n, Storage, Utils).
- **Shared (`src/shared/`)**: UI component dùng chung (`FAppbar`, `FFilledButton`, `FTextInput`...), common hooks và styles token.
- **App (`src/app/`)**: Entry point, cấu hình App Providers, Navigation và Redux Root Store.

```
presentation  ──depends on──▶  domain  ◀──implements──  data
   (Redux)                 (entity, usecase,               (axios,
                             repository interface)           datasource)
```

---

## 2. Cấu trúc thư mục

```
src/
├── app/                                 # Entry & Cấu hình ứng dụng
│   ├── App.tsx                          # App root component
│   ├── navigation/                      # Root Stack Navigator & Bottom Tab Navigator
│   │   ├── RootNavigator.tsx
│   │   ├── BottomNavigator.tsx
│   │   ├── types.ts                     # Navigation types & useAppNavigation hook
│   │   └── index.ts
│   ├── providers/                       # Tổng hợp Context Providers (Redux, Paper, Theme...)
│   │   ├── AppProviders.tsx
│   │   └── index.ts
│   └── store/                           # Redux Toolkit root store
│       ├── index.ts                     # configureStore + typed hooks (useAppDispatch, useAppSelector)
│       ├── rootReducer.ts               # combineReducers
│       └── middleware.ts                # Custom middlewares
│
├── core/                                # Infrastructure & Services dùng chung
│   ├── api/
│   │   ├── axiosClient.ts               # Axios instance + Request/Response Interceptors
│   │   ├── endpoints.ts                 # Centralized API Endpoints
│   │   └── apiError.ts                  # Chuẩn hóa ApiError class
│   ├── di/
│   │   └── container.ts                 # Dependency Injection Container (wiring DataSources -> Repos -> UseCases)
│   ├── config/
│   │   └── env.ts                       # Biến môi trường (baseURL, timeout, keys...)
│   ├── constants/
│   │   └── storageKeys.ts               # Storage key constants
│   ├── theme/
│   │   ├── FTheme.ts                    # Colors, typography, spacing
│   │   ├── ThemeContext.tsx             # Context provider & useTheme hook
│   │   └── index.ts
│   ├── i18n/
│   │   ├── i18n.ts                      # Cấu hình đa ngôn ngữ (i18next)
│   │   ├── locales/ (en.json, vi.json)
│   │   └── index.ts
│   └── utils/
│       ├── storage.ts                   # Type-safe AsyncStorage wrapper
│       ├── validation.ts                # Regex validate phone, email...
│       ├── date.ts                      # Format ngày tháng (moment)
│       └── firebase/fcmHelper.ts        # Firebase Cloud Messaging
│
├── shared/                              # UI dùng chung & Styling tokens
│   ├── components/                      # FAppbar, FFilledButton, FTextInput, FLoading, FSnackbar...
│   ├── hooks/                           # useSnackbar...
│   └── styles/                          # tokens (space/spacing/borderRadius), spacing helpers, FIconStyles, FElevation, FInputSize
│
└── features/                            # Các module tính năng (Vertical slices)
    └── <feature_name>/                  # Ví dụ: auth, home, account, splash, device...
        ├── domain/                      # 1. Domain Layer (Pure TS)
        │   ├── entities/                # Định nghĩa data models nghiệp vụ
        │   ├── repositories/            # Interfaces của repository (bắt đầu bằng chữ I)
        │   └── usecases/                # Các hành động nghiệp vụ (mỗi file 1 usecase)
        ├── data/                        # 2. Data Layer
        │   ├── datasources/             # RemoteDataSource (gọi axiosClient), LocalDataSource
        │   ├── models/                  # DTOs + mapper functions (DTO <-> Entity)
        │   └── repositories/            # Implementation của repository interface
        ├── presentation/                # 3. Presentation Layer
        │   ├── redux/                   # Slice, Thunks, Selectors
        │   ├── screens/                 # Màn hình UI
        │   ├── components/              # Component riêng của feature (nếu có)
        │   └── hooks/                   # Custom presentation hooks
        └── index.ts                     # Public API barrel export của feature
```

---

## 3. Quy tắc phụ thuộc giữa các layer

| Layer          | ĐƯỢC PHÉP import                                                | KHÔNG ĐƯỢC PHÉP import                                               |
| -------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `domain`       | TypeScript thuần, entity/interface khác trong domain            | ❌`data/*`, ❌ `presentation/*`, ❌ axios, ❌ react-native, ❌ redux |
| `data`         | `domain` (để implement interface), axiosClient, AsyncStorage... | ❌`presentation/*`, ❌ redux, ❌ react-native UI components          |
| `presentation` | `domain` (usecase, entity), `core/di`, redux, react-native      | ❌ import trực tiếp`data/*` (chỉ đi qua `domain` + DI `container`)   |

> [!WARNING]
> Nếu một file trong `presentation` import trực tiếp từ `data/`, đó là dấu hiệu vi phạm kiến trúc. Mọi giao tiếp dữ liệu phải thông qua interface ở `domain` và được inject qua `core/di/container.ts`.

---

## 4. Nguyên tắc cốt lõi & Convention

### Convention đặt tên

| Thành phần                    | Quy tắc                              | Ví dụ                                               |
| ----------------------------- | ------------------------------------ | --------------------------------------------------- |
| **Entity**                    | PascalCase, số ít                    | `User.ts`, `Product.ts`                             |
| **Repository Interface**      | `I` + PascalCase + `Repository`      | `IAuthRepository.ts`, `IProductRepository.ts`       |
| **Repository Implementation** | PascalCase +`RepositoryImpl`         | `AuthRepositoryImpl.ts`, `ProductRepositoryImpl.ts` |
| **UseCase**                   | PascalCase + hành động +`UseCase`    | `LoginUseCase.ts`, `GetProductListUseCase.ts`       |
| **DTO**                       | PascalCase +`DTO`                    | `AuthDTO.ts`, `ProductDTO.ts`                       |
| **Slice**                     | camelCase +`Slice`                   | `authSlice.ts`, `productSlice.ts`                   |
| **Thunk**                     | camelCase, động từ + danh từ         | `loginUser`, `fetchProductList`                     |
| **Screen / Component**        | PascalCase                           | `LoginScreen.tsx`, `ProductCard.tsx`                |
| **Hook**                      | `use` + PascalCase                   | `useAuth.ts`, `useProductList.ts`                   |
| **Unit Test**                 | tên gốc +`.test.ts(x)`, đặt trong `__tests__/` | `__tests__/LoginUseCase.test.ts`             |

### Path Alias (`@/*`)

Dự án đã cấu hình alias `@/*` trỏ trực tiếp đến `src/*` trong cả `tsconfig.json` và `babel.config.js`. Luôn ưu tiên dùng alias:

```ts
import {axiosClient} from '@/core/api/axiosClient';
import {container} from '@/core/di/container';
import {FTheme} from '@/core/theme';
import {FText, FFilledButton} from '@/shared/components';
import {useAuth} from '@/features/auth';
```

---

## 5. Quy tắc từng layer

### 5.1. Domain Layer

- **Không có bất kỳ dependency nào của React Native hay Redux**.
- Entity biểu diễn dữ liệu mà nghiệp vụ quan tâm, không phụ thuộc cấu trúc JSON của API.
- UseCase là lớp xử lý logic độc lập: validation, phối hợp gọi nhiều repository, biến đổi dữ liệu.

```ts
// domain/usecases/LoginUseCase.ts
import {IAuthRepository} from '../repositories/IAuthRepository';
import {LoginCredentials, AuthSession} from '../entities/User';

export class LoginUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthSession> {
    if (!credentials.phoneNumber?.trim()) {
      throw new Error('Số điện thoại không được để trống');
    }
    const session = await this.authRepo.login(credentials);
    await this.authRepo.saveAuth(session);
    return session;
  }
}
```

### 5.2. Data Layer

- Chứa các `datasources/`:
  - `RemoteDataSource`: Gọi API backend. **Đây là nơi duy nhất được phép import `axiosClient`**.
  - `LocalDataSource`: Đọc/ghi cache, AsyncStorage, Biometrics.
- Chứa các `models/`:
  - `*DTO.ts`: Khai báo kiểu dữ liệu trả về từ API backend.
  - Mapper functions: Chuyển đổi hai chiều `DTO -> Entity` và `Entity -> DTO`.
- Chứa `repositories/*Impl.ts`: Hiện thực hoá Interface của Domain bằng cách kết hợp RemoteDataSource và LocalDataSource.

### 5.3. Presentation Layer & Redux Toolkit

- Mỗi feature quản lý Redux state trong `features/<feature>/presentation/redux/`:
  - `*Slice.ts`: Khởi tạo state bằng `createSlice`, định nghĩa synchronous actions và extraReducers.
  - `*Thunks.ts`: Tạo asynchronous thunk bằng `createAsyncThunk`. **Thunk chỉ được gọi usecase qua `container`, không gọi trực tiếp API/Axios**.
  - `*Selectors.ts`: Viết các selector truy vấn state, tối ưu memoization với `createSelector`.
- Presentation Hooks (`hooks/use*.ts`): Đóng gói dispatch actions và selectors thành một API đơn giản cho các Screen/Component gọi.

### 5.4. Network Layer (Axios)

- Cấu hình duy nhất tại [src/core/api/axiosClient.ts](file:///Volumes/DEV/RN/RNCore/src/core/api/axiosClient.ts):
  - **Base URL & Timeout**: Tự động lấy từ [src/core/config/env.ts](file:///Volumes/DEV/RN/RNCore/src/core/config/env.ts).
  - **Request Interceptor**: Tự động đính kèm Bearer Token nếu có.
  - **Response Interceptor**: Bắt lỗi 401/403 tự động kích hoạt callback logout; chuẩn hóa mọi lỗi thành class [ApiError](file:///Volumes/DEV/RN/RNCore/src/core/api/apiError.ts).

### 5.5. Dependency Injection (DI)

- Toàn bộ việc khởi tạo dependencies (DataSources -> Repositories -> UseCases) được tập trung tại [src/core/di/container.ts](file:///Volumes/DEV/RN/RNCore/src/core/di/container.ts).
- Các Thunk và Hooks lấy UseCase từ `container`, đảm bảo loose coupling và dễ dàng mock khi viết Unit Test.

---

## 6. Quy trình tạo một Feature mới

Khi cần tạo thêm tính năng mới (ví dụ: `order`):

1. **Tạo cấu trúc thư mục**:
   ```
   src/features/order/
   ├── domain/
   │   ├── entities/Order.ts
   │   ├── repositories/IOrderRepository.ts
   │   └── usecases/GetOrdersUseCase.ts
   ├── data/
   │   ├── datasources/OrderRemoteDataSource.ts
   │   ├── models/OrderDTO.ts
   │   └── repositories/OrderRepositoryImpl.ts
   ├── presentation/
   │   ├── redux/orderSlice.ts, orderThunks.ts, orderSelectors.ts
   │   ├── screens/OrderListScreen.tsx, OrderDetailScreen.tsx
   │   └── hooks/useOrders.ts
   └── index.ts
   ```
2. **Định nghĩa Domain**: Viết Entity `Order.ts`, Interface `IOrderRepository.ts`, UseCase `GetOrdersUseCase.ts`.
3. **Định nghĩa Data**: Viết `OrderDTO.ts` + mapper, `OrderRemoteDataSource.ts` (gọi `axiosClient`), `OrderRepositoryImpl.ts`.
4. **Đăng ký vào DI Container**: Wire repo & usecase mới trong `src/core/di/container.ts`.
5. **Xây dựng Presentation**:
   - Viết `orderThunks.ts` gọi usecase từ `container`.
   - Viết `orderSlice.ts`, thêm reducer vào `src/app/store/rootReducer.ts`.
   - Viết `OrderListScreen.tsx` và hook `useOrders.ts`.
6. **Đăng ký Navigation**: Thêm route vào `src/app/navigation/RootNavigator.tsx` hoặc `BottomNavigator.tsx`.
7. **Export**: Xuất các public API qua `src/features/order/index.ts`.

---

## 7. Bắt đầu chạy dự án

### Yêu cầu môi trường

- Node.js >= 20.0.0
- React Native CLI
- Xcode (đối với iOS) và Android Studio (đối với Android)

### Cài đặt dependencies

```bash
npm install
# hoặc
yarn install
```

Đối với iOS (cài đặt CocoaPods):

```bash
cd ios && pod install && cd ..
```

### Chạy ứng dụng

1. **Khởi động Metro Server**:
   ```bash
   npm start
   ```
2. **Chạy trên Android**:
   ```bash
   npm run android
   ```
3. **Chạy trên iOS**:
   ```bash
   npm run ios
   ```

---

## 8. Kiểm thử & Kiểm tra chất lượng

### TypeScript Type Check

Kiểm tra tính đúng đắn về kiểu dữ liệu trên toàn bộ dự án:

```bash
npx tsc --noEmit
```

### Chạy Unit Test

Kiểm thử UseCase, Model mappers, Redux Slices:

```bash
npm test
```

Chạy test cho riêng từng feature:

```bash
npm test -- src/features/auth/
```

### Linting

```bash
npm run lint
```

---

## 9. Agent Tooling

- After cloning, run `git config core.hooksPath .githooks` once — enables the pre-commit hook (check:arch → tsc → test → lint). Never bypass with `--no-verify`.
- `npm run check:arch` — mechanical boundary check (rules B1–B4, `scripts/check-boundaries.js`); CI runs it too.
- `.opencode/skill/add-feature/` — scaffold workflow for new features; follow it when asked to add a feature.
- `.opencode/agent/architecture-reviewer.md` — review-only subagent; run after feature work, it reports violations and never edits.
- Specs live in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`.

---

## 10. Checklist Review PR

Trước khi tạo hoặc duyệt Pull Request, hãy kiểm tra các tiêu chí sau:

- [ ] File mới nằm đúng layer (`domain`, `data`, `presentation`) của đúng feature.
- [ ] Layer `domain/` **không** import `react-native`, `axios`, `redux`.
- [ ] Thunk **chỉ** gọi UseCase thông qua `container`, không gọi trực tiếp Axios trong thunk.
- [ ] Mọi Repository Implementation đều có interface `I*Repository` tương ứng trong `domain/repositories`.
- [ ] Tuân thủ đúng naming convention (PascalCase cho Entity/UseCase/Component, camelCase cho Slice/Thunk).
- [ ] Có Unit Test kèm theo cho các UseCase, DTO mappers hoặc Redux Slice mới.
- [ ] Không viết logic nghiệp vụ phức tạp trực tiếp trong Component/Screen (chỉ gọi Hook/Dispatch).
- [ ] Đã chạy `npx tsc --noEmit` và `npm test` thành công mà không có lỗi.
