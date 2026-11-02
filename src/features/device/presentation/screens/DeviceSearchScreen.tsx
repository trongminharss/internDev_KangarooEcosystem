import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';
import {findDeviceModel} from '../../domain/entities/Device';
import {DeviceScanSection} from '../components/DeviceScanSection';

/** C2 step 4: 2-minute scan limited to the chosen model. */
export const DeviceSearchScreen: React.FC = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'DeviceSearch'>>();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const modelName = findDeviceModel(params.modelId)?.name ?? '';

  return (
    <View style={styles.container}>
      <FAppbar
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + tokens.space.lg},
        ]}>
        <FText typo="headline8">
          {t('device.search.title', {name: modelName.toLowerCase()})}
        </FText>
        <DeviceScanSection
          modelId={params.modelId}
          onSelect={device =>
            navigation.navigate('DeviceConnect', {device, wifi: params.wifi})
          }
        />
      </ScrollView>
    </View>
  );
};

export default DeviceSearchScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
      gap: tokens.space.lg,
    },
  });
