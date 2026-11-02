# Dark/Light Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai dark/light theme 3 chế độ (Light/Dark/System) cho RNCore — hạ tầng Context + persistence, refactor toàn bộ components/screens sang `useTheme()`, đồng bộ React Navigation + Paper + StatusBar, UI toggle ở AccountScreen.

**Architecture:** Nâng cấp `ThemeContext` thành state holder (`mode` + hydrate từ AsyncStorage), `DarkTheme` derive từ `FTheme`, theme resolve trong provider và truyền qua prop `theme` của `NavigationContainer`; mọi component dùng `useTheme()` thay import tĩnh `FTheme`. Zero dependency mới.

**Tech Stack:** React Native 0.87, TypeScript, React Navigation 7, react-native-paper 5, Redux Toolkit (không dùng cho theme), AsyncStorage, jest + react-test-renderer.

**Spec:** `docs/superpowers/specs/2026-09-05-dark-light-theme-design.md`

---

## File Structure

**Create:**

- `src/core/theme/DarkTheme.ts` — bảng màu tối
- `src/core/theme/themeUtils.ts` — pure functions: `ThemeMode`, `isThemeMode`, `resolveTheme`, `resolveIsDark`
- `src/core/theme/paperTheme.ts` — `buildPaperTheme(theme)` map sang Paper theme
- `__tests__/themeUtils.test.ts` — test resolve logic
- `__tests__/themeContext.test.tsx` — test hydrate + setMode

**Modify:**

- `src/core/constants/storageKeys.ts` — thêm `KEY_THEME_MODE`
- `src/core/theme/ThemeContext.tsx` — state holder, hydrate, resolve
- `src/core/theme/index.ts` — re-export mới
- `src/app/providers/AppProviders.tsx` — PaperProvider động
- `src/app/App.tsx` — ThemedApp: StatusBar + Appearance theo theme
- `src/app/navigation/RootNavigator.tsx` — `NavigationContainer theme`
- `src/features/account/presentation/screens/AccountScreen.tsx` — UI toggle 3 chế độ + refactor
- Refactor 11 shared components + `BottomNavigator.tsx` + `HomeScreen.tsx` + `LoginScreen.tsx`

---

### Task 1: themeUtils + storageKeys + unit tests

**Files:**

- Create: `src/core/theme/themeUtils.ts`
- Modify: `src/core/constants/storageKeys.ts`
- Test: `__tests__/themeUtils.test.ts`

- [ ] **Step 1: Thêm storage key**

Modify `src/core/constants/storageKeys.ts` — thêm dòng:

```ts
  IDCARD_INFO: (phone: string) => `idcard_info_${phone}`,
  KEY_THEME_MODE: 'theme_mode',
} as const;
```

- [ ] **Step 2: Viết test trước (failing)**

Create `__tests__/themeUtils.test.ts`:

```ts
import {
  isThemeMode,
  resolveIsDark,
  resolveTheme,
} from '@/core/theme/themeUtils';

describe('isThemeMode', () => {
  it('accepts valid modes', () => {
    expect(isThemeMode('light')).toBe(true);
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('system')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isThemeMode(null)).toBe(false);
    expect(isThemeMode(undefined)).toBe(false);
    expect(isThemeMode('blue')).toBe(false);
    expect(isThemeMode(1)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('dark mode always returns dark theme', () => {
    expect(resolveTheme('dark', 'light').dark).toBe(true);
    expect(resolveTheme('dark', 'dark').dark).toBe(true);
  });

  it('light mode always returns light theme', () => {
    expect(resolveTheme('light', 'dark').dark).toBe(false);
    expect(resolveTheme('light', 'light').dark).toBe(false);
  });

  it('system mode follows the scheme', () => {
    expect(resolveTheme('system', 'dark').dark).toBe(true);
    expect(resolveTheme('system', 'light').dark).toBe(false);
    expect(resolveTheme('system', null).dark).toBe(false);
  });
});

describe('resolveIsDark', () => {
  it('returns the same result as resolveTheme.dark', () => {
    expect(resolveIsDark('dark', 'light')).toBe(true);
    expect(resolveIsDark('light', 'dark')).toBe(false);
    expect(resolveIsDark('system', 'dark')).toBe(true);
    expect(resolveIsDark('system', 'light')).toBe(false);
    expect(resolveIsDark('system', null)).toBe(false);
  });
});
```

- [ ] **Step 3: Chạy test — xác nhận FAIL**

Run: `npx jest __tests__/themeUtils.test.ts`
Expected: FAIL — `Cannot find module '@/core/theme/themeUtils'`

- [ ] **Step 4: Viết themeUtils**

Create `src/core/theme/themeUtils.ts`:

```ts
import {ColorSchemeName} from 'react-native';
import {DefaultTheme} from '@react-navigation/native';
import FTheme from './FTheme';
import DarkTheme from './DarkTheme';

export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveTheme(
  mode: ThemeMode,
  scheme: ColorSchemeName,
): DefaultTheme {
  if (mode === 'dark') {
    return DarkTheme;
  }
  if (mode === 'light') {
    return FTheme;
  }
  return scheme === 'dark' ? DarkTheme : FTheme;
}

export function resolveIsDark(
  mode: ThemeMode,
  scheme: ColorSchemeName,
): boolean {
  if (mode === 'dark') {
    return true;
  }
  if (mode === 'light') {
    return false;
  }
  return scheme === 'dark';
}
```

(Lưu ý: import `DarkTheme` sẽ lỗi TS cho tới khi Task 2 xong — thứ tự thực thi tuần tự.)

- [ ] **Step 5: Chạy test — xác nhận PASS**

Run: `npx jest __tests__/themeUtils.test.ts`
Expected: PASS — 10 tests. (Nếu Task 2 chưa xong vẫn pass vì `DarkTheme` là module export default — jest cần file tồn tại; thực thi tuần tự nên làm Task 2 ngay sau.)

- [ ] **Step 6: Commit**

```bash
git add src/core/constants/storageKeys.ts src/core/theme/themeUtils.ts __tests__/themeUtils.test.ts
git commit -m "feat(theme): add theme mode utils and storage key"
```

---

### Task 2: DarkTheme

**Files:**

- Create: `src/core/theme/DarkTheme.ts`

- [ ] **Step 1: Viết DarkTheme**

Create `src/core/theme/DarkTheme.ts`:

```ts
import {DefaultTheme} from '@react-navigation/native';
import FTheme from './FTheme';

const darkFonts: DefaultTheme['fonts'] = Object.fromEntries(
  Object.entries(FTheme.fonts).map(([key, style]) => [
    key,
    {...style, color: '#F4F7FF'},
  ]),
) as DefaultTheme['fonts'];

export const DarkTheme: DefaultTheme = {
  ...DefaultTheme,
  dark: true,
  fonts: darkFonts,
  colors: {
    primary: '#366AE2',
    primarySub: '#6E93EE',
    primaryBackground: 'rgba(54, 106, 226, 0.16)',
    primaryBorder: 'rgba(77, 122, 229, 0.45)',

    secondary1: '#FC6B03',
    secondarySub1: '#FC8B3A',
    secondaryBackground1: 'rgba(252, 107, 3, 0.16)',
    secondaryBorder1: 'rgba(252, 107, 3, 0.45)',

    secondary2: '#3AAC6D',
    secondarySub2: '#3FBF79',
    secondaryBackground2: 'rgba(58, 172, 109, 0.16)',
    secondaryBorder2: 'rgba(58, 172, 109, 0.45)',

    secondary3: '#DEA821',
    secondarySub3: '#E1B137',
    secondaryBackground3: 'rgba(222, 168, 33, 0.16)',
    secondaryBorder3: 'rgba(222, 168, 33, 0.45)',

    secondary4: '#AC67E4',
    secondarySub4: '#BD82EA',
    secondaryBackground4: 'rgba(172, 103, 228, 0.16)',
    secondaryBorder4: 'rgba(172, 103, 228, 0.45)',

    border1: 'rgba(244, 247, 255, 0.08)',
    border2: 'rgba(244, 247, 255, 0.18)',

    info: '#4D7AE5',
    infoSub: '#6E93EE',
    infoBackground: 'rgba(54, 106, 226, 0.16)',
    infoBorder: 'rgba(77, 122, 229, 0.45)',

    success: '#4BC07F',
    successSub: '#57C98B',
    successBackground: 'rgba(58, 172, 109, 0.16)',
    successBorder: 'rgba(58, 172, 109, 0.45)',

    warning: '#FD7A1C',
    warningSub: '#FD8C3E',
    warningBackground: 'rgba(252, 107, 3, 0.16)',
    warningBorder: 'rgba(252, 107, 3, 0.45)',

    error: '#F05B52',
    errorSub: '#F27068',
    errorBackground: 'rgba(225, 67, 55, 0.16)',
    errorBorder: 'rgba(225, 67, 55, 0.45)',

    white: '#161C24',
    grey1: '#1E2630',
    grey2: '#2A3441',
    disable: '#3D4756',
    black: '#FFFFFF',

    placeHolder: 'rgba(244, 247, 255, 0.4)',
    subtitle: 'rgba(244, 247, 255, 0.6)',
    body: 'rgba(244, 247, 255, 0.8)',
    label: 'rgba(244, 247, 255, 0.9)',
    title: '#F4F7FF',

    background: '#161C24',
    card: '#161C24',
    text: '#F4F7FF',
    border: '#2A3441',
    notification: '#F05B52',
  },
};

export default DarkTheme;
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (0 errors).

- [ ] **Step 3: Commit**

```bash
git add src/core/theme/DarkTheme.ts
git commit -m "feat(theme): add DarkTheme palette"
```

---

### Task 3: ThemeContext — state holder + hydrate + persistence

**Files:**

- Modify: `src/core/theme/ThemeContext.tsx`
- Modify: `src/core/theme/index.ts`
- Test: `__tests__/themeContext.test.tsx`

- [ ] **Step 1: Viết test trước (failing)**

Create `__tests__/themeContext.test.tsx`:

```tsx
import 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer from 'react-test-renderer';
import {ThemeProvider, useTheme} from '@/core/theme';

let captured: ReturnType<typeof useTheme> | null = null;

const Probe = () => {
  captured = useTheme();
  return null;
};

const renderProbe = (props: {theme?: any} = {}) =>
  renderer.create(
    <ThemeProvider {...props}>
      <Probe />
    </ThemeProvider>,
  );

describe('ThemeProvider', () => {
  beforeEach(() => {
    captured = null;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('defaults to system mode when nothing is stored', async () => {
    await renderer.act(async () => {
      renderProbe();
    });
    expect(captured?.mode).toBe('system');
  });

  it('hydrates stored mode from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('"dark"');
    await renderer.act(async () => {
      renderProbe();
    });
    expect(captured?.mode).toBe('dark');
    expect(captured?.isDark).toBe(true);
  });

  it('falls back to system mode on invalid stored value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('"blue"');
    await renderer.act(async () => {
      renderProbe();
    });
    expect(captured?.mode).toBe('system');
  });

  it('persists the new mode when setMode is called', async () => {
    await renderer.act(async () => {
      renderProbe();
    });
    await renderer.act(async () => {
      captured?.setMode('light');
    });
    expect(captured?.mode).toBe('light');
    expect(captured?.isDark).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_mode', '"light"');
  });

  it('supports a fixed theme override', async () => {
    const {FTheme} = require('@/core/theme');
    await renderer.act(async () => {
      renderProbe({theme: FTheme});
    });
    expect(captured?.isDark).toBe(false);
  });
});
```

Lưu ý: `Storage.setItem` JSON.stringify('light') → `'"light"'`. `require('@/core/theme')` tránh import vòng FTheme trực tiếp ở đầu file.

- [ ] **Step 2: Chạy test — xác nhận FAIL**

Run: `npx jest __tests__/themeContext.test.tsx`
Expected: FAIL — ThemeContext cũ chưa có `mode`/`setMode`.

- [ ] **Step 3: Nâng cấp ThemeContext**

Replace toàn bộ nội dung `src/core/theme/ThemeContext.tsx`:

```tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {useColorScheme} from 'react-native';
import {DefaultTheme} from '@react-navigation/native';
import {Storage} from '@/core/utils/storage';
import FTheme from './FTheme';
import {
  isThemeMode,
  resolveIsDark,
  resolveTheme,
  ThemeMode,
} from './themeUtils';

export interface ThemeContextValue {
  theme: DefaultTheme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: FTheme,
  isDark: false,
  mode: 'system',
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Truyền theme tĩnh để fix một màn hình/subtree (mặc định: dynamic theo mode) */
  theme?: DefaultTheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme: fixedTheme,
}) => {
  const systemScheme = useColorScheme();
  const [modeState, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await Storage.getItem<ThemeMode>(Storage.KEY_THEME_MODE);
        if (mounted && isThemeMode(stored)) {
          setModeState(stored);
        }
      } catch (e) {
        console.error('[ThemeProvider] Failed to load theme mode:', e);
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    Storage.setItem(Storage.KEY_THEME_MODE, next).catch(e =>
      console.error('[ThemeProvider] Failed to persist theme mode:', e),
    );
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    if (fixedTheme) {
      return {
        theme: fixedTheme,
        isDark: fixedTheme.dark,
        mode: modeState,
        setMode,
      };
    }
    return {
      theme: resolveTheme(modeState, systemScheme),
      isDark: resolveIsDark(modeState, systemScheme),
      mode: modeState,
      setMode,
    };
  }, [fixedTheme, modeState, systemScheme, setMode]);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
```

- [ ] **Step 4: Cập nhật index.ts**

Replace toàn bộ nội dung `src/core/theme/index.ts`:

```ts
export * from './FTheme';
export {default as FTheme} from './FTheme';
export {default as DarkTheme} from './DarkTheme';
export * from './themeUtils';
export * from './ThemeContext';
```

- [ ] **Step 5: Chạy toàn bộ test**

Run: `npx jest __tests__/themeContext.test.tsx __tests__/themeUtils.test.ts`
Expected: FAIL còn sót — `DarkTheme` typecheck tạm thời (jest dùng babel không typecheck). Nếu runtime lỗi do `@/core/theme` chưa export DarkTheme — kiểm tra index.ts đã cập nhật. Bước này bắt buộc PASS trước khi sang Task 4.

- [ ] **Step 6: Commit**

```bash
git add src/core/theme/ThemeContext.tsx src/core/theme/index.ts __tests__/themeContext.test.tsx
git commit -m "feat(theme): upgrade ThemeContext with mode state, hydration, persistence"
```

---

### Task 4: Refactor FText

**Files:**

- Modify: `src/shared/components/FText.tsx`

- [ ] **Step 1: Sửa FText sang useTheme**

Replace toàn bộ nội dung `src/shared/components/FText.tsx`:

```tsx
import React from 'react';
import {Text, TextStyle} from 'react-native';
import FTheme from '../styles/FTheme';
import {useTheme} from '@/core/theme';

interface FTextProps {
  typo: keyof typeof FTheme.fonts;
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number | undefined;
  color?: string;
}

const FText: React.FC<FTextProps> = ({
  typo,
  children,
  style,
  numberOfLines,
  color,
}) => {
  const {theme} = useTheme();
  const typoStyle = theme.fonts[typo];

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        typoStyle,
        {
          color: color ?? theme.colors.title,
        },
        style,
      ]}>
      {children}
    </Text>
  );
};

export default FText;
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → PASS.
Run: `npx jest` → tất cả test PASS (App.test renderer vẫn hoạt động với ThemeProvider mới — ThemeProvider có thể trả null ngắn nhưng act/effect đã flush).

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/FText.tsx
git commit -m "refactor(theme): FText consumes useTheme"
```

---

### Task 5: Refactor FIcon + FIconButton

**Files:**

- Modify: `src/shared/components/FIcon.tsx`
- Modify: `src/shared/components/FIconButton.tsx`

- [ ] **Step 1: Sửa FIcon**

Replace toàn bộ nội dung `src/shared/components/FIcon.tsx`:

```tsx
import React from 'react';
import {SvgXml} from 'react-native-svg';
import {useTheme} from '@/core/theme';

interface FIconProps {
  icon: string;
  iconColor?: string;
  size?: number;
}

const FIcon: React.FC<FIconProps> = ({icon, iconColor, size}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const color = iconColor ?? colors.subtitle;
  const modifiedColor = icon.replaceAll('"black"', '"' + color + '"');

  return <SvgXml xml={modifiedColor} width={size} height={size} />;
};

export default FIcon;
```

- [ ] **Step 2: Sửa FIconButton**

Replace toàn bộ nội dung `src/shared/components/FIconButton.tsx`:

```tsx
import React from 'react';
import {IconButton} from 'react-native-paper';
import {SvgXml} from 'react-native-svg';
import {useTheme} from '@/core/theme';

interface FIconButtonProps {
  icon: string;
  onPress?: () => void;
  iconColor?: string;
  size?: number;
  disabled?: boolean;
}

const FIconButton: React.FC<FIconButtonProps> = ({
  icon,
  onPress,
  iconColor,
  size,
  disabled = false,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const color = iconColor ?? colors.subtitle;
  const modifiedColor = icon.replaceAll('fill="black"', 'fill="' + color + '"');

  return (
    <IconButton
      icon={() => <SvgXml xml={modifiedColor} width={size} height={size} />}
      iconColor={color}
      size={size}
      disabled={disabled}
      onPress={onPress}
      rippleColor={colors.border1}
    />
  );
};

export default FIconButton;
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → PASS. Run: `npx jest` → PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/components/FIcon.tsx src/shared/components/FIconButton.tsx
git commit -m "refactor(theme): FIcon and FIconButton consume useTheme"
```

---

### Task 6: Refactor FFilledButton

**Files:**

- Modify: `src/shared/components/FFilledButton.tsx`

- [ ] **Step 1: Sửa FFilledButton**

Replace toàn bộ nội dung `src/shared/components/FFilledButton.tsx`:

```tsx
import React from 'react';
import {TouchableOpacity, Text, ViewStyle, TextStyle} from 'react-native';
import FButtonSize, {FButtonSizeProps} from '../styles/FButtonSize';
import FTheme from '../styles/FTheme';
import {useTheme} from '@/core/theme';

interface FFilledButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: FButtonSizeProps;
  backgroundColor?: string;
  textColor?: string;
}

const FFilledButton: React.FC<FFilledButtonProps> = ({
  title,
  onPress,
  style,
  size = FButtonSize.size48,
  textStyle = FTheme.fonts.buttonText1,
  backgroundColor,
  textColor,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const bgColor = backgroundColor ?? colors.primary;
  const fgColor = textColor ?? colors.white;

  return (
    <TouchableOpacity
      style={[
        {
          height: size.height,
          backgroundColor: bgColor,
          borderRadius: size.borderRadius,
          padding: size.padding,
        },
        style,
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

export default FFilledButton;
```

(Giữ `textStyle = FTheme.fonts.buttonText1` tĩnh — font giống nhau ở cả 2 theme.)

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/shared/components/FFilledButton.tsx
git commit -m "refactor(theme): FFilledButton consumes useTheme"
```

---

### Task 7: Refactor FLoading + FProgress

**Files:**

- Modify: `src/shared/components/FLoading.tsx`
- Modify: `src/shared/components/FProgress.tsx`

- [ ] **Step 1: Sửa FLoading — chỉ thay 2 dòng màu**

Trong `src/shared/components/FLoading.tsx`:

- Dòng 4: `import FTheme from '../styles/FTheme';` → `import {useTheme} from '@/core/theme';`
- Dòng 15: chữ ký component → trở thành function block (component hiện là arrow trả về trực tiếp). Replace toàn bộ file:

```tsx
import React from 'react';
import {Dialog, Portal, ActivityIndicator} from 'react-native-paper';
import {Pulse, Bounce} from 'react-native-animated-spinkit';
import {useTheme} from '@/core/theme';
import {SvgXml} from 'react-native-svg';
import {View} from 'react-native';

const avatar =
  '<svg width="57" height="57" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="28" fill="white"/><defs><radialGradient id="paint0_radial_5869_24798" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(45.655 11.7372) scale(46.4516 46.4616)"><stop stop-color="#54D5FF"/><stop offset="1" stop-color="#2700FF"/></radialGradient><radialGradient id="paint1_radial_5869_24798" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(45.655 11.7372) scale(46.4516 46.4616)"><stop stop-color="#54D5FF"/><stop offset="1" stop-color="#2700FF"/></radialGradient><radialGradient id="paint2_radial_5869_24798" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(45.655 11.7372) scale(46.4516 46.4616)"><stop stop-color="#54D5FF"/><stop offset="1" stop-color="#2700FF"/></radialGradient></defs><path d="M44.8861 18.8227H14.449C14.449 14.9986 17.5275 11.9194 21.3507 11.9194H44.8861V18.8227Z" fill="url(#paint0_radial_5869_24798)"/><path d="M44.8861 44.3993H21.3507C17.5275 44.3993 14.449 41.3202 14.449 37.4961H44.8861V44.3993Z" fill="url(#paint1_radial_5869_24798)"/><path d="M39.4244 31.6358H12.0657C10.1789 31.6358 8.63965 30.0962 8.63965 28.209C8.63965 26.3218 10.1789 24.7822 12.0657 24.7822H39.4244V31.6358Z" fill="url(#paint2_radial_5869_24798)"/></svg>';

interface FLoadingProps {
  visible: boolean;
  loadFullScreen?: boolean;
}

const FLoading: React.FC<FLoadingProps> = ({
  visible,
  loadFullScreen = true,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return loadFullScreen ? (
    <Portal>
      <Dialog
        visible={visible}
        dismissable={false}
        style={{
          height: 0,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: 'transparent',
        }}>
        <Dialog.Content
          style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Pulse
            size={150}
            color={colors.primary}
            style={{position: 'absolute'}}></Pulse>
          <Bounce
            size={80}
            color="rgba(54, 106, 226, 0.6)"
            style={{position: 'absolute'}}></Bounce>
          <ActivityIndicator
            size={60}
            color={colors.primary}
            style={{position: 'absolute'}}
          />
          <SvgXml
            xml={avatar}
            width={50}
            height={50}
            style={{position: 'absolute'}}
          />
        </Dialog.Content>
      </Dialog>
    </Portal>
  ) : (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Pulse
        size={150}
        color={colors.primary}
        style={{position: 'absolute'}}></Pulse>
      <Bounce
        size={80}
        color="rgba(54, 106, 226, 0.6)"
        style={{position: 'absolute'}}></Bounce>
      <ActivityIndicator
        size={60}
        color={colors.primary}
        style={{position: 'absolute'}}
      />
      <SvgXml
        xml={avatar}
        width={50}
        height={50}
        style={{position: 'absolute'}}
      />
    </View>
  );
};

export default FLoading;
```

- [ ] **Step 2: Sửa FProgress**

Replace toàn bộ nội dung `src/shared/components/FProgress.tsx` — thay `FTheme.colors.*` bằng `colors.*` từ `useTheme()`, thay `'#F3F3F3'` (track) bằng `colors.grey1`:

```tsx
import React from 'react';
import {View, ViewStyle, Text, TouchableOpacity} from 'react-native';
import {useTheme} from '@/core/theme';
import FText from './FText';

interface FProgressProps {
  iconLeft?: any;
  iconRight?: any;
  action: any;
  colorAction?: string;
  contentTitle?: string;
  TextActionView?: string;
  value?: string;
  value1?: string;
  style?: ViewStyle;
}

const FProgress: React.FC<FProgressProps> = ({
  iconLeft,
  iconRight,
  action,
  colorAction,
  contentTitle,
  TextActionView,
  value,
  value1,
  style,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <View
      style={{
        padding: 5,
        paddingHorizontal: 15,
        backgroundColor: colors.white,
      }}>
      <View style={{flexDirection: 'row', paddingVertical: 2}}>
        <View style={{flex: 1}}>
          {contentTitle !== undefined && (
            <FText typo="title4">{contentTitle}</FText>
          )}
        </View>
        <TouchableOpacity style={{flex: 1, alignItems: 'flex-end'}}>
          {TextActionView !== undefined && (
            <FText typo="buttonText2">{TextActionView}</FText>
          )}
        </TouchableOpacity>
      </View>
      {iconLeft && iconRight ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 4,
          }}>
          <View>{iconLeft !== undefined && iconLeft}</View>
          <View
            style={[
              {
                flex: 1,
                backgroundColor: colors.grey1,
                borderRadius: 8,
                height: 10,
                marginHorizontal: 10,
              },
              style,
            ]}>
            <Text
              style={{
                width: action,
                backgroundColor: colorAction ? colorAction : colors.primary,
                borderRadius: 8,
              }}></Text>
          </View>
          <View>{iconRight !== undefined && iconRight}</View>
        </View>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 4,
          }}>
          <View>
            <FText typo="title6">{value}</FText>
          </View>
          <View
            style={[
              {
                flex: 1,
                backgroundColor: colors.grey1,
                borderRadius: 8,
                height: 10,
                marginHorizontal: 10,
              },
              style,
            ]}>
            <Text
              style={{
                width: action,
                backgroundColor: colorAction ? colorAction : colors.primary,
                borderRadius: 8,
              }}></Text>
          </View>
          <View>
            <FText typo="title6">{value1}</FText>
          </View>
        </View>
      )}

      {value && value1 && iconLeft && iconRight && (
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1}}>
            <FText typo="title6">{value}</FText>
          </View>
          <View style={{flex: 1, alignItems: 'flex-end'}}>
            <FText typo="title6">{value1}</FText>
          </View>
        </View>
      )}
    </View>
  );
};

export default FProgress;
```

- [ ] **Step 3: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/shared/components/FLoading.tsx src/shared/components/FProgress.tsx
git commit -m "refactor(theme): FLoading and FProgress consume useTheme"
```

---

### Task 8: Refactor FSlider

**Files:**

- Modify: `src/shared/components/FSlider.tsx`

- [ ] **Step 1: Sửa FSlider**

Replace toàn bộ nội dung `src/shared/components/FSlider.tsx` — chỉ các chỗ màu động hoá:

```tsx
import React from 'react';
import {View, ViewStyle, TouchableOpacity} from 'react-native';
import {RangeSlider, Slider} from '@react-native-assets/slider';
import {useTheme} from '@/core/theme';
import FText from './FText';

interface FSliderProps {
  inboundColor?: string;
  mode?: 'Ranger';
  iconLeft?: any;
  iconRight?: any;
  contentTitle?: string;
  TextActionView?: string;
  value?: string;
  onValueRanger?: (value: [number, number]) => void;
  value1?: string;
  style?: ViewStyle;
  range: [number, number];
  minValue?: number;
  maxValue?: number;
  onValue?: (value: number) => void;
}

const FSlider: React.FC<FSliderProps> = ({
  inboundColor,
  mode,
  iconLeft,
  iconRight,
  contentTitle,
  TextActionView,
  value,
  value1,
  style,
  minValue,
  maxValue,
  range,
  onValueRanger,
  onValue,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const trackColor = colors.grey1;
  const thumbBg = colors.white;

  return (
    <View style={{backgroundColor: colors.white}}>
      {mode ? (
        <View
          style={{
            padding: 5,
            paddingHorizontal: 15,
            backgroundColor: colors.white,
          }}>
          {contentTitle && TextActionView && (
            <View style={{flexDirection: 'row', paddingVertical: 2}}>
              <View style={{flex: 1}}>
                {contentTitle !== undefined && (
                  <FText typo="title4">{contentTitle}</FText>
                )}
              </View>
              <TouchableOpacity style={{flex: 1, alignItems: 'flex-end'}}>
                {TextActionView !== undefined && (
                  <FText typo="buttonText2">{TextActionView}</FText>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: contentTitle && TextActionView ? 5 : 2,
            }}>
            <View>{iconLeft !== undefined && iconLeft}</View>
            <View style={[{flex: 1, marginHorizontal: 20}, style]}>
              <RangeSlider
                range={range}
                minimumValue={minValue}
                maximumValue={maxValue}
                step={0}
                minimumRange={0}
                crossingAllowed={false}
                outboundColor={trackColor}
                inboundColor={
                  inboundColor !== undefined ? inboundColor : colors.primary
                }
                thumbTintColor="red"
                thumbStyle={{
                  borderColor: '#096DD9',
                  backgroundColor: thumbBg,
                  borderWidth: 1,
                }}
                trackStyle={{height: 8}}
                vertical={false}
                inverted={false}
                enabled={true}
                trackHeight={4}
                thumbSize={20}
                slideOnTap={true}
                onValueChange={range => onValueRanger && onValueRanger(range)}
              />
            </View>

            <View>{iconRight !== undefined && iconRight}</View>
          </View>
          {value && value1 && (
            <View style={{flexDirection: 'row', paddingHorizontal: 10}}>
              <View style={{flex: 1}}>
                <FText typo="title6">{range[0]}</FText>
              </View>
              <View style={{flex: 1, alignItems: 'flex-end'}}>
                <FText typo="title6">{range[1]}</FText>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View
          style={{
            padding: 5,
            paddingHorizontal: 15,
            backgroundColor: colors.white,
          }}>
          {contentTitle && TextActionView && (
            <View style={{flexDirection: 'row', paddingVertical: 2}}>
              <View>
                {contentTitle !== undefined && (
                  <FText typo="title4">{contentTitle}</FText>
                )}
              </View>
              <TouchableOpacity style={{flex: 1, alignItems: 'flex-end'}}>
                {TextActionView !== undefined && (
                  <FText typo="buttonText2">{TextActionView}</FText>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginVertical: 10,
            }}>
            <View>{iconLeft !== undefined && iconLeft}</View>
            <View style={[{flex: 1, marginHorizontal: 20}, style]}>
              <Slider
                value={0.2}
                minimumValue={0}
                maximumValue={100}
                step={0}
                minimumTrackTintColor={
                  inboundColor !== undefined ? inboundColor : colors.primary
                }
                maximumTrackTintColor={trackColor}
                thumbTintColor="darkcyan"
                thumbStyle={{
                  borderColor: '#096DD9',
                  backgroundColor: thumbBg,
                  borderWidth: 1,
                }}
                trackStyle={{height: 8, borderRadius: 4}}
                vertical={false}
                inverted={false}
                enabled={true}
                trackHeight={4}
                thumbSize={20}
                slideOnTap={true}
                onValueChange={value => onValue && onValue(value)}
              />
            </View>

            <View>{iconRight !== undefined && iconRight}</View>
          </View>
          {value && value1 && (
            <View style={{flexDirection: 'row', paddingLeft: 10}}>
              <View style={{flex: 1}}>
                <FText typo="title6">0%</FText>
              </View>
              <View style={{flex: 1, alignItems: 'flex-end'}}>
                <FText typo="title6">100%</FText>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default FSlider;
```

(Đã bỏ các prop `undefined` thừa `minTrackStyle`/`midTrackStyle`/`maxTrackStyle`/`thumbImage`/`onSlidingStart`/`onSlidingComplete` — giá trị mặc định sẵn có; behavior giữ nguyên.)

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/shared/components/FSlider.tsx
git commit -m "refactor(theme): FSlider consumes useTheme"
```

---

### Task 9: Refactor FAppbar

**Files:**

- Modify: `src/shared/components/FAppbar.tsx`

- [ ] **Step 1: Sửa FAppbar**

Replace toàn bộ nội dung `src/shared/components/FAppbar.tsx`:

```tsx
import {View, ViewStyle} from 'react-native';
import React from 'react';
import {Appbar} from 'react-native-paper';
import {useTheme} from '@/core/theme';
import FIconButton from './FIconButton';
import {FOutlined} from '../styles/FIconStyles';
import FText from './FText';

interface FAppbarProps {
  icon?: string;
  onBack?: () => void;
  noContent?: boolean;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
  toolbarHeight?: number;
  backColor?: string;
  trailling?: React.ReactNode;
  customizeTitle?: React.ReactNode;
}

const FAppbar: React.FC<FAppbarProps> = ({
  icon = FOutlined.close,
  onBack,
  noContent = false,
  style,
  title,
  subtitle,
  toolbarHeight = 48,
  backColor,
  trailling,
  customizeTitle,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <Appbar.Header
      style={[
        {
          backgroundColor: colors.white,
          padding: 0,
          height: toolbarHeight,
          elevation: 0,
          justifyContent: trailling != null ? 'space-between' : undefined,
        },
        style,
      ]}>
      {!noContent && (
        <FIconButton
          icon={icon}
          size={24}
          onPress={onBack}
          iconColor={backColor ?? colors.subtitle}
        />
      )}

      {(title !== undefined || subtitle !== undefined) && (
        <View style={{paddingLeft: 12}}>
          <FText style={{color: colors.title}} typo="title1">
            {title}
          </FText>
          <FText style={{color: colors.title}} typo="subtitle2">
            {subtitle}
          </FText>
        </View>
      )}

      {customizeTitle && <>{customizeTitle}</>}

      <View style={{alignItems: 'flex-end'}}>{trailling}</View>
    </Appbar.Header>
  );
};

export default FAppbar;
```

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/shared/components/FAppbar.tsx
git commit -m "refactor(theme): FAppbar consumes useTheme"
```

---

### Task 10: Refactor FSnackbar

**Files:**

- Modify: `src/shared/components/FSnackbar.tsx`

- [ ] **Step 1: Sửa FSnackbar**

Replace toàn bộ nội dung `src/shared/components/FSnackbar.tsx` — thay `FTheme.colors.*` bằng `colors.*`:

```tsx
import React from 'react';
import {Platform, View} from 'react-native';
import {Snackbar} from 'react-native-paper';
import {FFilled} from '../styles/FIconStyles';
import {useTheme} from '@/core/theme';
import FIcon from './FIcon';
import Modal from 'react-native-modal';
import FText from './FText';

interface FSnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  type: 'fail' | 'success' | 'info';
  paddingBottom?: number;
}

const FSnackbar: React.FC<FSnackbarProps> = ({
  visible,
  message,
  onDismiss,
  type,
  paddingBottom = 16,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onDismiss}
      backdropColor={colors.title}
      backdropOpacity={0.8}
      coverScreen={false}
      hasBackdrop={false}
      style={{justifyContent: 'flex-end', margin: 0}}>
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        style={{
          backgroundColor:
            type === 'fail'
              ? colors.error
              : type === 'info'
              ? colors.info
              : colors.success,
          marginHorizontal: 16,
          marginBottom: paddingBottom,
          borderRadius: 8,
          ...Platform.select({
            ios: {
              paddingTop: 4,
            },
          }),
          opacity: 1,
        }}
        duration={2500}>
        {Platform.OS == 'ios' ? (
          <View style={{flexDirection: 'row', paddingRight: 16}}>
            <FIcon
              icon={
                type === 'fail'
                  ? FFilled.c_remove
                  : type === 'info'
                  ? FFilled.c_info
                  : FFilled.c_check
              }
              size={24}
              iconColor={colors.white}
            />
            <FText
              typo="bodyText2"
              style={{color: colors.white, paddingLeft: 12}}>
              {message}
            </FText>
          </View>
        ) : (
          <FText
            typo="bodyText2"
            style={{color: colors.white, paddingLeft: 12}}>
            {message}
          </FText>
        )}
      </Snackbar>
    </Modal>
  );
};

export default FSnackbar;
```

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/shared/components/FSnackbar.tsx
git commit -m "refactor(theme): FSnackbar consumes useTheme"
```

---

### Task 11: Refactor FBottmSheet

**Files:**

- Modify: `src/shared/components/FBottmSheet.tsx`

- [ ] **Step 1: Sửa FBottmSheet**

Replace toàn bộ nội dung `src/shared/components/FBottmSheet.tsx` — `styles` module-level chuyển thành `createStyles(colors)`:

```tsx
import React, {ReactNode} from 'react';
import {View, StyleSheet, ViewStyle, StatusBar} from 'react-native';
import Modal from 'react-native-modal';
import {ActivityIndicator} from 'react-native-paper';
import {useTheme} from '@/core/theme';
import {Pulse, Bounce} from 'react-native-animated-spinkit';
import {SvgXml} from 'react-native-svg';
import {ColorsProps} from '@/core/theme';

const avatar =
  '<svg width="57" height="57" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="28" fill="white"/><defs><radialGradient id="paint0_radial_5869_24798" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(45.655 11.7372) scale(46.4516 46.4616)"><stop stop-color="#54D5FF"/><stop offset="1" stop-color="#2700FF"/></radialGradient><radialGradient id="paint1_radial_5869_24798" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(45.655 11.7372) scale(46.4516 46.4616)"><stop stop-color="#54D5FF"/><stop offset="1" stop-color="#2700FF"/></radialGradient><radialGradient id="paint2_radial_5869_24798" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(45.655 11.7372) scale(46.4516 46.4616)"><stop stop-color="#54D5FF"/><stop offset="1" stop-color="#2700FF"/></radialGradient></defs><path d="M44.8861 18.8227H14.449C14.449 14.9986 17.5275 11.9194 21.3507 11.9194H44.8861V18.8227Z" fill="url(#paint0_radial_5869_24798)"/><path d="M44.8861 44.3993H21.3507C17.5275 44.3993 14.449 41.3202 14.449 37.4961H44.8861V44.3993Z" fill="url(#paint1_radial_5869_24798)"/><path d="M39.4244 31.6358H12.0657C10.1789 31.6358 8.63965 30.0962 8.63965 28.209C8.63965 26.3218 10.1789 24.7822 12.0657 24.7822H39.4244V31.6358Z" fill="url(#paint2_radial_5869_24798)"/></svg>';

interface FBottomSheetProps {
  isVisible: boolean;
  isLoading?: boolean;
  closeModal: () => void;
  children: ReactNode;
  style?: ViewStyle;
}

const FBottomSheet: React.FC<FBottomSheetProps> = ({
  isVisible,
  closeModal,
  children,
  style,
  isLoading = false,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <>
      <StatusBar
        {...({
          backgroundColor: isVisible ? 'rgba(0, 32, 77, 0.8)' : undefined,
        } as any)}
      />
      <Modal
        avoidKeyboard={true}
        isVisible={isVisible}
        onBackdropPress={isLoading ? undefined : closeModal}
        onSwipeComplete={isLoading ? undefined : closeModal}
        backdropColor={colors.title}
        backdropOpacity={0.8}
        swipeDirection={isLoading ? undefined : 'down'}
        style={{justifyContent: 'flex-end', margin: 0}}>
        <View
          pointerEvents={isLoading ? 'none' : 'auto'}
          style={[
            styles.container,
            style,
            {justifyContent: 'center', alignItems: 'center'},
          ]}>
          <View style={{width: '100%', alignItems: 'center'}}>
            <View style={styles.dotBTS}></View>
          </View>
          {children}
          {isLoading ? (
            <>
              <Pulse
                size={150}
                color={colors.primary}
                style={{position: 'absolute'}}></Pulse>
              <Bounce
                size={80}
                color="rgba(54, 106, 226, 0.6)"
                style={{position: 'absolute'}}></Bounce>
              <ActivityIndicator
                size={60}
                color={colors.primary}
                style={{position: 'absolute'}}
              />
              <SvgXml
                xml={avatar}
                width={50}
                height={50}
                style={{position: 'absolute'}}
              />
            </>
          ) : null}
        </View>
      </Modal>
    </>
  );
};

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      borderTopRightRadius: 12,
      borderTopLeftRadius: 12,
      backgroundColor: colors.white,
    },
    dotBTS: {
      width: 32,
      height: 4,
      backgroundColor: colors.grey2,
      alignItems: 'center',
      borderRadius: 8,
      marginBottom: 4,
      marginTop: 8,
    },
  });

export default FBottomSheet;
```

(Lưu ý thay `'#EAEAEA'` ở `dotBTS` → `colors.grey2`.)

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/shared/components/FBottmSheet.tsx
git commit -m "refactor(theme): FBottmSheet consumes useTheme"
```

---

### Task 12: Refactor FTextInput

**Files:**

- Modify: `src/shared/components/FTextInput.tsx`

- [ ] **Step 1: Sửa FTextInput**

Replace toàn bộ nội dung `src/shared/components/FTextInput.tsx` — thay `FTheme.colors.*` bên trong JSX bằng `colors.*` + `theme` của Paper bằng `buildPaperTheme`-style inline:

```tsx
import React from 'react';
import {
  ViewStyle,
  TextStyle,
  View,
  KeyboardTypeOptions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {FButtonSizeProps} from '../styles/FButtonSize';
import FInputSize from '../styles/FInputSize';
import FTheme from '../styles/FTheme';
import {useTheme} from '@/core/theme';
import FIconButton from './FIconButton';
import FText from './FText';
import {FFilled} from '../styles/FIconStyles';

interface FTextInputProps {
  readonly?: boolean;
  label: string;
  value: string;
  rightIcon?: React.ReactNode;
  onFocus?: () => void;
  onClear: () => void;
  onPressIn?: () => void;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: FButtonSizeProps;
  errorText?: string;
  secureTextEntry?: boolean;
  showHelperButton?: boolean;
  helperButton?: React.ReactNode;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' | undefined;
}

const FTextInput: React.FC<FTextInputProps> = ({
  readonly = false,
  label,
  value,
  onFocus,
  onClear,
  onChangeText,
  onPressIn,
  style,
  rightIcon,
  size = FInputSize.size56,
  textStyle = FTheme.fonts.bodyText1,
  errorText,
  secureTextEntry = false,
  showHelperButton = false,
  helperButton,
  keyboardType = 'default',
  autoCapitalize,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const [isFocused, setIsFocused] = React.useState(false);
  const buildClearIcon = (
    <View style={{width: rightIcon ? 36 : null}}>
      <FIconButton
        icon={FFilled.c_remove}
        size={16}
        onPress={() => {
          value = '';
          if (onClear) onClear();
        }}
      />
    </View>
  );
  return (
    <TouchableOpacity
      onPress={readonly ? onPressIn : undefined}
      disabled={!readonly}>
      <View pointerEvents={readonly ? 'none' : undefined}>
        <View
          style={[
            {
              width: '100%',
              borderRadius: size.borderRadius,
              flexDirection: 'row',
              borderWidth: 1,
              alignItems: 'center',
              backgroundColor: colors.white,
              borderColor: errorText
                ? colors.error
                : isFocused
                ? colors.primary
                : colors.border1,
            },
            style,
          ]}>
          <TextInput
            label={errorText && value?.trim()?.length > 0 ? '' : label}
            onFocus={() => {
              if (onFocus) onFocus();
              setIsFocused(true);
            }}
            keyboardType={keyboardType}
            onBlur={() => {
              setIsFocused(false);
            }}
            style={{
              flex: 1,
              width: '100%',
              height: size.height,
              backgroundColor: colors.white,
              borderTopLeftRadius: size.borderRadius,
              borderTopRightRadius: size.borderRadius,
              borderBottomLeftRadius: size.borderRadius,
              borderBottomRightRadius: size.borderRadius,
              fontSize: textStyle.fontSize,
              fontWeight: textStyle.fontWeight,
            }}
            value={value}
            autoCapitalize={autoCapitalize}
            cursorColor={colors.label}
            underlineColor="transparent"
            onChangeText={text => {
              onChangeText(text);
              value = text;
            }}
            onPressIn={() => {
              if (onPressIn) onPressIn();
            }}
            secureTextEntry={secureTextEntry}
            textColor={colors.label}
            selectionColor={
              Platform.OS == 'ios' ? colors.primary : colors.primaryBorder
            }
            theme={{
              colors: {
                text: colors.label,
                primary: colors.primary,
                placeholder: colors.placeHolder,
                onSurfaceVariant: colors.placeHolder,
              },
            }}
          />

          {readonly
            ? buildClearIcon
            : isFocused && value?.trim()?.length > 0
            ? buildClearIcon
            : null}
          {rightIcon ? rightIcon : null}
        </View>
        {errorText?.trim() !== '' || showHelperButton == true ? (
          <View
            style={{
              flexDirection: 'row',
            }}>
            <FText
              style={{
                flex: 1,
                color: colors.error,
                paddingTop: helperButton ? 11 : 8,
              }}
              typo="subtitle3">
              {errorText}
            </FText>
            {helperButton}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default FTextInput;
```

(Giữ nguyên logic `value` gán lại như cũ — chỉ đổi nguồn màu. Giữ import `FTheme` cho type `textStyle`.)

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/shared/components/FTextInput.tsx
git commit -m "refactor(theme): FTextInput consumes useTheme"
```

---

### Task 13: Refactor BottomNavigator

**Files:**

- Modify: `src/app/navigation/BottomNavigator.tsx`

- [ ] **Step 1: Sửa BottomNavigator**

Replace toàn bộ nội dung `src/app/navigation/BottomNavigator.tsx`:

```tsx
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTheme} from '@/core/theme';
import {FText, FIcon} from '@/shared/components';
import {Felevation, FFilled} from '@/shared/styles';
import {HomeScreen} from '@/features/home';
import {AccountScreen} from '@/features/account';
import {BottomTabParamList} from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtitle,
        tabBarStyle: [
          {
            height: insets.bottom + 56,
            paddingBottom: insets.bottom + 6,
            alignItems: 'center',
            justifyContent: 'space-around',
          },
          Felevation.top1,
          {backgroundColor: colors.white},
        ],
        headerShown: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: ({color}: any) => (
            <FText typo="label5" style={{color}}>
              Trang chủ
            </FText>
          ),
          tabBarIcon: ({color}: any) => (
            <FIcon icon={FFilled.home} size={24} iconColor={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: ({color}: any) => (
            <FText typo="label5" style={{color}}>
              Cá nhân
            </FText>
          ),
          tabBarIcon: ({color}: any) => (
            <FIcon icon={FFilled.user_profile} size={24} iconColor={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomNavigator;
```

(Lý do thêm `{backgroundColor: colors.white}` sau `Felevation.top1`: Felevation android hardcode `backgroundColor: 'white'` — style sau cùng thắng → tab bar theo theme.)

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/app/navigation/BottomNavigator.tsx
git commit -m "refactor(theme): BottomNavigator consumes useTheme"
```

---

### Task 14: Refactor HomeScreen

**Files:**

- Modify: `src/features/home/presentation/screens/HomeScreen.tsx`

- [ ] **Step 1: Sửa HomeScreen** — styles module-level → `createStyles(colors)`

Replace toàn bộ nội dung `src/features/home/presentation/screens/HomeScreen.tsx`:

```tsx
import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {ColorsProps, useTheme} from '@/core/theme';

export const HomeScreen: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home</Text>
    </View>
  );
};

export default HomeScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.white,
    },
    text: {
      fontSize: 18,
      color: colors.title,
    },
  });
```

- [ ] **Step 2: Verify + Commit**

Run: `npx tsc --noEmit` → PASS.

```bash
git add src/features/home/presentation/screens/HomeScreen.tsx
git commit -m "refactor(theme): HomeScreen consumes useTheme"
```

---

### Task 15: Refactor LoginScreen

**Files:**

- Modify: `src/features/auth/presentation/screens/LoginScreen.tsx`

- [ ] **Step 1: Sửa LoginScreen**

Trong `src/features/auth/presentation/screens/LoginScreen.tsx`:

1. Dòng 8: `import {FTheme} from '@/core/theme';` → `import {ColorsProps, useTheme} from '@/core/theme';`
2. Trong thân component (sau dòng 28, cạnh `const insets = ...`): thêm

```tsx
const {theme} = useTheme();
const {colors} = theme;
const styles = useMemo(() => createStyles(colors), [colors]);
```

Và thêm `useMemo` vào import React ở dòng 2:
`import React, {useEffect, useState, useMemo} from 'react';`

3. Thay toàn bộ lần xuất hiện `FTheme.colors.primary` (dòng 164), `FTheme.colors.subtitle` (dòng 212, 238, 260), `FTheme.colors.body` (dòng 242), `FTheme.colors.primary` (dòng 262) trong JSX bằng `colors.primary` / `colors.subtitle` / `colors.body`.

4. Thay khối `styles` module-level (dòng 274-316) bằng:

```tsx
const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.white,
      flex: 1,
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
    titlePass: {
      color: colors.title,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 8,
    },
    bottomButtonView: {
      width: '100%',
      bottom: 0,
      position: 'absolute',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    textButton: {
      paddingTop: 16,
      alignItems: 'center',
      paddingHorizontal: 16,
      alignSelf: 'center',
    },
    biometricButton: {
      alignSelf: 'center',
      width: 'auto',
      marginTop: 40,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
  });
```

(không xóa `export default LoginScreen;` — nó nằm trước khối styles.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → PASS.
Run: `npx jest` → PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/auth/presentation/screens/LoginScreen.tsx
git commit -m "refactor(theme): LoginScreen consumes useTheme"
```

---

### Task 16: buildPaperTheme + AppProviders

**Files:**

- Create: `src/core/theme/paperTheme.ts`
- Modify: `src/app/providers/AppProviders.tsx`

- [ ] **Step 1: Viết paperTheme.ts**

Create `src/core/theme/paperTheme.ts`:

```ts
import {
  MD3DarkTheme,
  MD3LightTheme,
  Theme as PaperTheme,
} from 'react-native-paper';
import {DefaultTheme} from '@react-navigation/native';

export function buildPaperTheme(theme: DefaultTheme): PaperTheme {
  const base = theme.dark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      surface: theme.colors.card,
      text: theme.colors.label,
      placeholder: theme.colors.placeHolder,
      outline: theme.colors.border2,
      onSurfaceVariant: theme.colors.placeHolder,
    },
  };
}

export default buildPaperTheme;
```

Cập nhật `src/core/theme/index.ts` — thêm:

```ts
export * from './paperTheme';
```

- [ ] **Step 2: Sửa AppProviders**

Replace toàn bộ nội dung `src/app/providers/AppProviders.tsx`:

```tsx
import React, {ReactNode} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider as ReduxProvider} from 'react-redux';
import {PaperProvider} from 'react-native-paper';
import {MenuProvider} from 'react-native-popup-menu';

import {store} from '@/app/store';
import {FSnackbarProvider} from '@/shared/hooks/useSnackbar';
import {ThemeProvider, useTheme} from '@/core/theme';
import {buildPaperTheme} from '@/core/theme/paperTheme';

export interface AppProvidersProps {
  children: ReactNode;
}

const ThemedPaperProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const {theme} = useTheme();
  return (
    <PaperProvider theme={buildPaperTheme(theme)}>{children}</PaperProvider>
  );
};

export const AppProviders: React.FC<AppProvidersProps> = ({children}) => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ReduxProvider store={store}>
        <ThemeProvider>
          <MenuProvider>
            <ThemedPaperProvider>
              <FSnackbarProvider>{children}</FSnackbarProvider>
            </ThemedPaperProvider>
          </MenuProvider>
        </ThemeProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

export default AppProviders;
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → PASS.
Run: `npx jest` → PASS (mock PaperProvider vẫn chạy — `ThemedPaperProvider` chỉ cần useTheme ở trong ThemeProvider).

- [ ] **Step 4: Commit**

```bash
git add src/core/theme/paperTheme.ts src/core/theme/index.ts src/app/providers/AppProviders.tsx
git commit -m "feat(theme): wire PaperProvider with dynamic theme"
```

---

### Task 17: NavigationContainer theme + StatusBar/Appearance

**Files:**

- Modify: `src/app/navigation/RootNavigator.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Sửa RootNavigator**

Trong `src/app/navigation/RootNavigator.tsx`:

1. Thêm import: `import {useTheme} from '@/core/theme';`
2. Trong component `RootNavigator`:

```tsx
export const RootNavigator: React.FC = () => {
  const {theme} = useTheme();

  return (
    <NavigationContainer theme={theme}>
```

- [ ] **Step 2: Sửa App.tsx**

Replace toàn bộ nội dung `src/app/App.tsx`:

```tsx
import React, {useEffect} from 'react';
import {Appearance, Platform, StatusBar} from 'react-native';

import '@/core/i18n';
import {useTheme} from '@/core/theme';
import {
  getFcmToken,
  registerListenerWithFCM,
} from '@/core/utils/firebase/fcmHelper';
import {AppProviders} from './providers';
import {RootNavigator} from './navigation';

const ThemedApp: React.FC = () => {
  const {isDark, theme} = useTheme();

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      (StatusBar as any).setBackgroundColor?.(
        isDark ? theme.colors.background : 'transparent',
      );
      (StatusBar as any).setTranslucent?.(true);
    }
    if (Appearance.setColorScheme) {
      Appearance.setColorScheme(isDark ? 'dark' : 'light');
    }
  }, [isDark, theme.colors.background]);

  return <RootNavigator />;
};

export const App: React.FC = () => {
  /** Setup Firebase Cloud Messaging */
  useEffect(() => {
    getFcmToken();
    const unsubscribe = registerListenerWithFCM();
    return unsubscribe;
  }, []);

  return (
    <AppProviders>
      <ThemedApp />
    </AppProviders>
  );
};

export default App;
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → PASS.
Run: `npx jest` → PASS (App.test renderer: App → AppProviders → ThemedApp; fake timers + act flush hydration).

- [ ] **Step 4: Commit**

```bash
git add src/app/navigation/RootNavigator.tsx src/app/App.tsx
git commit -m "feat(theme): pass theme to NavigationContainer and sync StatusBar/Appearance"
```

---

### Task 18: AccountScreen — UI toggle 3 chế độ

**Files:**

- Modify: `src/features/account/presentation/screens/AccountScreen.tsx`

- [ ] **Step 1: Sửa AccountScreen**

Replace toàn bộ nội dung `src/features/account/presentation/screens/AccountScreen.tsx`:

```tsx
import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {ColorsProps, ThemeMode, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled} from '@/shared/styles/FIconStyles';

const OPTIONS: {mode: ThemeMode; label: string}[] = [
  {mode: 'light', label: 'Sáng'},
  {mode: 'dark', label: 'Tối'},
  {mode: 'system', label: 'Theo hệ thống'},
];

export const AccountScreen: React.FC = () => {
  const {mode, setMode, theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <FText typo="title1" style={styles.header}>
        Cài đặt
      </FText>
      <FText typo="subtitle2" style={styles.subHeader}>
        Giao diện
      </FText>
      {OPTIONS.map(option => {
        const selected = mode === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={styles.row}
            onPress={() => setMode(option.mode)}>
            <FText
              typo="title6"
              style={{color: selected ? colors.primary : colors.body}}>
              {option.label}
            </FText>
            {selected && (
              <FIcon
                icon={FFilled.c_check}
                size={20}
                iconColor={colors.primary}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default AccountScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    header: {
      color: colors.title,
    },
    subHeader: {
      color: colors.subtitle,
      marginTop: 24,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border1,
    },
  });
```

(FText buộc truyền `typo`; `FText` không truyền `color` → default `colors.title` của FText mới đã theo theme. `FFilled.c_check` đã tồn tại trong FIconStyles.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit` → PASS.
Run: `npx jest` → PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/account/presentation/screens/AccountScreen.tsx
git commit -m "feat(theme): add theme mode toggle UI in AccountScreen"
```

---

### Task 19: Verification cuối cùng

- [ ] **Step 1: Toàn bộ verify**

Run: `npx tsc --noEmit` → PASS (0 errors).
Run: `npm run lint` → PASS (0 errors).
Run: `npx jest` → PASS (App.test + themeUtils + themeContext).

- [ ] **Step 2: Kiểm tra số dư import tĩnh FTheme**

Run: `grep -rn "FTheme" src --include="*.tsx" --include="*.ts" | grep -v "core/theme" | grep -v "shared/styles" | grep -v "useTheme"`
Expected: chỉ còn (nếu có): `FTheme` dùng trong type (`keyof typeof FTheme.fonts`) tại FText/FTextInput — cho phép. Không còn `FTheme.colors` / `FTheme.fonts` đọc trực tiếp ngoài core/theme.

- [ ] **Step 3: Hướng dẫn verify manual (không bắt buộc trong CI)**

1. `npm run ios` → App mở ở mode System (mặc định)
2. Account tab → chọn "Tối" → toàn app chuyển tối (tab bar, input, snackbar, status bar)
3. Kill app → mở lại → vẫn tối (persisted)
4. Chọn "Theo hệ thống" → đổi system dark/light trên máy → app đổi theo
5. Android tương tự (nếu máy có)

- [ ] **Step 4: Commit (nếu còn dư thay đổi)**

```bash
git add -A
git commit -m "chore(theme): final verification fixes"
```

---

## Self-Review

**Spec coverage:**

- §4.1 ThemeContext state holder + hydrate + persist → Task 3
- §4.2 DarkTheme derive → Task 2
- §4.3 Refactor 11 components + screens + navigator → Task 4-15
- §4.4 PaperProvider (buildPaperTheme) + StatusBar + Appearance → Task 16-17
- §4.5 AccountScreen toggle → Task 18
- §5 Error handling: fallback 'system' khi storage lỗi + guard `Appearance.setColorScheme` → Task 1-3, 17
- §6 Testing: jest cho utils + context, verify manual → Task 1, 3, 19

**Điểm cần lưu ý khi thực thi:**

- `themeUtils.ts` import `DarkTheme` — tạo file theo đúng thứ tự Task 1 → Task 2 để tránh lỗi build giữa chừng
- `FText`/`FTextInput` giữ import tĩnh `FTheme` chỉ cho type (`keyof typeof FTheme.fonts`) — không phải runtime đọc màu
- `Felevation.top1` hardcode android `backgroundColor: 'white'` → đã override sau trong BottomNavigator
- Mọi component có `StyleSheet.create` at module level dùng màu → phải chuyển `createStyles(colors)` để dark mode có hiệu lực
