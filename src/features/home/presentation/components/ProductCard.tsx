import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';
import {MockProduct} from '@/features/home/presentation/mocks/mockHome';

export const formatPrice = (price: number): string =>
  `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;

interface ProductCardProps {
  product: MockProduct;
  onPress: () => void;
  onAddToCart: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);

  return (
    <Pressable
      style={styles.card}
      testID={`product-card-${product.id}`}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      onPress={onPress}>
      <View>
        <View style={styles.image}>
          {/* ponytail: placeholder until real product images ship */}
          <FIcon icon={FFilled.image} size={40} iconColor={colors.grey300} />
        </View>
        {product.badge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  product.badge === 'hot' ? colors.error : colors.success,
              },
            ]}
            testID={`product-badge-${product.id}`}>
            <FText typo="bodyLabel04" color={colors.onDarkPrimary}>
              {product.badge === 'hot'
                ? t('home.products.badgeHot')
                : t('home.products.badgeNew')}
            </FText>
          </View>
        ) : null}
      </View>
      <FText typo="bodyLabel03" numberOfLines={2} style={styles.name}>
        {product.name}
      </FText>
      <View style={styles.priceRow}>
        <FText typo="body02">{formatPrice(product.price)}</FText>
        <Pressable
          style={styles.cartButton}
          hitSlop={tokens.space.xs}
          testID={`product-cart-${product.id}`}
          accessibilityRole="button"
          accessibilityLabel={t('home.products.addToCart')}
          onPress={onAddToCart}>
          <FIcon
            icon={FFilled.shopping_cart}
            size={20}
            iconColor={colors.success}
          />
        </Pressable>
      </View>
    </Pressable>
  );
};

export default ProductCard;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: tokens.borderRadius.medium,
      padding: tokens.space.sm,
    },
    image: {
      height: 120,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.grey1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.space.sm,
    },
    badge: {
      position: 'absolute',
      top: tokens.space.xs,
      left: tokens.space.xs,
      borderRadius: tokens.borderRadius.small,
      paddingHorizontal: tokens.spacing._2xs,
      paddingVertical: tokens.spacing._3xs,
    },
    name: {
      minHeight: 40,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: tokens.spacing._2xs,
    },
    cartButton: {
      width: 28,
      height: 28,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.successBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
