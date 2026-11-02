# Home Screen (Empty-Device State) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the F-components showcase `HomeScreen` with the real Home screen from the reference image: greeting header + avatar, empty-device banner with "Kết nối ngay" CTA, 2-column product grid, "Xem thêm" — with mocked data and mockable loading/error/empty states per region.

**Architecture:** Home stays a presentation-only feature (no domain/data/Redux). A `mockHome.ts` module exports two async loaders (`loadDeviceRegion`, `loadProductRegion`) plus mock products; `HomeScreen` resolves them into local state and passes `{status, data}` props down. One `FlatList numColumns={2}` is the scroll container; header/banner/title live in `ListHeaderComponent`, cards in `renderItem`, status bodies in `ListEmptyComponent`, "Xem thêm" in `ListFooterComponent`. All non-existent destinations (connect flow, product detail, cart, see-more, retry) are noop + `// TODO: integration point`.

**Tech Stack:** React Native 0.87 + TypeScript, FlatList, react-native-svg `LinearGradient` (already used by `WaterWaveBackground` — no new dependency), i18next, F-components (`FText`, `FButton`, `FIcon`), theme tokens. Tests: jest 29 + react-test-renderer 19, tests in root `__tests__/`.

**Spec:** `docs/superpowers/specs/2026-09-18-home-screen-design.md`

**Reference flow doc:** `docs/superpowers/plans/KGR_HOME_UI_FLOW.md`

**Key codebase facts (verified):**
- `ColorsProps` tokens used below exist: `bgLightBase`, `card`, `onDarkPrimary`, `blue200`, `blue50`, `grey100`, `grey300`, `error`, `success`, `green50`, `title` (`src/core/theme/colors.ts`, `FTheme.ts`).
- Icons exist in `FFilled`: `hyperlink`, `shopping_cart`, `user_profile`, `image` (`src/shared/styles/FIconStyles.tsx`).
- `FButton` is Pressable-based (no Paper) → `testID`/`onPress` work in tests. Props used: `title`, `kind`, `color`, `size`, `width`, `onPress`, `testID`, `style`.
- `FIcon` props: `icon`, `iconColor`, `size`. `FText` props: `typo`, `color`, `style`, `numberOfLines`.
- `FIconButton` is Paper-based (untestable in this suite) — avatar uses `Pressable` + `FIcon` instead.
- `FLoading` is a full-screen Paper dialog — NOT used; loading states are grey skeleton boxes per the spec.
- Spacing rule: layout margins/padding → `tokens.space.*`; component-internal padding/gap → `tokens.spacing.*` / `spacing` helpers. Raw numbers only for geometry (heights, sizes) with a comment where non-obvious.
- Tests: copy the jest mock block from `__tests__/HomeScreen.test.tsx` (async-storage, safe-area, gesture-handler, modal, animatable, rn-tooltip, svg, spinkit, slider, step-indicator, reanimated, paper). Extend the svg mock (see Task 7) because `EmptyDeviceCard` imports `Svg/Defs/LinearGradient/Rect/Stop` directly.
- Component tests need `import '@/core/i18n';` (asserts Vietnamese strings) and `ThemeProvider` wrapper (hydration via mocked AsyncStorage).

---

### Task 1: i18n keys

**Files:**
- Modify: `src/core/i18n/locales/vi.json`
- Modify: `src/core/i18n/locales/en.json`

- [ ] **Step 1: Add `home` keys to `vi.json`**

Replace the existing `"home"` block:

```json
  "home": {
    "title": "Trang chủ",
    "greeting": {
      "morning": "Chào buổi sáng",
      "noon": "Chào buổi trưa",
      "afternoon": "Chào buổi chiều",
      "evening": "Chào buổi tối"
    },
    "device": {
      "empty": "Chưa có thiết bị nào được ghép nối",
      "connect": "Kết nối ngay",
      "error": "Không tải được thiết bị",
      "retry": "Thử lại"
    },
    "products": {
      "title": "Khám phá sản phẩm",
      "seeMore": "Xem thêm",
      "empty": "Chưa có sản phẩm",
      "error": "Không tải được sản phẩm",
      "retry": "Thử lại",
      "badgeHot": "HOT",
      "badgeNew": "Mới"
    }
  },
```

- [ ] **Step 2: Add `home` keys to `en.json`**

Replace the existing `"home"` block:

```json
  "home": {
    "title": "Home",
    "greeting": {
      "morning": "Good morning",
      "noon": "Good afternoon",
      "afternoon": "Good afternoon",
      "evening": "Good evening"
    },
    "device": {
      "empty": "No device has been paired yet",
      "connect": "Connect now",
      "error": "Failed to load devices",
      "retry": "Retry"
    },
    "products": {
      "title": "Discover products",
      "seeMore": "See more",
      "empty": "No products available",
      "error": "Failed to load products",
      "retry": "Retry",
      "badgeHot": "HOT",
      "badgeNew": "New"
    }
  },
```

- [ ] **Step 3: Verify JSON is valid and suite is green**

Run: `node -e "require('./src/core/i18n/locales/vi.json');require('./src/core/i18n/locales/en.json');console.log('ok')" && npx tsc --noEmit`
Expected: `ok`, tsc exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/core/i18n/locales/vi.json src/core/i18n/locales/en.json
git commit -m "feat(home): add home screen i18n keys"
```

---

### Task 2: Mock data module

**Files:**
- Create: `src/features/home/presentation/mocks/mockHome.ts`
- Test: `__tests__/mockHome.test.ts`

- [ ] **Step 1: Write the failing test**

`__tests__/mockHome.test.ts`:

```ts
import {
  loadDeviceRegion,
  loadProductRegion,
  MOCK_PRODUCTS,
} from '@/features/home/presentation/mocks/mockHome';

describe('mockHome', () => {
  it('loadDeviceRegion resolves the requested state', async () => {
    await expect(loadDeviceRegion('empty', 0)).resolves.toEqual({status: 'empty'});
    await expect(loadDeviceRegion('error', 0)).resolves.toEqual({status: 'error'});
    await expect(loadDeviceRegion('success', 0)).resolves.toEqual({status: 'success'});
  });

  it('loadProductRegion returns items only on success', async () => {
    await expect(loadProductRegion('success', 0)).resolves.toEqual({
      status: 'success',
      items: MOCK_PRODUCTS,
    });
    await expect(loadProductRegion('empty', 0)).resolves.toEqual({
      status: 'empty',
      items: [],
    });
    await expect(loadProductRegion('error', 0)).resolves.toEqual({
      status: 'error',
      items: [],
    });
  });

  it('mock products carry id, name, price and optional badge', () => {
    expect(MOCK_PRODUCTS.length).toBeGreaterThanOrEqual(4);
    for (const p of MOCK_PRODUCTS) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(typeof p.price).toBe('number');
      expect(['hot', 'new', undefined]).toContain(p.badge);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/mockHome.test.ts`
Expected: FAIL — cannot find module `mockHome`.

- [ ] **Step 3: Implement `mockHome.ts`**

```ts
// ponytail: mock loaders — swap for thunks + real API when the data layer lands
export type RegionState = 'success' | 'error' | 'empty';

export interface MockProduct {
  id: string;
  name: string;
  price: number;
  badge?: 'hot' | 'new';
}

export type DeviceRegionResult = {status: RegionState};
export type ProductRegionResult = {status: RegionState; items: MockProduct[]};

/** Flip this single value to demo loading → state transitions. */
export const MOCK_REGION_STATE: RegionState = 'success';

export const MOCK_PRODUCTS: MockProduct[] = [
  {id: 'p1', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'hot'},
  {id: 'p2', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'new'},
  {id: 'p3', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'hot'},
  {id: 'p4', name: 'Máy lọc nước KGR 01H23', price: 250000},
  {id: 'p5', name: 'Máy lọc nước KGR 02H23', price: 320000, badge: 'new'},
  {id: 'p6', name: 'Máy lọc nước KGR 02H23', price: 320000},
];

const DELAY_MS = 800;
const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

export const loadDeviceRegion = async (
  state: RegionState = MOCK_REGION_STATE,
  delayMs: number = DELAY_MS,
): Promise<DeviceRegionResult> => {
  await delay(delayMs);
  return {status: state};
};

export const loadProductRegion = async (
  state: RegionState = MOCK_REGION_STATE,
  delayMs: number = DELAY_MS,
): Promise<ProductRegionResult> => {
  await delay(delayMs);
  if (state === 'success') {
    return {status: 'success', items: MOCK_PRODUCTS};
  }
  return {status: state, items: []};
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/mockHome.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/mocks/mockHome.ts __tests__/mockHome.test.ts
git commit -m "feat(home): add mock home data loaders"
```

---

### Task 3: HomeHeader (greeting + avatar)

**Files:**
- Create: `src/features/home/presentation/components/HomeHeader.tsx`
- Test: `__tests__/HomeHeader.test.tsx`

- [ ] **Step 1: Write the failing test**

`__tests__/HomeHeader.test.tsx`:

```ts
import 'react-native';
import '@/core/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
}));

import React from 'react';
import renderer from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import {getGreetingKey, HomeHeader} from '@/features/home/presentation/components/HomeHeader';

describe('getGreetingKey', () => {
  it('maps hours to greeting keys', () => {
    expect(getGreetingKey(4)).toBe('evening');
    expect(getGreetingKey(0)).toBe('evening');
    expect(getGreetingKey(5)).toBe('morning');
    expect(getGreetingKey(10)).toBe('morning');
    expect(getGreetingKey(11)).toBe('noon');
    expect(getGreetingKey(12)).toBe('noon');
    expect(getGreetingKey(13)).toBe('afternoon');
    expect(getGreetingKey(17)).toBe('afternoon');
    expect(getGreetingKey(18)).toBe('evening');
    expect(getGreetingKey(23)).toBe('evening');
  });
});

describe('HomeHeader', () => {
  const renderHeader = async () => {
    let tree!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <HomeHeader onAvatarPress={jest.fn()} />
        </ThemeProvider>,
      );
    });
    return tree;
  };

  it('renders a greeting text and an avatar button', async () => {
    const tree = await renderHeader();
    expect(tree.root.findByProps({testID: 'home-header'})).toBeTruthy();
    expect(tree.root.findByProps({testID: 'avatar-button'})).toBeTruthy();
    const texts = tree.root.findAll(
      node =>
        typeof node.props.children === 'string' &&
        (node.props.children as string).startsWith('Chào buổi'),
    );
    expect(texts.length).toBe(1);
  });

  it('calls onAvatarPress when the avatar is pressed', async () => {
    const onAvatarPress = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <HomeHeader onAvatarPress={onAvatarPress} />
        </ThemeProvider>,
      );
    });
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'avatar-button'}).props.onPress();
    });
    expect(onAvatarPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/HomeHeader.test.tsx`
Expected: FAIL — module `HomeHeader` does not exist.

- [ ] **Step 3: Implement `HomeHeader.tsx`**

```tsx
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';

export type GreetingKey = 'morning' | 'noon' | 'afternoon' | 'evening';

export const getGreetingKey = (hour: number): GreetingKey => {
  if (hour < 5 || hour >= 18) {
    return 'evening';
  }
  if (hour < 11) {
    return 'morning';
  }
  if (hour < 13) {
    return 'noon';
  }
  return 'afternoon';
};

interface HomeHeaderProps {
  onAvatarPress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({onAvatarPress}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);
  const greeting = getGreetingKey(new Date().getHours());

  return (
    <View style={styles.container} testID="home-header">
      <FText typo="headline8">{t(`home.greeting.${greeting}`)}</FText>
      <Pressable
        testID="avatar-button"
        hitSlop={tokens.space.xs}
        onPress={onAvatarPress}>
        <FIcon
          icon={FFilled.user_profile}
          size={24}
          iconColor={colors.title}
        />
      </Pressable>
    </View>
  );
};

export default HomeHeader;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: tokens.space.lg,
    },
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/HomeHeader.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/components/HomeHeader.tsx __tests__/HomeHeader.test.tsx
git commit -m "feat(home): add HomeHeader with greeting and avatar"
```

---

### Task 4: EmptyDeviceCard (gradient banner + CTA)

**Files:**
- Create: `src/features/home/presentation/components/EmptyDeviceCard.tsx`
- Test: `__tests__/EmptyDeviceCard.test.tsx`

- [ ] **Step 1: Write the failing test**

`__tests__/EmptyDeviceCard.test.tsx`:

```ts
import 'react-native';
import '@/core/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-svg', () => {
  const React = require('react');
  const pass = ({children}: any) => React.createElement('View', null, children);
  return {
    SvgXml: () => null,
    Svg: pass,
    Defs: pass,
    LinearGradient: pass,
    Stop: () => null,
    Rect: () => null,
  };
});

import React from 'react';
import renderer from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import EmptyDeviceCard from '@/features/home/presentation/components/EmptyDeviceCard';

describe('EmptyDeviceCard', () => {
  const renderCard = async (onConnect: jest.Mock) => {
    let tree!: renderer.ReactTestRenderer;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <EmptyDeviceCard onConnect={onConnect} />
        </ThemeProvider>,
      );
    });
    return tree;
  };

  it('renders the empty-device message and the CTA', async () => {
    const tree = await renderCard(jest.fn());
    expect(tree.root.findByProps({testID: 'device-banner'})).toBeTruthy();
    expect(
      tree.root.findByProps({children: 'Chưa có thiết bị nào được ghép nối'}),
    ).toBeTruthy();
    expect(
      tree.root.findByProps({children: 'Kết nối ngay'}),
    ).toBeTruthy();
  });

  it('calls onConnect when the CTA is pressed', async () => {
    const onConnect = jest.fn();
    const tree = await renderCard(onConnect);
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-connect'}).props.onPress();
    });
    expect(onConnect).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/EmptyDeviceCard.test.tsx`
Expected: FAIL — module `EmptyDeviceCard` does not exist.

- [ ] **Step 3: Implement `EmptyDeviceCard.tsx`**

```tsx
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton, FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';

interface EmptyDeviceCardProps {
  onConnect: () => void;
}

const EmptyDeviceCard: React.FC<EmptyDeviceCardProps> = ({onConnect}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container} testID="device-banner">
      <Svg style={styles.gradient}>
        <Defs>
          <LinearGradient id="deviceBannerGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.blue200} />
            <Stop offset="1" stopColor={colors.blue50} />
          </LinearGradient>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          rx={tokens.borderRadius.medium}
          fill="url(#deviceBannerGradient)"
        />
      </Svg>
      <View style={styles.content}>
        <FIcon
          icon={FFilled.hyperlink}
          size={40}
          iconColor={colors.onDarkPrimary}
        />
        <FText
          typo="bodyLabel02"
          color={colors.onDarkPrimary}
          style={styles.message}>
          {t('home.device.empty')}
        </FText>
        <FButton
          title={t('home.device.connect')}
          color="success"
          size="m"
          width={160}
          testID="device-connect"
          onPress={onConnect}
        />
      </View>
    </View>
  );
};

export default EmptyDeviceCard;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      borderRadius: tokens.borderRadius.medium,
      overflow: 'hidden',
      marginBottom: tokens.space.lg,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      alignItems: 'center',
      gap: tokens.space.md,
      paddingVertical: tokens.space.xl,
      paddingHorizontal: tokens.space.lg,
    },
    message: {
      textAlign: 'center',
    },
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/EmptyDeviceCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/components/EmptyDeviceCard.tsx __tests__/EmptyDeviceCard.test.tsx
git commit -m "feat(home): add EmptyDeviceCard banner with connect CTA"
```

---

### Task 5: ProductCard (badge, name, price, cart)

**Files:**
- Create: `src/features/home/presentation/components/ProductCard.tsx`
- Test: `__tests__/ProductCard.test.tsx`

- [ ] **Step 1: Write the failing test**

`__tests__/ProductCard.test.tsx`:

```ts
import 'react-native';
import '@/core/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
}));

import React from 'react';
import renderer from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import {
  formatPrice,
  ProductCard,
} from '@/features/home/presentation/components/ProductCard';
import {MockProduct} from '@/features/home/presentation/mocks/mockHome';

const baseProduct: MockProduct = {
  id: 'p1',
  name: 'Máy lọc nước KGR 01H23',
  price: 250000,
};

const renderCard = async (product: MockProduct, onPress: jest.Mock, onAddToCart: jest.Mock) => {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <ProductCard product={product} onPress={onPress} onAddToCart={onAddToCart} />
      </ThemeProvider>,
    );
  });
  return tree;
};

describe('formatPrice', () => {
  it('formats with dot thousand separators and đ suffix', () => {
    expect(formatPrice(250000)).toBe('250.000đ');
    expect(formatPrice(0)).toBe('0đ');
    expect(formatPrice(1234567)).toBe('1.234.567đ');
  });
});

describe('ProductCard', () => {
  it('renders name, price and no badge when badge is absent', async () => {
    const tree = await renderCard(baseProduct, jest.fn(), jest.fn());
    expect(tree.root.findByProps({children: 'Máy lọc nước KGR 01H23'})).toBeTruthy();
    expect(tree.root.findByProps({children: '250.000đ'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'product-badge-p1'}).length).toBe(0);
  });

  it('renders HOT and Mới badges from data', async () => {
    const hot = await renderCard({...baseProduct, badge: 'hot'}, jest.fn(), jest.fn());
    expect(hot.root.findByProps({children: 'HOT'})).toBeTruthy();
    const nuax = await renderCard(
      {...baseProduct, badge: 'new'},
      jest.fn(),
      jest.fn(),
    );
    expect(nuax.root.findByProps({children: 'Mới'})).toBeTruthy();
  });

  it('cart press does not trigger the card press and vice versa', async () => {
    const onPress = jest.fn();
    const onAddToCart = jest.fn();
    const tree = await renderCard(baseProduct, onPress, onAddToCart);

    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-cart-p1'}).props.onPress();
    });
    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-card-p1'}).props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/ProductCard.test.tsx`
Expected: FAIL — module `ProductCard` does not exist.

- [ ] **Step 3: Implement `ProductCard.tsx`**

```tsx
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';
import {MockProduct} from '../mocks/mockHome';

export const formatPrice = (price: number): string =>
  `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;

interface ProductCardProps {
  product: MockProduct;
  onPress: () => void;
  onAddToCart: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <Pressable
      style={styles.card}
      testID={`product-card-${product.id}`}
      onPress={onPress}>
      <View>
        <View style={styles.image}>
          {/* ponytail: placeholder until real product images ship */}
          <FIcon icon={FFilled.image} size={40} iconColor={colors.grey300} />
        </View>
        {product.badge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  product.badge === 'hot' ? colors.error : colors.success,
              },
            ]}
            testID={`product-badge-${product.id}`}>
            <FText typo="bodyLabel04" color={colors.onDarkPrimary}>
              {product.badge === 'hot'
                ? t('home.products.badgeHot')
                : t('home.products.badgeNew')}
            </FText>
          </View>
        ) : null}
      </View>
      <FText typo="bodyLabel03" numberOfLines={2} style={styles.name}>
        {product.name}
      </FText>
      <View style={styles.priceRow}>
        <FText typo="body02">{formatPrice(product.price)}</FText>
        <Pressable
          style={styles.cartButton}
          hitSlop={tokens.space.xs}
          testID={`product-cart-${product.id}`}
          onPress={onAddToCart}>
          <FIcon
            icon={FFilled.shopping_cart}
            size={20}
            iconColor={colors.success}
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

export default ProductCard;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: tokens.borderRadius.medium,
      padding: tokens.space.sm,
    },
    image: {
      height: 120,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.grey100,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.space.sm,
    },
    badge: {
      position: 'absolute',
      top: tokens.space.xs,
      left: tokens.space.xs,
      borderRadius: tokens.borderRadius.small,
      paddingHorizontal: tokens.space.sm,
      paddingVertical: tokens.spacing._3xs,
    },
    name: {
      minHeight: 40,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: tokens.spacing._2xs,
    },
    cartButton: {
      width: 28,
      height: 28,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.green50,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/ProductCard.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/components/ProductCard.tsx __tests__/ProductCard.test.tsx
git commit -m "feat(home): add ProductCard with badge, price and cart action"
```

---

### Task 6: DeviceSection + ProductSection (region status switches)

**Files:**
- Create: `src/features/home/presentation/components/DeviceSection.tsx`
- Create: `src/features/home/presentation/components/ProductSection.tsx`
- Test: `__tests__/HomeSections.test.tsx`

- [ ] **Step 1: Write the failing test**

`__tests__/HomeSections.test.tsx`:

```ts
import 'react-native';
import '@/core/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-svg', () => {
  const React = require('react');
  const pass = ({children}: any) => React.createElement('View', null, children);
  return {
    SvgXml: () => null,
    Svg: pass,
    Defs: pass,
    LinearGradient: pass,
    Stop: () => null,
    Rect: () => null,
  };
});

import React from 'react';
import renderer from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import DeviceSection from '@/features/home/presentation/components/DeviceSection';
import {
  ProductSectionBody,
  ProductSectionTitle,
} from '@/features/home/presentation/components/ProductSection';

type Status = 'loading' | 'success' | 'error' | 'empty';

const render = async (ui: React.ReactElement) => {
  let tree!: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<ThemeProvider>{ui}</ThemeProvider>);
  });
  return tree;
};

describe('DeviceSection', () => {
  it('shows a skeleton while loading', async () => {
    const tree = await render(
      <DeviceSection status={'loading' as Status} onConnect={jest.fn()} onRetry={jest.fn()} />,
    );
    expect(tree.root.findByProps({testID: 'device-skeleton'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'device-banner'}).length).toBe(0);
  });

  it('shows the banner only when the device list is confirmed empty', async () => {
    const tree = await render(
      <DeviceSection status={'empty' as Status} onConnect={jest.fn()} onRetry={jest.fn()} />,
    );
    expect(tree.root.findByProps({testID: 'device-banner'})).toBeTruthy();
  });

  it('renders nothing for success (has-device UI is a later integration point)', async () => {
    const tree = await render(
      <DeviceSection status={'success' as Status} onConnect={jest.fn()} onRetry={jest.fn()} />,
    );
    expect(tree.root.findAllByProps({testID: 'device-banner'}).length).toBe(0);
    expect(tree.root.findAllByProps({testID: 'device-skeleton'}).length).toBe(0);
  });

  it('shows an error with retry', async () => {
    const onRetry = jest.fn();
    const tree = await render(
      <DeviceSection status={'error' as Status} onConnect={jest.fn()} onRetry={onRetry} />,
    );
    expect(tree.root.findByProps({testID: 'device-error'})).toBeTruthy();
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-retry'}).props.onPress();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ProductSection', () => {
  it('renders the section title', async () => {
    const tree = await render(<ProductSectionTitle />);
    expect(
      tree.root.findByProps({children: 'Khám phá sản phẩm'}),
    ).toBeTruthy();
  });

  it('shows a 2-column skeleton while loading', async () => {
    const tree = await render(
      <ProductSectionBody status={'loading' as Status} onRetry={jest.fn()} />,
    );
    expect(tree.root.findByProps({testID: 'product-skeleton'})).toBeTruthy();
  });

  it('shows the empty message', async () => {
    const tree = await render(
      <ProductSectionBody status={'empty' as Status} onRetry={jest.fn()} />,
    );
    expect(tree.root.findByProps({children: 'Chưa có sản phẩm'})).toBeTruthy();
  });

  it('shows an error with retry', async () => {
    const onRetry = jest.fn();
    const tree = await render(
      <ProductSectionBody status={'error' as Status} onRetry={onRetry} />,
    );
    expect(tree.root.findByProps({testID: 'product-error'})).toBeTruthy();
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-retry'}).props.onPress();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for success (grid is rendered by the FlatList)', async () => {
    const tree = await render(
      <ProductSectionBody status={'success' as Status} onRetry={jest.fn()} />,
    );
    expect(tree.root.toJSON()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/HomeSections.test.tsx`
Expected: FAIL — modules `DeviceSection` / `ProductSection` do not exist.

- [ ] **Step 3: Implement `DeviceSection.tsx`**

```tsx
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import EmptyDeviceCard from './EmptyDeviceCard';

export type RegionStatus = 'loading' | 'success' | 'error' | 'empty';

interface DeviceSectionProps {
  status: RegionStatus;
  onConnect: () => void;
  onRetry: () => void;
}

const DeviceSection: React.FC<DeviceSectionProps> = ({
  status,
  onConnect,
  onRetry,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  if (status === 'loading') {
    return <View style={styles.skeleton} testID="device-skeleton" />;
  }
  if (status === 'empty') {
    return <EmptyDeviceCard onConnect={onConnect} />;
  }
  if (status === 'error') {
    return (
      <View style={styles.center} testID="device-error">
        <FText typo="body03" color={colors.error}>
          {t('home.device.error')}
        </FText>
        <FButton
          title={t('home.device.retry')}
          kind="ghost"
          color="error"
          size="m"
          testID="device-retry"
          onPress={onRetry}
        />
      </View>
    );
  }
  // TODO: integration point — has-device UI (chưa đặc tả theo flow doc)
  return null;
};

export default DeviceSection;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    skeleton: {
      height: 140,
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey100,
      marginBottom: tokens.space.lg,
    },
    center: {
      alignItems: 'center',
      gap: tokens.space.sm,
      paddingVertical: tokens.space.xl,
      marginBottom: tokens.space.lg,
    },
  });
```

- [ ] **Step 4: Implement `ProductSection.tsx`**

```tsx
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {RegionStatus} from './DeviceSection';

export const ProductSectionTitle: React.FC = () => {
  const {t} = useTranslation();
  const styles = createTitleStyles();
  return (
    <FText typo="bodyLabel01" style={styles.title}>
      {t('home.products.title')}
    </FText>
  );
};

interface ProductSectionBodyProps {
  status: RegionStatus;
  onRetry: () => void;
}

/** Renders only the non-success grid states — the success grid is the FlatList itself. */
export const ProductSectionBody: React.FC<ProductSectionBodyProps> = ({
  status,
  onRetry,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createBodyStyles(colors);

  if (status === 'loading') {
    return (
      <View style={styles.skeletonGrid} testID="product-skeleton">
        {[0, 1].map(row => (
          <View key={row} style={styles.skeletonRow}>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </View>
        ))}
      </View>
    );
  }
  if (status === 'empty') {
    return (
      <View style={styles.center} testID="product-empty">
        <FText typo="body03" color={colors.subtitle}>
          {t('home.products.empty')}
        </FText>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.center} testID="product-error">
        <FText typo="body03" color={colors.error}>
          {t('home.products.error')}
        </FText>
        <FButton
          title={t('home.products.retry')}
          kind="ghost"
          color="error"
          size="m"
          testID="product-retry"
          onPress={onRetry}
        />
      </View>
    );
  }
  return null;
};

const createTitleStyles = () =>
  StyleSheet.create({
    title: {
      marginBottom: tokens.space.md,
    },
  });

const createBodyStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    skeletonGrid: {
      gap: tokens.space.sm,
    },
    skeletonRow: {
      flexDirection: 'row',
      gap: tokens.space.sm,
    },
    skeletonCard: {
      flex: 1,
      height: 180,
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey100,
    },
    center: {
      alignItems: 'center',
      gap: tokens.space.sm,
      paddingVertical: tokens.space.xl,
    },
  });
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/HomeSections.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/home/presentation/components/DeviceSection.tsx src/features/home/presentation/components/ProductSection.tsx __tests__/HomeSections.test.tsx
git commit -m "feat(home): add device and product region status sections"
```

---

### Task 7: HomeScreen rewrite + barrel + remove showcase

**Files:**
- Modify: `src/features/home/presentation/screens/HomeScreen.tsx` (full rewrite)
- Modify: `src/features/home/presentation/components/index.ts`
- Delete (after grep confirms no outside references): `src/features/home/presentation/components/{ButtonsSection,FeedbackSection,InputsSection,OverlaySection,TypographySection,FSection}.tsx`
- Test: `__tests__/HomeScreen.test.tsx` (full rewrite)

- [ ] **Step 1: Check showcase usage before deleting**

Run: `grep -rn "FSection\|ButtonsSection\|FeedbackSection\|InputsSection\|OverlaySection\|TypographySection" src --include="*.tsx" --include="*.ts" | grep -v "features/home/presentation"`
Expected: no output. If there IS output, keep the referenced files and delete only the unreferenced ones.

- [ ] **Step 2: Rewrite the failing test**

Replace `__tests__/HomeScreen.test.tsx` entirely:

```tsx
import 'react-native';
import '@/core/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({children}: any) => children,
  TouchableWithoutFeedback: ({children}: any) => children,
}));

jest.mock('react-native-modal', () => {
  const React = require('react');
  const MockModal = ({children}: any) =>
    React.createElement('View', null, children);
  MockModal.default = MockModal;
  return MockModal;
});

jest.mock('react-native-animatable', () => ({
  View: ({children}: any) => children,
  initializeRegistryWithDefinitions: jest.fn(),
}));

jest.mock('rn-tooltip', () => ({
  __esModule: true,
  default: ({children}: any) => children,
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const pass = ({children}: any) => React.createElement('View', null, children);
  return {
    SvgXml: () => null,
    Svg: pass,
    Defs: pass,
    LinearGradient: pass,
    Stop: () => null,
    Rect: () => null,
  };
});

jest.mock('react-native-animated-spinkit', () => ({
  Pulse: () => null,
  Bounce: () => null,
}));

jest.mock('@react-native-assets/slider', () => ({
  Slider: () => null,
  RangeSlider: () => null,
}));

jest.mock('react-native-step-indicator', () => () => null);

jest.mock('react-native-reanimated', () => {
  const {createElement} = require('react');
  const createAnimatedComponent = (Comp: unknown) => (props: any) =>
    createElement(Comp, {
      ...props,
      ...(typeof props.animatedProps === 'object'
        ? props.animatedProps
        : null),
    });
  return {
    __esModule: true,
    default: {createAnimatedComponent},
    createAnimatedComponent,
    useSharedValue: (init: number) => ({value: init}),
    useAnimatedProps: (updater: () => Record<string, unknown>) => updater(),
    useFrameCallback: () => ({setActive: jest.fn(), isActive: true}),
    useReducedMotion: () => false,
  };
});

jest.mock('react-native-paper', () => {
  const React = require('react');
  const pass = ({children}: any) => children;
  const view = ({children}: any) =>
    React.createElement('View', null, children);
  const Dialog: any = view;
  Dialog.Title = view;
  Dialog.Content = view;
  Dialog.Actions = view;
  return {
    Appbar: {Header: view},
    IconButton: view,
    Dialog,
    Portal: pass,
    Snackbar: view,
    ActivityIndicator: view,
    TextInput: view,
  };
});

jest.mock('@/features/home/presentation/mocks/mockHome', () => ({
  MOCK_PRODUCTS: [
    {id: 'p1', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'hot'},
    {id: 'p2', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'new'},
  ],
  loadDeviceRegion: jest.fn(),
  loadProductRegion: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const navigate = jest.fn();
  return {...actual, useNavigation: () => ({navigate}), __navigate: navigate};
});

import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import {HomeScreen} from '@/features/home/presentation/screens/HomeScreen';
import {loadDeviceRegion, loadProductRegion} from '@/features/home/presentation/mocks/mockHome';

const mockLoadDevice = loadDeviceRegion as jest.Mock;
const mockLoadProduct = loadProductRegion as jest.Mock;

const navModule = () =>
  require('@react-navigation/native') as any as {__navigate: jest.Mock};

const renderHome = async () => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <HomeScreen />
      </ThemeProvider>,
    );
  });
  return tree;
};

const successProducts = () => ({
  status: 'success',
  items: [
    {id: 'p1', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'hot'},
    {id: 'p2', name: 'Máy lọc nước KGR 01H23', price: 250000, badge: 'new'},
  ],
});

beforeEach(() => {
  jest.clearAllMocks();
  navModule().__navigate.mockClear();
});

describe('HomeScreen', () => {
  it('renders header, banner, title, cards and see-more in image order', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    const instances = tree.root.findAll(() => true);
    const position = (testID: string) =>
      instances.findIndex(node => node.props.testID === testID);
    const order = [
      'home-header',
      'device-banner',
      'product-card-p1',
      'product-card-p2',
      'see-more',
    ].map(position);
    order.forEach(index => expect(index).toBeGreaterThanOrEqual(0));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('shows skeletons while regions are loading, no banner', async () => {
    mockLoadDevice.mockReturnValue(new Promise(() => {}));
    mockLoadProduct.mockReturnValue(new Promise(() => {}));
    const tree = await renderHome();

    expect(tree.root.findByProps({testID: 'device-skeleton'})).toBeTruthy();
    expect(tree.root.findByProps({testID: 'product-skeleton'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'device-banner'}).length).toBe(0);
    expect(tree.root.findAllByProps({testID: 'see-more'}).length).toBe(0);
  });

  it('device error does not block the product grid', async () => {
    mockLoadDevice.mockResolvedValue({status: 'error'});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    expect(tree.root.findByProps({testID: 'device-error'})).toBeTruthy();
    expect(tree.root.findByProps({testID: 'product-card-p1'})).toBeTruthy();
    expect(tree.root.findByProps({testID: 'see-more'})).toBeTruthy();
  });

  it('empty products hides see-more and shows the empty message', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue({status: 'empty', items: []});
    const tree = await renderHome();

    expect(tree.root.findByProps({children: 'Chưa có sản phẩm'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'see-more'}).length).toBe(0);
  });

  it('product error shows retry and no cards', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue({status: 'error', items: []});
    const tree = await renderHome();

    expect(tree.root.findByProps({testID: 'product-error'})).toBeTruthy();
    expect(tree.root.findAllByProps({testID: 'product-card-p1'}).length).toBe(0);
  });

  it('avatar navigates to Account; cart and card presses do not navigate', async () => {
    mockLoadDevice.mockResolvedValue({status: 'empty'});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    await renderer.act(async () => {
      tree.root.findByProps({testID: 'avatar-button'}).props.onPress();
    });
    expect(navModule().__navigate).toHaveBeenCalledWith('Account');

    navModule().__navigate.mockClear();
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-cart-p1'}).props.onPress();
    });
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'product-card-p1'}).props.onPress();
    });
    expect(navModule().__navigate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/HomeScreen.test.tsx`
Expected: FAIL — screen still renders the showcase (no `home-header`, `device-banner` testIDs).

- [ ] **Step 4: Rewrite `HomeScreen.tsx`**

Replace the whole file:

```tsx
import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import DeviceSection, {RegionStatus} from '../components/DeviceSection';
import HomeHeader from '../components/HomeHeader';
import ProductCard from '../components/ProductCard';
import {
  ProductSectionBody,
  ProductSectionTitle,
} from '../components/ProductSection';
import {
  DeviceRegionResult,
  loadDeviceRegion,
  loadProductRegion,
  ProductRegionResult,
} from '../mocks/mockHome';

type DeviceState = {status: Extract<RegionStatus, 'loading'>} | DeviceRegionResult;
type ProductState = {status: Extract<RegionStatus, 'loading'>} | ProductRegionResult;

// TODO: integration point — các đích chưa có màn (kết nối thiết bị, chi tiết SP, giỏ, xem thêm, thử lại)
const noopTODO = () => {};

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const navigation = useAppNavigation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  const [device, setDevice] = useState<DeviceState>({status: 'loading'});
  const [products, setProducts] = useState<ProductState>({
    status: 'loading',
    items: [],
  });

  useEffect(() => {
    let mounted = true;
    loadDeviceRegion().then(state => {
      if (mounted) {
        setDevice(state);
      }
    });
    loadProductRegion().then(state => {
      if (mounted) {
        setProducts(state);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const items = products.status === 'success' ? products.items : [];

  return (
    <View style={styles.container}>
      <FlatList
        numColumns={2}
        data={items}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ProductCard product={item} onPress={noopTODO} onAddToCart={noopTODO} />
        )}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[
          styles.content,
          // 90 = khoảng đệm cho thanh tab nổi (65) + khoảng hở, theo HomeScreen cũ
          {paddingBottom: insets.bottom + 90},
        ]}
        ListHeaderComponent={
          <>
            <HomeHeader onAvatarPress={() => navigation.navigate('Account')} />
            <DeviceSection
              status={device.status}
              onConnect={noopTODO}
              onRetry={noopTODO}
            />
            <ProductSectionTitle />
          </>
        }
        ListEmptyComponent={
          <ProductSectionBody status={products.status} onRetry={noopTODO} />
        }
        ListFooterComponent={
          products.status === 'success' && items.length > 0 ? (
            <View style={styles.footer}>
              <FButton
                title={t('home.products.seeMore')}
                kind="ghost"
                color="success"
                size="m"
                testID="see-more"
                onPress={noopTODO}
              />
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default HomeScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgLightBase,
    },
    content: {
      paddingTop: tokens.space.lg,
      paddingHorizontal: tokens.space.md,
    },
    column: {
      justifyContent: 'space-between',
      gap: tokens.space.sm,
      marginBottom: tokens.space.sm,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: tokens.space.md,
    },
  });
```

- [ ] **Step 5: Update the components barrel**

Replace `src/features/home/presentation/components/index.ts`:

```ts
export {default as DeviceSection} from './DeviceSection';
export type {RegionStatus} from './DeviceSection';
export {default as EmptyDeviceCard} from './EmptyDeviceCard';
export {default as HomeHeader} from './HomeHeader';
export {getGreetingKey} from './HomeHeader';
export {default as ProductCard, formatPrice} from './ProductCard';
export {ProductSectionBody, ProductSectionTitle} from './ProductSection';
```

(Delete the old showcase exports along with the files.)

- [ ] **Step 6: Delete showcase components (per Step 1 grep result)**

```bash
git rm src/features/home/presentation/components/ButtonsSection.tsx \
       src/features/home/presentation/components/FeedbackSection.tsx \
       src/features/home/presentation/components/InputsSection.tsx \
       src/features/home/presentation/components/OverlaySection.tsx \
       src/features/home/presentation/components/TypographySection.tsx \
       src/features/home/presentation/components/FSection.tsx
```

- [ ] **Step 7: Run the screen test to verify it passes**

Run: `npx jest __tests__/HomeScreen.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 8: Run the whole suite to catch fallout from removed showcase files**

Run: `npm test`
Expected: all suites PASS (including App.test.tsx which renders the tree with the new HomeScreen).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(home): build home screen with device banner and product grid"
```

---

### Task 8: Quality gates

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors (fix any that appear, then re-run Steps 1–2).

- [ ] **Step 4: Commit any lint/type fixes**

```bash
git add -A
git commit -m "fix(home): address lint and type findings"
```
(Skip if there is nothing to commit.)

---

## Manual smoke check (no commit)

Run the app in the emulator and confirm against the reference image:
- Greeting matches the current time of day; avatar top-right.
- Blue gradient banner with link icon, message and green "Kết nối ngay" pill.
- 2-column product grid with HOT/Mới badges, prices formatted `250.000đ`, cart icons.
- "Xem thêm" centered below the grid; floating pill tab bar does not cover it.
- Flip `MOCK_REGION_STATE` in `mockHome.ts` to `'loading'` / `'error'` / `'empty'` and re-check each state renders as specified.

## Self-Review

- **Spec coverage:** §1 scope → Tasks 1–7 (banner only when confirmed empty: DeviceSection `empty` branch + Task 7 loading test asserts no banner during loading; avatar → Account wired; other taps noop + TODO). §3 layout → Task 7 FlatList/header/footer. §4 states + independence → Tasks 2, 6, 7 (device error test keeps grid alive). §5 interactions → Task 7. §6 visual mapping → Tasks 4–6 (tokens, FFilled icons, badge colors). §7 i18n → Task 1. §8 testing → every task + HomeScreen suite covers the spec's checklist assertions. §9 out of scope untouched.
- **Placeholder scan:** none — every code step is complete; the only TODOs are the deliberate runtime integration points named by the spec.
- **Type consistency:** `RegionStatus` defined in `DeviceSection.tsx`, re-exported from the barrel, imported by `ProductSection.tsx` and `HomeScreen.tsx`. `DeviceRegionResult`/`ProductRegionResult`/`MockProduct` defined in `mockHome.ts`, used in Tasks 5 and 7 identically. testIDs consistent across components and tests: `home-header`, `avatar-button`, `device-banner`, `device-connect`, `device-skeleton`, `device-error`, `device-retry`, `product-skeleton`, `product-empty`, `product-error`, `product-retry`, `product-card-{id}`, `product-badge-{id}`, `product-cart-{id}`, `see-more`.
