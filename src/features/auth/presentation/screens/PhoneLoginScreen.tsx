import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInputInstance,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useTranslation} from 'react-i18next';
import {Formik} from 'formik';

import {ColorsProps, useTheme} from '@/core/theme';
import {FValidatePhone} from '@/core/utils/validation';
import {Storage} from '@/core/utils/storage';
import {
  FAppbar,
  FBottomSheet,
  FBottomSheetRef,
  FButton,
  FCheckbox,
  FLoading,
  FText,
  FTextInput,
  WaterWaveBubblesBackground,
} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';

import {useAuth} from '../hooks/useAuth';

export const PhoneLoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {height: screenH} = useWindowDimensions();
  const waveHeight = Math.round(screenH * 0.4);
  const navigation = useAppNavigation();
  const {t} = useTranslation();
  const {showSnackbar, hideSnackbar} = useFSnackbar();
  const {requestOtp, isLoading} = useAuth();

  const [agreedTerms, setAgreedTerms] = useState(false);
  const termsSheetRef = useRef<FBottomSheetRef>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const phoneInputRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e =>
      setKbHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(hideEvent, () =>
      setKbHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => phoneInputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const agreed = await Storage.getItem<boolean>(
          Storage.KEY_TERMS_ACCEPTED,
        );
        if (agreed !== null) {
          setAgreedTerms(agreed);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  const toggleAgreedTerms = (value?: boolean) => {
    const next = value !== undefined ? value : !agreedTerms;
    setAgreedTerms(next);
    Storage.setItem(Storage.KEY_TERMS_ACCEPTED, next).catch((error: any) =>
      console.error('Error saving agreed terms:', error),
    );
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 10)]
      .filter(Boolean)
      .join(' ');
  };

  const handleContinue = async (phoneNumber: string) => {
    if (isLoading) {
      return;
    }
    Keyboard.dismiss();
    hideSnackbar();
    try {
      await requestOtp(phoneNumber);
      navigation.navigate('Otp', {phoneNumber});
    } catch (error: any) {
      showSnackbar(error || t('common.error'), {type: 'fail'});
    }
  };

  const openTermsSheet = () => {
    Keyboard.dismiss();
    termsSheetRef.current?.present();
  };

  const termLinks = [
    {key: t('auth.termsOfUse'), onPress: openTermsSheet},
    {key: t('auth.legalDeclaration'), onPress: openTermsSheet},
    {key: t('auth.privacyPolicy'), onPress: openTermsSheet},
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.background, {height: waveHeight}]}>
        <WaterWaveBubblesBackground height={waveHeight} />
      </View>
      <FAppbar noContent />
      <Formik
        initialValues={{phoneNumber: ''}}
        validate={values => {
          const errors: any = {};
          const phoneText = values.phoneNumber.replace(/\s/g, '');
          if (!phoneText) {
            errors.phoneNumber = `${t('common.invalidEmpty')}`;
          } else if (!FValidatePhone(phoneText)) {
            errors.phoneNumber = `${t('auth.invalidPhone')}`;
          }
          return errors;
        }}
        onSubmit={values =>
          handleContinue(values.phoneNumber.replace(/\s/g, ''))
        }>
        {({values, submitForm, errors, setFieldValue}) => {
          const phoneValid =
            values.phoneNumber.trim().length > 0 && !errors.phoneNumber;
          const canContinue = phoneValid && agreedTerms;
          return (
            <View style={{flex: 1}}>
              <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
                {isLoading && <FLoading visible={isLoading} />}
                <FText typo="headline7" style={styles.largeTitle}>
                  {t('auth.phoneTitle')}
                </FText>
                <View style={{paddingHorizontal: tokens.space.md}}>
                  <FTextInput
                    inputRef={phoneInputRef}
                    placeholder={t('auth.enterPhone')}
                    value={values.phoneNumber}
                    keyboardType="number-pad"
                    onClear={() => setFieldValue('phoneNumber', '')}
                    onChangeText={text =>
                      setFieldValue('phoneNumber', formatPhone(text))
                    }
                    errorText={errors.phoneNumber ?? ''}
                  />
                </View>

                <FCheckbox
                  checked={agreedTerms}
                  onPress={() => toggleAgreedTerms()}
                  style={styles.termRow}>
                  <View style={styles.termTextWrap}>
                    <FText typo="body03" style={styles.termText}>
                      {`${t('auth.agreePrefix')} `}
                    </FText>
                    {termLinks.map((link, index) => (
                      <React.Fragment key={link.key}>
                        <TouchableOpacity onPress={link.onPress}>
                          <FText typo="body03" style={styles.termLink}>
                            {link.key}
                          </FText>
                        </TouchableOpacity>
                        {index < termLinks.length - 1 ? (
                          <FText typo="body03" style={styles.termText}>
                            {index === termLinks.length - 2
                              ? ` ${t('common.and')} `
                              : ', '}
                          </FText>
                        ) : null}
                      </React.Fragment>
                    ))}
                  </View>
                </FCheckbox>
              </KeyboardAwareScrollView>

              <View
                style={[
                  styles.continuePin,
                  {paddingBottom: insets.bottom + 8 + kbHeight},
                ]}>
                <FButton
                  title={t('auth.continue')}
                  onPress={submitForm}
                  disabled={!canContinue}
                  style={{
                    alignSelf: 'center',
                    borderRadius: tokens.borderRadius.full,
                    width: 200,
                  }}
                />
              </View>
            </View>
          );
        }}
      </Formik>

      <FBottomSheet
        ref={termsSheetRef}
        snapPoints={['88%']}
        enableDynamicSizing={false}>
        <FText typo="title2" style={styles.sheetTitle}>
          {t('auth.termsTitle')}
        </FText>
        <ScrollView style={styles.sheetContent}>
          <FText typo="bodyText2" style={{color: colors.subtitle}}>
            {t('auth.termsContent')}
          </FText>
        </ScrollView>
        <FButton
          title={t('auth.agree')}
          onPress={() => {
            termsSheetRef.current?.dismiss();
            toggleAgreedTerms(true);
          }}
          style={{
            marginHorizontal: tokens.space.md,
            marginBottom: insets.bottom,
            borderRadius: tokens.borderRadius.full,
            width: 200,
          }}
        />
      </FBottomSheet>
    </View>
  );
};

export default PhoneLoginScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    background: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    continuePin: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    largeTitle: {
      color: colors.title,
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space._6xl,
      paddingBottom: tokens.space.md,
    },
    termRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      margin: tokens.space.xl,
    },
    termTextWrap: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    termText: {
      color: colors.text,
    },
    termLink: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    sheetTitle: {
      color: colors.title,
      textAlign: 'center',
      paddingTop: tokens.space.sm,
      paddingBottom: tokens.space.md,
    },
    sheetContent: {
      flex: 1,
      paddingHorizontal: tokens.space.md,
      paddingBottom: tokens.space.md,
    },
  });
