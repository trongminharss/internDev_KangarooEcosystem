import React, {useMemo} from 'react';
import {Keyboard, StyleSheet, View} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RouteProp, useRoute} from '@react-navigation/native';
import {Formik} from 'formik';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar, FButton, FText, FTextInput} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {Chip} from '../components/Chip';

const ISSUES = [
  'weakFlow',
  'odor',
  'noHot',
  'noCold',
  'noisy',
  'leak',
  'disconnected',
];
const LEVELS = ['low', 'medium', 'high'];

type Values = {issues: string[]; detail: string; level: string};

export const DeviceFeedbackScreen: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {showSnackbar} = useFSnackbar();
  const {params} = useRoute<RouteProp<RootStackParamList, 'DeviceFeedback'>>();

  const submit = async (_values: Values) => {
    Keyboard.dismiss();
    // ponytail: no feedback endpoint yet; POST {..._values, snapshot: params.snapshot} when it exists.
    showSnackbar(t('device.feedback.sent'), {
      type: 'success',
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <FAppbar
        title={t('device.feedback.title')}
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
      />
      <Formik<Values>
        initialValues={{issues: [], detail: '', level: LEVELS[1]}}
        validate={v =>
          v.issues.length || v.detail.trim()
            ? {}
            : {detail: t('device.feedback.required')}
        }
        onSubmit={submit}>
        {({
          values,
          errors,
          submitCount,
          setFieldValue,
          submitForm,
          isSubmitting,
        }) => (
          <>
            <KeyboardAwareScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}>
              <FText typo="headline8" color={colors.title}>
                {t('device.feedback.issuesTitle')}
              </FText>
              <View style={styles.wrap}>
                {ISSUES.map(it => (
                  <Chip
                    idleColor={colors.white}
                    key={it}
                    label={t(`device.feedback.issues.${it}`)}
                    active={values.issues.includes(it)}
                    onPress={() =>
                      setFieldValue(
                        'issues',
                        values.issues.includes(it)
                          ? values.issues.filter(x => x !== it)
                          : [...values.issues, it],
                      )
                    }
                  />
                ))}
              </View>

              <FText typo="headline8" color={colors.title}>
                {t('device.feedback.detailTitle')}
              </FText>
              <FTextInput
                placeholder={t('device.feedback.detailPlaceholder')}
                value={values.detail}
                onChangeText={v => setFieldValue('detail', v)}
                onClear={() => setFieldValue('detail', '')}
                errorText={submitCount > 0 ? errors.detail ?? '' : ''}
              />

              <FText typo="headline8" color={colors.title}>
                {t('device.feedback.levelTitle')}
              </FText>
              <View style={styles.wrap}>
                {LEVELS.map(l => (
                  <Chip
                    idleColor={colors.white}
                    key={l}
                    label={t(`device.feedback.levels.${l}`)}
                    active={values.level === l}
                    onPress={() => setFieldValue('level', l)}
                  />
                ))}
              </View>

              <FText typo="headline8" color={colors.title}>
                {t('device.feedback.snapshotTitle')}
              </FText>
              <View style={styles.card}>
                {params.snapshot.map(([k, v]) => (
                  <View key={k} style={styles.spec}>
                    <FText typo="body03" color={colors.subtitle}>
                      {k}
                    </FText>
                    <FText typo="bodyLabel03" color={colors.title}>
                      {v}
                    </FText>
                  </View>
                ))}
              </View>
            </KeyboardAwareScrollView>
            <View
              style={[
                styles.footer,
                {paddingBottom: insets.bottom + tokens.spacing.xs},
              ]}>
              <FButton
                title={t('device.feedback.submit')}
                width="block"
                disabled={isSubmitting}
                onPress={submitForm}
              />
            </View>
          </>
        )}
      </Formik>
    </View>
  );
};

export default DeviceFeedbackScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: tokens.space.md,
      gap: tokens.spacing.xs,
    },
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing._2xs,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: tokens.borderRadius.medium,
      padding: tokens.spacing.s,
      gap: tokens.spacing._2xs,
    },
    spec: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    footer: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.spacing.xs,
      backgroundColor: colors.white,
    },
  });
