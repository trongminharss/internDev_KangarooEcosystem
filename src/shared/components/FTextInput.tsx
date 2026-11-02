import React from 'react';
import {
  ViewStyle,
  TextStyle,
  View,
  KeyboardTypeOptions,
  Platform,
  TouchableOpacity,
  TextInput as RNTextInput,
  TextInputInstance,
} from 'react-native';
import {FInputSizeProps} from '../styles/FInputSize';
import FInputSize from '../styles/FInputSize';
import FTheme from '@/core/theme/FTheme';
import {useTheme} from '@/core/theme';
import FIconButton from './FIconButton';
import FText from './FText';
import {FFilled} from '../styles/FIconStyles';
import {tokens} from '@/shared/styles';

interface FTextInputProps {
  readonly?: boolean;
  placeholder: string;
  value: string;
  rightIcon?: React.ReactNode;
  onFocus?: () => void;
  onClear: () => void;
  onPressIn?: () => void;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: FInputSizeProps;
  errorText?: string;
  secureTextEntry?: boolean;
  showHelperButton?: boolean;
  helperButton?: React.ReactNode;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' | undefined;
  inputRef?: React.MutableRefObject<TextInputInstance | null>;
  disabled?: boolean;
}

const FTextInput: React.FC<FTextInputProps> = ({
  readonly = false,
  placeholder,
  value,
  onFocus,
  onClear,
  onChangeText,
  onPressIn,
  style,
  rightIcon,
  size = FInputSize.size56,
  textStyle = FTheme.fonts.body02,
  errorText,
  secureTextEntry = false,
  showHelperButton = false,
  helperButton,
  keyboardType = 'default',
  autoCapitalize,
  inputRef,
  disabled = false,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const [isFocused, setIsFocused] = React.useState(false);
  const borderColor = errorText
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.border1;
  const backgroundColor = disabled ? colors.grey1 : colors.white;
  const textColor = disabled ? colors.disable : colors.label;
  const buildClearIcon = (
    <View style={{width: rightIcon ? 36 : null}}>
      <FIconButton
        icon={FFilled.c_remove}
        size={16}
        onPress={() => {
          if (onClear) onClear();
        }}
      />
    </View>
  );
  return (
    <TouchableOpacity
      onPress={readonly ? onPressIn : undefined}
      disabled={!readonly || disabled}>
      <View pointerEvents={readonly ? 'none' : undefined}>
        <View
          testID="f-text-input-container"
          style={[
            {
              width: '100%',
              borderRadius: size.borderRadius,
              overflow: 'hidden',
              flexDirection: 'row',
              borderWidth: 1,
              alignItems: 'center',
              backgroundColor,
              borderColor,
            },
            style,
          ]}>
          <RNTextInput
            ref={inputRef}
            placeholder={placeholder}
            placeholderTextColor={
              disabled ? colors.disable : colors.placeHolder
            }
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
              height: size.height,
              backgroundColor,
              color: textColor,
              fontSize: textStyle.fontSize,
              fontWeight: textStyle.fontWeight,
              textAlignVertical: 'center',
              paddingHorizontal: size.padding,
            }}
            value={value}
            autoCapitalize={autoCapitalize}
            cursorColor={colors.label}
            onChangeText={onChangeText}
            onPressIn={() => {
              if (onPressIn) onPressIn();
            }}
            secureTextEntry={secureTextEntry}
            editable={!disabled}
            selectionColor={
              Platform.OS == 'ios' ? colors.primary : colors.primaryBorder
            }
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
                paddingTop: helperButton
                  ? tokens.spacing.xs
                  : tokens.spacing._2xs,
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
