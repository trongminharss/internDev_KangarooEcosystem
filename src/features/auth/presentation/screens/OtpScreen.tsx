import {
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import React, {useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ColorsProps, useTheme} from '@/core/theme';
import {
  FAppbar,
  FButton,
  FLoading,
  FOtpInput,
  FText,
  WaterWaveBubblesBackground,
} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';

import {useAuth} from '../hooks/useAuth';
import {useCountdown} from '@/shared/hooks/useCountdown';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

export const OtpScreen: React.FC = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'Otp'>>();
  const phoneNumber = params.phoneNumber;
  const insets = useSafeAreaInsets();
  const {theme, isDark} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const {height: screenH} = useWindowDimensions();
  const waveHeight = Math.round(screenH * 0.6);
  const navigation = useAppNavigation();
  const {t} = useTranslation();
  const {showSnackbar, hideSnackbar} = useFSnackbar();
  const {requestOtp, verifyOtp, isLoading} = useAuth();
  const {seconds, isDone: canResend, restart} = useCountdown(60);

  const [otp, setOtp] = useState('');
  const [isError, setIsError] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [kbHeight, setKbHeight] = useState(0);

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

      // convert phoneNumber to type: 0914 352 897
      const formatPhone = (phone: string) => {
        if (phone.length === 10 && phone.startsWith('0')) {
          return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7, 10)}`;
        }
        return phone;
      };

  const handleResend = async () => {
    if (!canResend || isLoading) {
      return;
    }
    hideSnackbar();
    // clear otp
    setOtp('');
    setIsError(false);
    setResetKey(k => k + 1);
    try {
      await requestOtp(phoneNumber);
      restart();
    } catch (error: any) {
      showSnackbar(error || t('common.error'), {type: 'fail'});
    }
  };

  const handleContinue = async () => {
    if (otp.length < 6 || isLoading) {
      return;
    }
    try {
      await verifyOtp({phoneNumber, otp});
      navigation.reset({index: 0, routes: [{name: 'BottomNavigation'}]});
    } catch (error: any) {
      showSnackbar(error || t('common.error'), {type: 'fail'});
      setIsError(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.background, {height: waveHeight}]}>
        <WaterWaveBubblesBackground height={waveHeight} />
      </View>
      <FAppbar onBack={() => navigation.goBack()} noContent={false} />
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled">
        {isLoading && <FLoading visible={isLoading} />}
        <FText typo="headline7" style={styles.largeTitle}>
          {t('auth.otpTitle')}
        </FText>

        <View style={styles.boxesTouch}>
          <FOtpInput
            key={resetKey}
            autoFocus
            isError={isError}
            onCodeChanged={code => {
              setOtp(code);
              setIsError(false);
            }}
            onPasteRejected={() =>
              showSnackbar(t('auth.otpPasteInvalid'), {type: 'fail'})
            }
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <FText typo="bodyLabel03" style={styles.resendLink}>
                {t('auth.resend')}
              </FText>
            </TouchableOpacity>
          ) : (
            <FText typo="bodyLabel03" style={styles.mutedText}>
              {t('auth.resendAfter', {seconds})}
            </FText>
          )}
          <FText typo="bodyLabel04" style={styles.mutedText}>
            {`${t('auth.otpSentTo')} ${formatPhone(phoneNumber)}`}
          </FText>
        </View>

      </KeyboardAwareScrollView>
      <View
        style={[
          styles.continuePin,
          {paddingBottom: insets.bottom + 8 + kbHeight},
        ]}>
        <FButton
          title={t('auth.continue')}
          onPress={handleContinue}
          disabled={otp.length < 6 || isLoading}
          style={{
            alignSelf: 'center',
            borderRadius: tokens.borderRadius.full,
            width: 200,
          }}
        />
      </View>
    </View>
  );
};

export default OtpScreen;

const createStyles = (colors: ColorsProps, isDark = false) =>
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
    boxesTouch: {
      marginHorizontal: tokens.space.md,
    },
    resendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.lg,
    },
    resendLink: {
      color: colors.primary,
    },
    mutedText: {
      color: isDark ? colors.body : colors.subtitle,
    },
  });
