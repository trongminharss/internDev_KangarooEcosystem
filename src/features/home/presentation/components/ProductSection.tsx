import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FButton, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {RegionStatus} from './DeviceSection';

export const ProductSectionTitle: React.FC = () => {
  const {t} = useTranslation();
  const styles = createTitleStyles();
  return (
    <FText typo="bodyLabel01" style={styles.title}>
      {t('home.products.title')}
    </FText>
  );
};

interface ProductSectionBodyProps {
  status: RegionStatus;
  onRetry: () => void;
}

/** Renders only the non-success grid states — the success grid is the FlatList itself. */
export const ProductSectionBody: React.FC<ProductSectionBodyProps> = ({
  status,
  onRetry,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createBodyStyles(colors);

  if (status === 'loading') {
    return (
      <View style={styles.skeletonGrid} testID="product-skeleton">
        {[0, 1].map(row => (
          <View key={row} style={styles.skeletonRow}>
            <View style={styles.skeletonCard} />
            <View style={styles.skeletonCard} />
          </View>
        ))}
      </View>
    );
  }
  if (status === 'empty') {
    return (
      <View style={styles.center} testID="product-empty">
        <FText typo="body03" color={colors.subtitle}>
          {t('home.products.empty')}
        </FText>
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={styles.center} testID="product-error">
        <FText typo="body03" color={colors.error}>
          {t('home.products.error')}
        </FText>
        <FButton
          title={t('home.products.retry')}
          kind="ghost"
          color="error"
          size="m"
          testID="product-retry"
          onPress={onRetry}
        />
      </View>
    );
  }
  return null;
};

const createTitleStyles = () =>
  StyleSheet.create({
    title: {
      marginBottom: tokens.space.md,
    },
  });

const createBodyStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    skeletonGrid: {
      gap: tokens.space.sm,
    },
    skeletonRow: {
      flexDirection: 'row',
      gap: tokens.space.sm,
    },
    skeletonCard: {
      flex: 1,
      height: 180,
      borderRadius: tokens.borderRadius.medium,
      backgroundColor: colors.grey1,
    },
    center: {
      alignItems: 'center',
      gap: tokens.space.sm,
      paddingVertical: tokens.space.xl,
    },
  });
