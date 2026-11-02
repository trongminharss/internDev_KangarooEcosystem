import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Keyboard, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Formik} from 'formik';
import {container} from '@/core/di/container';
import {ColorsProps, useTheme} from '@/core/theme';
import {
  FAppbar,
  FButton,
  FCheckbox,
  FIcon,
  FIconButton,
  FText,
  FTextInput,
} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';
import {WifiNetwork, WifiSelection} from '../../domain/entities/Device';
import {validateWifiCredentials} from '../../domain/usecases/ProvisionDeviceUseCase';

/** C1 step 2 / C2 step 3: pick a network, type its password, optionally remember it. */
export const WifiSetupScreen: React.FC = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'WifiSetup'>>();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {showSnackbar} = useFSnackbar();

  const [networks, setNetworks] = useState<WifiNetwork[] | null>(null);
  const [savedSsid, setSavedSsid] = useState<string | null>(null);
  const findNetwork = (ssid: string) => networks?.find(n => n.ssid === ssid);

  const loadNetworks = useCallback(async () => {
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
    loadNetworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount; showSnackbar is not memoized upstream
  }, []);

  const submit = (ssid: string, password: string, rememberWifi: boolean) => {
    const selected = findNetwork(ssid);
    if (!selected) {
      return;
    }
    Keyboard.dismiss();
    const wifi: WifiSelection = {
      credentials: {
        ssid: selected.ssid,
        password: selected.secured ? password : '',
      },
      secured: selected.secured,
      rememberWifi,
    };
    if (params.device) {
      navigation.navigate('DeviceConnect', {device: params.device, wifi});
    } else {
      navigation.navigate('DeviceSearch', {modelId: params.modelId, wifi});
    }
  };

  return (
    <View style={styles.container}>
      <FAppbar
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
        trailing={
          <FIconButton
            icon={FOutlined.refresh}
            size={22}
            iconColor={colors.title}
            disabled={networks === null}
            onPress={loadNetworks}
          />
        }
      />
      {/* remounts once per scan so the remembered network (sorted first) is preselected */}
      <Formik
        key={networks === null ? 'loading' : 'ready'}
        initialValues={{
          ssid: networks?.some(n => n.ssid === savedSsid)
            ? savedSsid ?? ''
            : '',
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
        onSubmit={values =>
          submit(values.ssid, values.password, values.rememberWifi)
        }>
        {({
          values,
          errors,
          touched,
          isValid,
          setFieldValue,
          setFieldTouched,
          setValues,
          submitForm,
        }) => {
          const selected = findNetwork(values.ssid);
          return (
            <>
              <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.content}>
                <View style={styles.header}>
                  <FText typo="headline8">{t('device.wifi.title')}</FText>
                  <FText typo="body03" color={colors.subtitle}>
                    {t('device.wifi.subtitle')}
                  </FText>
                </View>

                {networks === null ? (
                  <View style={styles.loading}>
                    <FIcon
                      icon={FOutlined.wifi}
                      size={24}
                      iconColor={colors.primary}
                    />
                    <FText typo="body03" color={colors.subtitle}>
                      {t('device.wifi.scanning')}
                    </FText>
                  </View>
                ) : networks.length === 0 ? (
                  <FText
                    typo="body03"
                    color={colors.body}
                    style={styles.center}>
                    {t('device.wifi.empty')}
                  </FText>
                ) : (
                  <View style={styles.list}>
                    {networks.map((network, i) => {
                      const isSelected = values.ssid === network.ssid;
                      return (
                        <TouchableOpacity
                          key={network.ssid}
                          activeOpacity={0.7}
                          accessibilityRole="radio"
                          accessibilityState={{selected: isSelected}}
                          style={[styles.row, i > 0 && styles.divider]}
                          onPress={() =>
                            setValues({
                              ...values,
                              ssid: network.ssid,
                              password: '',
                            })
                          }>
                          <FIcon
                            icon={FOutlined.wifi}
                            size={22}
                            iconColor={
                              isSelected ? colors.primary : colors.title
                            }
                          />
                          <View style={styles.rowText}>
                            <FText typo="bodyLabel03" numberOfLines={1}>
                              {network.ssid}
                            </FText>
                            {network.ssid === savedSsid || !network.secured ? (
                              <FText typo="body04" color={colors.subtitle}>
                                {[
                                  network.ssid === savedSsid
                                    ? t('device.wifi.saved')
                                    : null,
                                  !network.secured
                                    ? t('device.wifi.open')
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </FText>
                            ) : null}
                          </View>
                          {network.secured && (
                            <FIcon
                              icon={FOutlined.lock}
                              size={16}
                              iconColor={colors.body}
                            />
                          )}
                          {isSelected && (
                            <FIcon
                              icon={FOutlined.check}
                              size={18}
                              iconColor={colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {selected?.secured && (
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
                    errorText={touched.password ? errors.password ?? '' : ''}
                  />
                )}

                {selected && (
                  <FCheckbox
                    checked={values.rememberWifi}
                    onPress={() =>
                      setFieldValue('rememberWifi', !values.rememberWifi)
                    }
                    title={t('device.wifi.remember')}
                  />
                )}
              </KeyboardAwareScrollView>

              <View
                style={[
                  styles.footer,
                  {paddingBottom: insets.bottom + tokens.space.md},
                ]}>
                <FButton
                  width="block"
                  title={t('device.wifi.continue')}
                  disabled={!isValid}
                  onPress={submitForm}
                />
              </View>
            </>
          );
        }}
      </Formik>
    </View>
  );
};

export default WifiSetupScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
      paddingBottom: tokens.space.lg,
      gap: tokens.space.md,
    },
    header: {
      gap: tokens.spacing._3xs,
    },
    loading: {
      alignItems: 'center',
      gap: tokens.spacing._2xs,
      paddingVertical: tokens.space.lg,
    },
    center: {
      textAlign: 'center',
      paddingVertical: tokens.space.lg,
    },
    list: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border1,
      borderRadius: tokens.borderRadius.medium,
      paddingHorizontal: tokens.spacing.s,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
      paddingVertical: tokens.spacing.s,
    },
    divider: {
      borderTopWidth: 1,
      borderTopColor: colors.border1,
    },
    rowText: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.md,
      borderTopWidth: 1,
      borderTopColor: colors.border1,
      backgroundColor: colors.white,
    },
  });
