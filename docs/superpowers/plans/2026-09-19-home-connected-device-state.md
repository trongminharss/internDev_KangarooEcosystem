# Home Connected Device State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the connected-device state to HomeScreen — a quality/quick-actions panel replaces the empty-device banner, and a device grid replaces the product grid.

**Architecture:** Approach A from the spec — `DeviceSection` owns the device-region UI (loading / empty / error / connected panel); `HomeScreen` keeps a single FlatList whose `data` swaps between products and devices based on connection state. New data shape lives in the existing presentation mocks (`mockHome.ts`), following the "swap for thunks later" pattern.

**Tech Stack:** React Native 0.87, TypeScript, i18next, react-test-renderer 19 + Jest 29 (`@react-native/jest-preset`). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-19-home-connected-device-state-design.md`

---

### Task 1: Mock data — `ConnectedDeviceData` types + `MOCK_CONNECTED`

**Files:**
- Modify: `src/features/home/presentation/mocks/mockHome.ts`
- Test: `__tests__/mockHome.test.ts`

- [ ] **Step 1: Update the failing test**

Replace the first test in `__tests__/mockHome.test.ts` and add a shape test. Full new file content:

```ts
import {
  loadDeviceRegion,
  loadProductRegion,
  MOCK_CONNECTED,
  MOCK_PRODUCTS,
} from '@/features/home/presentation/mocks/mockHome';

describe('mockHome', () => {
  it('loadDeviceRegion resolves the requested state', async () => {
    await expect(loadDeviceRegion('empty', 0)).resolves.toEqual({
      status: 'empty',
    });
    await expect(loadDeviceRegion('error', 0)).resolves.toEqual({
      status: 'error',
    });
    await expect(loadDeviceRegion('success', 0)).resolves.toEqual({
      status: 'success',
      data: MOCK_CONNECTED,
    });
  });

  it('MOCK_CONNECTED mirrors the design numbers and carries devices', () => {
    expect(MOCK_CONNECTED.grade).toBe('A+');
    expect(MOCK_CONNECTED.gradePpm).toBe('3.2');
    expect(MOCK_CONNECTED.tdsPpm).toBe('32');
    expect(MOCK_CONNECTED.qualityLabel).toBe('Tuyệt vời');
    expect(MOCK_CONNECTED.stats).toEqual({
      efficiency: '85%',
      filtered: '12.4L',
      inputPpm: '214',
    });
    expect(MOCK_CONNECTED.devices.length).toBeGreaterThanOrEqual(2);
    for (const d of MOCK_CONNECTED.devices) {
      expect(typeof d.id).toBe('string');
      expect(typeof d.room).toBe('string');
      expect(typeof d.name).toBe('string');
      expect(typeof d.statusText).toBe('string');
    }
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
Expected: FAIL — `MOCK_CONNECTED` is not exported.

- [ ] **Step 3: Implement types and mock data**

Replace `src/features/home/presentation/mocks/mockHome.ts` entirely:

```ts
// ponytail: mock loaders — swap for thunks + real API when the data layer lands
export type RegionState = 'success' | 'error' | 'empty';

export interface MockProduct {
  id: string;
  name: string;
  price: number;
  badge?: 'hot' | 'new';
}

export interface MockDevice {
  id: string;
  room: string;
  name: string;
  statusText: string;
}

export interface ConnectedDeviceData {
  grade: string;
  gradePpm: string;
  tdsPpm: string;
  qualityLabel: string;
  stats: {efficiency: string; filtered: string; inputPpm: string};
  devices: MockDevice[];
}

export type DeviceRegionResult =
  | {status: Exclude<RegionState, 'success'>}
  | {status: 'success'; data: ConnectedDeviceData};
export type ProductRegionResult = {status: RegionState; items: MockProduct[]};

/** Flip this single value to demo loading → state transitions. */
export const MOCK_REGION_STATE: RegionState = 'success';

export const MOCK_CONNECTED: ConnectedDeviceData = {
  grade: 'A+',
  gradePpm: '3.2',
  tdsPpm: '32',
  qualityLabel: 'Tuyệt vời',
  stats: {efficiency: '85%', filtered: '12.4L', inputPpm: '214'},
  devices: [
    {id: 'd1', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
    {id: 'd2', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
  ],
};

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
  return state === 'success'
    ? {status: 'success', data: MOCK_CONNECTED}
    : {status: state};
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

Note: `DeviceRegionResult` is now a discriminated union — `HomeScreen.tsx` and `DeviceSection.tsx` still compile at this point because they only read `status` (verified in Task 6/5; `tsc` may flag nothing here since neither reads `data` yet).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/mockHome.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/mocks/mockHome.ts __tests__/mockHome.test.ts
git commit -m "feat(home): add connected device mock data"
```

---

### Task 2: i18n keys for the connected state

**Files:**
- Modify: `src/core/i18n/locales/vi.json` (`home.device` section, ~line 57)
- Modify: `src/core/i18n/locales/en.json` (`home.device` section, ~line 57)

- [ ] **Step 1: Add vi keys**

In `src/core/i18n/locales/vi.json`, replace the `home.device` block with:

```json
    "device": {
      "empty": "Chưa có thiết bị nào được ghép nối",
      "connect": "Kết nối ngay",
      "error": "Không tải được thiết bị",
      "retry": "Thử lại",
      "quality": "Chất lượng nước",
      "statEfficiency": "Hiệu suất lọc",
      "statFiltered": "Nước lọc",
      "statInput": "Nguồn vào",
      "warranty": "Bảo Hành",
      "replaceFilter": "Thay lõi",
      "support": "Hỗ trợ",
      "gridTitle": "Thiết bị nổi bật",
      "more": "Thêm"
    },
```

- [ ] **Step 2: Add en keys**

In `src/core/i18n/locales/en.json`, replace the `home.device` block with:

```json
    "device": {
      "empty": "No device has been paired yet",
      "connect": "Connect now",
      "error": "Failed to load devices",
      "retry": "Retry",
      "quality": "Water quality",
      "statEfficiency": "Filtration rate",
      "statFiltered": "Filtered water",
      "statInput": "Input TDS",
      "warranty": "Warranty",
      "replaceFilter": "Filter change",
      "support": "Support",
      "gridTitle": "Featured devices",
      "more": "Add"
    },
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "require('./src/core/i18n/locales/vi.json');require('./src/core/i18n/locales/en.json');console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add src/core/i18n/locales/vi.json src/core/i18n/locales/en.json
git commit -m "feat(home): add i18n keys for connected device state"
```

---

### Task 3: `ConnectedDevicePanel` component

**Files:**
- Create: `src/features/home/presentation/components/ConnectedDevicePanel.tsx`
- Modify: `src/features/home/presentation/components/index.ts`
- Test: `__tests__/HomeSections.test.tsx`

- [ ] **Step 1: Write the failing test**

In `__tests__/HomeSections.test.tsx`, extend the existing import block (after the `ProductSection` import, ~line 112):

```tsx
import ConnectedDevicePanel from '@/features/home/presentation/components/ConnectedDevicePanel';
import {
  MOCK_CONNECTED,
} from '@/features/home/presentation/mocks/mockHome';
```

Add this describe after the `DeviceSection` describe:

```tsx
describe('ConnectedDevicePanel', () => {
  it('renders quality label, grade, tds row and the three actions', async () => {
    const tree = await render(<ConnectedDevicePanel data={MOCK_CONNECTED} />);
    expect(tree.root.findByProps({testID: 'device-panel'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Tuyệt vời'})).toBeTruthy();
    expect(tree.root.findAllByProps({children: 'A+'}).length).toBe(2);
    expect(tree.root.findByProps({testID: 'device-tds-row'})).toBeTruthy();
    expect(
      tree.root.findByProps({testID: 'device-action-warranty'}),
    ).toBeTruthy();
    expect(
      tree.root.findByProps({testID: 'device-action-filter'}),
    ).toBeTruthy();
    expect(
      tree.root.findByProps({testID: 'device-action-support'}),
    ).toBeTruthy();
  });

  it('renders the three stat pills', async () => {
    const tree = await render(<ConnectedDevicePanel data={MOCK_CONNECTED} />);
    expect(tree.root.findByProps({children: '85%'})).toBeTruthy();
    expect(tree.root.findByProps({children: '12.4L'})).toBeTruthy();
    expect(tree.root.findByProps({children: '214'})).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/HomeSections.test.tsx -t ConnectedDevicePanel`
Expected: FAIL — Cannot find module `ConnectedDevicePanel`.

- [ ] **Step 3: Implement the component**

Create `src/features/home/presentation/components/ConnectedDevicePanel.tsx`:

```tsx
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled, FOutlined, tokens} from '@/shared/styles';
import {ConnectedDeviceData} from '@/features/home/presentation/mocks/mockHome';

interface ConnectedDevicePanelProps {
  data: ConnectedDeviceData;
}

// TODO: integration point — các đích chưa có màn (TDS detail, bảo hành, thay lõi, hỗ trợ)
const noopTODO = () => {};

const ACTIONS = [
  {key: 'warranty', icon: FFilled.shield, labelKey: 'home.device.warranty'},
  {key: 'filter', icon: FOutlined.refresh, labelKey: 'home.device.replaceFilter'},
  {key: 'support', icon: FFilled.phone, labelKey: 'home.device.support'},
] as const;

const ConnectedDevicePanel: React.FC<ConnectedDevicePanelProps> = ({data}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container} testID="device-panel">
      <View style={styles.card}>
        <Svg style={styles.gradient}>
          <Defs>
            <LinearGradient id="devicePanelGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.blue200} />
              <Stop offset="1" stopColor={colors.blue50} />
            </LinearGradient>
          </Defs>
          <Rect
            width="100%"
            height="100%"
            rx={tokens.borderRadius.medium}
            fill="url(#devicePanelGradient)"
          />
        </Svg>
        <View style={styles.cardContent}>
          <View style={styles.qualityRow}>
            <View>
              <FText typo="bodyLabel02" color={colors.subtitle}>
                {t('home.device.quality')}
              </FText>
              <FText typo="headline7">{data.qualityLabel}</FText>
            </View>
            <View style={styles.gradeBlock}>
              <FText typo="headline5" color={colors.success}>
                {data.grade}
              </FText>
              <FText typo="bodyLabel02" color={colors.success}>
                {data.gradePpm} ppm
              </FText>
            </View>
          </View>
          <View style={styles.statsRow}>
            {[
              {
                value: data.stats.efficiency,
                label: t('home.device.statEfficiency'),
              },
              {
                value: data.stats.filtered,
                label: t('home.device.statFiltered'),
              },
              {value: data.stats.inputPpm, label: t('home.device.statInput')},
            ].map(stat => (
              <View key={stat.label} style={styles.statPill}>
                <FText typo="bodyLabel01">{stat.value}</FText>
                <FText typo="bodyLabel04" color={colors.subtitle}>
                  {stat.label}
                </FText>
              </View>
            ))}
          </View>
          <Pressable
            style={styles.tdsRow}
            testID="device-tds-row"
            accessibilityRole="button"
            accessibilityLabel={`${data.grade} ${data.tdsPpm} ppm`}
            onPress={noopTODO}>
            <FText typo="headline6" color={colors.success}>
              {data.grade}
            </FText>
            <FText typo="body02">{data.tdsPpm} ppm</FText>
            <View style={styles.tdsChevron}>
              <FIcon
                icon={FFilled.arrow_right}
                size={20}
                iconColor={colors.subtitle}
              />
            </View>
          </Pressable>
        </View>
      </View>
      <View style={styles.actionsRow}>
        {ACTIONS.map(action => (
          <Pressable
            key={action.key}
            style={styles.action}
            testID={`device-action-${action.key}`}
            accessibilityRole="button"
            accessibilityLabel={t(action.labelKey)}
            onPress={noopTODO}>
            <View style={styles.actionIcon}>
              <FIcon icon={action.icon} size={24} iconColor={colors.success} />
            </View>
            <FText typo="bodyLabel04">{t(action.labelKey)}</FText>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default ConnectedDevicePanel;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      gap: tokens.space.lg,
      marginBottom: tokens.space.lg,
    },
    card: {
      borderRadius: tokens.borderRadius.medium,
      overflow: 'hidden',
    },
    gradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    cardContent: {
      padding: tokens.space.md,
      gap: tokens.space.md,
    },
    qualityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    gradeBlock: {
      alignItems: 'flex-end',
    },
    statsRow: {
      flexDirection: 'row',
      gap: tokens.space.sm,
    },
    statPill: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: tokens.borderRadius.small,
      alignItems: 'center',
      paddingVertical: tokens.spacing.xs,
      gap: tokens.spacing._3xs,
    },
    tdsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: tokens.borderRadius.small,
      paddingHorizontal: tokens.space.md,
      paddingVertical: tokens.spacing.s,
      gap: tokens.spacing._2xs,
    },
    tdsChevron: {
      marginLeft: 'auto',
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.space.sm,
    },
    action: {
      alignItems: 'center',
      gap: tokens.spacing._3xs,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.green50,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/HomeSections.test.tsx`
Expected: PASS (all tests in the file, including the 2 new ones)

- [ ] **Step 5: Export from the barrel**

In `src/features/home/presentation/components/index.ts`, add after the `DeviceSection` lines:

```ts
export {default as ConnectedDevicePanel} from './ConnectedDevicePanel';
```

- [ ] **Step 6: Commit**

```bash
git add src/features/home/presentation/components/ConnectedDevicePanel.tsx src/features/home/presentation/components/index.ts __tests__/HomeSections.test.tsx
git commit -m "feat(home): add ConnectedDevicePanel with quality card and quick actions"
```

---

### Task 4: `DeviceCard` grid item

**Files:**
- Create: `src/features/home/presentation/components/DeviceCard.tsx`
- Modify: `src/features/home/presentation/components/index.ts`
- Test: `__tests__/HomeSections.test.tsx`

- [ ] **Step 1: Write the failing test**

In `__tests__/HomeSections.test.tsx`, extend the import block:

```tsx
import DeviceCard from '@/features/home/presentation/components/DeviceCard';
```

Add this describe:

```tsx
describe('DeviceCard', () => {
  const device = {
    id: 'd1',
    room: 'Phòng khách',
    name: 'Máy lọc nước',
    statusText: 'Tốt',
  };

  it('renders room, name and status', async () => {
    const tree = await render(<DeviceCard device={device} onPress={jest.fn()} />);
    expect(tree.root.findByProps({testID: 'device-card-d1'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Phòng khách'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Máy lọc nước'})).toBeTruthy();
    expect(tree.root.findByProps({children: 'Tốt'})).toBeTruthy();
  });

  it('invokes onPress from the card pressable', async () => {
    const onPress = jest.fn();
    const tree = await render(<DeviceCard device={device} onPress={onPress} />);
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-card-d1'}).props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/HomeSections.test.tsx -t DeviceCard`
Expected: FAIL — Cannot find module `DeviceCard`.

- [ ] **Step 3: Implement the component**

Create `src/features/home/presentation/components/DeviceCard.tsx`:

```tsx
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';
import {MockDevice} from '@/features/home/presentation/mocks/mockHome';

interface DeviceCardProps {
  device: MockDevice;
  onPress: () => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({device, onPress}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <Pressable
      style={styles.card}
      testID={`device-card-${device.id}`}
      accessibilityRole="button"
      accessibilityLabel={device.name}
      onPress={onPress}>
      <View style={styles.iconWrap}>
        {/* ponytail: placeholder until real device icons ship */}
        <FIcon icon={FFilled.settings} size={24} iconColor={colors.success} />
      </View>
      <FText typo="bodyLabel04" color={colors.subtitle}>
        {device.room}
      </FText>
      <FText typo="bodyLabel02" numberOfLines={1}>
        {device.name}
      </FText>
      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <FText typo="bodyLabel04" color={colors.subtitle}>
          {device.statusText}
        </FText>
      </View>
    </Pressable>
  );
};

export default DeviceCard;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: tokens.borderRadius.medium,
      padding: tokens.space.sm,
      gap: tokens.spacing._3xs,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.green50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.spacing._2xs,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._3xs,
      marginTop: tokens.spacing._2xs,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.success,
    },
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/HomeSections.test.tsx`
Expected: PASS

- [ ] **Step 5: Export from the barrel**

In `src/features/home/presentation/components/index.ts`, add after the `ConnectedDevicePanel` line:

```ts
export {default as DeviceCard} from './DeviceCard';
```

- [ ] **Step 6: Commit**

```bash
git add src/features/home/presentation/components/DeviceCard.tsx src/features/home/presentation/components/index.ts __tests__/HomeSections.test.tsx
git commit -m "feat(home): add DeviceCard grid item"
```

---

### Task 5: `DeviceSection` success branch + `DeviceGridHeader`

**Files:**
- Modify: `src/features/home/presentation/components/DeviceSection.tsx`
- Modify: `src/features/home/presentation/components/index.ts`
- Test: `__tests__/HomeSections.test.tsx`

- [ ] **Step 1: Write the failing tests**

In `__tests__/HomeSections.test.tsx`, extend the import block:

```tsx
import {
  DeviceGridHeader,
} from '@/features/home/presentation/components/DeviceSection';
```

Replace the test named `renders nothing for success (has-device UI is a later integration point)` (~line 148) with these two tests:

```tsx
  it('renders the connected panel when success carries data', async () => {
    const tree = await render(
      <DeviceSection
        status={'success' as Status}
        data={MOCK_CONNECTED}
        onConnect={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    expect(tree.root.findByProps({testID: 'device-panel'})).toBeTruthy();
  });

  it('renders nothing for success without data (defensive guard)', async () => {
    const tree = await render(
      <DeviceSection
        status={'success' as Status}
        data={undefined}
        onConnect={jest.fn()}
        onRetry={jest.fn()}
      />,
    );
    expect(tree.toJSON()).toBeNull();
  });
```

Add this describe:

```tsx
describe('DeviceGridHeader', () => {
  it('renders the grid title and the add button', async () => {
    const tree = await render(<DeviceGridHeader />);
    expect(
      tree.root.findByProps({children: 'Thiết bị nổi bật'}),
    ).toBeTruthy();
    expect(tree.root.findByProps({testID: 'device-more'})).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/HomeSections.test.tsx`
Expected: FAIL — `DeviceGridHeader` is not exported; the panel test fails because `data` prop is ignored.

- [ ] **Step 3: Implement**

Replace `src/features/home/presentation/components/DeviceSection.tsx` entirely:

```tsx
import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton, FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';
import EmptyDeviceCard from './EmptyDeviceCard';
import ConnectedDevicePanel from './ConnectedDevicePanel';
import {ConnectedDeviceData} from '@/features/home/presentation/mocks/mockHome';

export type RegionStatus = 'loading' | 'success' | 'error' | 'empty';

interface DeviceSectionProps {
  status: RegionStatus;
  data?: ConnectedDeviceData;
  onConnect: () => void;
  onRetry: () => void;
}

const DeviceSection: React.FC<DeviceSectionProps> = ({
  status,
  data,
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
  return data ? <ConnectedDevicePanel data={data} /> : null;
};

export default DeviceSection;

// TODO: integration point — đích "thêm thiết bị" chưa có màn
const noopTODO = () => {};

export const DeviceGridHeader: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <View style={headerStyles.row} testID="device-grid-header">
      <FText typo="bodyLabel01">{t('home.device.gridTitle')}</FText>
      <Pressable
        style={headerStyles.more}
        hitSlop={tokens.space.xs}
        testID="device-more"
        accessibilityRole="button"
        accessibilityLabel={t('home.device.more')}
        onPress={noopTODO}>
        <FText typo="bodyLabel02" color={colors.success}>
          {t('home.device.more')}
        </FText>
        <FIcon icon={FFilled.c_add} size={20} iconColor={colors.success} />
      </Pressable>
    </View>
  );
};

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

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.md,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing._3xs,
  },
});
```

- [ ] **Step 4: Export from the barrel**

In `src/features/home/presentation/components/index.ts`, change:

```ts
export {default as DeviceSection} from './DeviceSection';
```

to:

```ts
export {
  default as DeviceSection,
  DeviceGridHeader,
} from './DeviceSection';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/HomeSections.test.tsx`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add src/features/home/presentation/components/DeviceSection.tsx src/features/home/presentation/components/index.ts __tests__/HomeSections.test.tsx
git commit -m "feat(home): render connected panel and device grid header in DeviceSection"
```

---

### Task 6: Wire the connected state into `HomeScreen`

**Files:**
- Modify: `src/features/home/presentation/screens/HomeScreen.tsx`
- Test: `__tests__/HomeScreen.test.tsx`

- [ ] **Step 1: Write the failing tests**

In `__tests__/HomeScreen.test.tsx`, add after the `successProducts` helper (~line 152):

```tsx
const connectedData = () => ({
  grade: 'A+',
  gradePpm: '3.2',
  tdsPpm: '32',
  qualityLabel: 'Tuyệt vời',
  stats: {efficiency: '85%', filtered: '12.4L', inputPpm: '214'},
  devices: [
    {id: 'd1', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
    {id: 'd2', room: 'Phòng khách', name: 'Máy lọc nước', statusText: 'Tốt'},
  ],
});
```

Add these tests inside `describe('HomeScreen', ...)`:

```tsx
  it('connected state swaps the grid for device cards, no see-more', async () => {
    mockLoadDevice.mockResolvedValue({status: 'success', data: connectedData()});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    const instances = tree.root.findAll(() => true);
    const position = (testID: string) =>
      instances.findIndex(node => node.props.testID === testID);
    const order = [
      'home-header',
      'device-panel',
      'device-card-d1',
      'device-card-d2',
    ].map(position);
    order.forEach(index => expect(index).toBeGreaterThanOrEqual(0));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(tree.root.findAllByProps({testID: 'see-more'}).length).toBe(0);
    expect(tree.root.findAllByProps({testID: 'product-card-p1'}).length).toBe(
      0,
    );
  });

  it('connected noop presses do not navigate', async () => {
    mockLoadDevice.mockResolvedValue({status: 'success', data: connectedData()});
    mockLoadProduct.mockResolvedValue(successProducts());
    const tree = await renderHome();

    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-tds-row'}).props.onPress();
    });
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-action-warranty'}).props.onPress();
    });
    await renderer.act(async () => {
      tree.root.findByProps({testID: 'device-more'}).props.onPress();
    });
    expect(navModule().__navigate).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/HomeScreen.test.tsx -t connected`
Expected: FAIL — `device-panel` never renders (screen ignores `data`), `device-card-*` not found.

- [ ] **Step 3: Implement**

Replace `src/features/home/presentation/screens/HomeScreen.tsx` entirely:

```tsx
import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import DeviceSection, {
  DeviceGridHeader,
  RegionStatus,
} from '@/features/home/presentation/components/DeviceSection';
import HomeHeader from '@/features/home/presentation/components/HomeHeader';
import DeviceCard from '@/features/home/presentation/components/DeviceCard';
import ProductCard from '@/features/home/presentation/components/ProductCard';
import {
  ProductSectionBody,
  ProductSectionTitle,
} from '@/features/home/presentation/components/ProductSection';
import {
  DeviceRegionResult,
  loadDeviceRegion,
  loadProductRegion,
  MockDevice,
  MockProduct,
  ProductRegionResult,
} from '@/features/home/presentation/mocks/mockHome';

type DeviceState =
  | {status: Extract<RegionStatus, 'loading'>}
  | DeviceRegionResult;
type ProductState =
  | {status: Extract<RegionStatus, 'loading'>}
  | ProductRegionResult;
type ListItem = MockDevice | MockProduct;

// TODO: integration point — các đích chưa có màn (kết nối thiết bị, chi tiết thiết bị, chi tiết SP, giỏ, xem thêm, thử lại, thêm thiết bị)
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

  const connected = device.status === 'success';
  const items = products.status === 'success' ? products.items : [];
  const devices = connected ? device.data.devices : [];
  const listData: ListItem[] = connected ? devices : items;

  return (
    <View style={styles.container}>
      <FlatList
        numColumns={2}
        data={listData}
        keyExtractor={item => item.id}
        renderItem={({item}) =>
          'price' in item ? (
            <ProductCard
              product={item}
              onPress={noopTODO}
              onAddToCart={noopTODO}
            />
          ) : (
            <DeviceCard device={item} onPress={noopTODO} />
          )
        }
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
              data={connected ? device.data : undefined}
              onConnect={noopTODO}
              onRetry={noopTODO}
            />
            {connected ? <DeviceGridHeader /> : <ProductSectionTitle />}
          </>
        }
        ListEmptyComponent={
          connected ? undefined : (
            <ProductSectionBody status={products.status} onRetry={noopTODO} />
          )
        }
        ListFooterComponent={
          !connected && products.status === 'success' && items.length > 0 ? (
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
          ) : undefined
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/HomeScreen.test.tsx`
Expected: PASS (all tests, old and new)

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/screens/HomeScreen.tsx __tests__/HomeScreen.test.tsx
git commit -m "feat(home): swap product grid for device grid when connected"
```

---

### Task 7: Quality gates

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output (clean).

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Fix and commit if needed**

If any gate found issues, fix them and commit:

```bash
git add -A
git commit -m "fix(home): address quality gate findings"
```

If all gates were already clean, skip this step (no empty commit).
