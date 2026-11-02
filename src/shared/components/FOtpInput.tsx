import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  StyleProp,
  TextInput,
  TextInputInstance,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Animated, {
  FadeInDown,
  FadeOut,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useTheme} from '@/core/theme';
import {ColorsProps} from '@/core/theme/FTheme';
import {tokens} from '@/shared/styles';

interface FOtpInputProps extends TextInputProps {
  otpCount?: number;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  autoFocus?: boolean;
  editable?: boolean;
  onCodeChanged?: (codes: string) => void;
  enteringAnimated?: typeof LinearTransition;
  exitingAnimated?: typeof LinearTransition;
  isError?: boolean;
  onPasteRejected?: (value: string) => void;
}

interface FOtpContext extends FOtpInputProps {
  inputRef: React.MutableRefObject<(TextInputInstance | null)[]>;
  otpValue: string[];
  onPress: () => void;
  onFocusNext: (value: string, index: number) => void;
  onFocusPrevious: (key: string, index: number) => void;
  focus: number;
  onLongPress: () => void;
  rest?: TextInputProps;
}

const OtpContext = createContext<FOtpContext>({} as FOtpContext);
// ponytail: 100ms guessed — original TIMEOUT_FOCUS_INPUT lives outside this repo
const FOCUS_DELAY = 100;
const focusDelay = Platform.OS === 'android' ? FOCUS_DELAY : 2 * FOCUS_DELAY;

const OtpItem = ({i}: {i: number}) => {
  const {
    inputRef,
    onPress,
    onLongPress,
    otpValue,
    onFocusNext,
    onFocusPrevious,
    focus,
    containerStyle,
    inputStyle,
    textStyle,
    editable,
    enteringAnimated,
    exitingAnimated,
    isError,
    rest,
  } = useContext(OtpContext);
  const {theme, isDark} = useTheme();
  const styles = createStyles(theme.colors, isDark);

  const borderColorValue = useSharedValue(0);

  useEffect(() => {
    if (isError) {
      borderColorValue.value = withTiming(2, {duration: 100});
    } else if (focus === i || focus === -1) {
      borderColorValue.value = withTiming(1, {duration: 100});
    } else {
      borderColorValue.value = withTiming(0, {duration: 100});
    }
  }, [focus, isError, i, borderColorValue]);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      borderColorValue.value,
      [0, 1, 2],
      [
        isDark ? theme.colors.border2 : theme.colors.grey1,
        theme.colors.primary,
        theme.colors.error,
      ],
    );
    return {
      borderColor: color,
    };
  });

  return (
    <View style={[styles.item, containerStyle]}>
      <TextInput
        style={[styles.inputSize, inputStyle]}
        caretHidden
        autoCapitalize="none"
        keyboardType="ascii-capable"
        autoCorrect={false}
        spellCheck={false}
        editable={editable}
        ref={ref => {
          inputRef.current[i] = ref;
        }}
        value={otpValue[i]}
        onChangeText={v => onFocusNext(v, i)}
        onKeyPress={e => onFocusPrevious(e.nativeEvent.key, i)}
        textContentType="oneTimeCode"
        {...rest}
      />
      <Pressable
        disabled={!editable}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.overlay}>
        <Animated.View
          style={[
            styles.cell,
            styles.inputSize,
            styles.input,
            animatedBorderStyle,
            inputStyle,
          ]}>
          {otpValue[i] !== '' ? (
            <Animated.Text
              key="digit"
              entering={enteringAnimated}
              exiting={exitingAnimated}
              style={[theme.fonts.bodyLabel02, styles.text, textStyle]}>
              {otpValue[i]}
            </Animated.Text>
          ) : (
            <Animated.Text
              key="placeholder"
              style={[
                theme.fonts.bodyLabel02,
                styles.placeholderText,
                textStyle,
              ]}>
              -
            </Animated.Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
};

const FOtpInput = ({
  otpCount = 6,
  containerStyle = {},
  inputStyle = {},
  textStyle = {},
  autoFocus = false,
  editable = true,
  enteringAnimated = FadeInDown,
  exitingAnimated = FadeOut,
  onCodeChanged,
  onPasteRejected,
  isError = false,
  ...rest
}: FOtpInputProps) => {
  const {theme, isDark} = useTheme();
  const styles = createStyles(theme.colors, isDark);
  const inputRef = useRef<(TextInputInstance | null)[]>([]);
  const data: string[] = new Array(otpCount).fill('');
  const [focus, setFocus] = useState<number>(0);
  const [otpValue, setOtpValue] = useState<string[]>(data);

  const onPress = () => {
    if (focus === -1) {
      const lastIndex = otpCount - 1;
      setFocus(lastIndex);
      otpValue[lastIndex] = '';
      setOtpValue([...otpValue]);
      inputRef.current[lastIndex]?.blur();

      requestAnimationFrame(() => {
        inputRef.current[lastIndex]?.focus();
      });

      return;
    }

    inputRef.current[focus]?.blur();

    requestAnimationFrame(() => {
      inputRef.current[focus]?.focus();
    });
  };

  const onFocusNext = (value: string, index: number) => {
    if (!value) {
      return;
    }

    if (value.length > 1) {
      const longest = value
        .split(/[^a-zA-Z0-9]+/)
        .reduce((a, b) => (b.length > a.length ? b : a), '');
      if (!longest) {
        onPasteRejected?.(value);
        return;
      }
      const chars = longest.slice(0, otpCount).toUpperCase().split('');
      setOtpValue([...chars, ...new Array(otpCount - chars.length).fill('')]);
      if (chars.length === otpCount) {
        setFocus(-1);
        inputRef.current[otpCount - 1]?.blur();
        Keyboard.dismiss();
      } else {
        setFocus(chars.length);
        inputRef.current[chars.length]?.focus();
      }
      return;
    }

    const lastChar = value.slice(-1);
    let char = lastChar;

    if (lastChar === 'ư') char = 'w';
    if (lastChar === 'Ư') char = 'W';

    if (!/[a-zA-Z0-9]/.test(char)) {
      char = '';
    }

    if (char && index < otpCount - 1) {
      setFocus(index + 1);
      inputRef.current[index + 1]?.focus();
    }

    if (index === otpCount - 1 && char) {
      setFocus(-1);
      inputRef.current[index]?.blur();
    }

    otpValue[index] = char.toUpperCase();
    setOtpValue([...otpValue]);
  };

  const onFocusPrevious = (key: string, index: number) => {
    if (key === 'Backspace' && index !== 0) {
      inputRef.current[index - 1]?.focus();
      setFocus(index - 1);
      otpValue[index - 1] = '';
      setOtpValue([...otpValue]);
    } else if (key === 'Backspace' && index === 0) {
      otpValue[0] = '';
    }
  };

  const onLongPress = async () => {
    const text = await Clipboard.getString();
    onFocusNext(text, focus === -1 ? otpCount - 1 : focus);
  };

  const inputProps = {
    inputRef,
    otpValue,
    onPress,
    onFocusNext,
    onFocusPrevious,
    onLongPress,
    focus,
    autoFocus,
    containerStyle,
    inputStyle,
    textStyle,
    otpCount,
    editable,
    enteringAnimated,
    exitingAnimated,
    isError,
    rest,
  };

  useEffect(() => {
    const code = otpValue.join('');

    onCodeChanged?.(code);

    if (code.length === otpCount) {
      Keyboard.dismiss();
      setFocus(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue, otpCount]);

  useEffect(() => {
    if (!autoFocus) return;

    const timer = setTimeout(() => {
      inputRef.current[0]?.focus();
    }, focusDelay);
    return () => clearTimeout(timer);
  }, [autoFocus]);

  return (
    <OtpContext.Provider value={inputProps as FOtpContext}>
      <View style={styles.row}>
        {data.map((_, i) => (
          <OtpItem key={i} i={i} />
        ))}
      </View>
    </OtpContext.Provider>
  );
};

const createStyles = (colors: ColorsProps, isDark = false) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      width: '100%',
      gap: tokens.space.sm,
    },
    item: {
      flex: 1,
    },
    inputSize: {
      width: '100%',
      height: 50,
    },
    input: {
      backgroundColor: isDark ? colors.card : colors.grey50,
      shadowOpacity: isDark ? 0.2 : 0.09,
      shadowColor: colors.black,
      shadowOffset: {width: 0, height: 2},
      shadowRadius: 10,
      borderWidth: 1,
    },
    cell: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.borderRadius.small,
    },
    overlay: StyleSheet.absoluteFill,
    text: {
      color: colors.label,
    },
    placeholderText: {
      color: colors.placeHolder,
    },
  });

export default FOtpInput;
