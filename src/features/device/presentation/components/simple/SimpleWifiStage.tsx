import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Keyboard, Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Formik} from 'formik';
import {container} from '@/core/di/container';
import {ColorsProps, useTheme} from '@/core/theme';
import {FCheckbox, FIcon, FText, FTextInput} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {WifiNetwork, WifiSelection} from '../../../domain/entities/Device';
import {validateWifiCredentials} from '../../../domain/usecases/ProvisionDeviceUseCase';
import {CircleButton, FadeIn, SolidPill} from './SimpleUi';

/** Pick a 2.4 GHz network; the password field opens under the chosen row. */
export const SimpleWifiStage: React.FC<{
  onSubmit: (wifi: WifiSelection) => void;
}> = ({onSubmit}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {showSnackbar} = useFSnackbar();
  const [networks, setNetworks] = useState<WifiNetwork[] | null>(null);
  const [savedSsid, setSavedSsid] = useState<string | null>(null);
  const findNetwork = (ssid: string) => networks?.find(n => n.ssid === ssid);

  const load = useCallback(async () => {
    setNetworks(null);
    try {
      const result = await container.scanWifiUseCase.execute();
      setSavedSsid(result.savedSsid);
      setNetworks(result.networks);
    } catch (e: any) {
      setNetworks([]);
      showSnackbar(e?.message || t('common.error'), {type: 'fail'});
    }
  }, [showSnackbar, t]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount; showSnackbar is not memoized upstream
  }, []);

  return (
    // remounts once per scan so the remembered network is preselected
    <Formik
      key={networks === null ? 'loading' : 'ready'}
      initialValues={{
        ssid: networks?.some(n => n.ssid === savedSsid) ? savedSsid ?? '' : '',
        password: '',
        rememberWifi: true,
      }}
      validate={values => {
        const network = findNetwork(values.ssid);
        if (!network) {
          return {ssid: 'required'};
        }
        const error = validateWifiCredentials(values, network.secured);
        return error ? {password: error} : {};
      }}
      validateOnMount
      onSubmit={values => {
        const selected = findNetwork(values.ssid);
        if (!selected) {
          return;
        }
        Keyboard.dismiss();
        onSubmit({
          credentials: {
            ssid: selected.ssid,
            password: selected.secured ? values.password : '',
          },
          secured: selected.secured,
          rememberWifi: values.rememberWifi,
        });
      }}>
      {({
        values,
        errors,
        touched,
        isValid,
        setFieldValue,
        setFieldTouched,
        setValues,
        submitForm,
      }) => (
        <View style={styles.flex}>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            <FadeIn style={styles.header}>
              <FText typo="headline6">{t('device.wifi.title')}</FText>
              <FText typo="body03" color={colors.subtitle}>
                {t('device.wifi.subtitle')}
              </FText>
            </FadeIn>

            <FadeIn delay={80} style={styles.list}>
              <View style={styles.listHead}>
                <FText typo="headline8" style={styles.flex}>
                  {t('device.simple.networks')}
                </FText>
                <CircleButton
                  icon={FOutlined.refresh}
                  accessibilityLabel={t('device.wifi.refresh')}
                  disabled={networks === null}
                  onPress={load}
                  style={styles.refresh}
                />
              </View>

              {networks === null ? (
                <View style={styles.empty}>
                  <FText typo="body04" color={colors.subtitle}>
                    {t('device.wifi.scanning')}
                  </FText>
                </View>
              ) : networks.length === 0 ? (
                <View style={styles.empty}>
                  <FText typo="body04" color={colors.subtitle}>
                    {t('device.wifi.empty')}
                  </FText>
                </View>
              ) : (
                networks.map(network => {
                  const selected = values.ssid === network.ssid;
                  return (
                    <View
                      key={network.ssid}
                      style={[styles.row, selected && styles.rowSelected]}>
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{selected}}
                        accessibilityLabel={network.ssid}
                        onPress={() =>
                          setValues({
                            ...values,
                            ssid: network.ssid,
                            password: '',
                          })
                        }
                        style={styles.rowMain}>
                        <View style={styles.iconCircle}>
                          <FIcon
                            icon={FOutlined.wifi}
                            size={20}
                            iconColor={colors.title}
                          />
                        </View>
                        <View style={styles.flex}>
                          <FText typo="bodyLabel02" numberOfLines={1}>
                            {network.ssid}
                          </FText>
                          <FText typo="body04" color={colors.subtitle}>
                            {network.ssid === savedSsid
                              ? t('device.wifi.saved')
                              : network.secured
                              ? t('device.simple.secured')
                              : t('device.wifi.open')}
                          </FText>
                        </View>
                        <View
                          style={[styles.radio, selected && styles.radioOn]}>
                          {selected && <View style={styles.radioDot} />}
                        </View>
                      </Pressable>
                      {selected && network.secured && (
                        <FadeIn>
                          <FTextInput
                            placeholder={t('device.wifi.password')}
                            value={values.password}
                            secureTextEntry
                            autoCapitalize="none"
                            onChangeText={text => {
                              setFieldValue('password', text);
                              setFieldTouched('password', true, false);
                            }}
                            onClear={() => setFieldValue('password', '')}
                            errorText={
                              touched.password ? errors.password ?? '' : ''
                            }
                          />
                        </FadeIn>
                      )}
                    </View>
                  );
                })
              )}
            </FadeIn>
          </KeyboardAwareScrollView>

          <View
            style={[
              styles.footer,
              {paddingBottom: insets.bottom + tokens.space.md},
            ]}>
            <FCheckbox
              checked={values.rememberWifi}
              onPress={() =>
                setFieldValue('rememberWifi', !values.rememberWifi)
              }
              title={t('device.wifi.remember')}
            />
            <SolidPill
              label={t('device.wifi.continue')}
              disabled={!isValid}
              onPress={submitForm}
            />
          </View>
        </View>
      )}
    </Formik>
  );
};

export default SimpleWifiStage;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
      paddingBottom: tokens.space.lg,
      gap: tokens.space.lg,
    },
    header: {
      gap: tokens.spacing._3xs,
    },
    list: {
      gap: tokens.spacing._2xs,
    },
    listHead: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    refresh: {
      width: 40,
      height: 40,
    },
    empty: {
      paddingVertical: tokens.space.lg,
      alignItems: 'center',
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey1,
    },
    row: {
      padding: tokens.spacing.xs,
      gap: tokens.spacing.xs,
      borderRadius: tokens.borderRadius.medium,
      borderWidth: 1,
      borderColor: colors.grey1,
      backgroundColor: colors.grey1,
    },
    rowSelected: {
      borderColor: colors.title,
    },
    rowMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: tokens.borderRadius.full,
      borderWidth: 2,
      borderColor: colors.border1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOn: {
      borderColor: colors.title,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.title,
    },
    footer: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
      gap: tokens.space.md,
    },
  });
