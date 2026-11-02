import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {Alert, Pressable, Share, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@/core/theme';
import {
  FBottomSheet,
  FBottomSheetRef,
  FButton,
  FIcon,
  FText,
  FTextInput,
} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {Purifier} from '../purifierMock';
import {Chip} from './Chip';

interface Props {
  device: Purifier;
  onRename: (name: string) => void;
  onRelocate: (location: string) => void;
  onDeleted: () => void;
}

type Mode = 'menu' | 'rename' | 'location';

const LOCATIONS = ['kitchen', 'living', 'dining', 'office'];

export const SettingsSheet = forwardRef<FBottomSheetRef, Props>(
  ({device, onRename, onRelocate, onDeleted}, ref) => {
    const {theme} = useTheme();
    const {colors} = theme;
    const {t} = useTranslation();
    const insets = useSafeAreaInsets();
    const {showSnackbar} = useFSnackbar();
    const [mode, setMode] = useState<Mode>('menu');
    const [text, setText] = useState('');
    const sheetRef = useRef<FBottomSheetRef>(null);

    useImperativeHandle(ref, () => sheetRef.current as FBottomSheetRef);

    const close = () => {
      sheetRef.current?.dismiss();
    };

    const edit = (m: Mode, initial: string) => {
      setText(initial);
      setMode(m);
    };

    const save = () => {
      const value = text.trim();
      if (!value) {
        return;
      }
      (mode === 'rename' ? onRename : onRelocate)(value);
      showSnackbar(
        t(`device.settings.${mode === 'rename' ? 'renamed' : 'relocated'}`),
        {type: 'success'},
      );
      close();
    };

    const confirmDelete = () =>
      Alert.alert(
        t('device.settings.deleteTitle'),
        t('device.settings.deleteMessage', {name: device.name}),
        [
          {text: t('device.settings.cancel'), style: 'cancel'},
          {
            text: t('device.settings.deleteConfirm'),
            style: 'destructive',
            onPress: () => {
              close();
              onDeleted();
            },
          },
        ],
      );

    const menu = [
      {
        icon: FOutlined.pencil,
        title: t('device.settings.rename'),
        value: device.name,
        onPress: () => edit('rename', device.name),
      },
      {
        icon: FOutlined.location,
        title: t('device.settings.location'),
        value: device.location,
        onPress: () => edit('location', device.location),
      },
      {
        icon: FOutlined.share,
        title: t('device.settings.share'),
        value: '',
        onPress: () =>
          Share.share({
            message: t('device.settings.shareMessage', {
              name: device.name,
              serial: device.serial,
            }),
          }),
      },
      {
        icon: FOutlined.system_update,
        title: t('device.settings.firmware'),
        value: `v${device.firmware}`,
        onPress: () =>
          showSnackbar(
            t('device.settings.firmwareLatest', {version: device.firmware}),
            {
              type: 'info',
            },
          ),
      },
    ];

    return (
      <FBottomSheet
        ref={sheetRef}
        onClose={() => setMode('menu')}
        snapPoints={['40%']}
        enableDynamicSizing={false}>
        <View
          style={[
            styles.body,
            {paddingBottom: insets.bottom + tokens.spacing.s},
          ]}>
          {mode === 'menu' ? (
            <>
              <FText typo="headline7" color={colors.title}>
                {t('device.settings.title')}
              </FText>
              {menu.map(m => (
                <Pressable
                  key={m.title}
                  onPress={m.onPress}
                  style={({pressed}) => [
                    styles.row,
                    pressed && {opacity: 0.6},
                  ]}>
                  <FIcon icon={m.icon} size={22} iconColor={colors.title} />
                  <FText
                    typo="bodyLabel03"
                    color={colors.title}
                    style={styles.flex}>
                    {m.title}
                  </FText>
                  <FText
                    typo="body03"
                    color={colors.subtitle}
                    numberOfLines={1}
                    style={styles.value}>
                    {m.value}
                  </FText>
                </Pressable>
              ))}
              <Pressable
                onPress={confirmDelete}
                style={({pressed}) => [styles.row, pressed && {opacity: 0.6}]}>
                <FIcon
                  icon={FOutlined.trash_can}
                  size={22}
                  iconColor={colors.error}
                />
                <FText
                  typo="bodyLabel03"
                  color={colors.error}
                  style={styles.flex}>
                  {t('device.settings.delete')}
                </FText>
              </Pressable>
            </>
          ) : (
            <>
              <FText typo="headline7" color={colors.title}>
                {t(
                  `device.settings.${
                    mode === 'rename' ? 'renameTitle' : 'locationTitle'
                  }`,
                )}
              </FText>
              <FTextInput
                placeholder={t(
                  `device.settings.${
                    mode === 'rename'
                      ? 'namePlaceholder'
                      : 'locationPlaceholder'
                  }`,
                )}
                value={text}
                onChangeText={setText}
                onClear={() => setText('')}
                errorText={text.trim() ? '' : t('device.settings.empty')}
              />
              {mode === 'location' && (
                <View style={styles.chips}>
                  {LOCATIONS.map(k => t(`device.settings.locations.${k}`)).map(
                    l => (
                      <Chip
                        key={l}
                        label={l}
                        active={text === l}
                        onPress={() => setText(l)}
                      />
                    ),
                  )}
                </View>
              )}
              <View style={styles.actions}>
                <FButton
                  kind="tertiary"
                  color="black"
                  style={styles.flex}
                  title={t('device.settings.back')}
                  onPress={() => setMode('menu')}
                />
                <FButton
                  kind="primary"
                  color="success"
                  style={styles.flex}
                  title={t('device.settings.save')}
                  disabled={!text.trim()}
                  onPress={save}
                />
              </View>
            </>
          )}
        </View>
      </FBottomSheet>
    );
  },
);

export default SettingsSheet;

const styles = StyleSheet.create({
  body: {
    width: '100%',
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.spacing._2xs,
    gap: tokens.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xs,
  },
  flex: {
    flex: 1,
  },
  value: {
    maxWidth: '45%',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing._2xs,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing._2xs,
  },
});
