import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {useTheme} from '@/core/theme';
import {FOutlined} from '@/shared/styles/FIconStyles';
import {tokens} from '@/shared/styles';
import FIcon from './FIcon';
import FText from './FText';

type FCheckboxProps = {
  checked: boolean;
  onPress: () => void;
  /** Tiêu đề dạng text (bỏ qua nếu dùng children) */
  title?: string;
  /** Tiêu đề dạng view tùy chỉnh, vd: dòng điều khoản có link */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function FCheckbox({
  checked,
  onPress,
  title,
  children,
  style,
}: FCheckboxProps) {
  const {theme} = useTheme();
  const {colors} = theme;
  return (
    <TouchableOpacity
      style={[styles.row, style]}
      activeOpacity={0.7}
      onPress={onPress}>
      <View
        style={[
          styles.checkbox,
          {borderColor: colors.grey2},
          checked && {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
        ]}>
        {checked ? (
          <FIcon icon={FOutlined.check} size={12} iconColor={colors.white} />
        ) : null}
      </View>
      {children ??
        (title ? (
          <FText typo="bodyText2" style={{flex: 1, color: colors.body}}>
            {title}
          </FText>
        ) : null)}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: tokens.borderRadius.small,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing._2xs,
  },
});
