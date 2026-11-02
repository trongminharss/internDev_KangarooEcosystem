import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {RouteProp, useRoute} from '@react-navigation/native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar, FButton, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {BottomTabParamList} from '@/app/navigation/types';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {PURIFIER_MOCK} from '@/features/device';

export const StoreScreen: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);
  const {showSnackbar} = useFSnackbar();
  const skus = useRoute<RouteProp<BottomTabParamList, 'Store'>>().params?.skus;
  // ponytail: filters come from the demo device until a product catalogue exists.
  const products = PURIFIER_MOCK.filters.filter(f => skus?.includes(f.sku));

  return (
    <View style={styles.container}>
      <FAppbar title={t('tab.store')} noContent />
      {products.length ? (
        <ScrollView contentContainerStyle={styles.list}>
          <FText typo="body03" color={colors.subtitle}>
            Lõi lọc phù hợp với {PURIFIER_MOCK.name}
          </FText>
          {products.map(p => (
            <View key={p.sku} style={styles.product}>
              <View style={styles.flex}>
                <FText typo="bodyLabel03" color={colors.title}>
                  {p.name}
                </FText>
                <FText typo="body04" color={colors.subtitle}>
                  {p.sku}, tuổi thọ {p.lifeMonths} tháng
                </FText>
                <FText typo="headline8" color={colors.title}>
                  {p.price.toLocaleString('vi-VN')}đ
                </FText>
              </View>
              <FButton
                size="m"
                title="Mua ngay"
                onPress={() =>
                  showSnackbar(`Đã thêm ${p.name} vào đơn hàng`, {
                    type: 'success',
                  })
                }
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <FText typo="headline7" style={styles.title}>
            {t('tab.store')}
          </FText>
          <FText typo="body02" style={styles.subtitle}>
            Khám phá và mua sắm hệ sinh thái thiết bị Kangaroo
          </FText>
        </View>
      )}
    </View>
  );
};

export default StoreScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.space.md,
    },
    title: {
      color: colors.title,
      marginBottom: tokens.spacing.xs,
    },
    subtitle: {
      color: colors.subtitle,
      textAlign: 'center',
    },
    list: {
      padding: tokens.space.md,
      gap: tokens.spacing.xs,
    },
    flex: {
      flex: 1,
    },
    product: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
      padding: tokens.spacing.s,
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey1,
    },
  });
