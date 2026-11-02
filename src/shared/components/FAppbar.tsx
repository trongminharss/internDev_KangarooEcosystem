import React, {useRef} from 'react';
import {StyleSheet, TouchableOpacity, View, ViewStyle} from 'react-native';
import {Appbar} from 'react-native-paper';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SvgProps} from 'react-native-svg';
import {LANGUAGES, useLanguage} from '@/core/i18n';
import {useTheme} from '@/core/theme';
import {tokens} from '@/shared/styles';
import EnglishSvg from '@/assets/svg/english.svg';
import VietnamSvg from '@/assets/svg/vietnam.svg';
import {FFilled, FOutlined} from '../styles/FIconStyles';
import FBottomSheet, {FBottomSheetRef} from './FBottomSheet';
import FIcon from './FIcon';
import FIconButton from './FIconButton';
import FText from './FText';

const LANGUAGE_FLAGS: Record<string, React.FC<SvgProps>> = {
  vi: VietnamSvg,
  en: EnglishSvg,
};

export interface FAppbarProps {
  icon?: string;
  onBack?: () => void;
  noContent?: boolean;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
  toolbarHeight?: number;
  backColor?: string;
  trailling?: React.ReactNode;
  trailing?: React.ReactNode;
  customizeTitle?: React.ReactNode;
  showLanguage?: boolean;
  showLanguageSelector?: boolean;
  onLanguagePress?: () => void;
}

const FAppbar: React.FC<FAppbarProps> = ({
  icon = FOutlined.left_arrow,
  onBack,
  noContent = false,
  style,
  title,
  subtitle,
  toolbarHeight = 48,
  backColor,
  trailling,
  trailing,
  customizeTitle,
  showLanguage = true,
  showLanguageSelector = true,
  onLanguagePress,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {language, setLanguage} = useLanguage();
  const languageSheetRef = useRef<FBottomSheetRef>(null);

  const isLanguageVisible = showLanguage || showLanguageSelector;
  const trailingContent = trailing ?? trailling;
  const hasRightContent = isLanguageVisible || trailingContent != null;

  const handleLanguagePress = () => {
    if (onLanguagePress) {
      onLanguagePress();
    } else {
      languageSheetRef.current?.present();
    }
  };

  const CurrentFlag = LANGUAGE_FLAGS[language] ?? VietnamSvg;

  return (
    <>
      <Appbar.Header
        style={[
          {
            backgroundColor: colors.white,
            padding: 0,
            height: toolbarHeight,
            elevation: 0,
            justifyContent: hasRightContent ? 'space-between' : undefined,
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
          <View style={{paddingLeft: tokens.spacing.xs}}>
            <FText style={{color: colors.title}} typo="title1">
              {title}
            </FText>
            <FText style={{color: colors.title}} typo="subtitle2">
              {subtitle}
            </FText>
          </View>
        )}

        {customizeTitle && <>{customizeTitle}</>}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 'auto',
          }}>
          {isLanguageVisible && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLanguagePress}
              style={styles.languageButton}>
              <CurrentFlag width={26} height={26} />
            </TouchableOpacity>
          )}
          {trailingContent}
        </View>
      </Appbar.Header>

      {isLanguageVisible && (
        <FBottomSheet
          ref={languageSheetRef}
          snapPoints={['40%']}
          enableDynamicSizing={false}>
          <View
            style={[
              styles.sheetContent,
              {paddingBottom: Math.max(insets.bottom, tokens.spacing.s)},
            ]}>
            <FText
              typo="title2"
              color={colors.title}
              style={styles.sheetTitle}>
              {t('account.language')}
            </FText>
            {LANGUAGES.map(option => {
              const selected = language === option.code;
              const Flag = LANGUAGE_FLAGS[option.code] ?? VietnamSvg;
              return (
                <TouchableOpacity
                  key={option.code}
                  activeOpacity={0.7}
                  style={[
                    styles.row,
                    {borderBottomColor: colors.border1},
                  ]}
                  onPress={() => {
                    setLanguage(option.code);
                    languageSheetRef.current?.dismiss();
                  }}>
                  <View style={styles.leadingWrap}>
                    <Flag width={28} height={28} />
                    <FText
                      typo="title6"
                      color={selected ? colors.primary : colors.title}
                      style={{marginLeft: tokens.spacing.xs}}>
                      {option.label}
                    </FText>
                  </View>
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
        </FBottomSheet>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    width: '100%',
    paddingHorizontal: tokens.spacing.s,
  },
  sheetTitle: {
    textAlign: 'center',
    paddingTop: tokens.spacing._2xs,
    paddingBottom: tokens.spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.s,
    borderBottomWidth: 1,
  },
  leadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageButton: {
    padding: tokens.spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FAppbar;


