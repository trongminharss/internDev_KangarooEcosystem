import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {Snackbar} from 'react-native-paper';
import Modal from 'react-native-modal';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {tokens} from '@/shared/styles';
import {FFilled, FOutlined} from '../styles/FIconStyles';
import FIcon from './FIcon';
import FText from './FText';

export type FSnackbarType = 'fail' | 'error' | 'success' | 'info' | 'warning';
export type FSnackbarEmphasis = 'high' | 'low';

export interface FSnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  type?: FSnackbarType;
  emphasis?: FSnackbarEmphasis;
  title?: string;
  showTitle?: boolean;
  icon?: string;
  duration?: number;
  paddingTop?: number;
  style?: StyleProp<ViewStyle>;
}

const defaultFallbackTitles: Record<'info' | 'success' | 'warning' | 'fail', string> = {
  info: 'Thông tin',
  success: 'Thành công',
  warning: 'Cảnh báo',
  fail: 'Thất bại',
};

const FSnackbar: React.FC<FSnackbarProps> = ({
  visible,
  message,
  onDismiss,
  type = 'fail',
  emphasis = 'low',
  title,
  showTitle = true,
  icon,
  duration = 2500,
  paddingTop = 16,
  style,
}) => {
  const {t} = useTranslation();
  const {theme, isDark} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  const normalizedType = type === 'error' ? 'fail' : type;

  // Default icons for each status type
  const defaultIcon = {
    info: FFilled.c_info,
    success: FFilled.c_check,
    warning: FFilled.warning_sign,
    fail: FFilled.c_warning,
  }[normalizedType];

  const resolvedIcon = icon ?? defaultIcon;

  // Color tokens for High and Low emphasis variants
  const colorConfig =
    emphasis === 'high'
      ? {
          info: {
            backgroundColor: colors.info,
            iconColor: '#FFFFFF',
            textColor: '#FFFFFF',
            closeIconColor: '#FFFFFF',
            borderColor: 'transparent',
          },
          success: {
            backgroundColor: colors.success,
            iconColor: '#FFFFFF',
            textColor: '#FFFFFF',
            closeIconColor: '#FFFFFF',
            borderColor: 'transparent',
          },
          warning: {
            backgroundColor: colors.warning,
            iconColor: '#FFFFFF',
            textColor: '#FFFFFF',
            closeIconColor: '#FFFFFF',
            borderColor: 'transparent',
          },
          fail: {
            backgroundColor: colors.error,
            iconColor: '#FFFFFF',
            textColor: '#FFFFFF',
            closeIconColor: '#FFFFFF',
            borderColor: 'transparent',
          },
        }[normalizedType]
      : {
          info: {
            backgroundColor: colors.infoBackground,
            iconColor: colors.info,
            textColor: colors.title,
            closeIconColor: colors.title,
            borderColor: isDark ? colors.infoBorder : 'transparent',
          },
          success: {
            backgroundColor: colors.successBackground,
            iconColor: colors.success,
            textColor: colors.title,
            closeIconColor: colors.title,
            borderColor: isDark ? colors.successBorder : 'transparent',
          },
          warning: {
            backgroundColor: colors.warningBackground,
            iconColor: colors.warning,
            textColor: colors.title,
            closeIconColor: colors.title,
            borderColor: isDark ? colors.warningBorder : 'transparent',
          },
          fail: {
            backgroundColor: colors.errorBackground,
            iconColor: colors.error,
            textColor: colors.title,
            closeIconColor: colors.title,
            borderColor: isDark ? colors.errorBorder : 'transparent',
          },
        }[normalizedType];

  // Title resolution: use explicit title if provided; otherwise default to localized type title
  const resolvedTitle =
    !showTitle || title === ''
      ? ''
      : title !== undefined
      ? t(title, title)
      : t(`snackbar.${normalizedType}`, defaultFallbackTitles[normalizedType]);

  const hasTitle = Boolean(resolvedTitle);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onDismiss}
      backdropColor={colors.title}
      backdropOpacity={0.8}
      coverScreen={false}
      hasBackdrop={false}
      animationIn="slideInDown"
      animationOut="slideOutUp"
      style={styles.modal}>
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={duration}
        wrapperStyle={[styles.snackbarWrapper, {top: paddingTop}]}
        contentStyle={styles.contentStyle}
        style={[
          styles.snackbar,
          {
            backgroundColor: colorConfig.backgroundColor,
            borderColor: colorConfig.borderColor,
            borderWidth: isDark && emphasis === 'low' ? 1 : 0,
          },
          style,
        ]}>
        <View
          style={[
            styles.card,
            {alignItems: hasTitle ? 'flex-start' : 'center'},
          ]}>
          <View
            style={[
              styles.contentWrapper,
              {alignItems: hasTitle ? 'flex-start' : 'center'},
            ]}>
            <View style={styles.iconContainer}>
              <FIcon icon={resolvedIcon} size={20} iconColor={colorConfig.iconColor} />
            </View>
            <View style={styles.textContainer}>
              {hasTitle && (
                <FText
                  typo="bodyLabel03"
                  style={{color: colorConfig.textColor}}>
                  {resolvedTitle}
                </FText>
              )}
              <FText
                typo="body03"
                style={{color: colorConfig.textColor}}>
                {t(message, message)}
              </FText>
            </View>
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.7}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={styles.closeButton}>
            <FIcon
              icon={FOutlined.e_remove}
              size={16}
              iconColor={colorConfig.closeIconColor}
            />
          </TouchableOpacity>
        </View>
      </Snackbar>
    </Modal>
  );
};

export default FSnackbar;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    modal: {
      justifyContent: 'flex-start',
      margin: 0,
      pointerEvents: 'box-none',
    },
    snackbarWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
    },
    snackbar: {
      marginHorizontal: tokens.space.md,
      borderRadius: tokens.borderRadius.medium,
      paddingHorizontal: 0,
      paddingVertical: 0,
      minHeight: 56,
      ...Platform.select({
        ios: {
          shadowColor: colors.black,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    contentStyle: {
      marginHorizontal: 0,
      marginVertical: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      flex: 1,
    },
    card: {
      flexDirection: 'row',
      paddingLeft: tokens.spacing.xs,
      paddingRight: tokens.spacing._3xs,
      paddingTop: tokens.spacing._3xs,
      paddingBottom: tokens.spacing._3xs,
      gap: tokens.spacing._2xs,
      width: '100%',
    },
    contentWrapper: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: tokens.spacing._2xs,
      gap: tokens.spacing._2xs,
    },
    iconContainer: {
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
      flexDirection: 'column',
      gap: tokens.spacing._3xs,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: tokens.borderRadius.medium,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
