# Component Showcase Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến HomeScreen thành catalog cuộn một màn hình demo tương tác đầy đủ 16 F-components của `src/shared`.

**Architecture:** Feature `home` (presentation-only) nhận thêm 6 file section trong `presentation/components/`, mỗi section tự chứa state của mình và render bên trong shell `FSection` dùng chung. HomeScreen chỉ compose Appbar + ScrollView. Không đụng `src/shared`, không thêm route.

**Tech Stack:** React Native 0.87, TypeScript, react-native-paper, react-test-renderer 19 (Jest 29, preset `@react-native/jest-preset`).

**Spec:** `docs/superpowers/specs/2026-09-11-component-showcase-home-design.md`

**Quy ước bắt buộc (theo AGENTS.md):**

- Màu chỉ qua `useTheme()` từ `@/core/theme`; pattern `createStyles(colors)` factory ở cuối file.
- Import F-components qua `@/shared` barrel. Prettier: `singleQuote`, `arrowParens: 'avoid'`, `bracketSpacing: false`, `bracketSameLine: true`, `trailingComma: 'all'` — code dưới đây đã đúng format, giữ nguyên.
- Không sửa file nào trong `src/shared`.
- API quirks phải giữ đúng hiện trạng: `FSwitch` chỉ nhận `status` (điều khiển từ ngoài), `FProgress.action` là chuỗi width, `FDialog` nội dung hardcoded, `FSlider` single-mode tự giữ value nội bộ, `FStepIndicator` prop tên là `lable` (không phải `labels`).
- Icon names đã xác minh tồn tại: `FFilled.c_check`, `FFilled.c_info`, `FFilled.c_remove`, `FFilled.search`, `FFilled.settings`, `FFilled.eye_on`, `FFilled.eye_off`, `FOutlined.close`, `FOutlined.arrown_left`, `FOutlined.arrown_right`.
- Token màu đã xác minh: `colors.success`, `colors.info`, `colors.error`, `colors.primary`, `colors.white`, `colors.border1`.

---

### Task 1: FSection shell

**Files:**

- Create: `src/features/home/presentation/components/FSection.tsx`

- [ ] **Step 1: Tạo file FSection.tsx**

```tsx
import React, {ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import FText from '@/shared/components/FText';

interface FSectionProps {
  title: string;
  testID: string;
  children: ReactNode;
}

const FSection: React.FC<FSectionProps> = ({title, testID, children}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View testID={testID} style={styles.section}>
      <FText typo="title2">{title}</FText>
      <View style={[styles.content, {borderColor: colors.border1}]}>
        {children}
      </View>
    </View>
  );
};

export default FSection;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    content: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      gap: 12,
      borderColor: colors.border1,
    },
  });
```

- [ ] **Step 2: Kiểm tra types**

Run: `npx tsc --noEmit`
Expected: không có output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/features/home/presentation/components/FSection.tsx
git commit -m "feat(home): add FSection shell"
```

---

### Task 2: TypographySection

**Files:**

- Create: `src/features/home/presentation/components/TypographySection.tsx`

- [ ] **Step 1: Tạo file TypographySection.tsx**

```tsx
import React from 'react';
import {StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {
  FFilled,
  FIcon,
  FIconButton,
  FOutlined,
  FText,
  FTooltip,
  useFSnackbar,
} from '@/shared';
import FSection from './FSection';

const TypographySection: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {showSnackbar} = useFSnackbar();
  const styles = createStyles(colors);

  return (
    <FSection title="Typography & Icons" testID="section-typography">
      <FText typo="largeTitle">largeTitle</FText>
      <FText typo="title1">title1</FText>
      <FText typo="title2">title2</FText>
      <FText typo="bodyText1">bodyText1</FText>
      <FText typo="bodyText2">bodyText2</FText>
      <FText typo="subtitle1">subtitle1</FText>
      <FText typo="buttonText1">buttonText1</FText>
      <FText typo="label1">label1</FText>
      <View style={styles.row}>
        <FIcon icon={FFilled.c_check} size={24} iconColor={colors.success} />
        <FIcon icon={FFilled.c_info} size={24} iconColor={colors.info} />
        <FIcon icon={FFilled.c_remove} size={24} iconColor={colors.error} />
        <FIcon icon={FFilled.search} size={24} />
        <FIcon icon={FFilled.settings} size={24} />
        <FIcon icon={FOutlined.close} size={24} />
        <FIcon
          icon={FOutlined.arrown_left}
          size={16}
          iconColor={colors.primary}
        />
        <FIcon
          icon={FOutlined.arrown_right}
          size={16}
          iconColor={colors.primary}
        />
      </View>
      <View style={styles.row}>
        <FIconButton
          icon={FFilled.settings}
          size={24}
          onPress={() =>
            showSnackbar('Bạn đã nhấn FIconButton', {type: 'info'})
          }
        />
        <FTooltip
          message="Đây là FTooltip"
          backgroundMess={colors.title}
          TextColor={colors.white}>
          <FText typo="bodyText1">Nhấn để xem tooltip</FText>
        </FTooltip>
      </View>
    </FSection>
  );
};

export default TypographySection;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
  });
```

- [ ] **Step 2: Kiểm tra types**

Run: `npx tsc --noEmit`
Expected: không có output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/features/home/presentation/components/TypographySection.tsx
git commit -m "feat(home): add typography section"
```

---

### Task 3: ButtonsSection

**Files:**

- Create: `src/features/home/presentation/components/ButtonsSection.tsx`

- [ ] **Step 1: Tạo file ButtonsSection.tsx**

FSwitch không có callback onPress và nội bộ `setIsEnabled(status)` — nên demo điều khiển qua state ngoài + nút Bật/Tắt (đúng hiện trạng API, không sửa shared).

```tsx
import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {
  FButtonSize,
  FFilledButton,
  FSwitch,
  FText,
  useFSnackbar,
} from '@/shared';
import FSection from './FSection';

const ButtonsSection: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {showSnackbar} = useFSnackbar();
  const [switchOn, setSwitchOn] = useState(false);
  const styles = createStyles(colors);

  const press = (name: string) => () =>
    showSnackbar(`Bạn đã nhấn ${name}`, {type: 'success'});

  return (
    <FSection title="Buttons & Switch" testID="section-buttons">
      <FFilledButton
        title="Primary size48"
        onPress={press('FFilledButton size48')}
      />
      <FFilledButton
        title="Small size40"
        size={FButtonSize.size40}
        onPress={press('FFilledButton size40')}
      />
      <FFilledButton
        title="Custom màu"
        backgroundColor={colors.success}
        onPress={press('FFilledButton custom')}
      />
      <View style={styles.row}>
        <FText typo="bodyText1">
          {switchOn ? 'FSwitch: Bật' : 'FSwitch: Tắt'}
        </FText>
        <FFilledButton
          title={switchOn ? 'Tắt' : 'Bật'}
          size={FButtonSize.size40}
          onPress={() => setSwitchOn(!switchOn)}
        />
        <FSwitch status={switchOn} />
      </View>
    </FSection>
  );
};

export default ButtonsSection;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
  });
```

- [ ] **Step 2: Kiểm tra types**

Run: `npx tsc --noEmit`
Expected: không có output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/features/home/presentation/components/ButtonsSection.tsx
git commit -m "feat(home): add buttons section"
```

---

### Task 4: InputsSection

**Files:**

- Create: `src/features/home/presentation/components/InputsSection.tsx`

- [ ] **Step 1: Tạo file InputsSection.tsx**

Lưu ý: `FTextInput` render hàng error khi `errorText?.trim() !== ''` — luôn truyền chuỗi (`''` khi hợp lệ), không truyền `undefined`.

```tsx
import React, {useState} from 'react';
import {FFilled, FIconButton, FTextInput, useFSnackbar} from '@/shared';
import FSection from './FSection';

const InputsSection: React.FC = () => {
  const {showSnackbar} = useFSnackbar();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [email, setEmail] = useState('email sai');

  return (
    <FSection title="Inputs" testID="section-inputs">
      <FTextInput
        label="Họ tên"
        value={name}
        onChangeText={setName}
        onClear={() => setName('')}
      />
      <FTextInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        onClear={() => setPassword('')}
        secureTextEntry={secure}
        rightIcon={
          <FIconButton
            icon={secure ? FFilled.eye_on : FFilled.eye_off}
            size={20}
            onPress={() => setSecure(!secure)}
          />
        }
      />
      <FTextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        onClear={() => setEmail('')}
        keyboardType="email-address"
        autoCapitalize="none"
        errorText={email.includes('@') ? '' : 'Email không hợp lệ'}
      />
      <FTextInput
        label="Chọn ngày"
        value="01/01/2026"
        onChangeText={() => undefined}
        onClear={() => undefined}
        readonly
        onPressIn={() => showSnackbar('Trường chỉ đọc', {type: 'info'})}
      />
    </FSection>
  );
};

export default InputsSection;
```

- [ ] **Step 2: Kiểm tra types**

Run: `npx tsc --noEmit`
Expected: không có output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/features/home/presentation/components/InputsSection.tsx
git commit -m "feat(home): add inputs section"
```

---

### Task 5: FeedbackSection

**Files:**

- Create: `src/features/home/presentation/components/FeedbackSection.tsx`

- [ ] **Step 1: Tạo file FeedbackSection.tsx**

```tsx
import React, {useState} from 'react';
import {
  FButtonSize,
  FFilledButton,
  FLoading,
  FProgress,
  FSlider,
  FStepIndicator,
  FText,
} from '@/shared';
import FSection from './FSection';

const FeedbackSection: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(0);
  const [rangeValue, setRangeValue] = useState<[number, number]>([20, 80]);
  const [step, setStep] = useState(0);

  return (
    <FSection title="Feedback" testID="section-feedback">
      <FText typo="title4">FLoading inline</FText>
      <FLoading visible={true} loadFullScreen={false} />
      <FProgress
        action="60%"
        contentTitle="Dung lượng đã dùng"
        value="0 GB"
        value1="60 GB"
      />
      <FText typo="title4">FSlider: {Math.round(sliderValue)}%</FText>
      <FSlider onValue={setSliderValue} />
      <FText typo="title4">
        {`Range: ${Math.round(rangeValue[0])} - ${Math.round(rangeValue[1])}`}
      </FText>
      <FSlider
        mode="Ranger"
        range={rangeValue}
        minValue={0}
        maxValue={100}
        onValueRanger={setRangeValue}
      />
      <FStepIndicator
        lable={['Đăng ký', 'Xác minh', 'Hoàn tất']}
        stepCount={3}
        currentPosition={step}
      />
      <FFilledButton
        title="Bước tiếp theo"
        size={FButtonSize.size40}
        onPress={() => setStep((step + 1) % 3)}
      />
    </FSection>
  );
};

export default FeedbackSection;
```

- [ ] **Step 2: Kiểm tra types**

Run: `npx tsc --noEmit`
Expected: không có output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/features/home/presentation/components/FeedbackSection.tsx
git commit -m "feat(home): add feedback section"
```

---

### Task 6: OverlaySection + barrel

**Files:**

- Create: `src/features/home/presentation/components/OverlaySection.tsx`
- Create: `src/features/home/presentation/components/index.ts`

- [ ] **Step 1: Tạo file OverlaySection.tsx**

```tsx
import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {
  FBottomSheet,
  FDialog,
  FExpansionPanel,
  FFilledButton,
  FButtonSize,
  FText,
  useFSnackbar,
} from '@/shared';
import FSection from './FSection';

const OverlaySection: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {showSnackbar} = useFSnackbar();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const styles = createStyles(colors);

  return (
    <FSection title="Overlays" testID="section-overlays">
      <FFilledButton
        title="Mở FBottomSheet"
        onPress={() => setSheetVisible(true)}
      />
      <FBottomSheet
        isVisible={sheetVisible}
        closeModal={() => setSheetVisible(false)}>
        <FText typo="bodyText1" style={styles.sheetText}>
          Nội dung FBottomSheet
        </FText>
        <FFilledButton
          title="Đóng sheet"
          onPress={() => setSheetVisible(false)}
        />
      </FBottomSheet>

      <FFilledButton
        title="Mở FDialog"
        onPress={() => setDialogVisible(true)}
      />
      <FDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
      />

      <FFilledButton
        title={
          panelExpanded ? 'Thu gọn FExpansionPanel' : 'Mở rộng FExpansionPanel'
        }
        onPress={() => setPanelExpanded(!panelExpanded)}
      />
      <FExpansionPanel expanded={panelExpanded} height1={0.15}>
        <View style={[styles.panel, {borderColor: colors.border1}]}>
          <FText typo="bodyText2">Nội dung bên trong FExpansionPanel</FText>
        </View>
      </FExpansionPanel>

      <View style={styles.row}>
        <FFilledButton
          title="Success"
          size={FButtonSize.size40}
          onPress={() => showSnackbar('Thành công', {type: 'success'})}
        />
        <FFilledButton
          title="Info"
          size={FButtonSize.size40}
          onPress={() => showSnackbar('Thông tin', {type: 'info'})}
        />
        <FFilledButton
          title="Fail"
          size={FButtonSize.size40}
          onPress={() => showSnackbar('Thất bại', {type: 'fail'})}
        />
      </View>
    </FSection>
  );
};

export default OverlaySection;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    sheetText: {
      marginTop: 16,
      marginBottom: 16,
    },
    panel: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      borderColor: colors.border1,
    },
  });
```

- [ ] **Step 2: Tạo barrel `components/index.ts`**

```ts
export {default as TypographySection} from './TypographySection';
export {default as ButtonsSection} from './ButtonsSection';
export {default as InputsSection} from './InputsSection';
export {default as FeedbackSection} from './FeedbackSection';
export {default as OverlaySection} from './OverlaySection';
```

- [ ] **Step 3: Kiểm tra types**

Run: `npx tsc --noEmit`
Expected: không có output (exit 0).

- [ ] **Step 4: Commit**

```bash
git add src/features/home/presentation/components/OverlaySection.tsx src/features/home/presentation/components/index.ts
git commit -m "feat(home): add overlays section and components barrel"
```

---

### Task 7: Test + HomeScreen rewrite (red → green)

**Files:**

- Create: `src/features/home/presentation/screens/HomeScreen.test.tsx`
- Modify: `src/features/home/presentation/screens/HomeScreen.tsx` (thay toàn bộ)

- [ ] **Step 1: Tạo test HomeScreen.test.tsx**

Mocks inline theo quy ước repo (không có jest setup file). Mock phải đủ cho toàn bộ tree: paper (Appbar/Dialog/Portal/Snackbar/ActivityIndicator/TextInput), modal, animatable (có `initializeRegistryWithDefinitions` vì FSwitch gọi nó), gesture-handler (có `TouchableWithoutFeedback` vì FSwitch dùng nó), tooltip, svg, slider (không nằm trong `transformIgnorePatterns`), spinkit, step-indicator, safe-area, AsyncStorage (ThemeProvider hydrate).

```tsx
import 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
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

jest.mock('react-native-svg', () => ({
  SvgXml: () => null,
}));

jest.mock('react-native-animated-spinkit', () => ({
  Pulse: () => null,
  Bounce: () => null,
}));

jest.mock('@react-native-assets/slider', () => ({
  Slider: () => null,
  RangeSlider: () => null,
}));

jest.mock('react-native-step-indicator', () => () => null);

jest.mock('react-native-paper', () => {
  const React = require('react');
  const pass = ({children}: any) => children;
  const view = ({children}: any) => React.createElement('View', null, children);
  const Dialog: any = view;
  Dialog.Title = view;
  Dialog.Content = view;
  Dialog.Actions = view;
  return {
    Appbar: {Header: view},
    Dialog,
    Portal: pass,
    Snackbar: view,
    ActivityIndicator: view,
    TextInput: view,
  };
});

import React from 'react';
import renderer, {ReactTestRenderer} from 'react-test-renderer';
import {ThemeProvider} from '@/core/theme';
import {FSnackbarProvider} from '@/shared';
import {HomeScreen} from './HomeScreen';

const renderHomeScreen = async () => {
  let tree!: ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(
      <ThemeProvider>
        <FSnackbarProvider>
          <HomeScreen />
        </FSnackbarProvider>
      </ThemeProvider>,
    );
  });
  return tree;
};

describe('HomeScreen showcase', () => {
  it('renders all showcase sections in order', async () => {
    const tree = await renderHomeScreen();
    const instances = tree.root.findAll(() => true);
    const position = (testID: string) =>
      instances.findIndex(node => node.props.testID === testID);
    const order = [
      'section-typography',
      'section-buttons',
      'section-inputs',
      'section-feedback',
      'section-overlays',
    ].map(position);
    order.forEach(index => expect(index).toBeGreaterThanOrEqual(0));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('renders the showcase appbar title', async () => {
    const tree = await renderHomeScreen();
    expect(
      tree.root.findAll(
        node =>
          typeof node.props.children === 'string' &&
          node.props.children.includes('F-Components Showcase'),
      ).length,
    ).toBeGreaterThan(0);
  });

  it('toggles FSwitch state via the demo button', async () => {
    const tree = await renderHomeScreen();
    const section = tree.root.findByProps({testID: 'section-buttons'});
    expect(section.findByProps({children: 'FSwitch: Tắt'})).toBeTruthy();

    const buttonText = section.findByProps({children: 'Bật'});
    const pressable = buttonText.parent;
    await renderer.act(async () => {
      pressable?.props.onPress();
    });

    expect(
      tree.root.findByProps({testID: 'section-buttons'}).findByProps({
        children: 'FSwitch: Bật',
      }),
    ).toBeTruthy();
  });
});
```

- [ ] **Step 2: Chạy test — phải FAIL (HomeScreen cũ chưa có sections)**

Run: `npx jest src/features/home --verbose`
Expected: FAIL — không tìm thấy `testID: 'section-typography'` (HomeScreen vẫn là bản cũ chỉ có 1 Text).

- [ ] **Step 3: Thay toàn bộ nội dung HomeScreen.tsx**

```tsx
import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar} from '@/shared';
import {
  ButtonsSection,
  FeedbackSection,
  InputsSection,
  OverlaySection,
  TypographySection,
} from '../components';

export const HomeScreen: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <FAppbar title="F-Components Showcase" noContent />
      <ScrollView contentContainerStyle={styles.content}>
        <TypographySection />
        <ButtonsSection />
        <InputsSection />
        <FeedbackSection />
        <OverlaySection />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    content: {
      paddingBottom: 32,
    },
  });
```

- [ ] **Step 4: Chạy test — phải PASS**

Run: `npx jest src/features/home --verbose`
Expected: PASS — 3 test pass (`renders all showcase sections in order`, `renders the showcase appbar title`, `toggles FSwitch state via the demo button`).

- [ ] **Step 5: Commit**

```bash
git add src/features/home/presentation/screens/HomeScreen.tsx src/features/home/presentation/screens/HomeScreen.test.tsx
git commit -m "feat(home): render component showcase on home screen"
```

---

### Task 8: Quality gates toàn repo

**Files:** không có file mới — chỉ chạy kiểm tra, sửa nếu lỗi.

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 2: Toàn bộ test suite**

Run: `npm test`
Expected: tất cả pass, không test nào fail (App.test vẫn pass vì HomeScreen mới render được trong tree — App.test đã mock đủ modal/paper/safe-area/animatable/tooltip; nếu App.test fail do thiếu mock `react-native-animated-spinkit`/`@react-native-assets/slider`/`react-native-step-indicator`, thêm chính 3 khối mock từ Task 7 Step 1 vào `__tests__/App.test.tsx` và commit kèm message `test: extend app test mocks for showcase`).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: 0 lỗi. Lỗi phổ biến nếu có: import không dùng — xóa dòng import tương ứng.

- [ ] **Step 4: Commit phần sửa (nếu có)**

```bash
git add -A
git commit -m "chore(home): fix quality gate findings"
```

(Nếu không có gì để sửa, bỏ qua bước này.)
